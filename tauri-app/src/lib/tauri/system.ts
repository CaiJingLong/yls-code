import { invoke } from "@tauri-apps/api/core";

import { setDisplayTimeZone } from "../datetime";
import { isTauriRuntime } from "./runtime";

export async function initializeSystemTimeZone() {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    const timeZone = await invoke<string>("get_system_timezone");
    setDisplayTimeZone(timeZone);
  } catch {
    // Fall back to the WebView-reported timezone when the native lookup is unavailable.
  }
}
