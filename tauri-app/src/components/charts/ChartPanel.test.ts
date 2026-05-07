import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import ChartPanel from "./ChartPanel.vue";
import { mountWithApp } from "../../test-utils";

const echartsMocks = vi.hoisted(() => {
  const setOption = vi.fn();
  const dispose = vi.fn();
  const resize = vi.fn();
  const init = vi.fn(() => ({
    setOption,
    dispose,
    resize,
  }));

  return { init, setOption, dispose, resize };
});

vi.mock("../../lib/echarts", () => ({
  init: echartsMocks.init,
  ECharts: class {},
  EChartsOption: {},
}));

describe("ChartPanel", () => {
  it("keeps the existing chart visible without showing a loading state while refreshing", async () => {
    echartsMocks.setOption.mockClear();

    const wrapper = mountWithApp(ChartPanel, {
      props: {
        title: "模型成本构成",
        option: { series: [{ type: "pie", data: [{ value: 1, name: "gpt-5.4" }] }] },
        loading: false,
        empty: false,
      },
    });

    await nextTick();
    expect(wrapper.find(".chart-root").exists()).toBe(true);

    await wrapper.setProps({
      loading: true,
      empty: false,
      option: { series: [{ type: "pie", data: [{ value: 2, name: "gpt-5.4-mini" }] }] },
    });
    await nextTick();

    expect(wrapper.find(".chart-root").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("图表加载中");
    expect(echartsMocks.setOption).toHaveBeenCalled();
  });
});
