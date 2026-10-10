import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTenantSessionRecoveryCoordinator,
  tenantSessionRecovery,
} from "@/lib/tenant-session-recovery";
import { healthApi } from "./health";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("exits a stalled health lookup instead of loading indefinitely", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
  const rejected = expect(healthApi.get()).rejects.toMatchObject({ name: "RequestTimeoutError" });
  await vi.advanceTimersByTimeAsync(30_000);
  await rejected;
});

describe("healthApi", () => {
  it("initiates tenant-session recovery and keeps the bootstrap request pending", async () => {
    const reload = vi.fn();
    const recovery = createTenantSessionRecoveryCoordinator(reload);
    vi.spyOn(tenantSessionRecovery, "recoverIfNeeded").mockImplementation(recovery.recoverIfNeeded);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "tenant_session_invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = healthApi.get();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    let settled = false;
    void request.then(() => { settled = true; }, () => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
  });
});
