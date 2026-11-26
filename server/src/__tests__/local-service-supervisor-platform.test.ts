import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalServiceProcessOwnedBy,
  readLocalServicePortOwner,
  readLocalServiceProcessCwd,
} from "../services/local-service-supervisor.js";

const execute = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  const { promisify } = await import("node:util");
  const execFile = Object.assign(vi.fn(), { [promisify.custom]: execute });
  return { ...actual, execFile };
});

describe("local service platform output", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    execute.mockReset();
  });

  it("attributes a Windows listener to a descendant of the launched process", async () => {
    const port = 43_123;
    const listenerPid = 43_210;
    const launchedPid = 32_000;
    Object.defineProperty(process, "platform", { value: "win32" });
    execute.mockResolvedValueOnce({
      stdout: `  TCP    127.0.0.1:${port}    0.0.0.0:0    LISTENING    ${listenerPid}\r\n`,
    }).mockResolvedValueOnce({ stdout: `${launchedPid}\r\n` });

    await expect(readLocalServicePortOwner(port)).resolves.toBe(listenerPid);
    await expect(isLocalServiceProcessOwnedBy(listenerPid, launchedPid)).resolves.toBe(true);
    expect(execute).toHaveBeenNthCalledWith(1, "netstat", ["-ano", "-p", "tcp"]);
    expect(execute).toHaveBeenNthCalledWith(2, "powershell.exe", [
      "-NoProfile", "-NonInteractive", "-Command", expect.stringContaining(String(listenerPid)),
    ]);
  });

  it("preserves newlines and trailing whitespace from Darwin lsof cwd output", async () => {
    const reportedCwd = path.join(os.tmpdir(), "paperclip-runtime-line\nbreak ");
    Object.defineProperty(process, "platform", { value: "darwin" });
    execute.mockResolvedValueOnce({ stdout: `p${process.pid}\0fcwd\0n${reportedCwd}\0\n` });

    await expect(readLocalServiceProcessCwd(process.pid)).resolves.toBe(reportedCwd);
    expect(execute).toHaveBeenCalledWith("lsof", ["-a", "-d", "cwd", "-p", String(process.pid), "-F0n"]);
  });
});
