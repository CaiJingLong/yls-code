import { Lang } from "quasar";
import { createI18n } from "vue-i18n";

import type { SyncKind } from "../types/sync";
import {
  getQuasarLangPack,
  messages,
  normalizeLocale,
  type AppLocale,
} from "./messages";

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages,
});

export function createAppI18n() {
  return i18n;
}

export function setLocale(locale: AppLocale) {
  const normalized = normalizeLocale(locale);
  i18n.global.locale.value = normalized;
  Lang.set(getQuasarLangPack(normalized));
  return normalized;
}

export function translate(key: string, params: Record<string, unknown> = {}) {
  return i18n.global.t(key, params);
}

export function formatSyncProgress(
  kind: SyncKind,
  scannedPages: number,
  insertedRows: number,
) {
  const kindText = translate(kind === "full" ? "sync.kindFull" : "sync.kindIncremental");

  return translate("sync.progress", {
    kind: kindText,
    scannedPages,
    insertedRows,
  });
}
