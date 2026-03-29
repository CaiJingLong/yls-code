import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "./App.vue";

describe("App", () => {
  it("renders remaining quota from dashboard state", () => {
    const wrapper = mount(App, {
      props: {
        initialState: {
          status: "ready",
          themeMode: "system",
          resolvedTheme: "dark",
          lastUpdatedAt: null,
          summary: {
            remainingQuota: 83.891,
            usedQuota: 36.109,
            totalQuota: 120,
            requestCount: 483,
            packageLabel: "Pro",
            expiresAt: "2026-06-19T08:24:55.656Z"
          },
          charts: {
            breakdown: [],
            trend: []
          },
          logs: [],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            isLoadingMore: false
          },
          errors: []
        }
      }
    });

    expect(wrapper.text()).toContain("83.891");
  });
});
