// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginUiContribution } from "@/api/plugins";
import { PluginLauncherOutlet, PluginLauncherProvider } from "./launchers";

const testState = vi.hoisted(() => ({
  navigate: vi.fn(),
  contributions: [] as PluginUiContribution[],
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: testState.contributions, isLoading: false, error: null }),
}));

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ key: "launcher-test-location" }),
  useNavigate: () => testState.navigate,
  NavLink: ({ children, className, state: _state, to, ...props }: {
    children: ReactNode | ((state: { isActive: boolean }) => ReactNode);
    className?: string | ((state: { isActive: boolean }) => string);
    state?: unknown;
    to: string;
  }) => {
    const routeState = { isActive: true };
    return (
      <a
        href={to}
        className={typeof className === "function" ? className(routeState) : className}
        {...props}
      >
        {typeof children === "function" ? children(routeState) : children}
      </a>
    );
  },
}));

vi.mock("@/context/SidebarContext", () => ({
  useSidebar: () => ({
    isMobile: false,
    setSidebarOpen: vi.fn(),
    collapsed: false,
    peeking: false,
  }),
}));

afterEach(() => {
  testState.navigate.mockReset();
  testState.contributions = [];
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("plugin sidebar launchers", () => {
  it("uses the native sidebar row with a declared icon and host navigation", async () => {
    testState.contributions = [{
      pluginId: "plugin-architecture-map",
      pluginKey: "anchoros.paperclip-architecture-map",
      displayName: "Architecture Map",
      version: "0.1.1",
      uiEntryFile: "index.js",
      slots: [{
        type: "routeSidebar",
        id: "architecture-map-sidebar-route",
        displayName: "思维导图",
        exportName: "ProjectArchitectureTab",
        routePath: "architecture-map",
      }],
      launchers: [{
        id: "architecture-map-sidebar",
        displayName: "思维导图",
        icon: "brain-circuit",
        placementZone: "sidebar",
        action: { type: "navigate", target: "architecture-map" },
      }],
    }];

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      act(() => {
        root.render(
          <PluginLauncherProvider>
            <PluginLauncherOutlet
              placementZones={["sidebar"]}
              context={{ companyId: "company-arc", companyPrefix: "ARC" }}
            />
          </PluginLauncherProvider>,
        );
      });

      const link = container.querySelector<HTMLAnchorElement>('a[href="/ARC/architecture-map"]');
      expect(link?.textContent).toContain("思维导图");
      expect(link?.className).toContain("bg-accent");
      expect(link?.querySelector("svg.lucide-brain-circuit")).not.toBeNull();

      await act(async () => {
        link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await Promise.resolve();
      });
      expect(testState.navigate).toHaveBeenCalledWith("/ARC/architecture-map");
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });
});
