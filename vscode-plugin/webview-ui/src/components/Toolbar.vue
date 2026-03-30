<script setup lang="ts">
defineProps<{
  lastUpdatedAt: string | null;
}>();

defineEmits<{
  refresh: [];
  openSettings: [];
}>();

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "尚未刷新";
  }

  return new Date(value).toLocaleString("zh-CN");
}
</script>

<template>
  <section class="toolbar">
    <div>
      <p class="eyebrow">YLS Code</p>
      <h1>用量概览</h1>
      <p class="muted">最近刷新：{{ formatUpdatedAt(lastUpdatedAt) }}</p>
    </div>

    <div class="toolbar-actions">
      <button class="ghost-button" type="button" @click="$emit('openSettings')">设置</button>
      <button class="primary-button" type="button" @click="$emit('refresh')">刷新</button>
    </div>
  </section>
</template>
