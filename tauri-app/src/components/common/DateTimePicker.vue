<script setup lang="ts">
import dayjs from "dayjs";
import { QDate, QIcon, QInput, QPopupProxy, QSeparator, QTime } from "quasar";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  id?: string;
  label: string;
  modelValue: string;
  placeholder?: string;
  clearable?: boolean;
  disable?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputValue = ref(formatDisplayValue(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = formatDisplayValue(value);
  },
);

const dateValue = computed({
  get() {
    return props.modelValue ? props.modelValue.slice(0, 10).replace(/-/g, "/") : "";
  },
  set(value: string) {
    updateValue(value, timeValue.value);
  },
});

const timeValue = computed({
  get() {
    return props.modelValue ? props.modelValue.slice(11, 16) : "00:00";
  },
  set(value: string) {
    updateValue(dateValue.value, value);
  },
});

function formatDisplayValue(value: string) {
  if (!value) {
    return "";
  }

  const parsed = dayjs(value, "YYYY-MM-DDTHH:mm", true);
  return parsed.isValid() ? parsed.format("YYYY/MM/DD HH:mm") : value;
}

function updateValue(date: string, time: string) {
  if (!date) {
    emit("update:modelValue", "");
    return;
  }

  emit("update:modelValue", `${date.replace(/\//g, "-")}T${time || "00:00"}`);
}

function updateInputValue(value: string | number | null) {
  const nextValue = String(value ?? "");
  inputValue.value = nextValue;

  if (!nextValue.trim()) {
    emit("update:modelValue", "");
    return;
  }

  const parsed = dayjs(nextValue, "YYYY/MM/DD HH:mm", true);
  if (!parsed.isValid()) {
    return;
  }

  emit("update:modelValue", parsed.format("YYYY-MM-DDTHH:mm"));
}
</script>

<template>
  <QInput
    :id="id"
    :label="label"
    :model-value="inputValue"
    class="datetime-picker"
    dense
    :disable="disable"
    outlined
    mask="####/##/## ##:##"
    :placeholder="placeholder ?? 'YYYY/MM/DD HH:mm'"
    :clearable="clearable"
    @update:model-value="updateInputValue"
  >
    <template #append>
      <QIcon name="event" class="cursor-pointer datetime-picker-popup-trigger">
        <QPopupProxy cover transition-show="scale" transition-hide="scale">
          <div class="datetime-picker-popup">
            <QDate v-model="dateValue" mask="YYYY/MM/DD" flat minimal />
            <QSeparator />
            <QTime v-model="timeValue" format24h flat />
          </div>
        </QPopupProxy>
      </QIcon>
    </template>
  </QInput>
</template>

<style scoped>
.datetime-picker {
  min-width: 190px;
  --q-primary: var(--accent);
}

.datetime-picker :deep(.q-field__control) {
  height: 48px;
  border-radius: 0.9rem;
  color: var(--text);
  background: var(--bg-panel);
}

.datetime-picker :deep(.q-field__native),
.datetime-picker :deep(.q-field__label),
.datetime-picker :deep(.q-icon) {
  color: var(--text-muted);
}

.datetime-picker-popup {
  display: grid;
  background: var(--bg-panel);
}
</style>
