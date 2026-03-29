import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { init, use, type ECharts, type EChartsOption } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

use([PieChart, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, SVGRenderer]);

export { init, type ECharts, type EChartsOption };
