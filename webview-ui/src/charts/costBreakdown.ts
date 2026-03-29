import type { EChartsOption } from "../lib/echarts";
import type { DashboardChartDatum, ResolvedTheme } from "../types/dashboard";

export function createCostBreakdownOption(data: DashboardChartDatum[], theme: ResolvedTheme): EChartsOption {
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item"
    },
    textStyle: {
      color: theme === "dark" ? "#f3efe6" : "#1e1f24"
    },
    series: [
      {
        name: "Cost",
        type: "pie",
        radius: ["48%", "72%"],
        itemStyle: {
          borderRadius: 10,
          borderColor: theme === "dark" ? "#0d1016" : "#f7f0df",
          borderWidth: 3
        },
        label: {
          color: theme === "dark" ? "#f3efe6" : "#1e1f24",
          formatter: "{b}\n{c}"
        },
        data
      }
    ]
  };
}
