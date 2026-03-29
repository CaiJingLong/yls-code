<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { init, type ECharts, type EChartsOption } from "../lib/echarts";
import type { ResolvedTheme } from "../types/dashboard";

const props = defineProps<{
  title: string;
  option: EChartsOption;
  theme: ResolvedTheme;
  empty: boolean;
}>();

const root = ref<HTMLDivElement | null>(null);
let chart: ECharts | undefined;
let resizeObserver: ResizeObserver | undefined;

function renderChart(): void {
  if (!root.value || props.empty) {
    return;
  }

  if (!chart) {
    chart = init(root.value, undefined, {
      renderer: "svg"
    });
  }

  chart.setOption(props.option, {
    notMerge: true
  });
}

onMounted(() => {
  renderChart();

  if (root.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(root.value);
  }
});

watch(
  () => [props.option, props.theme, props.empty],
  () => {
    if (props.empty) {
      chart?.dispose();
      chart = undefined;
      return;
    }

    renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <section class="panel">
    <header class="panel-header">
      <h2>{{ title }}</h2>
    </header>
    <div v-if="empty" class="panel-empty">暂无数据</div>
    <div v-else ref="root" class="chart-root"></div>
  </section>
</template>
