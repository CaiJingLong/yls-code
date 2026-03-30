<script setup lang="ts">
import { reactive, watch } from "vue";

import CostTrendChart from "../components/charts/CostTrendChart.vue";
import ModelCostPie from "../components/charts/ModelCostPie.vue";
import { zhCN } from "../i18n/zhCN";
import { queryAnalytics, queryOverview } from "../lib/tauri/query";
import { accountsStore } from "../stores/accounts";
import { syncStore } from "../stores/sync";
import type { AnalyticsGranularity, AnalyticsResponse, OverviewResponse } from "../types/query";

const state = reactive({
  loading: false,
  overview: null as OverviewResponse | null,
  analytics: null as AnalyticsResponse | null,
  granularity: "day" as AnalyticsGranularity,
  error: null as string | null,
});

async function loadData() {
  const accountId = accountsStore.state.activeAccountId;
  if (!accountId) {
    state.overview = null;
    state.analytics = null;
    return;
  }

  state.loading = true;
  state.error = null;

  try {
    const [overview, analytics] = await Promise.all([
      queryOverview(accountId),
      queryAnalytics({ accountId, granularity: state.granularity }),
    ]);
    state.overview = overview;
    state.analytics = analytics;
  } catch {
    state.error = zhCN.errors.loadOverview;
  } finally {
    state.loading = false;
  }
}

const t = zhCN;

watch(
  () => [accountsStore.state.activeAccountId, state.granularity, syncStore.state.status, syncStore.state.progress?.jobId],
  () => {
    void loadData();
  },
  { immediate: true },
);
</script>

<template>
  <section class="page page-grid">
    <div class="page-title">
      <div>
        <h2>{{ t.overview.title }}</h2>
        <p>{{ t.overview.subtitle }}</p>
      </div>
      <label class="field">
        <span>{{ t.overview.trend }}</span>
        <select v-model="state.granularity">
          <option value="day">{{ t.overview.byDay }}</option>
          <option value="hour">{{ t.overview.byHour }}</option>
        </select>
      </label>
    </div>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      {{ t.overview.emptyNoAccount }}
    </div>
    <div v-else-if="state.error" class="empty-state">{{ state.error }}</div>
    <template v-else>
      <div class="summary-grid">
        <article class="card">
          <h3>{{ t.overview.account }}</h3>
          <div class="card-value">{{ state.overview?.accountName ?? t.common.noValue }}</div>
          <p>{{ state.overview?.baseUrl }}</p>
        </article>
        <article class="card">
          <h3>{{ t.overview.cachedLogs }}</h3>
          <div class="card-value">{{ state.overview?.cachedLogCount ?? 0 }}</div>
          <p>{{ state.overview?.latestLogAt ?? t.overview.noLocalLogs }}</p>
        </article>
        <article class="card">
          <h3>{{ t.overview.totalCost }}</h3>
          <div class="card-value">${{ (state.overview?.totalCostUsd ?? 0).toFixed(4) }}</div>
          <p>{{ t.overview.aggregatedFromLocal }}</p>
        </article>
        <article class="card">
          <h3>{{ t.overview.totalTokens }}</h3>
          <div class="card-value">{{ state.overview?.totalTokens ?? 0 }}</div>
          <p>{{ t.overview.lastSyncPrefix }}{{ state.overview?.lastSuccessfulSyncAt ?? t.overview.never }}</p>
        </article>
      </div>

      <div class="chart-grid">
        <ModelCostPie :data="state.analytics?.modelBreakdown ?? []" :loading="state.loading" />
        <CostTrendChart
          :data="state.analytics?.trend ?? []"
          :granularity="state.granularity"
          :loading="state.loading"
          :title="t.overview.localUsdTrend"
        />
      </div>
    </template>
  </section>
</template>
