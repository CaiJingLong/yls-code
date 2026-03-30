<script setup lang="ts">
import { computed, watch } from "vue";

import { formatSyncProgress, zhCN } from "../../i18n/zhCN";
import { accountsStore } from "../../stores/accounts";
import { preferencesStore } from "../../stores/preferences";
import { syncStore } from "../../stores/sync";

const t = zhCN;

const statusText = computed(() => {
  const progress = syncStore.state.progress;

  if (syncStore.state.status === "running" && progress) {
    return formatSyncProgress(
      progress.kind,
      progress.scannedPages,
      progress.insertedRows,
    );
  }

  if (syncStore.state.status === "failed") {
    return t.topBar.syncFailed;
  }

  if (syncStore.state.status === "completed") {
    return t.topBar.syncCompleted;
  }

  return t.topBar.idle;
});

watch(
  () => [preferencesStore.state.pollingEnabled, preferencesStore.state.pollingIntervalMs],
  () => {
    syncStore.configurePolling();
  },
);
</script>

<template>
  <header class="topbar">
    <div class="topbar-group">
      <label class="topbar-field">
        <span>{{ t.topBar.account }}</span>
        <select
          :value="accountsStore.state.activeAccountId ?? ''"
          @change="accountsStore.setActiveAccount(($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">{{ t.topBar.noAccount }}</option>
          <option v-for="item in accountsStore.state.items" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="topbar-group">
      <label class="topbar-field">
        <span>{{ t.topBar.theme }}</span>
        <select
          :value="preferencesStore.state.themeMode"
          @change="
            preferencesStore.setThemeMode(
              ($event.target as HTMLSelectElement).value as 'system' | 'light' | 'dark',
            )
          "
        >
          <option value="system">{{ t.topBar.themeSystem }}</option>
          <option value="light">{{ t.topBar.themeLight }}</option>
          <option value="dark">{{ t.topBar.themeDark }}</option>
        </select>
      </label>

      <span class="topbar-status">{{ statusText }}</span>
    </div>
  </header>
</template>
