<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import ChartPanel from "./components/ChartPanel.vue";
import LogsTable from "./components/LogsTable.vue";
import SummaryCards from "./components/SummaryCards.vue";
import TabNav from "./components/TabNav.vue";
import Toolbar from "./components/Toolbar.vue";
import TrendControls from "./components/TrendControls.vue";
import { aggregateTrendByGranularity, createModelBreakdownData } from "./charts/aggregations";
import { createCostBreakdownOption } from "./charts/costBreakdown";
import { createCostTrendOption } from "./charts/costTrend";
import type { EChartsOption } from "./lib/echarts";
import { getVsCodeApi } from "./lib/vscode";
import { useDashboardPreferences } from "./composables/useDashboardPreferences";
import { useDashboardState } from "./stores/dashboard";
import { createEmptyDashboardState, type DashboardViewState } from "./types/dashboard";

const props = defineProps<{
  initialState?: DashboardViewState;
}>();

const vscode = getVsCodeApi();
const { state, patch } = useDashboardState(props.initialState ?? createEmptyDashboardState());
const { preferences } = useDashboardPreferences(vscode);
let pollingTimer: number | undefined;

const breakdownData = computed(() => createModelBreakdownData(state.logs));
const trendData = computed(() => aggregateTrendByGranularity(state.logs, preferences.trendGranularity));

const breakdownOption = computed<EChartsOption>(() => createCostBreakdownOption(breakdownData.value, state.resolvedTheme));

const trendOption = computed<EChartsOption>(() =>
  createCostTrendOption(trendData.value, state.resolvedTheme, preferences.trendGranularity)
);
const chartLoading = computed(() => state.status === "loading" && state.logs.length === 0);

function requestRefresh(): void {
  if (state.status === "loading") {
    return;
  }

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

function syncPolling(enabled: boolean, intervalMs: number): void {
  if (pollingTimer !== undefined) {
    window.clearInterval(pollingTimer);
    pollingTimer = undefined;
  }

  if (!enabled) {
    return;
  }

  pollingTimer = window.setInterval(() => {
    requestRefresh();
  }, intervalMs);
}

onMounted(() => {
  window.addEventListener("message", handleMessage as EventListener);
  vscode.postMessage({ type: "ready" });
  syncPolling(preferences.pollingEnabled, preferences.pollingIntervalMs);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage as EventListener);
  syncPolling(false, preferences.pollingIntervalMs);
});

watch(
  () => [preferences.pollingEnabled, preferences.pollingIntervalMs] as const,
  ([enabled, intervalMs]) => {
    syncPolling(enabled, intervalMs);
  }
);
</script>

<template>
  <main class="app-shell" :data-theme="state.resolvedTheme">
    <div class="app-grid">
      <Toolbar :last-updated-at="state.lastUpdatedAt" @refresh="requestRefresh" @open-settings="openSettings" />
      <TabNav :active-tab="preferences.activeTab" @change="preferences.activeTab = $event" />

      <section v-if="state.errors.length > 0" class="notice">
        <strong>状态提示</strong>
        <p v-for="error in state.errors" :key="`${error.section}-${error.code}`">{{ error.message }}</p>
      </section>

      <template v-if="preferences.activeTab === 'overview'">
        <SummaryCards :summary="state.summary" />
        <TrendControls
          :trend-granularity="preferences.trendGranularity"
          :polling-enabled="preferences.pollingEnabled"
          :polling-interval-ms="preferences.pollingIntervalMs"
          @update:trend-granularity="preferences.trendGranularity = $event"
          @update:polling-enabled="preferences.pollingEnabled = $event"
        />

        <section v-if="chartLoading" class="chart-grid">
          <section class="panel">
            <header class="panel-header">
              <h2>模型成本构成</h2>
            </header>
            <div class="panel-empty">加载中...</div>
          </section>
          <section class="panel">
            <header class="panel-header">
              <h2>美元成本趋势</h2>
            </header>
            <div class="panel-empty">加载中...</div>
          </section>
        </section>
        <section v-else class="chart-grid">
          <ChartPanel
            title="模型成本构成"
            :option="breakdownOption"
            :theme="state.resolvedTheme"
            :loading="false"
            :empty="breakdownData.length === 0"
          />
          <ChartPanel
            title="美元成本趋势"
            :option="trendOption"
            :theme="state.resolvedTheme"
            :loading="false"
            :empty="trendData.length === 0"
          />
        </section>
      </template>

      <LogsTable
        v-else
        :logs="state.logs"
        :pagination="state.pagination"
        @load-more="loadMore"
      />
    </div>
  </main>
</template>
