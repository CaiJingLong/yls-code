import { createApp } from "vue";
import { Quasar } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";

import App from "./App.vue";
import { createAppI18n } from "./i18n";
import { getQuasarLangPack } from "./i18n/messages";
import "./styles/app.css";
import { initializeSystemTimeZone } from "./lib/tauri/system";
import { router } from "./router";
import { preferencesStore } from "./stores/preferences";

async function bootstrap() {
  await initializeSystemTimeZone();
  const app = createApp(App);

  app
    .use(createAppI18n())
    .use(Quasar, {
      lang: getQuasarLangPack(preferencesStore.state.locale),
    })
    .use(router)
    .mount("#app");
}

void bootstrap();
