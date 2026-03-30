import { reactive } from "vue";

import { listenSyncProgress, startSync } from "../lib/tauri/sync";
import { isTauriRuntime } from "../lib/tauri/runtime";
import { accountsStore } from "./accounts";
import { preferencesStore } from "./preferences";
import type { SyncKind, SyncProgressEvent } from "../types/sync";

const state = reactive({
  status: "idle" as "idle" | "running" | "completed" | "failed",
  progress: null as SyncProgressEvent | null,
  error: null as string | null,
});

let unlisten: (() => void) | null = null;
let pollingTimer: number | null = null;

async function ensureListener() {
  if (!isTauriRuntime() || unlisten) {
    return;
  }

  unlisten = await listenSyncProgress((event) => {
    state.progress = event;
    state.status = event.status;
    state.error = event.status === "failed" ? event.message ?? "Sync failed" : null;
  });
}

function clearPolling() {
  if (pollingTimer !== null) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export const syncStore = {
  state,
  async initialize() {
    await ensureListener();
  },
  async trigger(kind: SyncKind = "incremental") {
    const accountId = accountsStore.state.activeAccountId;
    if (!accountId || !isTauriRuntime()) {
      return;
    }

    state.status = "running";
    state.error = null;
    await startSync(accountId, kind);
  },
  configurePolling() {
    clearPolling();

    if (!preferencesStore.state.pollingEnabled || !isTauriRuntime()) {
      return;
    }

    pollingTimer = window.setInterval(() => {
      void syncStore.trigger("incremental");
    }, preferencesStore.state.pollingIntervalMs);
  },
  teardown() {
    clearPolling();
    unlisten?.();
    unlisten = null;
  },
};
