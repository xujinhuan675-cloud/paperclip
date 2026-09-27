import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = fs.readFileSync(
  path.join(repoRoot, ".github", "workflows", "downstream-deploy.yml"),
  "utf8",
);
const script = fs.readFileSync(
  path.join(repoRoot, "scripts", "downstream-registry-deploy.sh"),
  "utf8",
);

test("downstream deployment is manual and reuses the repository Docker image", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s+push:/);
  assert.match(workflow, /ghcr\.io\/\$\{GITHUB_REPOSITORY\}:sha-\$\{short_commit\}/);
  assert.match(workflow, /image_ref must point to a tagged ghcr\.io image/);
  assert.match(workflow, /image_ref contains unsafe characters/);
  assert.doesNotMatch(workflow, /docker\/build-push-action|docker build/);
  assert.match(workflow, /scripts\/downstream-registry-deploy\.sh/);
});

test("Paperclip deployment leaves Bridge unchanged", () => {
  assert.match(script, /docker pull "\$PAPERCLIP_IMAGE_REF"/);
  assert.match(script, /update_env PAPERCLIP_IMAGE "\$PAPERCLIP_IMAGE_REF"/);
  assert.match(script, /up -d --no-build --force-recreate --no-deps paperclip/);
  assert.match(script, /compose_env_value BRIDGE_IMAGE/);
  assert.match(script, /bridge-image\.unchanged/);
  assert.doesNotMatch(script, /update_env BRIDGE_IMAGE/);
  assert.doesNotMatch(script, /no-deps bridge/);
  assert.doesNotMatch(script, /plugin-assets/);
});

test("Paperclip deployment keeps rollback and health diagnostics", () => {
  assert.match(script, /\.env\.deploy\.before/);
  assert.match(script, /cp "\$BACKUP_DIR\/\.env\.deploy\.before" \.env\.deploy/);
  assert.match(script, /Paperclip did not become healthy/);
  assert.match(script, /docker logs --timestamps/);
});
