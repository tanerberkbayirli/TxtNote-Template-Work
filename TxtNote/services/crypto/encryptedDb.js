/**
 * AES-256-GCM export box for a SQLite snapshot, keyed from the wallet secret.
 *
 * The secp256k1 private key is HKDF'd into a 32-byte AES key (it is not used
 * as the raw cipher key). Test exports may embed the private key in `headers`
 * so a round-trip decrypt can be verified without the OS keychain.
 */

import { privateKeyToAccount } from "viem/accounts";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { decryptText, encryptText, isEncryptedBlob } from "./vault.js";

export const DB_EXPORT_KIND = "txtnote-encrypted-db";
export const DB_EXPORT_VERSION = 1;
export const DB_EXPORT_ALG = "AES-256-GCM";
export const DB_EXPORT_INFO = "txtnote-encrypted-db-v1";

const isPrivateKey = (value) =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);

const hexToBytes = (hex) => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("Geçersiz anahtar.");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

export function keyPairFromPrivateKey(privateKeyHex) {
  if (!isPrivateKey(privateKeyHex)) throw new Error("Geçersiz private key.");
  const account = privateKeyToAccount(privateKeyHex);
  return {
    privateKey: privateKeyHex,
    publicKey: account.publicKey,
    walletAddress: account.address,
  };
}

export function assertKeyPairMatches(privateKeyHex, { walletAddress, publicKey } = {}) {
  const pair = keyPairFromPrivateKey(privateKeyHex);
  if (
    walletAddress &&
    String(walletAddress).toLowerCase() !== pair.walletAddress.toLowerCase()
  ) {
    throw new Error("Private key bu cüzdan adresine ait değil.");
  }
  if (publicKey && String(publicKey).toLowerCase() !== pair.publicKey.toLowerCase()) {
    throw new Error("Private key bu public key ile eşleşmiyor.");
  }
  return pair;
}

export async function deriveDbExportKey(privateKeyHex) {
  if (!isPrivateKey(privateKeyHex)) throw new Error("Geçersiz private key.");
  const keyBytes = hkdf(sha256, hexToBytes(privateKeyHex), undefined, DB_EXPORT_INFO, 32);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptDatabaseSnapshot(
  snapshot,
  { privateKey, walletAddress, publicKey, testEmbedPrivateKey = true } = {},
) {
  const pair = assertKeyPairMatches(privateKey, { walletAddress, publicKey });
  const key = await deriveDbExportKey(pair.privateKey);
  const blob = await encryptText(JSON.stringify(snapshot ?? {}), key);
  const headers = {
    alg: DB_EXPORT_ALG,
    walletAddress: pair.walletAddress,
    publicKey: pair.publicKey,
    createdAt: Date.now(),
    testMode: Boolean(testEmbedPrivateKey),
  };
  if (testEmbedPrivateKey) {
    headers.testPrivateKey = pair.privateKey;
    headers.testNote =
      "Geçici test yükü — private key yalnızca decrypt doğrulaması için gömülüdür. Kalıcı yedekte bulunmamalı.";
  }
  return {
    v: DB_EXPORT_VERSION,
    kind: DB_EXPORT_KIND,
    headers,
    iv: blob.iv,
    ciphertext: blob.ciphertext,
  };
}

const asVaultBlob = (pkg) => ({
  v: 1,
  alg: DB_EXPORT_ALG,
  iv: pkg?.iv,
  ciphertext: pkg?.ciphertext,
});

export function exportContainsPlaintext(pkg, needle) {
  if (!needle) return false;
  const copy = {
    ...pkg,
    headers: pkg?.headers ? { ...pkg.headers, testPrivateKey: undefined } : pkg?.headers,
  };
  return JSON.stringify(copy).includes(needle);
}

export async function decryptDatabaseSnapshot(pkg, privateKey = pkg?.headers?.testPrivateKey) {
  if (!pkg || pkg.kind !== DB_EXPORT_KIND) throw new Error("Şifreli yedek okunamadı.");
  if (!privateKey) throw new Error("Çözme anahtarı yok.");
  assertKeyPairMatches(privateKey, {
    walletAddress: pkg.headers?.walletAddress,
    publicKey: pkg.headers?.publicKey,
  });
  const blob = asVaultBlob(pkg);
  if (!isEncryptedBlob(blob)) throw new Error("Şifreli kutu okunamadı.");
  const key = await deriveDbExportKey(privateKey);
  return JSON.parse(await decryptText(blob, key));
}

export async function verifyEncryptedDbRoundtrip(pkg, snapshot) {
  const opened = await decryptDatabaseSnapshot(pkg);
  return JSON.stringify(opened) === JSON.stringify(snapshot);
}
