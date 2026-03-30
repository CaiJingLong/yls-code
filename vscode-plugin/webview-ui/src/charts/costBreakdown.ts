import type { EChartsOption } from "../lib/echarts";
import type { DashboardChartDatum, ResolvedTheme } from "../types/dashboard";

export function createCostBreakdownOption(data: DashboardChartDatum[], theme: ResolvedTheme): EChartsOption {
  const pieData = data.map((item) => ({
    name: item.label,
    value: item.value
  }));

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number }) => {
        const modelName = typeof params.name === "string" ? params.name : "未知模型";
        return `${modelName}<br/>$${Number(params.value).toFixed(4)}`;
      }
    },
    textStyle: {
      color: theme === "dark" ? "#f3efe6" : "#1e1f24"
    },
    legend: {
      type: "scroll",
      bottom: 0,
      left: "center",
      icon: "circle",
      textStyle: {
        color: theme === "dark" ? "#f3efe6" : "#1e1f24",
        fontSize: 11
      },
      formatter: (name: string) => name
    },
    series: [
      {
        name: "",
        type: "pie",
        radius: ["38%", "62%"],
        center: ["50%", "42%"],
        minAngle: 4,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: theme === "dark" ? "#0d1016" : "#f7f0df",
          borderWidth: 3
        },
        label: {
          color: theme === "dark" ? "#f3efe6" : "#1e1f24",
          formatter: (params) => {
            const label = String(params.name);
            const compact = label.length > 12 ? `${label.slice(0, 12)}...` : label;

            return `${compact}\n$${Number(params.value).toFixed(3)}`;
          },
          fontSize: 11
        },
        labelLayout: {
          hideOverlap: true
        },
        data: pieData
      }
    ]
  };
}
