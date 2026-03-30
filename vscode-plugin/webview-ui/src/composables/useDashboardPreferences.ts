import { reactive, watch } from "vue";
import type { VsCodeApiLike } from "../lib/vscode";
import type { DashboardTab, TrendGranularity } from "../types/dashboard";

export interface DashboardPreferences {
  activeTab: DashboardTab;
  trendGranularity: TrendGranularity;
  pollingEnabled: boolean;
  pollingIntervalMs: number;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  activeTab: "overview",
  trendGranularity: "hour",
  pollingEnabled: true,
  pollingIntervalMs: 15_000
};

export function useDashboardPreferences(vscode: VsCodeApiLike) {
  const savedState = vscode.getState<Partial<DashboardPreferences>>() ?? {};
  const preferences = reactive<DashboardPreferences>({
    ...DEFAULT_PREFERENCES,
    ...savedState
  });

  watch(
    preferences,
    () => {
      vscode.setState({ ...preferences });
    },
    { deep: true }
  );

  return {
    preferences
  };
}
