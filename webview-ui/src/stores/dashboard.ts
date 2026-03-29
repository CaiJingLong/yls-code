import { reactive } from "vue";
import { createEmptyDashboardState, type DashboardViewState } from "../types/dashboard";

export function useDashboardState(initialState?: DashboardViewState) {
  const state = reactive<DashboardViewState>(initialState ?? createEmptyDashboardState());

  function patch(nextState: DashboardViewState): void {
    Object.assign(state, nextState);
  }

  return {
    state,
    patch
  };
}
