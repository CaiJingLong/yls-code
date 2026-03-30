import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import App from "./App.vue";

describe("App", () => {
  it("renders the workbench title and shell navigation", () => {
    const wrapper = mount(App);

    expect(wrapper.get("[data-testid='app-title']").text()).toContain(
      "YLS Desktop Workbench",
    );
    expect(wrapper.get("[data-testid='shell-nav']")).toBeDefined();
  });
});
