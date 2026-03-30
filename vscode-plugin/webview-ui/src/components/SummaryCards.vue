<script setup lang="ts">
import type { DashboardSummary } from "../types/dashboard";

defineProps<{
  summary: DashboardSummary | null;
}>();

function formatNumber(value: number | undefined): string {
  return value === undefined ? "--" : new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 3 }).format(value);
}

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString("zh-CN") : "--";
}
</script>

<template>
  <section class="summary-grid">
    <article class="stat-card accent-card">
      <p class="label">剩余额度</p>
      <strong>{{ formatNumber(summary?.remainingQuota) }}</strong>
    </article>
    <article class="stat-card">
      <p class="label">已用额度</p>
      <strong>{{ formatNumber(summary?.usedQuota) }}</strong>
    </article>
    <article class="stat-card">
      <p class="label">请求次数</p>
      <strong>{{ formatNumber(summary?.requestCount) }}</strong>
    </article>
    <article class="stat-card">
      <p class="label">套餐 / 到期</p>
      <strong>{{ summary?.packageLabel ?? "--" }}</strong>
      <span class="muted">{{ formatDate(summary?.expiresAt) }}</span>
    </article>
  </section>
</template>
