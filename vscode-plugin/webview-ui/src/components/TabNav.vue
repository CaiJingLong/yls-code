<script setup lang="ts">
import type { DashboardTab } from "../types/dashboard";

defineProps<{
  activeTab: DashboardTab;
}>();

defineEmits<{
  change: [tab: DashboardTab];
}>();
</script>

<template>
  <nav class="tab-nav" aria-label="Dashboard sections">
    <button
      class="tab-chip"
      :class="{ 'tab-chip-active': activeTab === 'overview' }"
      type="button"
      data-tab="overview"
      @click="$emit('change', 'overview')"
    >
      概览
    </button>
    <button
      class="tab-chip"
      :class="{ 'tab-chip-active': activeTab === 'logs' }"
      type="button"
      data-tab="logs"
      @click="$emit('change', 'logs')"
    >
      最近记录
    </button>
  </nav>
</template>
