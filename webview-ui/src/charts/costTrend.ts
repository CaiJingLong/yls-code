import type { EChartsOption } from "../lib/echarts";
import type { DashboardTrendDatum, ResolvedTheme } from "../types/dashboard";

export function createCostTrendOption(data: DashboardTrendDatum[], theme: ResolvedTheme): EChartsOption {
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis"
    },
    legend: {
      textStyle: {
        color: theme === "dark" ? "#f3efe6" : "#1e1f24"
      }
    },
    grid: {
      left: 16,
      right: 16,
      top: 40,
      bottom: 20,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        color: theme === "dark" ? "#bfc7d5" : "#4b5668"
      }
    },
    yAxis: [
      {
        type: "value",
        axisLabel: {
          color: theme === "dark" ? "#bfc7d5" : "#4b5668"
        }
      },
      {
        type: "value",
        axisLabel: {
          color: theme === "dark" ? "#bfc7d5" : "#4b5668"
        }
      }
    ],
    series: [
      {
        name: "Cost",
        type: "bar",
        data: data.map((item) => item.value),
        itemStyle: {
          color: "#ff8c42",
          borderRadius: [8, 8, 0, 0]
        }
      },
      {
        name: "Tokens",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: data.map((item) => item.secondaryValue),
        lineStyle: {
          color: "#4f8cff",
          width: 3
        },
        itemStyle: {
          color: "#4f8cff"
        }
      }
    ]
  };
}
