import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OverviewPage from "./OverviewPage.vue";
import { mountWithApp } from "../test-utils";
import type { AnalyticsResponse, OverviewResponse } from "../types/query";

const { queryOverviewMock, queryAnalyticsMock } = vi.hoisted(() => ({
  queryOverviewMock: vi.fn(async (): Promise<OverviewResponse> => ({
    accountId: "acct-test",
    accountName: "Test Account",
    baseUrl: "https://example.com",
    enabled: true,
    hasApiKey: true,
    todayRemainingQuota: 88.8,
    cachedLogCount: 12,
    totalCostUsd: 1.2345,
    totalTokens: 1234,
    latestLogAt: "2026-05-07T10:00:00.000Z",
    lastSuccessfulSyncAt: "2026-05-07T10:00:00.000Z",
    lastIncrementalSyncAt: "2026-05-07T10:00:00.000Z",
    lastFullSyncAt: "2026-05-07T09:00:00.000Z",
    lastError: null,
  })),
  queryAnalyticsMock: vi.fn(async (): Promise<AnalyticsResponse> => ({
    modelBreakdown: [],
    trend: [],
  })),
}));

vi.mock("../lib/tauri/query", () => ({
  queryOverview: queryOverviewMock,
  queryAnalytics: queryAnalyticsMock,
}));

vi.mock("../stores/accounts", () => ({
  accountsStore: {
    state: {
      activeAccountId: "acct-test",
    },
  },
}));

vi.mock("../stores/sync", () => ({
  syncStore: {
    state: {
      status: "idle",
      progress: null,
    },
  },
}));

vi.mock("../components/charts/CostTrendChart.vue", () => ({
  default: {
    template: "<div data-testid='cost-trend-chart' />",
    props: ["data", "granularity", "loading", "title"],
  },
}));

vi.mock("../components/charts/ModelCostPie.vue", () => ({
  default: {
    template: "<div data-testid='model-cost-pie' />",
    props: ["data", "loading"],
  },
}));

describe("OverviewPage", () => {
  beforeEach(() => {
    queryOverviewMock.mockClear();
    queryAnalyticsMock.mockClear();
  });

  it("renders total tokens with compact units", async () => {
    const wrapper = mountWithApp(OverviewPage);
    await flushPromises();

    expect(wrapper.text()).toContain("累计 Token 数");
    expect(wrapper.text()).toContain("1.2k");
    expect(wrapper.text()).not.toContain("1234");
  });
});
