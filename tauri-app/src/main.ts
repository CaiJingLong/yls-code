import { createApp } from "vue";
import { Quasar } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";

import App from "./App.vue";
import "./styles/app.css";
import { initializeSystemTimeZone } from "./lib/tauri/system";
import { router } from "./router";

async function bootstrap() {
  await initializeSystemTimeZone();
  createApp(App).use(Quasar, {}).use(router).mount("#app");
}

void bootstrap();
