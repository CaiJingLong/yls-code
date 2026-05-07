import { Quasar } from "quasar";
import { mount } from "@vue/test-utils";

import { getQuasarLangPack, type AppLocale } from "./i18n/messages";
import { preferencesStore } from "./stores/preferences";

export function mountWithApp(
  component: any,
  options: any = {},
  locale: AppLocale = "zh-CN",
) {
  preferencesStore.setLocale(locale);

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [
        [Quasar, { lang: getQuasarLangPack(locale) }],
        ...(options.global?.plugins ?? []),
      ],
    },
  });
}
