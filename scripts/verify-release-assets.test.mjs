import test from "node:test";
import assert from "node:assert/strict";

const moduleUnderTest = await import("./verify-release-assets.mjs").catch(() => ({}));
const { validateReleaseReadiness } = moduleUnderTest;

test("flags a release when latest.json is missing", () => {
  assert.equal(typeof validateReleaseReadiness, "function");

  const errors = validateReleaseReadiness({
    release: {
      tag_name: "v1.2.3",
      assets: [
        { name: "yls-code_1.2.3_aarch64.dmg" },
        { name: "yls-code_aarch64.app.tar.gz" },
        { name: "yls-code_aarch64.app.tar.gz.sig" },
      ],
    },
    latestMetadata: {
      version: "1.2.3",
      platforms: {
        "darwin-aarch64": {
          url: "https://github.com/CaiJingLong/yls-code/releases/download/v1.2.3/yls-code_aarch64.app.tar.gz",
          signature: "sig",
        },
      },
    },
  });

  assert.deepEqual(errors, ["release is missing latest.json asset"]);
});

test("flags a release when latest.json version does not match the release tag", () => {
  const errors = validateReleaseReadiness({
    release: {
      tag_name: "v1.2.3",
      assets: [
        { name: "latest.json" },
        { name: "yls-code_aarch64.app.tar.gz" },
      ],
    },
    latestMetadata: {
      version: "1.2.4",
      platforms: {
        "darwin-aarch64": {
          url: "https://github.com/CaiJingLong/yls-code/releases/download/v1.2.3/yls-code_aarch64.app.tar.gz",
          signature: "sig",
        },
      },
    },
  });

  assert.deepEqual(errors, [
    "latest.json version 1.2.4 does not match release tag v1.2.3",
  ]);
});

test("accepts a release when latest.json matches uploaded assets", () => {
  const errors = validateReleaseReadiness({
    release: {
      tag_name: "v1.2.3",
      assets: [
        { name: "latest.json" },
        { name: "yls-code_aarch64.app.tar.gz" },
        { name: "yls-code_1.2.3_x86-setup.exe" },
      ],
    },
    latestMetadata: {
      version: "1.2.3",
      platforms: {
        "darwin-aarch64": {
          url: "https://github.com/CaiJingLong/yls-code/releases/download/v1.2.3/yls-code_aarch64.app.tar.gz",
          signature: "sig-a",
        },
        "windows-i686": {
          url: "https://github.com/CaiJingLong/yls-code/releases/download/v1.2.3/yls-code_1.2.3_x86-setup.exe",
          signature: "sig-b",
        },
      },
    },
  });

  assert.deepEqual(errors, []);
});
