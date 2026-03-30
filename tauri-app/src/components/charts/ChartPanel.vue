<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { zhCN } from "../../i18n/zhCN";
import { init, type ECharts, type EChartsOption } from "../../lib/echarts";

const props = defineProps<{
  title: string;
  option: EChartsOption;
  loading: boolean;
  empty: boolean;
}>();

const root = ref<HTMLDivElement | null>(null);
let chart: ECharts | undefined;
let resizeObserver: ResizeObserver | undefined;
const t = zhCN;

function renderChart() {
  if (!root.value || props.empty) {
    return;
  }

  if (!chart) {
    chart = init(root.value, undefined, { renderer: "svg" });
  }

  chart.setOption(props.option, { notMerge: true });
}

onMounted(() => {
  if (root.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(root.value);
  }

  renderChart();
});

watch(
  () => [props.option, props.loading, props.empty],
  async () => {
    if (props.loading) {
      return;
    }

    if (props.empty) {
      chart?.dispose();
      chart = undefined;
      return;
    }

    await nextTick();
    renderChart();
  },
  { deep: true, flush: "post" },
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
    <div v-if="empty" class="panel-empty">
      {{ loading ? t.common.loadingChart : t.common.noData }}
    </div>
    <div v-else ref="root" class="chart-root"></div>
  </section>
</template>
