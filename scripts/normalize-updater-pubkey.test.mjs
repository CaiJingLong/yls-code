import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";

import { normalizeUpdaterPubkey } from "./normalize-updater-pubkey.mjs";

const rawPublicKeyBytes = Buffer.from([
  0x45, 0x64,
  0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
  0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
  0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27,
  0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
]);

const rawPublicKey = rawPublicKeyBytes.toString("base64");
const boxedPublicKey =
  "untrusted comment: minisign public key: 0102030405060708\n" +
  `${rawPublicKey}\n`;

test("normalizes a base64 encoded raw minisign public key", () => {
  const encodedRawPublicKey = Buffer.from(rawPublicKey, "utf8").toString("base64");
  const normalized = normalizeUpdaterPubkey(encodedRawPublicKey);

  assert.equal(normalized, Buffer.from(boxedPublicKey, "utf8").toString("base64"));
});

test("keeps a boxed updater public key unchanged", () => {
  const encodedBoxedPublicKey = Buffer.from(boxedPublicKey, "utf8").toString("base64");

  assert.equal(normalizeUpdaterPubkey(encodedBoxedPublicKey), encodedBoxedPublicKey);
});

test("rejects invalid base64 input", () => {
  assert.throws(
    () => normalizeUpdaterPubkey("not-base64"),
    /TAURI_UPDATER_PUBKEY is not valid base64/u,
  );
});
