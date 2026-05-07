import { getVersion } from "@tauri-apps/api/app";
import packageJson from "../../package.json";

import { isTauriRuntime } from "./tauri/runtime";

export async function resolveAppVersion() {
  if (!isTauriRuntime()) {
    return packageJson.version;
  }

  try {
    return await getVersion();
  } catch {
    return packageJson.version;
  }
}
