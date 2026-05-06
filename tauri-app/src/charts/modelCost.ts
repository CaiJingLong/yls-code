import type { EChartsOption } from "../lib/echarts";
import type { ModelCostPoint } from "../types/query";
import type { ResolvedTheme } from "../composables/useResolvedTheme";

export function createModelCostOption(
  data: ModelCostPoint[],
  theme: ResolvedTheme,
): EChartsOption {
  const totalCost = data.reduce((sum, item) => sum + item.totalCostUsd, 0);

  function formatCostPercentage(value: number) {
    if (totalCost <= 0) {
      return "0.0%";
    }

    return `${((value / totalCost) * 100).toFixed(1)}%`;
  }

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number }) =>
        `${params.name}<br/>$${Number(params.value).toFixed(4)} · ${formatCostPercentage(Number(params.value))}`,
    },
    textStyle: {
      color: theme === "dark" ? "#f7efe2" : "#1c1814",
    },
    legend: {
      type: "scroll",
      bottom: 0,
      left: "center",
      textStyle: {
        color: theme === "dark" ? "#f7efe2" : "#1c1814",
      },
    },
    series: [
      {
        type: "pie",
        radius: ["38%", "62%"],
        center: ["50%", "42%"],
        label: {
          formatter: (params: { name: string; value: number }) => {
            const compact = params.name.length > 12 ? `${params.name.slice(0, 12)}...` : params.name;
            return `${compact}\n$${Number(params.value).toFixed(3)}`;
          },
          color: theme === "dark" ? "#f7efe2" : "#1c1814",
          fontSize: 11,
        },
        labelLayout: {
          hideOverlap: true,
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: theme === "dark" ? "#161514" : "#f8f1e7",
          borderWidth: 3,
        },
        data: data.map((item) => ({
          name: item.modelName,
          value: item.totalCostUsd,
        })),
      },
    ],
  };
}
