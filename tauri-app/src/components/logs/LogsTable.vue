<script setup lang="ts">
import { formatDateTimeDisplay } from "../../lib/datetime";
import { formatCompactNumber } from "../../lib/number";
import { useI18n } from "vue-i18n";
import type { LogListItem } from "../../types/query";

defineProps<{
  items: LogListItem[];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>{{ t("logsTable.model") }}</th>
          <th>{{ t("logsTable.reasoning") }}</th>
          <th>{{ t("logsTable.cost") }}</th>
          <th>{{ t("logsTable.tokens") }}</th>
          <th>{{ t("logsTable.created") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.modelName }}</td>
          <td>{{ item.reasoning || t("logsTable.noReasoning") }}</td>
          <td>${{ item.totalCostUsd.toFixed(4) }}</td>
          <td>{{ formatCompactNumber(item.totalTokens) }}</td>
          <td>{{ formatDateTimeDisplay(item.createdAt) ?? t("common.noValue") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
