<script setup lang="ts">
import { reactive, watch } from "vue";

import CostTrendChart from "../components/charts/CostTrendChart.vue";
import ModelCostPie from "../components/charts/ModelCostPie.vue";
import { queryAnalytics } from "../lib/tauri/query";
import { accountsStore } from "../stores/accounts";
import { syncStore } from "../stores/sync";
import type { AnalyticsGranularity, AnalyticsResponse } from "../types/query";

const state = reactive({
  loading: false,
  granularity: "hour" as AnalyticsGranularity,
  analytics: null as AnalyticsResponse | null,
  error: null as string | null,
});

async function loadAnalytics() {
  const accountId = accountsStore.state.activeAccountId;
  if (!accountId) {
    state.analytics = null;
    return;
  }

  state.loading = true;
  state.error = null;

  try {
    state.analytics = await queryAnalytics({
      accountId,
      granularity: state.granularity,
    });
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to query analytics";
  } finally {
    state.loading = false;
  }
}

watch(
  () => [accountsStore.state.activeAccountId, state.granularity, syncStore.state.progress?.jobId],
  () => {
    void loadAnalytics();
  },
  { immediate: true },
);
</script>

<template>
  <section class="page page-grid">
    <div class="page-title">
      <div>
        <h2>Analytics</h2>
        <p>Break cost and tokens down by model and time bucket.</p>
      </div>
      <label class="field">
        <span>Granularity</span>
        <select v-model="state.granularity">
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
        </select>
      </label>
    </div>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      Select an account to query analytics.
    </div>
    <div v-else-if="state.error" class="empty-state">{{ state.error }}</div>
    <template v-else>
      <div class="chart-grid">
        <ModelCostPie :data="state.analytics?.modelBreakdown ?? []" :loading="state.loading" />
        <CostTrendChart
          :data="state.analytics?.trend ?? []"
          :granularity="state.granularity"
          :loading="state.loading"
          title="Cost Trend"
        />
      </div>

      <section class="table-panel">
        <header class="table-header">
          <h2>Model Ranking</h2>
        </header>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Cost</th>
                <th>Tokens</th>
                <th>Requests</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in state.analytics?.modelBreakdown ?? []" :key="item.modelName">
                <td>{{ item.modelName }}</td>
                <td>${{ item.totalCostUsd.toFixed(4) }}</td>
                <td>{{ item.totalTokens }}</td>
                <td>{{ item.requestCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>
