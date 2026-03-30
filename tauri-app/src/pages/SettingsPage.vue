<script setup lang="ts">
import PageHeader from "../components/layout/PageHeader.vue";
import { zhCN } from "../i18n/zhCN";
import { accountsStore } from "../stores/accounts";
import { preferencesStore } from "../stores/preferences";
import { syncStore } from "../stores/sync";

const t = zhCN;
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
  </section>
</template>
