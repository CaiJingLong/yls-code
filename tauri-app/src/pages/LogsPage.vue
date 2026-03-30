<script setup lang="ts">
import { reactive, watch } from "vue";

import LogsTable from "../components/logs/LogsTable.vue";
import { queryLogs } from "../lib/tauri/query";
import { accountsStore } from "../stores/accounts";
import { syncStore } from "../stores/sync";
import type { LogsQueryResponse } from "../types/query";

const filters = reactive({
  search: "",
  model: "",
  createdAfter: "",
  createdBefore: "",
  page: 1,
  pageSize: 50,
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
      createdAfter: filters.createdAfter || null,
      createdBefore: filters.createdBefore || null,
    });
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to query logs";
  } finally {
    state.loading = false;
  }
}

watch(
  () => [accountsStore.state.activeAccountId, syncStore.state.progress?.jobId],
  () => {
    void loadLogs();
  },
  { immediate: true },
);
</script>

<template>
  <section class="page page-grid">
    <div class="page-title">
      <div>
        <h2>Logs</h2>
        <p>Search and page through normalized local log records.</p>
      </div>
      <button class="secondary" :disabled="state.loading" @click="loadLogs">Refresh</button>
    </div>

    <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
      Select or create an account first.
    </div>
    <template v-else>
      <section class="card stack">
        <div class="filters">
          <label class="field">
            <span>Search</span>
            <input v-model="filters.search" placeholder="model / reasoning / raw json" />
          </label>
          <label class="field">
            <span>Model</span>
            <input v-model="filters.model" placeholder="gpt-5.4" />
          </label>
          <label class="field">
            <span>Created After</span>
            <input v-model="filters.createdAfter" placeholder="2026-03-29T00:00:00.000Z" />
          </label>
          <label class="field">
            <span>Created Before</span>
            <input v-model="filters.createdBefore" placeholder="2026-03-30T23:59:59.000Z" />
          </label>
        </div>
        <div class="actions">
          <button class="secondary" :disabled="state.loading" @click="filters.page = 1; loadLogs()">
            Apply Filters
          </button>
        </div>
      </section>

      <section class="table-panel">
        <header class="table-header">
          <h2>Recent Logs</h2>
          <span class="tag">{{ state.response?.total ?? 0 }} total</span>
        </header>
        <div v-if="state.error" class="panel-empty">{{ state.error }}</div>
        <div v-else-if="state.loading" class="panel-empty">Loading logs...</div>
        <div v-else-if="!(state.response?.items.length)" class="panel-empty">No logs matched this query.</div>
        <LogsTable v-else :items="state.response.items" />
      </section>

      <div class="actions">
        <button
          class="ghost"
          :disabled="filters.page <= 1 || state.loading"
          @click="filters.page -= 1; loadLogs()"
        >
          Previous
        </button>
        <button
          class="secondary"
          :disabled="state.loading || (state.response ? filters.page * filters.pageSize >= state.response.total : true)"
          @click="filters.page += 1; loadLogs()"
        >
          Next
        </button>
      </div>
    </template>
  </section>
</template>
