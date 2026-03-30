import type { EChartsOption } from "../lib/echarts";
import type { DashboardTrendDatum, ResolvedTheme, TrendGranularity } from "../types/dashboard";

export function createCostTrendOption(
  data: DashboardTrendDatum[],
  theme: ResolvedTheme,
  granularity: TrendGranularity
): EChartsOption {
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => `$${Number(value).toFixed(4)}`
    },
    grid: {
      left: 10,
      right: 16,
      top: 20,
      bottom: granularity === "hour" ? 42 : 24
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        color: theme === "dark" ? "#bfc7d5" : "#4b5668",
        hideOverlap: true,
        rotate: granularity === "hour" ? 26 : 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: theme === "dark" ? "#bfc7d5" : "#4b5668",
        formatter: (value: number) => `$${value.toFixed(value < 1 ? 2 : 1)}`
      }
    },
    series: [
      {
        name: "USD",
        type: "line",
        smooth: true,
        data: data.map((item) => item.value),
        areaStyle: {
          color: theme === "dark" ? "rgba(255, 140, 66, 0.18)" : "rgba(217, 95, 20, 0.14)"
        },
        itemStyle: {
          color: "#ff8c42"
        },
        lineStyle: {
          color: "#ff8c42",
          width: 3
        }
      }
    ]
  };
}
