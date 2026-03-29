<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import ChartPanel from "./components/ChartPanel.vue";
import LogsTable from "./components/LogsTable.vue";
import SummaryCards from "./components/SummaryCards.vue";
import Toolbar from "./components/Toolbar.vue";
import { createCostBreakdownOption } from "./charts/costBreakdown";
import { createCostTrendOption } from "./charts/costTrend";
import type { EChartsOption } from "./lib/echarts";
import { getVsCodeApi } from "./lib/vscode";
import { useDashboardState } from "./stores/dashboard";
import { createEmptyDashboardState, type DashboardViewState } from "./types/dashboard";

const props = defineProps<{
  initialState?: DashboardViewState;
}>();

const vscode = getVsCodeApi();
const { state, patch } = useDashboardState(props.initialState ?? createEmptyDashboardState());

const breakdownOption = computed<EChartsOption>(() =>
  createCostBreakdownOption(state.charts.breakdown, state.resolvedTheme)
);

const trendOption = computed<EChartsOption>(() => createCostTrendOption(state.charts.trend, state.resolvedTheme));

function requestRefresh(): void {
  vscode.postMessage({ type: "refresh" });
}

function openSettings(): void {
  vscode.postMessage({ type: "openSettings" });
}

function loadMore(): void {
  vscode.postMessage({ type: "loadMore" });
}

function handleMessage(event: MessageEvent<{ type: string; payload?: DashboardViewState }>): void {
  if (event.data.type === "state" && event.data.payload) {
    patch(event.data.payload);
  }
}

onMounted(() => {
  window.addEventListener("message", handleMessage as EventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage as EventListener);
});
</script>

<template>
  <main class="app-shell" :data-theme="state.resolvedTheme">
    <div class="app-grid">
      <Toolbar :last-updated-at="state.lastUpdatedAt" @refresh="requestRefresh" @open-settings="openSettings" />

      <section v-if="state.errors.length > 0" class="notice">
        <strong>状态提示</strong>
        <p v-for="error in state.errors" :key="`${error.section}-${error.code}`">{{ error.message }}</p>
      </section>

      <SummaryCards :summary="state.summary" />

      <section class="chart-grid">
        <ChartPanel
          title="成本构成"
          :option="breakdownOption"
          :theme="state.resolvedTheme"
          :empty="state.charts.breakdown.length === 0"
        />
        <ChartPanel
          title="最近记录趋势"
          :option="trendOption"
          :theme="state.resolvedTheme"
          :empty="state.charts.trend.length === 0"
        />
      </section>

      <LogsTable :logs="state.logs" :pagination="state.pagination" @load-more="loadMore" />
    </div>
  </main>
</template>
