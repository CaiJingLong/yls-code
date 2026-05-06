import { describe, expect, it } from "vitest";

import { LocalStorageStore } from "./localStorageStore";

describe("LocalStorageStore", () => {
  it("loads defaults when the key is missing or invalid", () => {
    const storage = new LocalStorageStore("missing-key", { search: "", pageSize: 50 });

    expect(storage.load()).toEqual({ search: "", pageSize: 50 });

    localStorage.setItem("invalid-key", "{bad json");
    const invalid = new LocalStorageStore("invalid-key", { granularity: "hour" });
    expect(invalid.load()).toEqual({ granularity: "hour" });
  });

  it("persists and merges stored values with defaults", () => {
    const storage = new LocalStorageStore("filters-key", {
      search: "",
      model: "",
      pageSize: 50,
    });

    storage.save({ search: "gpt", model: "gpt-5.4" });

    expect(storage.load()).toEqual({
      search: "gpt",
      model: "gpt-5.4",
      pageSize: 50,
    });
  });
});
