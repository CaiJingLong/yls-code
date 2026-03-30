import { reactive } from "vue";

import { isTauriRuntime } from "../lib/tauri/runtime";
import { accountsStore } from "./accounts";
import { syncStore } from "./sync";

const state = reactive({
  initialized: false,
});

export const appStore = {
  state,
  async initialize() {
    if (state.initialized) {
      return;
    }

    if (isTauriRuntime()) {
      await accountsStore.load();
      await syncStore.initialize();
      syncStore.configurePolling();
    }

    state.initialized = true;
  },
};
