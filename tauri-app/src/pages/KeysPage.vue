<script setup lang="ts">
import { computed, reactive } from "vue";

import AccountForm from "../components/keys/AccountForm.vue";
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
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to save account";
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
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to delete account";
  } finally {
    state.loading = false;
  }
}

async function toggleEnabled(id: string, enabled: boolean) {
  state.loading = true;
  state.error = null;

  try {
    await accountsStore.setAccountEnabled(id, enabled);
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to update account";
  } finally {
    state.loading = false;
  }
}
</script>

<template>
  <section class="page page-grid">
    <div class="page-title">
      <div>
        <h2>Keys</h2>
        <p>Manage account metadata and securely stored API keys.</p>
      </div>
    </div>

    <div v-if="state.error" class="empty-state">{{ state.error }}</div>

    <div class="page-grid" style="grid-template-columns: 1.2fr 1fr;">
      <section class="table-panel">
        <header class="table-header">
          <h2>Accounts</h2>
          <button class="ghost" @click="state.editing = null">New</button>
        </header>
        <div v-if="accountsStore.state.loading" class="panel-empty">Loading accounts...</div>
        <div v-else-if="!items.length" class="panel-empty">No accounts configured yet.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.baseUrl }}</td>
                <td>
                  <span class="tag">{{ item.enabled ? "Enabled" : "Disabled" }}</span>
                </td>
                <td class="actions">
                  <button class="secondary" :disabled="state.loading" @click="editAccount(item.id)">Edit</button>
                  <button class="ghost" :disabled="state.loading" @click="toggleEnabled(item.id, !item.enabled)">
                    {{ item.enabled ? "Disable" : "Enable" }}
                  </button>
                  <button class="ghost" :disabled="state.loading" @click="handleDelete(item.id)">Delete</button>
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
