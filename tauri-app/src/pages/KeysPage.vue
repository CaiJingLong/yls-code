<script setup lang="ts">
import { computed, reactive } from "vue";

import AccountForm from "../components/keys/AccountForm.vue";
import { zhCN } from "../i18n/zhCN";
import { accountsStore } from "../stores/accounts";
import type { SaveAccountInput } from "../types/accounts";

const state = reactive({
  loading: false,
  editing: null as SaveAccountInput | null,
  error: null as string | null,
});

const items = computed(() => accountsStore.state.items);

function editAccount(id: string) {
  const account = items.value.find((item) => item.id === id);
  if (!account) {
    return;
  }

  state.editing = {
    id: account.id,
    name: account.name,
    baseUrl: account.baseUrl,
    apiKey: "",
    enabled: account.enabled,
  };
}

async function handleSubmit(input: SaveAccountInput) {
  state.loading = true;
  state.error = null;

  try {
    await accountsStore.saveAccount(input);
    state.editing = null;
  } catch {
    state.error = zhCN.errors.saveAccount;
  } finally {
    state.loading = false;
  }
}

async function handleDelete(id: string) {
  state.loading = true;
  state.error = null;

  try {
    await accountsStore.deleteAccount(id);
    if (state.editing?.id === id) {
      state.editing = null;
    }
  } catch {
    state.error = zhCN.errors.deleteAccount;
  } finally {
    state.loading = false;
  }
}

async function toggleEnabled(id: string, enabled: boolean) {
  state.loading = true;
  state.error = null;

  try {
    await accountsStore.setAccountEnabled(id, enabled);
  } catch {
    state.error = zhCN.errors.updateAccount;
  } finally {
    state.loading = false;
  }
}

const t = zhCN;
</script>

<template>
  <section class="page page-grid">
    <div class="page-title">
      <div>
        <h2>{{ t.keys.title }}</h2>
        <p>{{ t.keys.subtitle }}</p>
      </div>
    </div>

    <div v-if="state.error" class="empty-state">{{ state.error }}</div>

    <div class="page-grid" style="grid-template-columns: 1.2fr 1fr;">
      <section class="table-panel">
        <header class="table-header">
          <h2>{{ t.keys.accounts }}</h2>
          <button class="ghost" @click="state.editing = null">{{ t.common.create }}</button>
        </header>
        <div v-if="accountsStore.state.loading" class="panel-empty">{{ t.keys.loadingAccounts }}</div>
        <div v-else-if="!items.length" class="panel-empty">{{ t.keys.noAccounts }}</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t.keys.columnName }}</th>
                <th>{{ t.keys.columnUrl }}</th>
                <th>{{ t.keys.columnStatus }}</th>
                <th>{{ t.keys.columnActions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.baseUrl }}</td>
                <td>
                  <span class="tag">{{ item.enabled ? t.common.enabled : t.common.disabled }}</span>
                </td>
                <td class="actions">
                  <button class="secondary" :disabled="state.loading" @click="editAccount(item.id)">{{ t.common.edit }}</button>
                  <button class="ghost" :disabled="state.loading" @click="toggleEnabled(item.id, !item.enabled)">
                    {{ item.enabled ? t.common.disable : t.common.enable }}
                  </button>
                  <button class="ghost" :disabled="state.loading" @click="handleDelete(item.id)">{{ t.common.delete }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <AccountForm
        :initial-value="state.editing"
        :loading="state.loading"
        @submit="handleSubmit"
        @cancel="state.editing = null"
      />
    </div>
  </section>
</template>
