import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { constants as fsConstants, promises as fs } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import type {
  AdapterExecutionControls,
  AdapterShellCommandAllowlistControl,
} from "@paperclipai/adapter-utils";
import {
  buildLocalProcessSandboxSpawnTarget,
  type LocalProcessSandboxReadOnlyMount,
} from "@paperclipai/adapter-utils/local-process-sandbox";

const require = createRequire(import.meta.url);

export const CODEX_SHELL_COMMAND_POLICY_VERSION = 1;
export const CODEX_SHELL_COMMAND_POLICY_MECHANISM = "codex_managed_pre_tool_use_execpolicy_v1";
export const CODEX_SHELL_COMMAND_POLICY_MINIMUM_CODEX_VERSION = "0.144.0";
export const CODEX_SHELL_COMMAND_POLICY_ETC_TARGET = "/etc/codex";
export const CODEX_SHELL_COMMAND_POLICY_HOOKS_TARGET = "/run/paperclip/codex-managed-hooks";

type ShellCommandPolicy = {
  version: 1;
  allowedPrefixes: string[][];
};

interface ResolvedPolicyRuntime {
  policy: ShellCommandPolicy;
  control: AdapterShellCommandAllowlistControl;
  codexExecutable: string;
  bwrapExecutable: string;
  nodeExecutable: string;
  trustedPath: string;
}

export interface PreparedCodexShellCommandPolicy {
  control: AdapterShellCommandAllowlistControl;
  readOnlyMounts: LocalProcessSandboxReadOnlyMount[];
  codexExecutable: string;
  bwrapExecutable: string;
  trustedPath: string;
  cleanup: () => Promise<void>;
}

export interface CodexShellCommandPolicyRunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export type CodexShellCommandPolicyRunner = (
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; input?: string; timeoutMs: number },
) => Promise<CodexShellCommandPolicyRunResult>;

export interface CodexShellCommandPolicyProbeOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  resolveExecutable?: (command: "codex" | "bwrap" | "node", env: NodeJS.ProcessEnv) => Promise<string>;
  run?: CodexShellCommandPolicyRunner;
  buildSandbox?: typeof buildLocalProcessSandboxSpawnTarget;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value) ?? "null").digest("hex");
}

function invalidPolicyReason(reason: string, policyDigest = ""): AdapterShellCommandAllowlistControl {
  return {
    enforced: false,
    mechanism: CODEX_SHELL_COMMAND_POLICY_MECHANISM,
    policyVersion: CODEX_SHELL_COMMAND_POLICY_VERSION,
    policyDigest,
    reason,
  };
}

function parsePolicy(value: unknown): ShellCommandPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("shell_command_policy_must_be_an_object");
  }
  const record = value as Record<string, unknown>;
  if (record.version !== CODEX_SHELL_COMMAND_POLICY_VERSION) {
    throw new Error("shell_command_policy_version_unsupported");
  }
  if (!Array.isArray(record.allowedPrefixes) || record.allowedPrefixes.length === 0) {
    throw new Error("shell_command_policy_allowed_prefixes_required");
  }
  const allowedPrefixes = record.allowedPrefixes.map((prefix, prefixIndex) => {
    if (!Array.isArray(prefix) || prefix.length === 0 || prefix.length > 16) {
      throw new Error(`shell_command_policy_prefix_${prefixIndex}_invalid`);
    }
    return prefix.map((part, partIndex) => {
      if (typeof part !== "string" || !part.trim() || part.length > 256 || /[\u0000\r\n]/.test(part)) {
        throw new Error(`shell_command_policy_prefix_${prefixIndex}_${partIndex}_invalid`);
      }
      return part;
    });
  });
  if (allowedPrefixes.length > 256) throw new Error("shell_command_policy_too_many_prefixes");
  return { version: 1, allowedPrefixes };
}

export function parseCodexShellCommandPolicy(value: unknown): {
  policy: ShellCommandPolicy;
  policyDigest: string;
} {
  const policy = parsePolicy(value);
  return { policy, policyDigest: digest(policy) };
}

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

function codexVersion(output: string): string | null {
  const match = output.match(/(?:codex(?:-cli)?\s+)?v?(\d+\.\d+\.\d+)/i);
  return match?.[1] ?? null;
}

async function defaultRunner(
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; input?: string; timeoutMs: number },
): Promise<CodexShellCommandPolicyRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const append = (current: string, chunk: Buffer) => (current + chunk.toString("utf8")).slice(-65_536);
    child.stdout.on("data", (chunk: Buffer) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = append(stderr, chunk); });
    child.stdin.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.once("error", reject);
    const timeout = setTimeout(() => child.kill("SIGKILL"), options.timeoutMs);
    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(options.input);
  });
}

function envPath(env: NodeJS.ProcessEnv): string {
  return env.PATH ?? env.Path ?? "";
}

async function assertRootOwnedImmutable(candidate: string): Promise<string> {
  const absolute = path.resolve(candidate);
  await fs.access(absolute, fsConstants.X_OK);
  const real = await fs.realpath(absolute);
  const inspect = async (value: string) => {
    const stat = await fs.lstat(value);
    const writableByNonRoot = !stat.isSymbolicLink() && (stat.mode & 0o022) !== 0;
    if (stat.uid !== 0 || writableByNonRoot) {
      throw new Error(`shell_command_policy_executable_not_host_owned:${value}`);
    }
  };
  await inspect(absolute);
  for (const start of new Set([path.dirname(absolute), real, path.dirname(real)])) {
    let current = start;
    while (true) {
      await inspect(current);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return real;
}

async function resolveTrustedExecutable(command: string, env: NodeJS.ProcessEnv): Promise<string> {
  let rejectedCandidate: string | null = null;
  for (const entry of envPath(env).split(path.delimiter)) {
    if (!entry || !path.isAbsolute(entry)) continue;
    const candidate = path.join(entry, command);
    try {
      return await assertRootOwnedImmutable(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") rejectedCandidate = candidate;
    }
  }
  throw new Error(
    rejectedCandidate
      ? `shell_command_policy_trusted_executable_not_found:${command}:rejected:${rejectedCandidate}`
      : `shell_command_policy_trusted_executable_not_found:${command}`,
  );
}

function staticPolicyControl(config: Record<string, unknown>): {
  policy: ShellCommandPolicy;
  control: AdapterShellCommandAllowlistControl;
} | { control: AdapterShellCommandAllowlistControl; policy?: never } {
  let parsed: { policy: ShellCommandPolicy; policyDigest: string };
  try {
    parsed = parseCodexShellCommandPolicy(config.shellCommandPolicy);
  } catch (error) {
    return { control: invalidPolicyReason(error instanceof Error ? error.message : String(error)) };
  }
  const control = invalidPolicyReason("", parsed.policyDigest);
  control.reason = null;
  if (config.engine !== "cli") control.reason = "shell_command_policy_requires_cli_engine";
  else if (config.filesystemScope !== "workspace") control.reason = "shell_command_policy_requires_workspace_scope";
  else if (config.networkScope !== "deny") control.reason = "shell_command_policy_requires_network_deny";
  else if ((typeof config.command === "string" ? config.command.trim() : "codex") !== "codex") {
    control.reason = "shell_command_policy_requires_codex_command";
  } else if ((typeof config.filesystemSandboxCommand === "string" ? config.filesystemSandboxCommand.trim() : "bwrap") !== "bwrap") {
    control.reason = "shell_command_policy_requires_bwrap";
  } else if (config.env && typeof config.env === "object" && !Array.isArray(config.env)
    && Object.keys(config.env as Record<string, unknown>).length > 0) {
    control.reason = "shell_command_policy_requires_empty_adapter_env";
  }
  return { policy: parsed.policy, control };
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

const HOOK_SOURCE = String.raw`#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import shellQuote from "shell-quote";

const [rulesPath, codexCommand, policyDigest] = process.argv.slice(2);
const audit = (decision, reason, command) => {
  const commandHash = createHash("sha256").update(command || "").digest("hex");
  process.stderr.write(JSON.stringify({
    paperclipShellPolicy: "v1",
    policyDigest,
    decision,
    reason,
    commandHash,
  }) + "\n");
};
const deny = (reason, command = "") => {
  audit("deny", reason, command);
  process.stderr.write("Paperclip managed shell command policy denied this command.\n");
  process.exit(2);
};
try {
  let body = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) body += chunk;
  const event = JSON.parse(body);
  const command = event?.tool_input?.command;
  if (event?.hook_event_name !== "PreToolUse" || event?.tool_name !== "Bash" || typeof command !== "string" || !command.trim()) {
    deny("invalid_pre_tool_use_payload", typeof command === "string" ? command : "");
  }
  const tokens = shellQuote.parse(command, () => ({ op: "environment_expansion" }));
  const commands = [[]];
  for (const token of tokens) {
    if (typeof token === "string") {
      if (!token) deny("empty_command_token", command);
      commands[commands.length - 1].push(token);
      continue;
    }
    if (token && typeof token === "object" && ["&&", "||", ";", "|"].includes(token.op)) {
      if (commands[commands.length - 1].length === 0) deny("empty_compound_command", command);
      commands.push([]);
      continue;
    }
    deny("unsupported_shell_syntax", command);
  }
  if (commands.length === 0 || commands.some((entry) => entry.length === 0)) deny("empty_command", command);
  for (const argv of commands) {
    const result = spawnSync(codexCommand, ["execpolicy", "check", "--rules", rulesPath, "--", ...argv], {
      encoding: "utf8",
      timeout: 4_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error || result.status !== 0) deny("execpolicy_check_failed", command);
    let parsed;
    try { parsed = JSON.parse(result.stdout || ""); } catch { deny("execpolicy_output_invalid", command); }
    if (parsed?.decision !== "allow") deny("execpolicy_decision_" + String(parsed?.decision || "missing"), command);
  }
  audit("allow", "execpolicy_allow", command);
} catch (error) {
  deny("hook_error_" + (error instanceof Error ? error.message : String(error)));
}
`;

function rulesSource(policy: ShellCommandPolicy): string {
  return policy.allowedPrefixes.map((prefix) => [
    "prefix_rule(",
    `    pattern = ${JSON.stringify(prefix)},`,
    '    decision = "allow",',
    '    justification = "Paperclip managed workspace command allowlist",',
    ")",
    "",
  ].join("\n")).join("\n");
}

function requirementsSource(hooksPath: string, nodeExecutable: string, codexExecutable: string): string {
  const hookPath = path.posix.join(hooksPath, "pre-tool-use-policy.mjs");
  const command = [
    nodeExecutable,
    hookPath,
    path.posix.join(hooksPath, "shell-command-policy.rules"),
    codexExecutable,
    "POLICY_DIGEST",
  ].map(shellQuote).join(" ");
  return [
    "allow_managed_hooks_only = true",
    "",
    "[features]",
    "hooks = true",
    "multi_agent = false",
    "apps = false",
    "computer_use = false",
    "browser_use = false",
    "browser_use_external = false",
    "browser_use_full_cdp_access = false",
    "",
    "[features.code_mode]",
    "enabled = false",
    "",
    "[hooks]",
    `managed_dir = ${tomlString(hooksPath)}`,
    "",
    "[[hooks.PreToolUse]]",
    'matcher = "^Bash$"',
    "",
    "[[hooks.PreToolUse.hooks]]",
    'type = "command"',
    `command = ${tomlString(command)}`,
    "timeout = 10",
    'statusMessage = "Checking Paperclip managed shell command policy"',
    "",
  ].join("\n");
}

function commandSource(prefix: string[]): string {
  return prefix.map(shellQuote).join(" ");
}

function event(command: string): string {
  return JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command } });
}

function assertAllowed(result: CodexShellCommandPolicyRunResult, name: string): void {
  if (result.code !== 0) throw new Error(`${name}_failed:${result.stderr.trim() || `exit_${result.code}`}`);
  let parsed: unknown;
  try { parsed = JSON.parse(result.stdout); } catch { throw new Error(`${name}_invalid_json`); }
  if (!parsed || typeof parsed !== "object" || (parsed as Record<string, unknown>).decision !== "allow") {
    throw new Error(`${name}_did_not_allow:${result.stdout.trim() || "empty"}`);
  }
}

async function resolvePolicyRuntime(
  config: Record<string, unknown>,
  options: CodexShellCommandPolicyProbeOptions,
): Promise<ResolvedPolicyRuntime | { control: AdapterShellCommandAllowlistControl }> {
  const staticResult = staticPolicyControl(config);
  if (!("policy" in staticResult) || staticResult.control.reason) return { control: staticResult.control };
  if ((options.platform ?? process.platform) !== "linux") {
    return { control: { ...staticResult.control, reason: "shell_command_policy_requires_linux" } };
  }
  const env = options.env ?? process.env;
  const resolveExecutable = options.resolveExecutable ?? resolveTrustedExecutable;
  const run = options.run ?? defaultRunner;
  try {
    const [codexExecutable, bwrapExecutable, nodeExecutable] = await Promise.all([
      resolveExecutable("codex", env),
      resolveExecutable("bwrap", env),
      resolveExecutable("node", env),
    ]);
    const trustedPath = [...new Set([
      path.dirname(nodeExecutable),
      path.dirname(codexExecutable),
      path.dirname(bwrapExecutable),
    ])].join(path.delimiter);
    const trustedEnv: NodeJS.ProcessEnv = { ...env, PATH: trustedPath };
    delete trustedEnv.Path;
    const bwrapVersion = await run(bwrapExecutable, ["--version"], { env: trustedEnv, timeoutMs: 5_000 });
    if (bwrapVersion.code !== 0) throw new Error("bwrap_version_probe_failed");
    const versionResult = await run(codexExecutable, ["--version"], { env: trustedEnv, timeoutMs: 5_000 });
    if (versionResult.code !== 0) throw new Error("codex_version_probe_failed");
    const runtimeVersion = codexVersion(`${versionResult.stdout}\n${versionResult.stderr}`);
    if (!runtimeVersion || compareVersions(runtimeVersion, CODEX_SHELL_COMMAND_POLICY_MINIMUM_CODEX_VERSION) < 0) {
      return {
        control: {
          ...staticResult.control,
          runtimeVersion,
          reason: `codex_hooks_require_${CODEX_SHELL_COMMAND_POLICY_MINIMUM_CODEX_VERSION}_or_newer`,
        },
      };
    }
    return {
      policy: staticResult.policy,
      control: { ...staticResult.control, runtimeVersion },
      codexExecutable,
      bwrapExecutable,
      nodeExecutable,
      trustedPath,
    };
  } catch (error) {
    return {
      control: {
        ...staticResult.control,
        reason: `shell_command_policy_host_probe_failed:${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

async function materializeAndVerify(
  runtime: ResolvedPolicyRuntime,
  options: CodexShellCommandPolicyProbeOptions,
): Promise<PreparedCodexShellCommandPolicy> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-codex-shell-policy-"));
  try {
    const etcCodex = path.join(root, "etc", "codex");
    const hooks = path.join(root, "hooks");
    const codexHome = path.join(root, "codex-home");
    await fs.mkdir(etcCodex, { recursive: true, mode: 0o700 });
    await fs.mkdir(hooks, { recursive: true, mode: 0o700 });
    await fs.mkdir(codexHome, { recursive: true, mode: 0o700 });
    const rulesPath = path.join(hooks, "shell-command-policy.rules");
    const hookPath = path.join(hooks, "pre-tool-use-policy.mjs");
    const shellQuoteEntry = require.resolve("shell-quote");
    await fs.cp(path.dirname(shellQuoteEntry), path.join(hooks, "node_modules", "shell-quote"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(etcCodex, "requirements.toml"),
      requirementsSource(
        CODEX_SHELL_COMMAND_POLICY_HOOKS_TARGET,
        runtime.nodeExecutable,
        runtime.codexExecutable,
      ).replace("POLICY_DIGEST", runtime.control.policyDigest),
      { mode: 0o400 },
    );
    await fs.writeFile(rulesPath, rulesSource(runtime.policy), { mode: 0o400 });
    await fs.writeFile(hookPath, HOOK_SOURCE, { mode: 0o500 });

    const env: NodeJS.ProcessEnv = {
      ...(options.env ?? process.env),
      PATH: runtime.trustedPath,
      CODEX_HOME: codexHome,
    };
    delete env.Path;
    const run = options.run ?? defaultRunner;
    const allowedCommand = commandSource(runtime.policy.allowedPrefixes[0]!);
    const directAllow = await run(
      runtime.codexExecutable,
      ["execpolicy", "check", "--rules", rulesPath, "--", ...runtime.policy.allowedPrefixes[0]!],
      { env, timeoutMs: 5_000 },
    );
    assertAllowed(directAllow, "shell_command_policy_execpolicy_self_test");
    const hookAllow = await run(
      runtime.nodeExecutable,
      [hookPath, rulesPath, runtime.codexExecutable, runtime.control.policyDigest],
      { env, input: event(allowedCommand), timeoutMs: 5_000 },
    );
    if (hookAllow.code !== 0) throw new Error("shell_command_policy_hook_allow_self_test_failed");
    const hookCompoundAllow = await run(
      runtime.nodeExecutable,
      [hookPath, rulesPath, runtime.codexExecutable, runtime.control.policyDigest],
      { env, input: event(`${allowedCommand} && ${allowedCommand}`), timeoutMs: 5_000 },
    );
    if (hookCompoundAllow.code !== 0) {
      throw new Error("shell_command_policy_hook_compound_allow_self_test_failed");
    }
    const hookDeny = await run(
      runtime.nodeExecutable,
      [hookPath, rulesPath, runtime.codexExecutable, runtime.control.policyDigest],
      { env, input: event("paperclip-forbidden-command"), timeoutMs: 5_000 },
    );
    if (hookDeny.code !== 2) throw new Error("shell_command_policy_hook_deny_self_test_failed");
    const hookSyntaxDeny = await run(
      runtime.nodeExecutable,
      [hookPath, rulesPath, runtime.codexExecutable, runtime.control.policyDigest],
      { env, input: event(`${allowedCommand} > paperclip-policy-probe`), timeoutMs: 5_000 },
    );
    if (hookSyntaxDeny.code !== 2) throw new Error("shell_command_policy_hook_syntax_self_test_failed");

    const readOnlyMounts = [
      { source: etcCodex, target: CODEX_SHELL_COMMAND_POLICY_ETC_TARGET },
      { source: hooks, target: CODEX_SHELL_COMMAND_POLICY_HOOKS_TARGET },
    ];
    const buildSandbox = options.buildSandbox ?? buildLocalProcessSandboxSpawnTarget;
    const sandboxTarget = await buildSandbox({
      executable: runtime.codexExecutable,
      args: [
        "execpolicy",
        "check",
        "--rules",
        path.posix.join(CODEX_SHELL_COMMAND_POLICY_HOOKS_TARGET, "shell-command-policy.rules"),
        "--",
        ...runtime.policy.allowedPrefixes[0]!,
      ],
      cwd: root,
      options: {
        workspaceDir: root,
        filesystemScope: "workspace",
        networkScope: "deny",
        readOnlyMounts,
        command: runtime.bwrapExecutable,
      },
    });
    const sandboxEnv = Object.fromEntries(
      Object.entries({ ...env, ...sandboxTarget.env }).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    const sandboxResult = await run(runtime.bwrapExecutable, sandboxTarget.args, {
      env: sandboxEnv,
      timeoutMs: 10_000,
    });
    assertAllowed(sandboxResult, "shell_command_policy_bwrap_self_test");
    await sandboxTarget.cleanup?.();

    return {
      control: { ...runtime.control, enforced: true, reason: null },
      readOnlyMounts,
      codexExecutable: runtime.codexExecutable,
      bwrapExecutable: runtime.bwrapExecutable,
      trustedPath: runtime.trustedPath,
      cleanup: async () => fs.rm(root, { recursive: true, force: true }),
    };
  } catch (error) {
    await fs.rm(root, { recursive: true, force: true });
    throw error;
  }
}

export async function resolveCodexShellCommandPolicyControls(
  config: Record<string, unknown>,
  options: CodexShellCommandPolicyProbeOptions = {},
): Promise<AdapterExecutionControls> {
  if (config.shellCommandPolicy == null) return { shellCommandAllowlist: null };
  const runtime = await resolvePolicyRuntime(config, options);
  if (!("policy" in runtime)) return { shellCommandAllowlist: runtime.control };
  try {
    const prepared = await materializeAndVerify(runtime, options);
    const control = prepared.control;
    await prepared.cleanup();
    return { shellCommandAllowlist: control };
  } catch (error) {
    return {
      shellCommandAllowlist: {
        ...runtime.control,
        enforced: false,
        reason: `shell_command_policy_self_test_failed:${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

export async function prepareCodexShellCommandPolicy(input: {
  config: Record<string, unknown>;
  platform?: NodeJS.Platform;
  resolveExecutable?: CodexShellCommandPolicyProbeOptions["resolveExecutable"];
  run?: CodexShellCommandPolicyRunner;
  buildSandbox?: typeof buildLocalProcessSandboxSpawnTarget;
}): Promise<PreparedCodexShellCommandPolicy> {
  const options: CodexShellCommandPolicyProbeOptions = {
    platform: input.platform,
    resolveExecutable: input.resolveExecutable,
    run: input.run,
    buildSandbox: input.buildSandbox,
  };
  const runtime = await resolvePolicyRuntime(input.config, options);
  if (!("policy" in runtime)) throw new Error(runtime.control.reason ?? "shell_command_policy_not_enforced");
  return materializeAndVerify(runtime, options);
}
