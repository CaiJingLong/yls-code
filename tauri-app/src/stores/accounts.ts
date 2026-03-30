import { computed, reactive } from "vue";

import {
  deleteAccount as deleteAccountCommand,
  listAccounts,
  saveAccount as saveAccountCommand,
  setAccountEnabled as setAccountEnabledCommand,
} from "../lib/tauri/accounts";
import { isTauriRuntime } from "../lib/tauri/runtime";
import type { AccountSummary, SaveAccountInput } from "../types/accounts";

const STORAGE_KEY = "yls-workbench.active-account";

function getStoredActiveAccountId() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(STORAGE_KEY);
}

const state = reactive({
  items: [] as AccountSummary[],
  activeAccountId: getStoredActiveAccountId() as string | null,
  loading: false,
  error: null as string | null,
});

const activeAccount = computed(
  () => state.items.find((item) => item.id === state.activeAccountId) ?? null,
);

function persistActiveAccountId() {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (state.activeAccountId) {
    localStorage.setItem(STORAGE_KEY, state.activeAccountId);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function loadAccounts() {
  if (!isTauriRuntime()) {
    state.items = [];
    state.loading = false;
    return;
  }

  state.loading = true;
  state.error = null;

  try {
    state.items = await listAccounts();

    if (!state.activeAccountId || !state.items.some((item) => item.id === state.activeAccountId)) {
      state.activeAccountId = state.items[0]?.id ?? null;
      persistActiveAccountId();
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to load accounts";
  } finally {
    state.loading = false;
  }
}

export const accountsStore = {
  state,
  activeAccount,
  async load() {
    await loadAccounts();
  },
  setActiveAccount(accountId: string | null) {
    state.activeAccountId = accountId;
    persistActiveAccountId();
  },
  async saveAccount(input: SaveAccountInput) {
    await saveAccountCommand(input);
    await loadAccounts();
  },
  async setAccountEnabled(accountId: string, enabled: boolean) {
    await setAccountEnabledCommand(accountId, enabled);
    await loadAccounts();
  },
  async deleteAccount(accountId: string) {
    await deleteAccountCommand(accountId);
    await loadAccounts();
  },
};
