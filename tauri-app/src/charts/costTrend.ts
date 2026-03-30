import type { EChartsOption } from "../lib/echarts";
import {
  formatTrendBucketAxisLabel,
  formatTrendBucketTooltipLabel,
} from "../lib/datetime";
import type { TrendPoint } from "../types/query";
import type { AnalyticsGranularity } from "../types/query";
import type { ResolvedTheme } from "../composables/useResolvedTheme";

export function createCostTrendOption(
  data: TrendPoint[],
  theme: ResolvedTheme,
  granularity: AnalyticsGranularity,
): EChartsOption {
  const axisLabels = data.map((item) =>
    formatTrendBucketAxisLabel(item.bucket, granularity),
  );

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          dataIndex?: number;
          marker?: string;
          seriesName?: string;
          value?: number;
        }>;
        const firstItem = items[0];
        const bucket = data[firstItem?.dataIndex ?? 0]?.bucket ?? "";
        const title = formatTrendBucketTooltipLabel(bucket, granularity);

        return [
          title,
          ...items.map((item) => {
            const value = Number(item.value ?? 0);
            return `${item.marker ?? ""}${item.seriesName ?? ""}: $${value.toFixed(4)}`;
          }),
        ].join("<br/>");
      },
    },
    grid: {
      left: 10,
      right: 16,
      top: 20,
      bottom: granularity === "hour" ? 42 : 24,
    },
    xAxis: {
      type: "category",
      data: axisLabels,
      axisLabel: {
        color: theme === "dark" ? "#bba993" : "#665648",
        hideOverlap: true,
        rotate: granularity === "hour" ? 24 : 0,
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: theme === "dark" ? "#bba993" : "#665648",
        formatter: (value: number) => `$${value.toFixed(value < 1 ? 2 : 1)}`,
      },
    },
    series: [
      {
        name: "美元",
        type: "line",
        smooth: true,
        data: data.map((item) => item.totalCostUsd),
        areaStyle: {
          color: theme === "dark" ? "rgba(255, 155, 87, 0.16)" : "rgba(198, 91, 33, 0.14)",
        },
        itemStyle: {
          color: "#ff8c42",
        },
        lineStyle: {
          color: "#ff8c42",
          width: 3,
        },
      },
    ],
  };
}
