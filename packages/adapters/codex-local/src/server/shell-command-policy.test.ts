import { promises as fs } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  CODEX_SHELL_COMMAND_POLICY_MECHANISM,
  type CodexShellCommandPolicyProbeOptions,
  type CodexShellCommandPolicyRunner,
  parseCodexShellCommandPolicy,
  prepareCodexShellCommandPolicy,
  resolveCodexShellCommandPolicyControls,
} from "./shell-command-policy.js";

const config = {
  engine: "cli",
  command: "codex",
  filesystemScope: "workspace",
  networkScope: "deny",
  shellCommandPolicy: {
    version: 1,
    allowedPrefixes: [["pwd"], ["git", "status"], ["pnpm", "test"]],
  },
};

function probeOptions(version = "0.144.4"): CodexShellCommandPolicyProbeOptions {
  const run: CodexShellCommandPolicyRunner = vi.fn(async (command, args, options) => {
    if (args[0] === "--version") {
      return {
        code: 0,
        stdout: command.endsWith("codex") ? `codex-cli ${version}` : "bubblewrap 0.10.0",
        stderr: "",
      };
    }
    if (command.endsWith("node")) {
      const denied = options.input?.includes("paperclip-forbidden-command")
        || options.input?.includes(" > ")
        || false;
      return { code: denied ? 2 : 0, stdout: "", stderr: denied ? "denied" : "allowed" };
    }
    return { code: 0, stdout: JSON.stringify({ decision: "allow" }), stderr: "" };
  });
  return {
    platform: "linux",
    resolveExecutable: vi.fn(async (command) => `/usr/bin/${command}`),
    run,
    buildSandbox: vi.fn(async (input) => ({
      command: input.options.command ?? "bwrap",
      args: ["--ro-bind", input.options.readOnlyMounts?.[0]?.source ?? "", "/etc/codex", "--", input.executable, ...input.args],
      cwd: "/",
      env: {},
    })),
  };
}

describe("Codex managed shell command policy", () => {
  it("strictly parses and hashes a versioned argv-prefix allowlist", () => {
    const first = parseCodexShellCommandPolicy(config.shellCommandPolicy);
    const second = parseCodexShellCommandPolicy(config.shellCommandPolicy);
    expect(first.policy.allowedPrefixes).toEqual([["pwd"], ["git", "status"], ["pnpm", "test"]]);
    expect(first.policyDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(second.policyDigest).toBe(first.policyDigest);
    expect(() => parseCodexShellCommandPolicy({ version: 1, allowedPrefixes: [["rg\nrm"]] }))
      .toThrow("shell_command_policy_prefix_0_0_invalid");
  });

  it("returns an enforced host fact only after Codex and Bubblewrap probes pass", async () => {
    const options = probeOptions();
    const controls = await resolveCodexShellCommandPolicyControls(config, options);
    expect(controls.shellCommandAllowlist).toMatchObject({
      enforced: true,
      mechanism: CODEX_SHELL_COMMAND_POLICY_MECHANISM,
      policyVersion: 1,
      runtimeVersion: "0.144.4",
      reason: null,
    });
    expect(options.resolveExecutable).toHaveBeenCalledWith("bwrap", process.env);
    expect(options.resolveExecutable).toHaveBeenCalledWith("codex", process.env);
    expect(options.run).toHaveBeenCalledWith(
      "/usr/bin/bwrap",
      expect.arrayContaining(["--ro-bind", "/etc/codex"]),
      expect.objectContaining({ timeoutMs: 10_000 }),
    );
  });

  it("fails closed for unsafe adapter settings or an old Codex runtime", async () => {
    const unsafe = await resolveCodexShellCommandPolicyControls(
      { ...config, filesystemScope: null },
      probeOptions(),
    );
    expect(unsafe.shellCommandAllowlist).toMatchObject({
      enforced: false,
      reason: "shell_command_policy_requires_workspace_scope",
    });
    const old = await resolveCodexShellCommandPolicyControls(config, probeOptions("0.143.0"));
    expect(old.shellCommandAllowlist).toMatchObject({
      enforced: false,
      runtimeVersion: "0.143.0",
      reason: "codex_hooks_require_0.144.0_or_newer",
    });
    const envOverride = await resolveCodexShellCommandPolicyControls(
      { ...config, env: { PATH: "/workspace/bin" } },
      probeOptions(),
    );
    expect(envOverride.shellCommandAllowlist).toMatchObject({
      enforced: false,
      reason: "shell_command_policy_requires_empty_adapter_env",
    });
  });

  it.skipIf(process.platform !== "linux")(
    "skips an untrusted PATH candidate and resolves the later host-owned executable",
    async () => {
      const root = await fs.mkdtemp("/tmp/paperclip-untrusted-path-");
      try {
        await fs.writeFile(`${root}/node`, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
        const controls = await resolveCodexShellCommandPolicyControls(config, {
          env: { ...process.env, PATH: `${root}:/usr/bin:/bin` },
        });
        expect(controls.shellCommandAllowlist).toMatchObject({
          enforced: true,
          mechanism: CODEX_SHELL_COMMAND_POLICY_MECHANISM,
          reason: null,
        });
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    },
    30_000,
  );

  it("materializes immutable managed requirements, hook and execpolicy rules per run", async () => {
    const prepared = await prepareCodexShellCommandPolicy({
      config,
      ...probeOptions(),
    });
    const etcMount = prepared.readOnlyMounts.find((entry) => entry.target === "/etc/codex");
    const hookMount = prepared.readOnlyMounts.find((entry) => entry.target === "/run/paperclip/codex-managed-hooks");
    expect(etcMount).toBeTruthy();
    expect(hookMount).toBeTruthy();
    const requirements = await fs.readFile(`${etcMount!.source}/requirements.toml`, "utf8");
    const rules = await fs.readFile(`${hookMount!.source}/shell-command-policy.rules`, "utf8");
    const hook = await fs.readFile(`${hookMount!.source}/pre-tool-use-policy.mjs`, "utf8");
    expect(requirements).toContain("allow_managed_hooks_only = true");
    expect(requirements).toContain('matcher = "^Bash$"');
    expect(requirements).toContain("[features.code_mode]");
    expect(rules).toContain('pattern = ["git","status"]');
    expect(hook).toContain('shellQuote.parse(command');
    expect(hook).toContain('spawnSync(codexCommand, ["execpolicy", "check"');
    await prepared.cleanup();
    await expect(fs.stat(etcMount!.source)).rejects.toThrow();
  });

  it.skipIf(process.platform !== "linux")(
    "passes the real host execpolicy, managed hook, and Bubblewrap conformance self-test",
    async () => {
      const controls = await resolveCodexShellCommandPolicyControls(config);
      expect(controls.shellCommandAllowlist).toMatchObject({
        enforced: true,
        mechanism: CODEX_SHELL_COMMAND_POLICY_MECHANISM,
        policyVersion: 1,
        runtimeVersion: "0.147.0",
        reason: null,
      });
    },
    30_000,
  );
});
