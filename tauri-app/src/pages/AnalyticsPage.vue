<script setup lang="ts">
import { computed, reactive, watch } from "vue";

import CostTrendChart from "../components/charts/CostTrendChart.vue";
import ModelCostPie from "../components/charts/ModelCostPie.vue";
import DateTimePicker from "../components/common/DateTimePicker.vue";
import PageHeader from "../components/layout/PageHeader.vue";
import { zhCN } from "../i18n/zhCN";
import {
  alignTrendPointsToDisplayGranularity,
  resolveAnalyticsQueryGranularity,
} from "../lib/analytics";
import {
  formatDateTimeDisplay,
  toUtcISOStringFromLocalInput,
} from "../lib/datetime";
import { LocalStorageStore } from "../lib/localStorageStore";
import { queryAnalytics } from "../lib/tauri/query";
import { accountsStore } from "../stores/accounts";
import { syncStore } from "../stores/sync";
import type { AnalyticsGranularity, AnalyticsResponse } from "../types/query";

const filterStorage = new LocalStorageStore("yls-workbench.analytics.filters", {
  granularity: "hour" as AnalyticsGranularity,
  createdAfter: "",
  createdBefore: "",
  mergeReasoningByModel: true,
});
const storedFilters = filterStorage.load();
const state = reactive({
  loading: false,
  granularity: storedFilters.granularity,
  createdAfter: storedFilters.createdAfter,
  createdBefore: storedFilters.createdBefore,
  mergeReasoningByModel: storedFilters.mergeReasoningByModel,
  analytics: null as AnalyticsResponse | null,
  error: null as string | null,
});
let latestRequestId = 0;

async function loadAnalytics() {
  const requestId = ++latestRequestId;
  const accountId = accountsStore.state.activeAccountId;
  if (!accountId) {
    if (requestId === latestRequestId) {
      state.analytics = null;
    }
    return;
  }

  if (requestId === latestRequestId) {
    state.loading = true;
    state.error = null;
  }

  try {
    const response = await queryAnalytics({
      accountId,
      granularity: resolveAnalyticsQueryGranularity(state.granularity),
      createdAfter: toUtcISOStringFromLocalInput(state.createdAfter),
      createdBefore: toUtcISOStringFromLocalInput(state.createdBefore, {
        boundary: "end",
      }),
      mergeReasoningByModel: state.mergeReasoningByModel,
    });
    if (requestId === latestRequestId) {
      state.analytics = {
        ...response,
        trend: alignTrendPointsToDisplayGranularity(response.trend, state.granularity),
      };
    }
  } catch {
    if (requestId === latestRequestId) {
      state.error = zhCN.errors.loadAnalytics;
    }
  } finally {
    if (requestId === latestRequestId) {
      state.loading = false;
    }
  }
}

const t = zhCN;
const effectiveRangeText = computed(() => {
  const after = toUtcISOStringFromLocalInput(state.createdAfter);
  const before = toUtcISOStringFromLocalInput(state.createdBefore, {
    boundary: "end",
  });
  const afterText =
    formatDateTimeDisplay(after) ?? t.analytics.rangeStartDefault;
  const beforeText =
    formatDateTimeDisplay(before) ?? t.analytics.rangeEndDefault;

  return `${afterText} ~ ${beforeText}`;
});
const filteredSummary = computed(() => {
  const modelBreakdown = state.analytics?.modelBreakdown ?? [];
  return modelBreakdown.reduce(
    (acc, item) => {
      acc.requests += item.requestCount;
      acc.tokens += item.totalTokens;
      acc.cost += item.totalCostUsd;
      return acc;
    },
    { requests: 0, tokens: 0, cost: 0 },
  );
});
const modelBreakdownTotalCost = computed(() => filteredSummary.value.cost);

function formatCostPercentage(value: number) {
  if (modelBreakdownTotalCost.value <= 0) {
    return "0.0%";
  }

  return `${((value / modelBreakdownTotalCost.value) * 100).toFixed(1)}%`;
}

watch(
  () => [
    accountsStore.state.activeAccountId,
    state.granularity,
    state.createdAfter,
    state.createdBefore,
    state.mergeReasoningByModel,
    syncStore.state.progress?.jobId,
  ],
  () => {
    void loadAnalytics();
  },
  { immediate: true },
);

watch(
  () => ({
    granularity: state.granularity,
    createdAfter: state.createdAfter,
    createdBefore: state.createdBefore,
    mergeReasoningByModel: state.mergeReasoningByModel,
  }),
  (filters) => {
    filterStorage.save(filters);
  },
  { deep: true },
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
      <DateTimePicker v-model="state.createdAfter" :label="t.analytics.createdAfter" />
      <DateTimePicker v-model="state.createdBefore" :label="t.analytics.createdBefore" />
      <label class="checkbox-field analytics-reasoning-merge">
        <input v-model="state.mergeReasoningByModel" type="checkbox" />
        <span>{{ t.analytics.mergeReasoningByModel }}</span>
      </label>
      <button class="secondary" :disabled="state.loading" @click="loadAnalytics">
        {{ t.analytics.applyFilters }}
      </button>
    </PageHeader>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      {{ t.analytics.emptyNoAccount }}
    </div>
    <div v-else-if="state.error" class="empty-state">{{ state.error }}</div>
    <template v-else>
      <section class="card analytics-filter-state">
        <div class="analytics-filter-state-row">
          <span class="tag">{{ t.analytics.effectiveRange }}</span>
          <code>{{ effectiveRangeText }}</code>
        </div>
        <div class="analytics-filter-metrics">
          <span>{{ t.analytics.filteredRequests }}: {{ filteredSummary.requests }}</span>
          <span>{{ t.analytics.filteredTokens }}: {{ filteredSummary.tokens }}</span>
          <span>{{ t.analytics.filteredCost }}: ${{ filteredSummary.cost.toFixed(4) }}</span>
        </div>
      </section>

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
                <th>{{ t.analytics.columnPercentage }}</th>
                <th>{{ t.analytics.columnTokens }}</th>
                <th>{{ t.analytics.columnRequests }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in state.analytics?.modelBreakdown ?? []" :key="item.modelName">
                <td>{{ item.modelName }}</td>
                <td>${{ item.totalCostUsd.toFixed(4) }}</td>
                <td>{{ formatCostPercentage(item.totalCostUsd) }}</td>
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
