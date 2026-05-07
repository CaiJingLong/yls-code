import test from "node:test";
import assert from "node:assert/strict";

const moduleUnderTest = await import("./generate-release-notes.mjs").catch(() => ({}));
const {
  DEFAULT_EMPTY_MESSAGE,
  RELEASE_BUMP_SUBJECT_PREFIX,
  buildReleaseBody,
  isIgnoredCommitSubject,
} = moduleUnderTest;

test("filters the automated release bump commit subject", () => {
  assert.equal(typeof isIgnoredCommitSubject, "function");
  assert.equal(
    isIgnoredCommitSubject("chore(release): bump version to 1.2.3"),
    true,
  );
  assert.equal(isIgnoredCommitSubject("feat: add compact token formatting"), false);
});

test("builds release notes from commit subjects and links", () => {
  assert.equal(typeof buildReleaseBody, "function");
  assert.equal(RELEASE_BUMP_SUBJECT_PREFIX, "chore(release): bump version to ");

  const body = buildReleaseBody({
    commits: [
      {
        sha: "109112d",
        subject: "feat: 新增 token 紧凑格式化工具并统一前端展示",
      },
      {
        sha: "c2359e5",
        subject: "chore(release): bump version to 0.1.12",
      },
      {
        sha: "f98afd0",
        subject: "ci: 将 Release 改为草稿模式并在校验通过后发布",
      },
    ],
    repositoryUrl: "https://github.com/CaiJingLong/yls-code",
  });

  assert.equal(
    body,
    [
      "## What's Changed",
      "",
      "- feat: 新增 token 紧凑格式化工具并统一前端展示 ([109112d](https://github.com/CaiJingLong/yls-code/commit/109112d))",
      "- ci: 将 Release 改为草稿模式并在校验通过后发布 ([f98afd0](https://github.com/CaiJingLong/yls-code/commit/f98afd0))",
    ].join("\n"),
  );
});

test("falls back to a default message when all commits are ignored", () => {
  const body = buildReleaseBody({
    commits: [
      {
        sha: "c2359e5",
        subject: "chore(release): bump version to 0.1.12",
      },
    ],
    repositoryUrl: "https://github.com/CaiJingLong/yls-code",
  });

  assert.equal(
    body,
    [
      "## What's Changed",
      "",
      `- ${DEFAULT_EMPTY_MESSAGE}`,
    ].join("\n"),
  );
});
