<script setup lang="ts">
import { reactive, watch } from "vue";

import CostTrendChart from "../components/charts/CostTrendChart.vue";
import ModelCostPie from "../components/charts/ModelCostPie.vue";
import PageHeader from "../components/layout/PageHeader.vue";
import { zhCN } from "../i18n/zhCN";
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
  } catch {
    state.error = zhCN.errors.loadAnalytics;
  } finally {
    state.loading = false;
  }
}

const t = zhCN;

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
    <PageHeader :title="t.analytics.title" :subtitle="t.analytics.subtitle">
      <label class="field">
        <span>{{ t.analytics.granularity }}</span>
        <select v-model="state.granularity">
          <option value="hour">{{ t.analytics.hourly }}</option>
          <option value="day">{{ t.analytics.daily }}</option>
        </select>
      </label>
    </PageHeader>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      {{ t.analytics.emptyNoAccount }}
    </div>
    <div v-else-if="state.error" class="empty-state">{{ state.error }}</div>
    <template v-else>
      <div class="chart-grid">
        <ModelCostPie :data="state.analytics?.modelBreakdown ?? []" :loading="state.loading" />
        <CostTrendChart
          :data="state.analytics?.trend ?? []"
          :granularity="state.granularity"
          :loading="state.loading"
          :title="t.analytics.costTrend"
        />
      </div>

      <section class="table-panel">
        <header class="table-header">
          <h2>{{ t.analytics.modelRanking }}</h2>
        </header>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t.analytics.columnModel }}</th>
                <th>{{ t.analytics.columnCost }}</th>
                <th>{{ t.analytics.columnTokens }}</th>
                <th>{{ t.analytics.columnRequests }}</th>
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
