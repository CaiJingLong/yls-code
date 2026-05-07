import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage.vue";
import { router } from "../router";
import { mountWithApp } from "../test-utils";

const mocks = vi.hoisted(() => ({
  isTauriRuntimeMock: vi.fn(() => true),
  isUpdaterAvailableMock: vi.fn(() => true),
}));

vi.mock("../lib/tauri/runtime", () => ({
  isTauriRuntime: mocks.isTauriRuntimeMock,
}));

vi.mock("../lib/tauri/updater", () => ({
  isUpdaterAvailable: mocks.isUpdaterAvailableMock,
}));

vi.mock("../stores/accounts", () => ({
  accountsStore: {
    state: {
      activeAccountId: "acct-1",
    },
  },
}));

vi.mock("../stores/sync", () => ({
  syncStore: {
    state: {
      status: "idle",
    },
    trigger: vi.fn(),
  },
}));

vi.mock("../stores/preferences", () => ({
  preferencesStore: {
    state: {
      pollingEnabled: true,
      pollingIntervalMs: 15000,
      locale: "zh-CN",
    },
    setPollingEnabled: vi.fn(),
    setPollingIntervalMs: vi.fn(),
    setLocale: vi.fn(),
  },
}));

vi.mock("../stores/update", () => ({
  updateStore: {
    state: {
      checking: false,
      installing: false,
      hasUpdate: false,
      currentVersion: "0.1.9",
      latestVersion: "",
      notes: "",
      message: "",
      error: null,
    },
    check: vi.fn(),
    install: vi.fn(),
  },
}));

vi.mock("../stores/app", () => ({
  appStore: {
    state: {
      version: "0.1.9",
    },
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the current version even when no update is available", () => {
    const wrapper = mountWithApp(SettingsPage, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("当前版本");
    expect(wrapper.text()).toContain("0.1.9");
  });
});
