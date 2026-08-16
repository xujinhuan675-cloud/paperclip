import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildHostServices } from "../services/plugin-host-services.js";

const mocks = vi.hoisted(() => ({
  dnsLookup: vi.fn(),
  httpRequest: vi.fn(),
}));

vi.mock("node:dns/promises", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:dns/promises")>(),
  lookup: mocks.dnsLookup,
}));

vi.mock("node:http", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:http")>(),
  request: mocks.httpRequest,
}));

function createEventBusStub() {
  return {
    forPlugin() {
      return { clear: vi.fn(), emit: vi.fn(), subscribe: vi.fn() };
    },
  } as never;
}

function servicesFor() {
  return buildHostServices({} as never, "plugin-record-id", "http-test", createEventBusStub());
}

describe("plugin host HTTP lifecycle", () => {
  beforeEach(() => {
    mocks.dnsLookup.mockReset();
    mocks.httpRequest.mockReset();
    mocks.dnsLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("aborts the matching outbound request when the worker sends http.cancel", async () => {
    let hostSignal: AbortSignal | undefined;
    mocks.httpRequest.mockImplementation((options: { signal?: AbortSignal }) => {
      const request = new EventEmitter() as EventEmitter & { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
      request.write = vi.fn();
      request.end = vi.fn();
      hostSignal = options.signal;
      options.signal?.addEventListener("abort", () => {
        request.emit("error", new DOMException("The operation was aborted", "AbortError"));
      }, { once: true });
      return request;
    });
    const services = servicesFor();

    const fetch = services.http.fetch({ url: "http://example.test/slow", requestId: "request-1" });
    await vi.waitFor(() => expect(mocks.httpRequest).toHaveBeenCalledOnce());
    await services.http.cancel({ requestId: "request-1" });

    await expect(fetch).rejects.toThrow(/aborted/i);
    expect(hostSignal?.aborted).toBe(true);
    services.dispose();
  });

  it("rejects when a response closes before the body reaches end", async () => {
    const response = new PassThrough() as PassThrough & {
      complete: boolean;
      headers: Record<string, string>;
      statusCode: number;
      statusMessage: string;
    };
    response.complete = false;
    response.headers = { "content-type": "text/plain" };
    response.statusCode = 200;
    response.statusMessage = "OK";
    mocks.httpRequest.mockImplementation((_options: unknown, onResponse: (value: typeof response) => void) => {
      const request = new EventEmitter() as EventEmitter & { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
      request.write = vi.fn();
      request.end = vi.fn(() => {
        onResponse(response);
        setTimeout(() => response.emit("close"), 0);
      });
      return request;
    });
    const services = servicesFor();

    await expect(services.http.fetch({ url: "http://example.test/incomplete" }))
      .rejects.toThrow("HTTP response closed before completion");
    services.dispose();
  });
});
