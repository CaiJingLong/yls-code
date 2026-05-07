<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

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
const { t } = useI18n();
</script>

<template>
  <ChartPanel
    :title="t('charts.modelCostBreakdown')"
    :option="option"
    :loading="loading"
    :empty="data.length === 0"
  />
</template>
