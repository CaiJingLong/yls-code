import { describe, expect, it } from "vitest";

import { createCostTrendOption } from "./costTrend";

describe("createCostTrendOption", () => {
  it("formats trend buckets for display instead of exposing raw UTC strings", () => {
    const option = createCostTrendOption(
      [
        {
          bucket: "2026-03-29T10:00:00Z",
          totalCostUsd: 1.23,
          totalTokens: 123,
          requestCount: 2,
        },
      ],
      "light",
      "hour",
    );

    expect(option.xAxis).toMatchObject({
      data: [expect.not.stringContaining("T")],
    });
    expect((option.xAxis as { data: string[] }).data[0]).not.toContain("Z");
  });

  it("uses a bar series for the cost trend", () => {
    const option = createCostTrendOption(
      [
        {
          bucket: "2026-03-29",
          totalCostUsd: 1.23,
          totalTokens: 123,
          requestCount: 2,
        },
      ],
      "light",
      "day",
    );

    expect(option.series).toEqual([
      expect.objectContaining({
        type: "bar",
      }),
    ]);
  });
});
