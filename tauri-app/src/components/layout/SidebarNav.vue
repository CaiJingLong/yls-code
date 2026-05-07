<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <aside class="sidebar" data-testid="shell-nav">
    <div class="brand">
      <p class="brand-kicker">YLS</p>
      <h1 class="brand-title" data-testid="app-title">yls-code</h1>
      <p class="brand-subtitle">{{ t("nav.subtitle") }}</p>
    </div>

    <nav class="sidebar-nav">
      <RouterLink class="sidebar-link" to="/overview">{{ t("nav.overview") }}</RouterLink>
      <RouterLink class="sidebar-link" to="/logs">{{ t("nav.logs") }}</RouterLink>
      <RouterLink class="sidebar-link" to="/analytics">{{ t("nav.analytics") }}</RouterLink>
      <RouterLink class="sidebar-link" to="/keys">{{ t("nav.keys") }}</RouterLink>
      <RouterLink class="sidebar-link" to="/settings">{{ t("nav.settings") }}</RouterLink>
    </nav>
  </aside>
</template>
