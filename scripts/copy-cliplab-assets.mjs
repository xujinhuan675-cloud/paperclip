import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ASSETS = ["LICENSE", "PROVENANCE.md"];

export async function copyCliplabAssets({ sourceDir, destDir }) {
  await mkdir(destDir, { recursive: true });
  await Promise.all(
    ASSETS.map((asset) => copyFile(path.join(sourceDir, asset), path.join(destDir, asset))),
  );
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const packageRoot = path.resolve(path.dirname(scriptPath), "..", "packages", "shared");
  await copyCliplabAssets({
    sourceDir: path.join(packageRoot, "src", "cliplab"),
    destDir: path.join(packageRoot, "dist", "cliplab"),
  });
}
