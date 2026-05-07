import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function normalizeVersion(version) {
  return String(version ?? "").replace(/^v/u, "");
}

function getAssetNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/");
    return decodeURIComponent(segments.at(-1) ?? "");
  } catch {
    return "";
  }
}

export function validateReleaseReadiness({ release, latestMetadata }) {
  const errors = [];
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const assetNames = new Set(
    assets
      .map((asset) => asset?.name)
      .filter((name) => typeof name === "string" && name.length > 0),
  );

  if (!assetNames.has("latest.json")) {
    errors.push("release is missing latest.json asset");
  }

  const releaseVersion = normalizeVersion(release?.tag_name);
  const metadataVersion = normalizeVersion(latestMetadata?.version);

  if (!metadataVersion) {
    errors.push("latest.json is missing version");
  } else if (releaseVersion && releaseVersion !== metadataVersion) {
    errors.push(
      `latest.json version ${latestMetadata.version} does not match release tag ${release.tag_name}`,
    );
  }

  const platforms = latestMetadata?.platforms;
  if (!platforms || typeof platforms !== "object") {
    errors.push("latest.json is missing platforms metadata");
    return errors;
  }

  for (const [platformName, platform] of Object.entries(platforms)) {
    const url = typeof platform?.url === "string" ? platform.url : "";
    const signature = typeof platform?.signature === "string" ? platform.signature : "";

    if (!url) {
      errors.push(`platform ${platformName} is missing url`);
      continue;
    }

    if (!signature) {
      errors.push(`platform ${platformName} is missing signature`);
    }

    const assetName = getAssetNameFromUrl(url);
    if (!assetName) {
      errors.push(`platform ${platformName} has invalid asset url ${url}`);
      continue;
    }

    if (!assetNames.has(assetName)) {
      errors.push(`platform ${platformName} references missing asset ${assetName}`);
    }
  }

  return errors;
}

function main() {
  const releasePath = process.env.RELEASE_JSON_PATH;
  const latestJsonPath = process.env.LATEST_JSON_PATH;

  if (!releasePath || !latestJsonPath) {
    throw new Error("RELEASE_JSON_PATH and LATEST_JSON_PATH are required");
  }

  const release = JSON.parse(readFileSync(resolve(releasePath), "utf8"));
  const latestMetadata = JSON.parse(readFileSync(resolve(latestJsonPath), "utf8"));
  const errors = validateReleaseReadiness({ release, latestMetadata });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
