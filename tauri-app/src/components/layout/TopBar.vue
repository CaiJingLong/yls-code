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

      <div class="actions">
        <button
          class="secondary"
          :disabled="!accountsStore.state.activeAccountId || syncStore.state.status === 'running'"
          @click="syncStore.trigger('incremental')"
        >
          {{ t.topBar.syncNow }}
        </button>
        <button
          class="ghost"
          :disabled="!accountsStore.state.activeAccountId || syncStore.state.status === 'running'"
          @click="syncStore.trigger('full')"
        >
          {{ t.topBar.fullSync }}
        </button>
      </div>
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

      <label class="topbar-field">
        <span>{{ t.topBar.polling }}</span>
        <select
          :value="preferencesStore.state.pollingIntervalMs"
          :disabled="!preferencesStore.state.pollingEnabled"
          @change="preferencesStore.setPollingIntervalMs(Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="15000">15s</option>
          <option :value="30000">30s</option>
          <option :value="60000">60s</option>
        </select>
      </label>

      <label class="topbar-field">
        <span>{{ t.topBar.autoSync }}</span>
        <select
          :value="preferencesStore.state.pollingEnabled ? 'on' : 'off'"
          @change="preferencesStore.setPollingEnabled(($event.target as HTMLSelectElement).value === 'on')"
        >
          <option value="on">{{ t.topBar.autoSyncEnabled }}</option>
          <option value="off">{{ t.topBar.autoSyncDisabled }}</option>
        </select>
      </label>

      <span class="topbar-status">{{ statusText }}</span>
    </div>
  </header>
</template>
