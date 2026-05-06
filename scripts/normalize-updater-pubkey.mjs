import { Buffer } from "node:buffer";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const BOX_COMMENT_PREFIX = "untrusted comment: minisign public key: ";
const RAW_PUBLIC_KEY_BYTES = 42;

function stripBase64Padding(value) {
  return value.replace(/=+$/u, "");
}

function decodeBase64Strict(value, label) {
  const normalized = value.replace(/\s+/gu, "");
  if (!normalized) {
    throw new Error(`${label} is empty`);
  }

  const decoded = Buffer.from(normalized, "base64");
  const roundTrip = stripBase64Padding(decoded.toString("base64"));
  if (roundTrip !== stripBase64Padding(normalized)) {
    throw new Error(`${label} is not valid base64`);
  }

  return decoded;
}

function formatKeyId(rawPublicKeyBytes) {
  let keyId = 0n;
  for (let index = 0; index < 8; index += 1) {
    keyId |= BigInt(rawPublicKeyBytes[2 + index]) << BigInt(index * 8);
  }

  return keyId.toString(16).toUpperCase().padStart(16, "0");
}

export function normalizeUpdaterPubkey(encodedValue) {
  if (typeof encodedValue !== "string" || encodedValue.trim() === "") {
    throw new Error("TAURI_UPDATER_PUBKEY is required");
  }

  const trimmed = encodedValue.trim();
  const decodedText = decodeBase64Strict(trimmed, "TAURI_UPDATER_PUBKEY").toString("utf8");

  if (decodedText.startsWith(BOX_COMMENT_PREFIX) && decodedText.includes("\n")) {
    return trimmed;
  }

  const rawPublicKey = decodedText.trim();
  const rawPublicKeyBytes = decodeBase64Strict(
    rawPublicKey,
    "decoded updater public key",
  );

  if (rawPublicKeyBytes.length !== RAW_PUBLIC_KEY_BYTES) {
    throw new Error(
      `decoded updater public key must be ${RAW_PUBLIC_KEY_BYTES} bytes, got ${rawPublicKeyBytes.length}`,
    );
  }

  const boxedPublicKey = `${BOX_COMMENT_PREFIX}${formatKeyId(rawPublicKeyBytes)}\n${rawPublicKey}\n`;
  return Buffer.from(boxedPublicKey, "utf8").toString("base64");
}

function main() {
  const normalized = normalizeUpdaterPubkey(process.env.TAURI_UPDATER_PUBKEY ?? "");
  const githubEnvPath = process.env.GITHUB_ENV;

  if (githubEnvPath) {
    appendFileSync(githubEnvPath, `TAURI_UPDATER_PUBKEY=${normalized}\n`);
    return;
  }

  process.stdout.write(`${normalized}\n`);
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
