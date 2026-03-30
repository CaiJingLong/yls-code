import { describe, expect, it, vi } from "vitest";
import { createMessageHandler } from "./dashboardViewProvider";

describe("dashboard message handler", () => {
  it("calls refresh on refresh message", async () => {
    const refresh = vi.fn();
    const handler = createMessageHandler({
      refresh,
      ready: vi.fn(),
      loadMore: vi.fn(),
      openSettings: vi.fn()
    });

    await handler({ type: "refresh" });

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("calls ready handler on ready message", async () => {
    const ready = vi.fn();
    const handler = createMessageHandler({
      refresh: vi.fn(),
      ready,
      loadMore: vi.fn(),
      openSettings: vi.fn()
    });

    await handler({ type: "ready" });

    expect(ready).toHaveBeenCalledTimes(1);
  });
});
