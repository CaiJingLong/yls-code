import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import App from "./App.vue";
import { createAppRouter } from "./router";

describe("App", () => {
  it("renders the app title and shell navigation", async () => {
    const router = createAppRouter(true);
    router.push("/overview");
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    await nextTick();

    expect(wrapper.get("[data-testid='app-title']").text()).toContain("yls-code");
    expect(wrapper.get("[data-testid='shell-nav']")).toBeDefined();
  });
});
