import { describe, expect, it } from "vitest";

import { resolveDevTsxLoaderExecArgv } from "./plugin-loader-paths.js";

describe("plugin loader paths", () => {
  it("passes the tsx loader to Node as a file URL", () => {
    const args = resolveDevTsxLoaderExecArgv("F:\\paperclip\\cli\\node_modules\\tsx\\dist\\loader.mjs");

    expect(args).toEqual([
      "--import",
      "file:///F:/paperclip/cli/node_modules/tsx/dist/loader.mjs",
    ]);
  });
});
