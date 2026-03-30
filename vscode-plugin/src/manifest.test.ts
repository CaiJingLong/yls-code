import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import manifest from "../package.json";

describe("extension manifest", () => {
  it("declares dashboard view as a webview", () => {
    const contributedViews = manifest.contributes.views.ylsCode;
    const dashboardView = contributedViews.find((view) => view.id === "ylsCode.dashboardView");

    expect(dashboardView).toBeDefined();
    expect(dashboardView?.type).toBe("webview");
  });

  it("declares a script to install the packaged VSIX from the command line", () => {
    expect(manifest.scripts["install:vsix"]).toBeDefined();
  });

  it("defaults log page size to 500", () => {
    expect(manifest.contributes.configuration.properties["ylsCode.pageSize"].default).toBe(500);
  });

  it("allows page size up to 1000", () => {
    expect(manifest.contributes.configuration.properties["ylsCode.pageSize"].maximum).toBe(1000);
  });

  it("uses the official logo for extension and activity bar icons", () => {
    expect(manifest.icon).toBe("resources/logo2.png");
    expect(manifest.contributes.viewsContainers.activitybar[0].icon).toBe("resources/activity.svg");
  });

  it("uses a simple path-based activity icon", () => {
    const iconPath = path.resolve(__dirname, "..", "resources", "activity.svg");
    const content = fs.readFileSync(iconPath, "utf8");

    expect(content).toContain("<path");
    expect(content).not.toContain("<rect");
  });
});
