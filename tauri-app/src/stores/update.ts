import { reactive } from "vue";
import { relaunch } from "@tauri-apps/plugin-process";

import { translate } from "../i18n";
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  isUpdaterAvailable,
  type Update,
} from "../lib/tauri/updater";
import { isTauriRuntime } from "../lib/tauri/runtime";

const state = reactive({
  checking: false,
  installing: false,
  hasUpdate: false,
  currentVersion: "",
  latestVersion: "",
  notes: "",
  downloadedBytes: 0,
  totalBytes: null as number | null,
  message: "" as string,
  error: null as string | null,
});

let pendingUpdate: Update | null = null;

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export const updateStore = {
  state,
  async check() {
    if (!isTauriRuntime() || !isUpdaterAvailable() || state.checking || state.installing) {
      state.message = "";
      state.error = null;
      return;
    }

    state.checking = true;
    state.error = null;
    state.hasUpdate = false;
    state.currentVersion = "";
    state.latestVersion = "";
    state.notes = "";
    state.message = translate("settings.updateChecking");
    state.downloadedBytes = 0;
    state.totalBytes = null;

    try {
      const update = await checkForUpdate();
      pendingUpdate = update;

      if (!update) {
        state.message = translate("settings.updateNotFound");
        return;
      }

      state.hasUpdate = true;
      state.currentVersion = update.currentVersion;
      state.latestVersion = update.version;
      state.notes = update.body ?? "";
      state.message = translate("settings.updateFound", { version: update.version });
    } catch {
      pendingUpdate = null;
      state.hasUpdate = false;
      state.message = "";
      state.error = translate("settings.updateCheckFailed");
    } finally {
      state.checking = false;
    }
  },
  async install() {
    if (
      !isTauriRuntime() ||
      !isUpdaterAvailable() ||
      !pendingUpdate ||
      state.installing ||
      state.checking
    ) {
      return;
    }

    state.installing = true;
    state.error = null;
    state.message = translate("settings.updateDownloading");
    state.downloadedBytes = 0;
    state.totalBytes = null;

    try {
      await downloadAndInstallUpdate(pendingUpdate, (downloaded, total) => {
        state.downloadedBytes = downloaded;
        state.totalBytes = total;

        if (total && total > 0) {
          state.message = translate("settings.updateDownloadingProgress", {
            done: formatBytes(downloaded),
            total: formatBytes(total),
          });
          return;
        }

        state.message = translate("settings.updateDownloadingSingle", {
          done: formatBytes(downloaded),
        });
      });

      state.message = translate("settings.updateInstalled");
      pendingUpdate = null;
      state.hasUpdate = false;
      await relaunch();
    } catch {
      state.error = translate("settings.updateInstallFailed");
    } finally {
      state.installing = false;
    }
  },
};
