import { execFileSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { EOL } from "node:os";
import { resolve } from "node:path";

export const RELEASE_BUMP_SUBJECT_PREFIX = "chore(release): bump version to ";
export const DEFAULT_EMPTY_MESSAGE = "本次发布无可汇总的提交变更。";
const DEFAULT_HEADER = "## What's Changed";

export function isIgnoredCommitSubject(subject) {
  return typeof subject === "string" && subject.startsWith(RELEASE_BUMP_SUBJECT_PREFIX);
}

export function buildReleaseBody({ commits, repositoryUrl }) {
  const filteredCommits = commits.filter((commit) => !isIgnoredCommitSubject(commit.subject));
  const lines = [DEFAULT_HEADER, ""];

  if (filteredCommits.length === 0) {
    lines.push(`- ${DEFAULT_EMPTY_MESSAGE}`);
    return lines.join("\n");
  }

  for (const commit of filteredCommits) {
    const shortSha = commit.sha.slice(0, 7);
    const commitUrl = `${repositoryUrl}/commit/${commit.sha}`;
    lines.push(`- ${commit.subject} ([${shortSha}](${commitUrl}))`);
  }

  return lines.join("\n");
}

export function parseGitLog(stdout) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha, ...subjectParts] = line.split("\t");
      return {
        sha,
        subject: subjectParts.join("\t"),
      };
    })
    .filter((commit) => commit.sha && commit.subject);
}

export function readCommits({ range, cwd }) {
  const args = ["log", "--no-merges", "--reverse", "--pretty=format:%H%x09%s"];

  if (range) {
    args.push(range);
  }

  const stdout = execFileSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  return parseGitLog(stdout);
}

export function buildReleaseNotesForRange({ range, repositoryUrl, cwd }) {
  const commits = readCommits({ range, cwd });
  return buildReleaseBody({ commits, repositoryUrl });
}

function appendGitHubOutput({ outputPath, name, value }) {
  appendFileSync(outputPath, `${name}<<EOF${EOL}${value}${EOL}EOF${EOL}`);
}

function main() {
  const cwd = process.cwd();
  const range = process.env.RELEASE_NOTES_RANGE?.trim() || "";
  const repository =
    process.env.GITHUB_REPOSITORY?.trim() || "CaiJingLong/yls-code";
  const repositoryUrl = process.env.REPOSITORY_URL?.trim() ||
    `https://github.com/${repository}`;
  const outputPath = process.env.RELEASE_NOTES_OUTPUT_PATH?.trim() || "";

  const body = buildReleaseNotesForRange({
    range,
    repositoryUrl,
    cwd,
  });

  if (outputPath) {
    writeFileSync(resolve(cwd, outputPath), `${body}\n`, "utf8");
  }

  if (process.env.GITHUB_OUTPUT) {
    appendGitHubOutput({
      outputPath: process.env.GITHUB_OUTPUT,
      name: "release_body",
      value: body,
    });
  } else {
    process.stdout.write(`${body}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
