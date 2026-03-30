<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { RouterView } from "vue-router";

import { appStore } from "../../stores/app";
import { syncStore } from "../../stores/sync";
import SidebarNav from "./SidebarNav.vue";
import TopBar from "./TopBar.vue";

onMounted(() => {
  void appStore.initialize();
});

onBeforeUnmount(() => {
  syncStore.teardown();
});
</script>

<template>
  <div class="app-shell">
    <SidebarNav />
    <div class="content-shell">
      <TopBar />
      <RouterView v-slot="{ Component }">
        <div class="content-scroll">
          <component :is="Component" />
        </div>
      </RouterView>
    </div>
  </div>
</template>
