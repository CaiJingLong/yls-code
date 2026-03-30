<script setup lang="ts">
import { reactive, watch } from "vue";

import type { SaveAccountInput } from "../../types/accounts";

const props = defineProps<{
  initialValue?: SaveAccountInput | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: SaveAccountInput];
  cancel: [];
}>();

const form = reactive<SaveAccountInput>({
  id: undefined,
  name: "",
  baseUrl: "https://code.ylsagi.com",
  apiKey: "",
  enabled: true,
});

watch(
  () => props.initialValue,
  (value) => {
    form.id = value?.id;
    form.name = value?.name ?? "";
    form.baseUrl = value?.baseUrl ?? "https://code.ylsagi.com";
    form.apiKey = value?.apiKey ?? "";
    form.enabled = value?.enabled ?? true;
  },
  { immediate: true },
);

function handleSubmit() {
  emit("submit", { ...form });
}
</script>

<template>
  <section class="card stack">
    <div class="page-title">
      <div>
        <h2>{{ form.id ? "Edit Account" : "Add Account" }}</h2>
        <p>Store metadata in SQLite and API keys in the local secure store.</p>
      </div>
    </div>

    <div class="form-grid">
      <label class="field">
        <span>Name</span>
        <input v-model="form.name" placeholder="Primary key" />
      </label>
      <label class="field">
        <span>Base URL</span>
        <input v-model="form.baseUrl" />
      </label>
      <label class="field">
        <span>API Key</span>
        <input v-model="form.apiKey" placeholder="yls-..." />
      </label>
      <label class="field">
        <span>Enabled</span>
        <select v-model="form.enabled">
          <option :value="true">Enabled</option>
          <option :value="false">Disabled</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button :disabled="loading" @click="handleSubmit">Save</button>
      <button class="ghost" :disabled="loading" @click="$emit('cancel')">Cancel</button>
    </div>
  </section>
</template>
