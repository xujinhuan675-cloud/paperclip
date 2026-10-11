import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { pluginWorkerNeedsTsx } from "./plugin-worker-runtime.js";

const fixtures: string[] = [];
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(entry: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "plugin-runtime-"));
  fixtures.push(root);
  const dependency = path.join(root, "node_modules/@paperclipai/shared");
  mkdirSync(dependency, { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { "@paperclipai/shared": "1.0.0" } }));
  writeFileSync(path.join(dependency, "package.json"), JSON.stringify({ name: "@paperclipai/shared", exports: `./${entry}` }));
  writeFileSync(path.join(dependency, entry), "export const test = true;");
  return root;
}

it("does not attach a TS loader to portable compiled dependencies", () => {
  const root = fixture("index.js");
  expect(pluginWorkerNeedsTsx(root, path.join(root, "dist/worker.js"))).toBe(false);
});

it("retains the TS loader for workspace source dependencies", () => {
  const root = fixture("index.ts");
  expect(pluginWorkerNeedsTsx(root, path.join(root, "dist/worker.js"))).toBe(true);
});

it("retains the TS loader for an explicit source worker", () => {
  const root = fixture("index.js");
  expect(pluginWorkerNeedsTsx(root, path.join(root, "src/worker.ts"))).toBe(true);
});
