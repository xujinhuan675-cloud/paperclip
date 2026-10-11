import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export function pluginWorkerNeedsTsx(packageRoot: string, workerEntrypoint: string): boolean {
  const isSource = (entry: string) => /\.(?:[cm]?ts|tsx)$/.test(entry);
  if (isSource(workerEntrypoint)) return true;
  const packageJsonPath = path.join(packageRoot, "package.json");
  const resolve = createRequire(packageJsonPath).resolve;
  let dependencies: Record<string, unknown> = {};
  try {
    dependencies = JSON.parse(readFileSync(packageJsonPath, "utf8")).dependencies ?? {};
  } catch {
    return true;
  }
  // The SDK can resolve shared workspace sources even when its own entry is JS.
  for (const name of new Set([...Object.keys(dependencies), "@paperclipai/shared", "@paperclipai/plugin-sdk"])) {
    try {
      if (isSource(resolve(name))) return true;
    } catch {
      // Bundled workers may inline their dependencies, leaving no package to resolve.
    }
  }
  return false;
}
