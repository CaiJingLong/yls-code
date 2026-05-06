<script setup lang="ts">
import { computed } from "vue";

import PageHeader from "../components/layout/PageHeader.vue";
import { zhCN } from "../i18n/zhCN";
import { isTauriRuntime } from "../lib/tauri/runtime";
import { isUpdaterAvailable } from "../lib/tauri/updater";
import { accountsStore } from "../stores/accounts";
import { preferencesStore } from "../stores/preferences";
import { syncStore } from "../stores/sync";
import { updateStore } from "../stores/update";

const t = zhCN;
const canUseUpdater = computed(() => isTauriRuntime() && isUpdaterAvailable());
</script>

<template>
  <section class="page page-grid">
    <PageHeader :title="t.settings.title" :subtitle="t.settings.subtitle" />

    <section class="card stack">
      <div>
        <h3>{{ t.settings.syncSection }}</h3>
        <p>{{ t.settings.syncHint }}</p>
      </div>

      <div v-if="!accountsStore.state.activeAccountId" class="empty-state">
        {{ t.settings.noAccount }}
      </div>

      <div class="actions">
        <button
          class="secondary"
          :disabled="!accountsStore.state.activeAccountId || syncStore.state.status === 'running'"
          @click="syncStore.trigger('incremental')"
        >
          {{ t.settings.syncNow }}
        </button>
        <button
          class="ghost"
          :disabled="!accountsStore.state.activeAccountId || syncStore.state.status === 'running'"
          @click="syncStore.trigger('full')"
        >
          {{ t.settings.fullSync }}
        </button>
      </div>
    </section>

    <section class="card stack">
      <div>
        <h3>{{ t.settings.pollingSection }}</h3>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>{{ t.settings.autoSync }}</span>
          <select
            :value="preferencesStore.state.pollingEnabled ? 'on' : 'off'"
            @change="preferencesStore.setPollingEnabled(($event.target as HTMLSelectElement).value === 'on')"
          >
            <option value="on">{{ t.settings.autoSyncEnabled }}</option>
            <option value="off">{{ t.settings.autoSyncDisabled }}</option>
          </select>
        </label>

        <label class="field">
          <span>{{ t.settings.polling }}</span>
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
      </div>
    </section>

    <section class="card stack">
      <div>
        <h3>{{ t.settings.updateSection }}</h3>
        <p>{{ t.settings.updateHint }}</p>
      </div>

      <div v-if="!canUseUpdater" class="empty-state">
        {{ t.settings.updateDesktopOnly }}
      </div>

      <div v-else class="stack">
        <div class="actions">
          <button
            class="secondary"
            :disabled="updateStore.state.checking || updateStore.state.installing"
            @click="updateStore.check()"
          >
            {{ t.settings.checkUpdate }}
          </button>
          <button
            class="ghost"
            :disabled="
              !updateStore.state.hasUpdate ||
              updateStore.state.installing ||
              updateStore.state.checking
            "
            @click="updateStore.install()"
          >
            {{ t.settings.installUpdate }}
          </button>
        </div>

        <div v-if="updateStore.state.message" class="tag">{{ updateStore.state.message }}</div>
        <div v-if="updateStore.state.error" class="tag">{{ updateStore.state.error }}</div>

        <div v-if="updateStore.state.hasUpdate" class="form-grid">
          <div class="field">
            <span>{{ t.settings.updateCurrentVersion }}</span>
            <code>{{ updateStore.state.currentVersion }}</code>
          </div>
          <div class="field">
            <span>{{ t.settings.updateLatestVersion }}</span>
            <code>{{ updateStore.state.latestVersion }}</code>
          </div>
        </div>

        <div v-if="updateStore.state.hasUpdate && updateStore.state.notes" class="field">
          <span>{{ t.settings.updateNotes }}</span>
          <pre class="update-notes">{{ updateStore.state.notes }}</pre>
        </div>
      </div>
    </section>
  </section>
</template>
