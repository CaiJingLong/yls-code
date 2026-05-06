import { reactive } from "vue";

import { isTauriRuntime } from "../lib/tauri/runtime";
import { isUpdaterAvailable } from "../lib/tauri/updater";
import { accountsStore } from "./accounts";
import { syncStore } from "./sync";
import { updateStore } from "./update";

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
      if (isUpdaterAvailable()) {
        await updateStore.check();
      }
    }

    state.initialized = true;
  },
};
