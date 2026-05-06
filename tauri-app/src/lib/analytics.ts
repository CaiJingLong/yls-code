import { formatDateDisplay } from "./datetime";
import type { AnalyticsGranularity, TrendPoint } from "../types/query";

export function resolveAnalyticsQueryGranularity(granularity: AnalyticsGranularity) {
  return granularity === "day" ? "hour" : granularity;
}

export function alignTrendPointsToDisplayGranularity(
  trend: TrendPoint[],
  granularity: AnalyticsGranularity,
) {
  if (granularity !== "day") {
    return trend;
  }

  const buckets = new Map<string, TrendPoint>();

  for (const point of trend) {
    const bucket = formatDateDisplay(point.bucket) ?? point.bucket.slice(0, 10);
    const existing = buckets.get(bucket);

    if (existing) {
      existing.totalCostUsd += point.totalCostUsd;
      existing.totalTokens += point.totalTokens;
      existing.requestCount += point.requestCount;
      continue;
    }

    buckets.set(bucket, {
      bucket,
      totalCostUsd: point.totalCostUsd,
      totalTokens: point.totalTokens,
      requestCount: point.requestCount,
    });
  }

  return [...buckets.values()].sort((left, right) => left.bucket.localeCompare(right.bucket));
}
