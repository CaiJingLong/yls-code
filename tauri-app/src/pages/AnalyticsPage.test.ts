import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnalyticsPage from "./AnalyticsPage.vue";
import { mountWithApp } from "../test-utils";
import type { AnalyticsQueryInput, AnalyticsResponse } from "../types/query";

const { queryAnalyticsMock } = vi.hoisted(() => ({
  queryAnalyticsMock: vi.fn(async (): Promise<AnalyticsResponse> => ({
    modelBreakdown: [],
    trend: [],
  })),
}));

vi.mock("../lib/tauri/query", () => ({
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

describe("AnalyticsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function mountPage() {
    return mountWithApp(AnalyticsPage);
  }

  function latestAnalyticsCall() {
    const calls = queryAnalyticsMock.mock.calls as unknown as [AnalyticsQueryInput][];
    const lastCall = calls[calls.length - 1];
    expect(lastCall).toBeDefined();

    return lastCall![0];
  }

  it("passes createdAfter/createdBefore to queryAnalytics when filters change", async () => {
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    const pickers = wrapper.findAllComponents({ name: "DateTimePicker" });
    expect(pickers).toHaveLength(2);
    await pickers[0]!.vm.$emit("update:modelValue", "2026-05-06T00:00");
    await pickers[1]!.vm.$emit("update:modelValue", "2026-05-06T23:59");
    await flushPromises();

    const lastCall = latestAnalyticsCall();
    expect(lastCall.accountId).toBe("acct-test");
    expect(lastCall.createdAfter).toBeTypeOf("string");
    expect(lastCall.createdBefore).toBeTypeOf("string");
    expect(lastCall.createdAfter).toMatch(/:00\.000Z$/);
    expect(lastCall.createdBefore).toMatch(/:59\.999Z$/);
  });

  it("restores and persists analytics filters from localStorage", async () => {
    localStorage.setItem(
      "yls-workbench.analytics.filters",
      JSON.stringify({
        granularity: "day",
        createdAfter: "2026-05-01T12:30",
        createdBefore: "2026-05-06T12:30",
        mergeReasoningByModel: false,
      }),
    );
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    expect((wrapper.find("select").element as HTMLSelectElement).value).toBe("day");
    const firstCall = latestAnalyticsCall();
    expect(firstCall.granularity).toBe("hour");
    expect(firstCall.createdAfter).toContain("2026-05-01T");
    expect(firstCall.mergeReasoningByModel).toBe(false);

    await wrapper.find("select").setValue("hour");
    await wrapper.find("input[type='checkbox']").setValue(true);
    await flushPromises();

    expect(JSON.parse(localStorage.getItem("yls-workbench.analytics.filters") ?? "{}")).toMatchObject({
      granularity: "hour",
      createdAfter: "2026-05-01T12:30",
      createdBefore: "2026-05-06T12:30",
      mergeReasoningByModel: true,
    });
  });

  it("passes the reasoning merge checkbox state to analytics queries", async () => {
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    expect(latestAnalyticsCall().mergeReasoningByModel).toBe(true);

    await wrapper.find("input[type='checkbox']").setValue(false);
    await flushPromises();

    expect(latestAnalyticsCall().mergeReasoningByModel).toBe(false);
  });

  it("renders Quasar date time inputs for the filter range", async () => {
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAllComponents({ name: "DateTimePicker" })).toHaveLength(2);
    expect(wrapper.findAll("input[type='datetime-local']")).toHaveLength(0);
  });

  it("queries hourly trend buckets when the UI is switched to daily analytics", async () => {
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    const granularity = wrapper.find("select");
    await granularity.setValue("day");
    await flushPromises();

    const lastCall = latestAnalyticsCall();
    expect(lastCall.granularity).toBe("hour");
  });

  it("shows the effective end filter with the same inclusive boundary used by queries", async () => {
    queryAnalyticsMock.mockClear();

    const wrapper = mountPage();
    await flushPromises();

    const picker = wrapper.findAllComponents({ name: "DateTimePicker" })[1];
    expect(picker).toBeDefined();
    await picker!.vm.$emit("update:modelValue", "2026-05-06T23:59");
    await flushPromises();

    expect(wrapper.get(".analytics-filter-state code").text()).toContain("23:59:59");
  });

  it("shows each model cost percentage in the ranking table", async () => {
    queryAnalyticsMock.mockResolvedValueOnce({
      modelBreakdown: [
        {
          modelName: "gpt-5.4",
          totalCostUsd: 3,
          totalTokens: 300,
          requestCount: 3,
        },
        {
          modelName: "gpt-5.4-mini",
          totalCostUsd: 1,
          totalTokens: 100,
          requestCount: 1,
        },
      ],
      trend: [],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find("thead").text()).toContain("百分比");
    const rows = wrapper.findAll("tbody tr");
    expect(rows[0]!.text()).toContain("75.0%");
    expect(rows[1]!.text()).toContain("25.0%");
  });
});
