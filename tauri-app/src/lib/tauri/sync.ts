import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { isTauriRuntime } from "./runtime";
import type { SyncKind, SyncProgressEvent } from "../../types/sync";

export async function startSync(accountId: string, kind: SyncKind) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("start_sync", { accountId, kind });
}

export async function listenSyncProgress(
  handler: (event: SyncProgressEvent) => void,
): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    return () => {};
  }

  return listen<SyncProgressEvent>("sync-progress", (event) => handler(event.payload));
}
