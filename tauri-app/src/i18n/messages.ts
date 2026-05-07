import quasarEnUS from "quasar/lang/en-US.js";
import quasarZhCN from "quasar/lang/zh-CN.js";

import { enUS } from "./enUS";
import { zhCN } from "./zhCN";

export const supportedLocales = ["zh-CN", "en-US"] as const;

export type AppLocale = (typeof supportedLocales)[number];
export type AppMessages = typeof zhCN;

export const messages = {
  "zh-CN": zhCN,
  "en-US": enUS,
} as const;

const quasarLangPacks = {
  "zh-CN": quasarZhCN,
  "en-US": quasarEnUS,
} as const;

export function normalizeLocale(locale?: string): AppLocale {
  return locale === "en-US" ? "en-US" : "zh-CN";
}

export function getQuasarLangPack(locale: AppLocale) {
  return quasarLangPacks[normalizeLocale(locale)];
}
