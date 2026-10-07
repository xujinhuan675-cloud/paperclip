import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Drift guard for the Docker build-stamp wiring.
 *
 * The server build runs scripts/write-build-stamp.mjs, which stamps the built
 * commit into dist/build-info.json. The build context has no .git, so the
 * script reads PAPERCLIP_BUILD_COMMIT instead. Docker exposes an ARG to the
 * next RUN as an environment variable, but an ARG goes out of scope at the end
 * of its stage. So the build stage must declare `ARG PAPERCLIP_BUILD_COMMIT`
 * before the server build; the production ARG alone stamps nothing, because
 * the server build already ran in the earlier stage.
 *
 * This guard fails if a refactor drops the build-stage ARG, moves it after the
 * server build, or removes the build-arg the docker workflow passes.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const dockerfile = readFileSync(path.join(repoRoot, "Dockerfile"), "utf8");
const workflow = readFileSync(path.join(repoRoot, ".github", "workflows", "docker.yml"), "utf8");
const previewWorkflow = readFileSync(path.join(repoRoot, ".github", "workflows", "release.yml"), "utf8");
const dockerBuildTest = readFileSync(path.join(repoRoot, "scripts", "docker-build-test.sh"), "utf8");
const cliToolsPackage = JSON.parse(readFileSync(path.join(repoRoot, "docker", "cli-tools", "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};
const cliToolsLock = JSON.parse(readFileSync(path.join(repoRoot, "docker", "cli-tools", "package-lock.json"), "utf8")) as {
  packages: Record<string, { version?: string }>;
};
const dependabot = readFileSync(path.join(repoRoot, ".github", "dependabot.yml"), "utf8");

/**
 * Return the text of the Dockerfile stage that starts at the named target.
 * A stage runs from its `FROM ... AS <name>` line to the next `FROM` line.
 */
function stageBody(source: string, stageName: string): string {
  const froms = [...source.matchAll(/^FROM .*$/gm)];
  const startIdx = froms.findIndex((m) => new RegExp(`\\bAS ${stageName}\\b`).test(m[0]));
  expect(startIdx, `Dockerfile must declare a '${stageName}' stage`).toBeGreaterThanOrEqual(0);
  const start = froms[startIdx].index ?? 0;
  const end = froms[startIdx + 1]?.index ?? source.length;
  return source.slice(start, end);
}

it("keeps CLI versions and application dependencies in reusable production layers", () => {
  const production = stageBody(dockerfile, "production");
  const entrypoint = production.search(/^RUN chmod \+x \/usr\/local\/bin\/docker-entrypoint\.sh/m);
  const runtime = production.search(/^ENV NODE_ENV=production/m);
  expect(production).not.toContain("CLI_TOOLS_CACHE_EPOCH");
  expect(production).toContain("COPY docker/cli-tools/package.json docker/cli-tools/package-lock.json /opt/paperclip-cli-tools/");
  expect(production).toContain("RUN npm ci --prefix /opt/paperclip-cli-tools --omit=dev");
  expect(production).toContain("ENV PATH=/opt/paperclip-cli-tools/node_modules/.bin:$PATH");
  expect(production).toContain("COPY --link --chown=node:node --from=build /app/node_modules /app/node_modules");
  expect(production).toContain("COPY --link --exclude=node_modules/** --chown=node:node --from=build /app /app");
  for (const name of [
    "@anthropic-ai/claude-code",
    "@openai/codex",
    "opencode-ai",
    "@google/gemini-cli",
    "@moonshot-ai/kimi-code",
  ]) {
    const version = cliToolsPackage.dependencies[name];
    expect(version, `${name} must be pinned to an exact version`).toMatch(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
    expect(cliToolsLock.packages[`node_modules/${name}`]?.version).toBe(version);
  }
  expect(dependabot).toContain('directory: "/docker/cli-tools"');
  for (const name of ["PAPERCLIP_BUILD_VERSION", "PAPERCLIP_BUILD_COMMIT"]) {
    const declarations = [...production.matchAll(new RegExp(`^ARG ${name}\\b`, "gm"))];
    expect(declarations).toHaveLength(1);
    expect(declarations[0].index).toBeGreaterThan(entrypoint);
    expect(declarations[0].index).toBeLessThan(runtime);
    expect(production.slice(runtime)).toContain(`${name}=\${${name}}`);
  }
});

describe("docker build-stamp wiring", () => {
  it("declares PAPERCLIP_BUILD_COMMIT in the build stage before the server build", () => {
    const build = stageBody(dockerfile, "build");
    const argIdx = build.search(/^ARG PAPERCLIP_BUILD_COMMIT\b/m);
    const serverBuildIdx = build.search(/^RUN pnpm --filter @paperclipai\/server build\b/m);
    expect(argIdx, "build stage must declare ARG PAPERCLIP_BUILD_COMMIT").toBeGreaterThanOrEqual(0);
    expect(serverBuildIdx, "build stage must run the server build").toBeGreaterThanOrEqual(0);
    expect(
      argIdx,
      "ARG PAPERCLIP_BUILD_COMMIT must precede the server build so the stamp script reads it",
    ).toBeLessThan(serverBuildIdx);
  });

  it("passes PAPERCLIP_BUILD_COMMIT as a build-arg for standard and explicit preview builds", () => {
    for (const [name, source] of [["standard", workflow], ["preview", previewWorkflow]]) {
      expect(source, `${name} must pass the source commit into the image build`)
        .toMatch(/^\s*PAPERCLIP_BUILD_COMMIT=\$\{\{ (?:github.sha|inputs.source_ref) \}\}$/m);
    }
  });
});

it("does not let calendar changes invalidate pinned CLI runtime tools", () => {
  expect(workflow).not.toContain("CLI_TOOLS_CACHE_EPOCH");
  expect(workflow).not.toContain("Compute tool cache epoch");
  expect(previewWorkflow).not.toContain("CLI_TOOLS_CACHE_EPOCH");
  expect(previewWorkflow).not.toContain("TOOLS_EPOCH");
  expect(dockerBuildTest).toMatch(/for cli in claude codex opencode gemini kimi/);
  expect(workflow).toContain("Verify bundled local-agent CLIs");
  expect(workflow).toMatch(/IMAGE_DIGEST: \$\{\{ steps\.build\.outputs\.digest \}\}/);
  expect(workflow).toMatch(/for cli in claude codex opencode gemini kimi/);
});


describe("Docker Rust dependency cache", () => {
  it("caches the locked dependency recipe separately from source and per-build metadata", () => {
    const chef = stageBody(dockerfile, "rust-chef");
    const planner = stageBody(dockerfile, "runner-plan");
    const dependencies = stageBody(dockerfile, "runner-deps");
    expect(chef).toContain("FROM rust-toolchain AS rust-chef");
    expect(chef).toMatch(/cargo install cargo-chef --version \d+\.\d+\.\d+ --locked/);
    expect(planner).toContain("COPY packages/paperclip-runner/runner ./runner");
    expect(planner).toContain("cargo chef prepare --recipe-path /tmp/runner-recipe.json");
    expect(dependencies).toContain("FROM rust-chef AS runner-deps");
    expect(dependencies).toContain("COPY --from=runner-plan /tmp/runner-recipe.json /tmp/runner-recipe.json");
    expect(dependencies).toContain("cargo chef cook --release --locked --package paperclip-runner-core --bin paperclip-runnerd");
    expect(dependencies).not.toMatch(/COPY .*\.\/runner|COPY .*\.\/protocol|COPY \. \.|PAPERCLIP_BUILD_COMMIT/);
  });

  it("rebuilds real workspace code and embedded protocol inputs after cooking dependencies", () => {
    const native = stageBody(dockerfile, "runner-build");
    expect(native).toContain("FROM runner-deps AS runner-build");
    for (const source of ["runner", "protocol"]) {
      expect(native.indexOf(`COPY packages/paperclip-runner/${source} ./${source}`))
        .toBeLessThan(native.indexOf("cargo build --release"));
      expect(native).toContain(`COPY packages/paperclip-runner/${source} ./${source}`);
    }
    expect(native).toContain("cargo build --release --manifest-path runner/Cargo.toml --locked -p paperclip-runner-core --bin paperclip-runnerd");
    expect(stageBody(dockerfile, "build")).toContain("FROM runner-build AS build");
  });
});
