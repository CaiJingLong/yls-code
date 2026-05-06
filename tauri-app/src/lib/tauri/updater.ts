import { check, type Update } from "@tauri-apps/plugin-updater";

export type { Update };

export function isUpdaterAvailable() {
  return import.meta.env.PROD;
}

export async function checkForUpdate() {
  if (!isUpdaterAvailable()) {
    return null;
  }

  return check();
}

export async function downloadAndInstallUpdate(
  update: Update,
  onProgress?: (downloaded: number, contentLength: number | null) => void,
) {
  if (!isUpdaterAvailable()) {
    return;
  }

  let downloaded = 0;
  let contentLength: number | null = null;

  await update.downloadAndInstall((event) => {
    if (event.event === "Started") {
      contentLength = event.data.contentLength ?? null;
      return;
    }

    if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      onProgress?.(downloaded, contentLength);
      return;
    }

    if (event.event === "Finished") {
      onProgress?.(downloaded, contentLength);
    }
  });
}
