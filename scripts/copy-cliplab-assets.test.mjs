import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { copyCliplabAssets } from "./copy-cliplab-assets.mjs";

test("copies Cliplab assets into a newly created output directory", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "paperclip-cliplab-assets-"));
  const sourceDir = path.join(root, "src", "cliplab");
  const destDir = path.join(root, "dist", "cliplab");

  try {
    await writeFile(path.join(root, "placeholder"), "placeholder");
    await import("node:fs/promises").then(({ mkdir }) => mkdir(sourceDir, { recursive: true }));
    await writeFile(path.join(sourceDir, "LICENSE"), "license");
    await writeFile(path.join(sourceDir, "PROVENANCE.md"), "provenance");

    await copyCliplabAssets({ sourceDir, destDir });

    assert.equal(await readFile(path.join(destDir, "LICENSE"), "utf8"), "license");
    assert.equal(await readFile(path.join(destDir, "PROVENANCE.md"), "utf8"), "provenance");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
