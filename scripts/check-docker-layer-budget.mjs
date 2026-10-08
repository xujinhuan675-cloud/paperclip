import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const mib = 1024 * 1024;
export const limits = { imageBytes: 1900 * mib, layerBytes: 850 * mib };

export function checkLayerBudget(manifest, budget = limits) {
  if (!Array.isArray(manifest?.layers) || manifest.layers.length === 0) {
    throw new Error("Expected a nonempty OCI image manifest, not an index");
  }
  for (const layer of manifest.layers) {
    if (!Number.isSafeInteger(layer.size) || layer.size < 0 || !/^sha256:[a-f0-9]{64}$/.test(layer.digest)) {
      throw new Error("Invalid image layer descriptor");
    }
  }
  const totalBytes = manifest.layers.reduce((sum, layer) => sum + layer.size, 0);
  const oversizedLayers = manifest.layers.filter((layer) => layer.size > budget.layerBytes);
  return { totalBytes, oversizedLayers, passed: totalBytes <= budget.imageBytes && oversizedLayers.length === 0 };
}

function inspect(ref) {
  return JSON.parse(execFileSync("docker", ["buildx", "imagetools", "inspect", "--raw", ref], {
    encoding: "utf8",
    maxBuffer: 4 * mib,
  }));
}

export function readPlatformManifest(ref, architecture, inspectManifest = inspect) {
  const manifest = inspectManifest(ref);
  if (!Array.isArray(manifest.manifests)) return manifest;
  const platform = manifest.manifests.find((entry) => entry.platform?.os === "linux" && entry.platform.architecture === architecture);
  if (!platform || !/^sha256:[a-f0-9]{64}$/.test(platform.digest)) {
    throw new Error(`Missing linux/${architecture} image manifest`);
  }
  return inspectManifest(`${ref.split("@")[0]}@${platform.digest}`);
}

function main() {
  const [ref, architecture] = process.argv.slice(2);
  if (!ref?.includes("@sha256:") || !["amd64", "arm64"].includes(architecture)) {
    throw new Error("Usage: check-docker-layer-budget.mjs <repository@digest> <amd64|arm64>");
  }
  const manifest = readPlatformManifest(ref, architecture);
  const result = checkLayerBudget(manifest);
  const lines = [
    `## Runtime Image Layers (linux/${architecture})`,
    "",
    `Compressed total: **${(result.totalBytes / mib).toFixed(2)} MiB** (budget: ${limits.imageBytes / mib} MiB).`,
    `Largest layer budget: ${limits.layerBytes / mib} MiB.`,
    "",
    "| Layer | Compressed MiB | Digest |",
    "| --- | ---: | --- |",
    ...manifest.layers.map((layer, index) => `| ${index + 1} | ${(layer.size / mib).toFixed(2)} | ${layer.digest} |`),
    "",
  ];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
  if (!result.passed) throw new Error("Runtime image exceeds the compressed layer budget; inspect platform packages and caches");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
