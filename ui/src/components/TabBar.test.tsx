// @vitest-environment jsdom

import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";
import { Tabs } from "./ui/tabs";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => <a href={to} {...props}>{children}</a>,
}));

describe("TabBar", () => {
  const container = document.createElement("div");
  const root = createRoot(container);

  afterEach(() => {
    act(() => root.unmount());
    container.replaceChildren();
  });

  it("renders linked tabs as navigable tabs", () => {
    act(() => root.render(
      <Tabs defaultValue="mine">
        <TabBar items={[
          { value: "mine", label: "Mine" },
          { value: "approvals", label: "My approvals", href: "/decision-center" },
        ]} />
      </Tabs>,
    ));

    const link = container.querySelector('a[href="/decision-center"]');
    expect(link?.textContent).toBe("My approvals");
    expect(link?.getAttribute("role")).toBe("tab");
  });
});
