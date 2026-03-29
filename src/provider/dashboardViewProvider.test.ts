import { describe, expect, it, vi } from "vitest";
import { createMessageHandler } from "./dashboardViewProvider";

describe("dashboard message handler", () => {
  it("calls refresh on refresh message", async () => {
    const refresh = vi.fn();
    const handler = createMessageHandler({
      refresh,
      loadMore: vi.fn(),
      openSettings: vi.fn()
    });

    await handler({ type: "refresh" });

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
