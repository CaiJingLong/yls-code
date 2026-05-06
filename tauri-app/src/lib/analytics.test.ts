import { describe, expect, it } from "vitest";

import { setDisplayTimeZone } from "./datetime";
import {
  alignTrendPointsToDisplayGranularity,
  resolveAnalyticsQueryGranularity,
} from "./analytics";

describe("analytics helpers", () => {
  it("queries hourly buckets when the UI shows daily analytics", () => {
    expect(resolveAnalyticsQueryGranularity("hour")).toBe("hour");
    expect(resolveAnalyticsQueryGranularity("day")).toBe("hour");
  });

  it("re-buckets hourly trend data into local calendar days", () => {
    const originalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setDisplayTimeZone("Asia/Shanghai");

    expect(
      alignTrendPointsToDisplayGranularity(
        [
          {
            bucket: "2026-03-29T16:00:00Z",
            totalCostUsd: 0.1,
            totalTokens: 100,
            requestCount: 1,
          },
          {
            bucket: "2026-03-29T23:00:00Z",
            totalCostUsd: 0.2,
            totalTokens: 200,
            requestCount: 2,
          },
          {
            bucket: "2026-03-30T01:00:00Z",
            totalCostUsd: 0.3,
            totalTokens: 300,
            requestCount: 3,
          },
        ],
        "day",
      ),
    ).toMatchObject([
      {
        bucket: "2026-03-30",
        totalTokens: 600,
        requestCount: 6,
      },
    ]);
    expect(
      alignTrendPointsToDisplayGranularity(
        [
          {
            bucket: "2026-03-29T16:00:00Z",
            totalCostUsd: 0.1,
            totalTokens: 100,
            requestCount: 1,
          },
          {
            bucket: "2026-03-29T23:00:00Z",
            totalCostUsd: 0.2,
            totalTokens: 200,
            requestCount: 2,
          },
          {
            bucket: "2026-03-30T01:00:00Z",
            totalCostUsd: 0.3,
            totalTokens: 300,
            requestCount: 3,
          },
        ],
        "day",
      )[0]?.totalCostUsd,
    ).toBeCloseTo(0.6);

    setDisplayTimeZone(originalTimeZone);
  });
});
