import { config } from "@vue/test-utils";
import { beforeEach } from "vitest";

import { createAppI18n } from "./i18n";
import { preferencesStore } from "./stores/preferences";

config.global.plugins = [createAppI18n()];

beforeEach(() => {
  preferencesStore.setLocale("zh-CN");
});
