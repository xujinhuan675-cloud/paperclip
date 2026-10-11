export class RequestTimeoutError extends Error {
  constructor() {
    super("The server took too long to respond. Please try again.");
    this.name = "RequestTimeoutError";
  }
}

// Bound the complete read, including the body, without replaying mutations.
export async function withReadDeadline<T>(
  read: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal | null,
): Promise<T> {
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  const controller = new AbortController();
  let onAbort!: () => void;
  let timer!: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    onAbort = () => {
      controller.abort();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => {
      reject(new RequestTimeoutError());
      controller.abort();
    }, 30_000);
  });
  try {
    return await Promise.race([read(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
