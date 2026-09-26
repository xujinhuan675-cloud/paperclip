#!/usr/bin/env bash
# Deploy a prebuilt downstream Paperclip image only. Bridge remains unchanged.
set -eu

: "${PAPERCLIP_IMAGE_REF:?PAPERCLIP_IMAGE_REF is required}"
REMOTE_DIR="${REMOTE_DIR:-/opt/paperclip-feishu-bridge-compose-20260804}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-paperclip-feishu-bridge-prod}"
RUN_ID="${RUN_ID:-manual-$(date -u +%Y%m%dT%H%M%SZ)}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/deploy-backups}"
GHCR_ENV_FILE="${GHCR_ENV_FILE:-/etc/paperclip-feishu-bridge/ghcr.env}"

case "$PAPERCLIP_IMAGE_REF" in
  ghcr.io/*:*) ;;
  *) echo "PAPERCLIP_IMAGE_REF must point to a tagged ghcr.io image" >&2; exit 2 ;;
esac
case "$PAPERCLIP_IMAGE_REF" in
  *[!A-Za-z0-9._:/@-]*) echo "PAPERCLIP_IMAGE_REF contains unsafe characters" >&2; exit 2 ;;
esac
case "$RUN_ID" in
  ''|*[!A-Za-z0-9_.-]*) echo "RUN_ID contains unsafe characters" >&2; exit 2 ;;
esac

cd "$REMOTE_DIR"
test -f .env.deploy
test -f docker-compose.yml
test -f docker-compose.release.yml

compose() {
  docker compose --env-file .env.deploy -f docker-compose.yml -f docker-compose.release.yml -p "$COMPOSE_PROJECT" "$@"
}

compose_env_value() {
  key="$1"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); value=$0 } END { print value }' .env.deploy
}

registry_env_value() {
  key="$1"
  if [ -f "$GHCR_ENV_FILE" ]; then
    awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); value=$0 } END { print value }' "$GHCR_ENV_FILE"
  fi
}

update_env() {
  key="$1"
  value="$2"
  tmp="$REMOTE_DIR/.env.deploy.ci.tmp"
  awk -v k="$key" -v v="$value" 'BEGIN { found=0 } $0 ~ "^" k "=" { print k "=" v; found=1; next } { print } END { if (!found) print k "=" v }' .env.deploy > "$tmp"
  mv "$tmp" .env.deploy
}

print_paperclip_diagnostics() {
  echo "[paperclip-deploy] diagnostics"
  compose ps -a paperclip 2>&1 || true
  container="$(compose ps -aq paperclip 2>/dev/null || true)"
  if [ -z "$container" ]; then return 0; fi
  docker inspect --format 'status={{.State.Status}} exit_code={{.State.ExitCode}} error={{json .State.Error}} oom_killed={{.State.OOMKilled}} restart_count={{.RestartCount}}' "$container" 2>&1 || true
  docker inspect --format '{{json .State.Health}}' "$container" 2>&1 || true
  docker logs --timestamps "$container" 2>&1 || true
}

ghcr_user="$(registry_env_value GHCR_USER)"
ghcr_pat="$(registry_env_value GHCR_PAT)"
if [ -n "$ghcr_pat" ]; then
  printf '%s' "$ghcr_pat" | docker login ghcr.io -u "${ghcr_user:-xujinhuan675-cloud}" --password-stdin >/dev/null
fi

echo "[paperclip-deploy] pulling $PAPERCLIP_IMAGE_REF"
docker pull "$PAPERCLIP_IMAGE_REF"

BACKUP_DIR="$BACKUP_ROOT/$COMPOSE_PROJECT-paperclip-$RUN_ID"
test ! -e "$BACKUP_DIR" || { echo "backup already exists: $BACKUP_DIR" >&2; exit 20; }
mkdir -p "$BACKUP_DIR"
cp .env.deploy "$BACKUP_DIR/.env.deploy.before"
old_paperclip_image="$(compose_env_value PAPERCLIP_IMAGE)"
unchanged_bridge_image="$(compose_env_value BRIDGE_IMAGE)"
printf '%s\n' "$old_paperclip_image" > "$BACKUP_DIR/paperclip-image.before"
printf '%s\n' "$unchanged_bridge_image" > "$BACKUP_DIR/bridge-image.unchanged"

MUTATION_STARTED=1
ROLLED_BACK=0
rollback() {
  [ "$ROLLED_BACK" -eq 0 ] || return 0
  ROLLED_BACK=1
  cp "$BACKUP_DIR/.env.deploy.before" .env.deploy
  compose up -d --no-build --force-recreate --no-deps paperclip >/dev/null 2>&1 || true
}
on_exit() {
  status=$?
  if [ "$status" -ne 0 ] && [ "$MUTATION_STARTED" -eq 1 ]; then rollback; fi
  exit "$status"
}
trap on_exit EXIT

update_env DEPLOYMENT_ARTIFACT_MODE images
update_env PAPERCLIP_IMAGE "$PAPERCLIP_IMAGE_REF"
update_env PAPERCLIP_BUILD_VERSION "${PAPERCLIP_BUILD_VERSION:-}"
update_env PAPERCLIP_BUILD_COMMIT "${PAPERCLIP_BUILD_COMMIT:-}"

compose config --quiet
if ! compose up -d --no-build --force-recreate --no-deps paperclip; then
  echo "[paperclip-deploy] Paperclip compose up failed" >&2
  print_paperclip_diagnostics
  exit 1
fi

paperclip_ready=0
for attempt in $(seq 1 90); do
  container="$(compose ps -q paperclip)"
  if [ -n "$container" ]; then
    state="$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container" 2>/dev/null || true)"
    echo "[paperclip-deploy] paperclip $state"
    if [ "$state" = "running healthy" ]; then paperclip_ready=1; break; fi
  fi
  sleep 2
done
if [ "$paperclip_ready" -ne 1 ]; then echo "[paperclip-deploy] Paperclip did not become healthy" >&2; print_paperclip_diagnostics; exit 1; fi

printf '%s\n' \
  "deployed_paperclip_image=$PAPERCLIP_IMAGE_REF" \
  "unchanged_bridge_image=$unchanged_bridge_image" \
  "paperclip_commit=${PAPERCLIP_BUILD_COMMIT:-unknown}" \
  "backup_dir=$BACKUP_DIR"
