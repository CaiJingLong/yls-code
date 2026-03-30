import { describe, expect, it } from "vitest";
import { aggregateTrendByGranularity, createModelBreakdownData } from "./aggregations";
import type { DashboardLogRow } from "../types/dashboard";

const logs: DashboardLogRow[] = [
  {
    id: "1",
    model: "gpt-5.4",
    reasoning: "xhigh",
    totalTokens: 1000,
    totalCost: 0.12,
    createdAt: "2026-03-29T07:10:00.000Z"
  },
  {
    id: "2",
    model: "gpt-5.4",
    reasoning: "xhigh",
    totalTokens: 1200,
    totalCost: 0.2,
    createdAt: "2026-03-29T07:25:00.000Z"
  },
  {
    id: "3",
    model: "gpt-4.1",
    reasoning: "medium",
    totalTokens: 900,
    totalCost: 0.08,
    createdAt: "2026-03-28T09:30:00.000Z"
  }
];

describe("chart aggregations", () => {
  it("groups cost breakdown by model", () => {
    expect(createModelBreakdownData(logs)).toEqual([
      { label: "gpt-5.4", value: 0.32 },
      { label: "gpt-4.1", value: 0.08 }
    ]);
  });

  it("aggregates trend by hour", () => {
    expect(aggregateTrendByGranularity(logs, "hour")).toEqual([
      { label: "03-28 17:00", value: 0.08 },
      { label: "03-29 15:00", value: 0.32 }
    ]);
  });

  it("aggregates trend by day", () => {
    expect(aggregateTrendByGranularity(logs, "day")).toEqual([
      { label: "03-28", value: 0.08 },
      { label: "03-29", value: 0.32 }
    ]);
  });
});
