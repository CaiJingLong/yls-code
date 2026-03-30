<script setup lang="ts">
import { reactive, watch } from "vue";

import { zhCN } from "../../i18n/zhCN";
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

const t = zhCN;

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
        <h2>{{ form.id ? t.accountForm.editTitle : t.accountForm.addTitle }}</h2>
        <p>{{ t.accountForm.subtitle }}</p>
      </div>
    </div>

    <div class="form-grid">
      <label class="field">
        <span>{{ t.accountForm.name }}</span>
        <input v-model="form.name" :placeholder="t.accountForm.namePlaceholder" />
      </label>
      <label class="field">
        <span>{{ t.accountForm.baseUrl }}</span>
        <input v-model="form.baseUrl" />
      </label>
      <label class="field">
        <span>{{ t.accountForm.apiKey }}</span>
        <input v-model="form.apiKey" :placeholder="t.accountForm.apiKeyPlaceholder" />
      </label>
      <label class="field">
        <span>{{ t.accountForm.enabled }}</span>
        <select v-model="form.enabled">
          <option :value="true">{{ t.accountForm.enabledOption }}</option>
          <option :value="false">{{ t.accountForm.disabledOption }}</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button :disabled="loading" @click="handleSubmit">{{ t.common.save }}</button>
      <button class="ghost" :disabled="loading" @click="$emit('cancel')">{{ t.common.cancel }}</button>
    </div>
  </section>
</template>
