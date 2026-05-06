import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Quasar } from "quasar";

import DateTimePicker from "./DateTimePicker.vue";

describe("DateTimePicker", () => {
  it("renders a stable display value for the selected datetime", () => {
    const wrapper = mount(DateTimePicker, {
      global: {
        plugins: [[Quasar, {}]],
      },
      props: {
        label: "开始时间",
        modelValue: "2026-05-01T12:30",
      },
    });

    expect(wrapper.text()).toContain("开始时间");
    expect(wrapper.find("input").element.value).toBe("2026/05/01 12:30");
  });

  it("accepts typed datetime text and emits the normalized value", async () => {
    const wrapper = mount(DateTimePicker, {
      global: {
        plugins: [[Quasar, {}]],
      },
      props: {
        label: "开始时间",
        modelValue: "",
      },
    });

    await wrapper.find("input").setValue("2026/05/06 12:30");

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted?.[emitted.length - 1]).toEqual(["2026-05-06T12:30"]);
  });

  it("does not attach the popup trigger to the editable text input", () => {
    const wrapper = mount(DateTimePicker, {
      global: {
        plugins: [[Quasar, {}]],
      },
      props: {
        label: "开始时间",
        modelValue: "",
      },
    });

    expect(wrapper.find(".datetime-picker-popup-trigger").exists()).toBe(true);
    expect(wrapper.findAllComponents({ name: "QPopupProxy" })).toHaveLength(1);
  });

  it("passes common input props through to Quasar input", () => {
    const wrapper = mount(DateTimePicker, {
      global: {
        plugins: [[Quasar, {}]],
      },
      props: {
        label: "结束时间",
        modelValue: "",
        placeholder: "选择结束时间",
        clearable: true,
        disable: true,
      },
    });

    expect(wrapper.find("input").attributes("placeholder")).toBe("选择结束时间");
    expect(wrapper.find("input").attributes()).toHaveProperty("disabled");
    expect(wrapper.props("clearable")).toBe(true);
  });
});
