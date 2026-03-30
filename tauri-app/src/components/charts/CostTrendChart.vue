<script setup lang="ts">
import { computed } from "vue";

import { createCostTrendOption } from "../../charts/costTrend";
import { preferencesStore } from "../../stores/preferences";
import type { AnalyticsGranularity, TrendPoint } from "../../types/query";
import ChartPanel from "./ChartPanel.vue";

const props = defineProps<{
  data: TrendPoint[];
  granularity: AnalyticsGranularity;
  loading: boolean;
  title?: string;
}>();

const option = computed(() =>
  createCostTrendOption(
    props.data,
    preferencesStore.resolvedTheme.value,
    props.granularity,
  ),
);
</script>

<template>
  <ChartPanel
    :title="title ?? 'Cost Trend'"
    :option="option"
    :loading="loading"
    :empty="data.length === 0"
  />
</template>
