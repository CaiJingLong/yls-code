<script setup lang="ts">
import { reactive, watch } from "vue";

import DateTimePicker from "../components/common/DateTimePicker.vue";
import PageHeader from "../components/layout/PageHeader.vue";
import LogsTable from "../components/logs/LogsTable.vue";
import { zhCN } from "../i18n/zhCN";
import { toUtcISOStringFromLocalInput } from "../lib/datetime";
import { LocalStorageStore } from "../lib/localStorageStore";
import { queryLogs } from "../lib/tauri/query";
import { accountsStore } from "../stores/accounts";
import { syncStore } from "../stores/sync";
import type { LogsQueryResponse } from "../types/query";

const filterStorage = new LocalStorageStore("yls-workbench.logs.filters", {
  search: "",
  model: "",
  createdAfter: "",
  createdBefore: "",
  pageSize: 50,
});
const storedFilters = filterStorage.load();
const filters = reactive({
  ...storedFilters,
  page: 1,
});

const state = reactive({
  loading: false,
  error: null as string | null,
  response: null as LogsQueryResponse | null,
});

async function loadLogs() {
  const accountId = accountsStore.state.activeAccountId;
  if (!accountId) {
    state.response = null;
    return;
  }

  state.loading = true;
  state.error = null;

  try {
    state.response = await queryLogs({
      accountId,
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || null,
      model: filters.model || null,
      createdAfter: toUtcISOStringFromLocalInput(filters.createdAfter),
      createdBefore: toUtcISOStringFromLocalInput(filters.createdBefore),
    });
  } catch {
    state.error = zhCN.errors.loadLogs;
  } finally {
    state.loading = false;
  }
}

const t = zhCN;

watch(
  () => [accountsStore.state.activeAccountId, syncStore.state.progress?.jobId],
  () => {
    void loadLogs();
  },
  { immediate: true },
);

watch(
  () => ({
    search: filters.search,
    model: filters.model,
    createdAfter: filters.createdAfter,
    createdBefore: filters.createdBefore,
    pageSize: filters.pageSize,
  }),
  (value) => {
    filterStorage.save(value);
  },
  { deep: true },
);
</script>

<template>
  <section class="page page-grid">
    <PageHeader :title="t.logs.title" :subtitle="t.logs.subtitle">
      <button class="secondary" :disabled="state.loading" @click="loadLogs">{{ t.common.refresh }}</button>
    </PageHeader>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      {{ t.logs.emptyNoAccount }}
    </div>
    <template v-else>
      <section class="card stack">
        <div class="filters">
          <label class="field">
            <span>{{ t.logs.search }}</span>
            <input v-model="filters.search" :placeholder="t.logs.searchPlaceholder" />
          </label>
          <label class="field">
            <span>{{ t.logs.model }}</span>
            <input v-model="filters.model" :placeholder="t.logs.modelPlaceholder" />
          </label>
          <DateTimePicker v-model="filters.createdAfter" :label="t.logs.createdAfter" clearable />
          <DateTimePicker v-model="filters.createdBefore" :label="t.logs.createdBefore" clearable />
        </div>
        <div class="actions">
          <button class="secondary" :disabled="state.loading" @click="filters.page = 1; loadLogs()">
            {{ t.logs.applyFilters }}
          </button>
        </div>
      </section>

      <section class="table-panel">
        <header class="table-header">
          <h2>{{ t.logs.recentLogs }}</h2>
          <span class="tag">共 {{ state.response?.total ?? 0 }} {{ t.logs.totalSuffix }}</span>
        </header>
        <div v-if="state.error" class="panel-empty">{{ state.error }}</div>
        <div v-else-if="state.loading" class="panel-empty">{{ t.logs.loading }}</div>
        <div v-else-if="!(state.response?.items.length)" class="panel-empty">{{ t.logs.noResults }}</div>
        <LogsTable v-else :items="state.response.items" />
      </section>

      <div class="actions">
        <button
          class="ghost"
          :disabled="filters.page <= 1 || state.loading"
          @click="filters.page -= 1; loadLogs()"
        >
          {{ t.common.previous }}
        </button>
        <button
          class="secondary"
          :disabled="state.loading || (state.response ? filters.page * filters.pageSize >= state.response.total : true)"
          @click="filters.page += 1; loadLogs()"
        >
          {{ t.common.next }}
        </button>
      </div>
    </template>
  </section>
</template>
