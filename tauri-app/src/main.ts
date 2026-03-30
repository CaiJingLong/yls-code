import { createApp } from "vue";
import App from "./App.vue";
import "./styles/app.css";
import { initializeSystemTimeZone } from "./lib/tauri/system";
import { router } from "./router";

async function bootstrap() {
  await initializeSystemTimeZone();
  createApp(App).use(router).mount("#app");
}

void bootstrap();
