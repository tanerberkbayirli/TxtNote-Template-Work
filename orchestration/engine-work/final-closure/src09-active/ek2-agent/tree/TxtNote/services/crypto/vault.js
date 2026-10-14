/**
 * Vault key + AES-256-GCM. The key is derived from a wallet signature so a
 * future Privy provider can use the same message without exporting a key.
 */

import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { signWalletMessage } from "../wallet/index.js";

export const VAULT_MESSAGE = "TxtNote Vault Key v1 — bu mesajı başka hiçbir uygulamada imzalama";
export const VAULT_INFO = "txtnote-vault-key-v1";
export const VAULT_VERSION = 1;
export const VAULT_ALG = "AES-256-GCM";

let vaultKey = null;

const hexToBytes = (hex) => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("Geçersiz imza.");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const bytesToBase64 = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
};

export const isEncryptedBlob = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      value.v === VAULT_VERSION &&
      value.alg === VAULT_ALG &&
      typeof value.iv === "string" &&
      typeof value.ciphertext === "string",
  );

export async function importVaultKey(signatureHex) {
  const keyBytes = hkdf(sha256, hexToBytes(signatureHex), undefined, VAULT_INFO, 32);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function deriveVaultKey(signMessage = signWalletMessage) {
  const signature = await signMessage(VAULT_MESSAGE);
  return importVaultKey(signature);
}

export async function unlockVault() {
  if (vaultKey) return vaultKey;
  vaultKey = await deriveVaultKey();
  return vaultKey;
}

export function isVaultReady() {
  return vaultKey != null;
}

export function lockVault() {
  vaultKey = null;
}

export async function encryptText(plainText, key = vaultKey) {
  if (!key) throw new Error("Kasa anahtarı yok.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(String(plainText ?? ""));
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    v: VAULT_VERSION,
    alg: VAULT_ALG,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuf)),
  };
}

export async function decryptText(blob, key = vaultKey) {
  if (!key) throw new Error("Kasa anahtarı yok.");
  if (!isEncryptedBlob(blob)) throw new Error("Şifreli kutu okunamadı.");
  const iv = base64ToBytes(blob.iv);
  const cipherBytes = base64ToBytes(blob.ciphertext);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuf);
}
