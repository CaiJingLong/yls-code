<script setup lang="ts">
import type { DashboardLogRow, DashboardPagination } from "../types/dashboard";

defineProps<{
  logs: DashboardLogRow[];
  pagination: DashboardPagination;
}>();

defineEmits<{
  loadMore: [];
}>();

function formatCost(value: number): string {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 4 }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("zh-CN");
}
</script>

<template>
  <section class="panel">
    <header class="panel-header">
      <h2>最近记录</h2>
      <span class="muted">当前已加载 {{ logs.length }} / {{ pagination.total }} 条</span>
    </header>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Reasoning</th>
            <th>Tokens</th>
            <th>Cost</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="logs.length === 0">
            <td colspan="5" class="empty-row">暂无记录</td>
          </tr>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.model }}</td>
            <td>{{ log.reasoning }}</td>
            <td>{{ log.totalTokens }}</td>
            <td>{{ formatCost(log.totalCost) }}</td>
            <td>{{ formatDate(log.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      v-if="pagination.hasMore"
      class="ghost-button wide-button"
      type="button"
      :disabled="pagination.isLoadingMore"
      @click="$emit('loadMore')"
    >
      {{ pagination.isLoadingMore ? "加载中..." : "加载更多" }}
    </button>
  </section>
</template>
