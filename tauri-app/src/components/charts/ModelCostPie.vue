<script setup lang="ts">
import { computed } from "vue";

import { createModelCostOption } from "../../charts/modelCost";
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
</script>

<template>
  <ChartPanel
    title="Model Cost Breakdown"
    :option="option"
    :loading="loading"
    :empty="data.length === 0"
  />
</template>
