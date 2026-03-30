<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { init, type ECharts, type EChartsOption } from "../lib/echarts";
import type { ResolvedTheme } from "../types/dashboard";

const props = defineProps<{
  title: string;
  option: EChartsOption;
  theme: ResolvedTheme;
  loading: boolean;
  empty: boolean;
}>();

const root = ref<HTMLDivElement | null>(null);
let chart: ECharts | undefined;
let resizeObserver: ResizeObserver | undefined;
let renderFrame = 0;

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

function scheduleRender(): void {
  if (renderFrame) {
    cancelAnimationFrame(renderFrame);
  }

  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    renderChart();
  });
}

function ensureResizeObserver(): void {
  if (!root.value || resizeObserver || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    chart?.resize();
  });
  resizeObserver.observe(root.value);
}

onMounted(() => {
  ensureResizeObserver();
  scheduleRender();
});

watch(
  () => [props.option, props.theme, props.loading, props.empty],
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
    ensureResizeObserver();
    scheduleRender();
  },
  { deep: true, flush: "post" }
);

onBeforeUnmount(() => {
  if (renderFrame) {
    cancelAnimationFrame(renderFrame);
  }
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <section class="panel">
    <header class="panel-header">
      <h2>{{ title }}</h2>
    </header>
    <div v-if="loading" class="panel-empty">加载中...</div>
    <div v-else-if="empty" class="panel-empty">暂无数据</div>
    <div v-else ref="root" class="chart-root"></div>
  </section>
</template>
