/**
 * Binds the local SQLite (or browser mirror) to the active wallet.
 * Ownership is the checksummed public address, the secp256k1 public key,
 * and a signature proving the matching private key was present when the
 * row was written.
 */

import { recoverMessageAddress } from "viem";
import {
  getWalletAddress,
  getWalletPublicKey,
  getWalletProvider,
  signWalletMessage,
  LOCAL_KEYRING_PROVIDER_ID,
  MEMORY_PROVIDER_ID,
} from "../wallet/index.js";

export const DB_OWNER_KV_KEY = "db_owner";
export const DB_OWNER_MESSAGE_PREFIX = "TxtNote DB Owner v1 — ";
const LS_OWNER = "txtnote.db.owner.v1";

const isTauri = () => {
  if (typeof window === "undefined") return false;
  const w = window;
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
};

const invoke = async (command, args) => {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke(command, args);
};

const isWalletAddress = (value) =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

const sameAddress = (left, right) =>
  Boolean(left && right && String(left).toLowerCase() === String(right).toLowerCase());

export const ownerBindingMessage = (walletAddress) =>
  `${DB_OWNER_MESSAGE_PREFIX}${walletAddress}`;

export function assertOwnerMatches(owner, walletAddress) {
  if (!owner?.walletAddress) return owner;
  if (!sameAddress(owner.walletAddress, walletAddress)) {
    throw new Error("Bu veritabanı başka bir cüzdana bağlı.");
  }
  return owner;
}

/** Local keyring is the only wallet on this device; it may replace a stale owner row. */
export function canAdoptLocalOwner(providerId = getWalletProvider()?.id) {
  return providerId === LOCAL_KEYRING_PROVIDER_ID || providerId === MEMORY_PROVIDER_ID;
}

export async function verifyOwnershipProof(owner) {
  if (!owner?.walletAddress || !owner?.ownershipProof) return owner;
  const recovered = await recoverMessageAddress({
    message: ownerBindingMessage(owner.walletAddress),
    signature: owner.ownershipProof,
  });
  if (!sameAddress(recovered, owner.walletAddress)) {
    throw new Error("Veritabanı sahiplik imzası doğrulanamadı.");
  }
  return owner;
}

const readBrowserOwner = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_OWNER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeBrowserOwner = (owner) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_OWNER, JSON.stringify(owner));
};

export async function loadDbOwner() {
  if (isTauri()) {
    const owner = await invoke("load_db_owner");
    return owner && typeof owner === "object" ? owner : null;
  }
  return readBrowserOwner();
}

export async function bindDatabaseOwner() {
  const walletAddress = await getWalletAddress();
  if (!isWalletAddress(walletAddress)) {
    throw new Error("Cüzdan adresi yok.");
  }

  const existing = await loadDbOwner();
  const mismatched = Boolean(
    existing?.walletAddress && !sameAddress(existing.walletAddress, walletAddress),
  );

  if (mismatched && !canAdoptLocalOwner()) {
    throw new Error("Bu veritabanı başka bir cüzdana bağlı.");
  }

  if (!mismatched && existing?.walletAddress) {
    if (existing.ownershipProof) {
      await verifyOwnershipProof(existing);
      if (existing.publicKey) return existing;
    }
  }

  const ownershipProof = await signWalletMessage(ownerBindingMessage(walletAddress));
  const publicKey = await getWalletPublicKey();
  const owner = {
    walletAddress,
    publicKey,
    walletProvider: getWalletProvider()?.id ?? LOCAL_KEYRING_PROVIDER_ID,
    boundAt: Date.now(),
    ownershipProof,
    ...(mismatched ? { replace: true } : {}),
  };
  await verifyOwnershipProof(owner);

  if (isTauri()) {
    return invoke("bind_db_owner", { owner });
  }
  writeBrowserOwner(owner);
  return owner;
}
