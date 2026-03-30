import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import ChartPanel from "./ChartPanel.vue";

const echartsMocks = vi.hoisted(() => {
  const setOption = vi.fn();
  const dispose = vi.fn();
  const resize = vi.fn();
  const init = vi.fn(() => ({
    setOption,
    dispose,
    resize
  }));

  return { init, setOption, dispose, resize };
});

vi.mock("../lib/echarts", () => ({
  init: echartsMocks.init,
  ECharts: class {},
  EChartsOption: {}
}));

describe("ChartPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state instead of empty state while upstream data is loading", () => {
    const wrapper = mount(ChartPanel, {
      props: {
        title: "模型成本构成",
        option: { series: [] },
        theme: "dark",
        loading: true,
        empty: true
      }
    });

    expect(wrapper.text()).toContain("加载中");
    expect(wrapper.text()).not.toContain("暂无数据");
    expect(echartsMocks.init).not.toHaveBeenCalled();
  });

  it("initializes chart when mounted with data", async () => {
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }) as typeof requestAnimationFrame);
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => undefined);

    const wrapper = mount(ChartPanel, {
      props: {
        title: "模型成本构成",
        option: { series: [{ type: "pie", data: [{ value: 1, name: "gpt-5.4" }] }] },
        theme: "dark",
        loading: false,
        empty: false
      }
    });

    await nextTick();

    expect(echartsMocks.init).toHaveBeenCalledTimes(1);
    expect(echartsMocks.setOption).toHaveBeenCalledTimes(1);
  });
});
