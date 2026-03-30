import { computed, reactive, watchEffect } from "vue";

import {
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "../composables/useResolvedTheme";

const STORAGE_KEY = "yls-workbench.preferences";

interface StoredPreferences {
  themeMode?: ThemeMode;
  pollingEnabled?: boolean;
  pollingIntervalMs?: number;
}

function loadStoredPreferences(): StoredPreferences {
  if (typeof localStorage === "undefined") {
    return {};
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as StoredPreferences;
  } catch {
    return {};
  }
}

const stored = loadStoredPreferences();

const state = reactive({
  themeMode: stored.themeMode ?? "system",
  pollingEnabled: stored.pollingEnabled ?? true,
  pollingIntervalMs: stored.pollingIntervalMs ?? 15_000,
});

const resolvedTheme = computed<ResolvedTheme>(() => resolveTheme(state.themeMode));

watchEffect(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeMode: state.themeMode,
        pollingEnabled: state.pollingEnabled,
        pollingIntervalMs: state.pollingIntervalMs,
      }),
    );
  }

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolvedTheme.value;
  }
});

export const preferencesStore = {
  state,
  resolvedTheme,
  setThemeMode(themeMode: ThemeMode) {
    state.themeMode = themeMode;
  },
  setPollingEnabled(enabled: boolean) {
    state.pollingEnabled = enabled;
  },
  setPollingIntervalMs(intervalMs: number) {
    state.pollingIntervalMs = intervalMs;
  },
};
