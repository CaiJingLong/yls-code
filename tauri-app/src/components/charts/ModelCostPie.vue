<script setup lang="ts">
import { computed } from "vue";

import { createModelCostOption } from "../../charts/modelCost";
import { zhCN } from "../../i18n/zhCN";
import { preferencesStore } from "../../stores/preferences";
import type { ModelCostPoint } from "../../types/query";
import ChartPanel from "./ChartPanel.vue";

const props = defineProps<{
  data: ModelCostPoint[];
  loading: boolean;
}>();

const option = computed(() =>
  createModelCostOption(props.data, preferencesStore.resolvedTheme.value),
);
const t = zhCN;
</script>

<template>
  <ChartPanel
    :title="t.charts.modelCostBreakdown"
    :option="option"
    :loading="loading"
    :empty="data.length === 0"
  />
</template>
