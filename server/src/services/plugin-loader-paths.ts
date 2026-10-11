import { pathToFileURL } from "node:url";

export function resolveDevTsxLoaderExecArgv(loaderPath: string): ["--import", string] {
  return ["--import", pathToFileURL(loaderPath).href];
}
