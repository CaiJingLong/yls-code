import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";

import AnalyticsPage from "../pages/AnalyticsPage.vue";
import KeysPage from "../pages/KeysPage.vue";
import LogsPage from "../pages/LogsPage.vue";
import OverviewPage from "../pages/OverviewPage.vue";

export function createAppRouter(useMemoryHistory = false) {
  return createRouter({
    history: useMemoryHistory ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: "/", redirect: "/overview" },
      { path: "/overview", component: OverviewPage },
      { path: "/logs", component: LogsPage },
      { path: "/analytics", component: AnalyticsPage },
      { path: "/keys", component: KeysPage },
    ],
  });
}

export const router = createAppRouter();
