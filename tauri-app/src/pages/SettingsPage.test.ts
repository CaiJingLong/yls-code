import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage.vue";
import { router } from "../router";
import { mountWithApp } from "../test-utils";

const mocks = vi.hoisted(() => ({
  isTauriRuntimeMock: vi.fn(() => true),
  isUpdaterAvailableMock: vi.fn(() => true),
  updateState: {
    checking: false,
    installing: false,
    hasUpdate: false,
    currentVersion: "0.1.9",
    latestVersion: "",
    notes: "",
    message: "",
    error: null as string | null,
  },
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
    state: mocks.updateState,
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
    Object.assign(mocks.updateState, {
      checking: false,
      installing: false,
      hasUpdate: false,
      currentVersion: "0.1.9",
      latestVersion: "",
      notes: "",
      message: "",
      error: null,
    });
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

  it("renders release notes as markdown when an update is available", () => {
    Object.assign(mocks.updateState, {
      hasUpdate: true,
      latestVersion: "0.1.12",
      notes: "## What's Changed\n\n- feat: add markdown release notes\n- ci: publish draft release",
    });

    const wrapper = mountWithApp(SettingsPage, {
      global: {
        plugins: [router],
      },
    });

    const notes = wrapper.get(".update-notes");
    expect(notes.html()).toContain("<h2");
    expect(notes.html()).toContain("<ul>");
    expect(notes.text()).toContain("feat: add markdown release notes");
    expect(notes.text()).not.toContain("## What's Changed");
  });
});
