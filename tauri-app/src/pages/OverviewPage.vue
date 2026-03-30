<script setup lang="ts">
import { reactive, watch } from "vue";

import CostTrendChart from "../components/charts/CostTrendChart.vue";
import ModelCostPie from "../components/charts/ModelCostPie.vue";
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
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to load overview";
  } finally {
    state.loading = false;
  }
}

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
        <h2>Overview</h2>
        <p>Usage totals, sync health, and model-level cost distribution.</p>
      </div>
      <label class="field">
        <span>Trend</span>
        <select v-model="state.granularity">
          <option value="day">By day</option>
          <option value="hour">By hour</option>
        </select>
      </label>
    </div>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      Add an account in the Keys tab to start syncing data.
    </div>
    <div v-else-if="state.error" class="empty-state">{{ state.error }}</div>
    <template v-else>
      <div class="summary-grid">
        <article class="card">
          <h3>Account</h3>
          <div class="card-value">{{ state.overview?.accountName ?? "n/a" }}</div>
          <p>{{ state.overview?.baseUrl }}</p>
        </article>
        <article class="card">
          <h3>Cached Logs</h3>
          <div class="card-value">{{ state.overview?.cachedLogCount ?? 0 }}</div>
          <p>{{ state.overview?.latestLogAt ?? "No local logs yet" }}</p>
        </article>
        <article class="card">
          <h3>Total Cost</h3>
          <div class="card-value">${{ (state.overview?.totalCostUsd ?? 0).toFixed(4) }}</div>
          <p>Aggregated from local SQLite logs</p>
        </article>
        <article class="card">
          <h3>Total Tokens</h3>
          <div class="card-value">{{ state.overview?.totalTokens ?? 0 }}</div>
          <p>Last sync: {{ state.overview?.lastSuccessfulSyncAt ?? "never" }}</p>
        </article>
      </div>

      <div class="chart-grid">
        <ModelCostPie :data="state.analytics?.modelBreakdown ?? []" :loading="state.loading" />
        <CostTrendChart
          :data="state.analytics?.trend ?? []"
          :granularity="state.granularity"
          :loading="state.loading"
          title="Local USD Trend"
        />
      </div>
    </template>
  </section>
</template>
