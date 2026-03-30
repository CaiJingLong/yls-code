<script setup lang="ts">
import type { TrendGranularity } from "../types/dashboard";

defineProps<{
  trendGranularity: TrendGranularity;
  pollingEnabled: boolean;
  pollingIntervalMs: number;
}>();

defineEmits<{
  'update:trendGranularity': [value: TrendGranularity];
  'update:pollingEnabled': [value: boolean];
}>();
</script>

<template>
  <section class="control-bar">
    <div class="control-group">
      <span class="control-label">趋势</span>
      <button
        class="segmented-button"
        :class="{ 'segmented-button-active': trendGranularity === 'hour' }"
        type="button"
        @click="$emit('update:trendGranularity', 'hour')"
      >
        按小时
      </button>
      <button
        class="segmented-button"
        :class="{ 'segmented-button-active': trendGranularity === 'day' }"
        type="button"
        @click="$emit('update:trendGranularity', 'day')"
      >
        按天
      </button>
    </div>

    <label class="polling-toggle">
      <input
        type="checkbox"
        :checked="pollingEnabled"
        @change="$emit('update:pollingEnabled', ($event.target as HTMLInputElement).checked)"
      />
      <span>自动轮询 {{ pollingIntervalMs / 1000 }}s</span>
    </label>
  </section>
</template>
