import type { DashboardChartDatum, DashboardLogRow, DashboardTrendDatum, TrendGranularity } from "../types/dashboard";

function roundCost(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getLocalBucketParts(value: string, granularity: TrendGranularity): { key: number; label: string } {
  const date = new Date(value);

  if (granularity === "day") {
    const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const label = `${pad(bucket.getMonth() + 1)}-${pad(bucket.getDate())}`;

    return {
      key: bucket.getTime(),
      label
    };
  }

  const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
  const label = `${pad(bucket.getMonth() + 1)}-${pad(bucket.getDate())} ${pad(bucket.getHours())}:00`;

  return {
    key: bucket.getTime(),
    label
  };
}

export function createModelBreakdownData(logs: DashboardLogRow[]): DashboardChartDatum[] {
  const grouped = new Map<string, number>();

  for (const log of logs) {
    grouped.set(log.model, (grouped.get(log.model) ?? 0) + log.totalCost);
  }

  return [...grouped.entries()]
    .map(([label, value]) => ({ label, value: roundCost(value) }))
    .sort((left, right) => right.value - left.value);
}

export function aggregateTrendByGranularity(
  logs: DashboardLogRow[],
  granularity: TrendGranularity
): DashboardTrendDatum[] {
  const grouped = new Map<number, DashboardTrendDatum>();

  for (const log of logs) {
    const bucket = getLocalBucketParts(log.createdAt, granularity);
    const current = grouped.get(bucket.key);

    if (current) {
      current.value = roundCost(current.value + log.totalCost);
      continue;
    }

    grouped.set(bucket.key, {
      label: bucket.label,
      value: roundCost(log.totalCost)
    });
  }

  return [...grouped.entries()].sort((left, right) => left[0] - right[0]).map((entry) => entry[1]);
}
