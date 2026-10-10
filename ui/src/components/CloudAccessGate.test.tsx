// @vitest-environment jsdom
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CloudAccessGate } from "./CloudAccessGate";

const mocks = vi.hoisted(() => ({ health: vi.fn(), session: vi.fn(), access: vi.fn() }));
vi.mock("@/api/health", () => ({ healthApi: { get: mocks.health } }));
vi.mock("@/api/auth", () => ({ authApi: { getSession: mocks.session } }));
vi.mock("@/api/access", () => ({ accessApi: { getCurrentBoardAccess: mocks.access } }));
vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/FLO/dashboard", search: "" }),
  Navigate: () => <div>auth redirect</div>,
  Outlet: () => <div>app loaded</div>,
}));
vi.mock("./AnimatedPaperclipIcon", () => ({ PaperclipLoading: () => <div>loading</div> }));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.health.mockResolvedValue({ deploymentMode: "authenticated", bootstrapStatus: "ready" });
  mocks.session.mockResolvedValue({ user: { id: "user-1" } });
  mocks.access.mockResolvedValue({ isInstanceAdmin: true, companyIds: [] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { root.unmount(); client.clear(); container.remove(); });

function mount() {
  root.render(<QueryClientProvider client={client}><CloudAccessGate /></QueryClientProvider>);
}

it("recovers a transient cold-load health failure", async () => {
  mocks.health.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  mount();
  await vi.waitFor(() => expect(container.textContent).toContain("app loaded"));
});

it("offers retry on session failure without redirecting to auth", async () => {
  mocks.session.mockRejectedValue(new TypeError("Failed to fetch"));
  mount();
  await vi.waitFor(() => expect(container.querySelector("button")).not.toBeNull());
  expect(container.textContent).not.toContain("auth redirect");
  mocks.session.mockResolvedValue({ user: { id: "user-1" } });
  container.querySelector("button")!.click();
  await vi.waitFor(() => expect(container.textContent).toContain("app loaded"));
});

it("still redirects a successfully resolved signed-out session", async () => {
  mocks.session.mockResolvedValue(null);
  mount();
  await vi.waitFor(() => expect(container.textContent).toContain("auth redirect"));
});
