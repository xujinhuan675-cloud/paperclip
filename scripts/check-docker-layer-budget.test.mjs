import assert from "node:assert/strict";
import { test } from "node:test";
import { checkLayerBudget, readPlatformManifest } from "./check-docker-layer-budget.mjs";

const layer = (size, digit = "a") => ({ size, digest: `sha256:${digit.repeat(64)}` });

test("accepts bounded layers and sums compressed transfer sizes", () => {
  assert.deepEqual(checkLayerBudget({ layers: [layer(50), layer(70)] }, { imageBytes: 120, layerBytes: 70 }), {
    totalBytes: 120, oversizedLayers: [], passed: true,
  });
});

test("rejects images and individual layers above their independent budgets", () => {
  assert.equal(checkLayerBudget({ layers: [layer(61), layer(60)] }, { imageBytes: 120, layerBytes: 70 }).passed, false);
  const result = checkLayerBudget({ layers: [layer(71)] }, { imageBytes: 120, layerBytes: 70 });
  assert.equal(result.passed, false);
  assert.equal(result.oversizedLayers.length, 1);
});

test("does not treat missing, empty, or invalid descriptors as a small image", () => {
  for (const manifest of [null, {}, { manifests: [] }, { layers: [] }, { layers: [layer(-1)] },
    { layers: [layer(1.5)] }, { layers: [{ size: 1, digest: "bad" }] }]) {
    assert.throws(() => checkLayerBudget(manifest));
  }
});

test("selects the requested platform and excludes attestation manifests", () => {
  const ref = `ghcr.io/example/paperclip@sha256:${"d".repeat(64)}`;
  const selected = `ghcr.io/example/paperclip@sha256:${"c".repeat(64)}`;
  const calls = [];
  const actual = { layers: [layer(10)] };
  const result = readPlatformManifest(ref, "arm64", (target) => {
    calls.push(target);
    return target === selected ? actual : { manifests: [
      { digest: `sha256:${"a".repeat(64)}`, platform: { os: "unknown", architecture: "unknown" } },
      { digest: `sha256:${"b".repeat(64)}`, platform: { os: "linux", architecture: "amd64" } },
      { digest: `sha256:${"c".repeat(64)}`, platform: { os: "linux", architecture: "arm64" } },
    ] };
  });
  assert.equal(result, actual);
  assert.deepEqual(calls, [ref, selected]);
});

test("accepts a direct manifest and refuses a missing platform", () => {
  const manifest = { layers: [layer(10)] };
  assert.equal(readPlatformManifest("ref", "amd64", () => manifest), manifest);
  assert.throws(() => readPlatformManifest("ref", "arm64", () => ({ manifests: [] })), /Missing linux\/arm64/);
});
