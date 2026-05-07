import { nextTick } from "vue";
import { describe, expect, it } from "vitest";

import App from "./App.vue";
import { createAppRouter } from "./router";
import { mountWithApp } from "./test-utils";

describe("App", () => {
  it("renders the app title, settings navigation, and a simplified top bar", async () => {
    const router = createAppRouter(true);
    router.push("/overview");
    await router.isReady();
    const wrapper = mountWithApp(App, {
      global: {
        plugins: [router],
      },
    });
    await nextTick();

    expect(wrapper.get("[data-testid='app-title']").text()).toContain("yls-code");
    expect(wrapper.get("[data-testid='shell-nav']")).toBeDefined();
    expect(wrapper.text()).toContain("设置");
    expect(wrapper.text()).not.toContain("立即同步");
    expect(wrapper.text()).not.toContain("全量同步");
    expect(wrapper.text()).not.toContain("轮询间隔");
    expect(wrapper.text()).not.toContain("自动同步");
  });

  it("renders English navigation copy after switching locale", async () => {
    const router = createAppRouter(true);
    router.push("/overview");
    await router.isReady();
    const wrapper = mountWithApp(App, {
      global: {
        plugins: [router],
      },
    }, "en-US");
    await nextTick();

    expect(wrapper.text()).toContain("Settings");
    expect(wrapper.text()).not.toContain("设置");
  });
});
