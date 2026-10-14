/**
 * Wallet / key-management seam. Callers depend on this file, not on Privy
 * or the local keyring implementation. Replace the provider later with:
 *
 *   setWalletProvider(privyWalletProvider)
 */

import { localKeyringWalletProvider } from "./localKeyring.js";

let provider = localKeyringWalletProvider;

export function setWalletProvider(next) {
  if (!next || typeof next.ensure !== "function" || typeof next.signMessage !== "function") {
    throw new Error("Geçersiz cüzdan sağlayıcısı.");
  }
  provider = next;
}

export function getWalletProvider() {
  return provider;
}

export async function bootstrapWallet() {
  return provider.ensure();
}

export async function getWalletAddress() {
  return provider.getAddress();
}

export async function getWalletPublicKey() {
  await provider.ensure();
  if (typeof provider.getPublicKey === "function") {
    return provider.getPublicKey();
  }
  throw new Error("Bu cüzdan sağlayıcısı public key döndürmüyor.");
}

export function isDurableWallet() {
  return typeof provider.isDurable === "function" ? provider.isDurable() : false;
}

export async function signWalletMessage(message) {
  return provider.signMessage(message);
}

/**
 * Temporary: returns the in-memory secp256k1 secret so the test export can
 * embed it in a decrypt-verification header. Production backup must not call this.
 */
export async function exportWalletSecretForTest() {
  if (typeof provider.exportSecretForTest !== "function") {
    throw new Error("Bu cüzdan sağlayıcısı test dışa aktarmayı desteklemiyor.");
  }
  await provider.ensure();
  return provider.exportSecretForTest();
}

/** Temporary: swaps the device wallet for a pasted key during the E2E lab. */
export async function importWalletSecretForTest(privateKey) {
  if (typeof provider.importSecretForTest !== "function") {
    throw new Error("Bu cüzdan sağlayıcısı anahtar içe aktarmayı desteklemiyor.");
  }
  return provider.importSecretForTest(privateKey);
}

export { LOCAL_KEYRING_PROVIDER_ID, MEMORY_PROVIDER_ID, WALLET_SECRET_ACCOUNT } from "./localKeyring.js";
