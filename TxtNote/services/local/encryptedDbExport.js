/**
 * Temporary test export: AES-256 wrap of the on-disk SQLite snapshot,
 * written to the user Desktop. The private key is embedded in headers
 * only while TEST_EMBED_PRIVATE_KEY is true.
 */

import { privateKeyToAccount } from "viem/accounts";
import {
  decryptDatabaseSnapshot,
  encryptDatabaseSnapshot,
  verifyEncryptedDbRoundtrip,
} from "../crypto/encryptedDb.js";
import { decryptText, deriveVaultKey, isEncryptedBlob } from "../crypto/vault.js";
import { exportWalletSecretForTest, getWalletAddress } from "../wallet/index.js";
import { bindDatabaseOwner } from "./dbOwner.js";

export const TEST_EMBED_PRIVATE_KEY = true;

const LS_SNAPSHOT = "txtnote.disk.snapshot.v1";

const isTauri = () => {
  if (typeof window === "undefined") return false;
  const w = window;
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
};

const invoke = async (command, args) => {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke(command, args);
};

const emptySnapshot = () => ({
  workspaces: [],
  items: [],
  trash: [],
  notes: {},
  trashEnabled: true,
  session: {},
  profile: {},
});

export const loadDiskSnapshot = async () => {
  if (isTauri()) {
    return invoke("load_snapshot");
  }
  if (typeof window === "undefined") return emptySnapshot();
  try {
    const raw = window.localStorage.getItem(LS_SNAPSHOT);
    return raw ? JSON.parse(raw) : emptySnapshot();
  } catch {
    return emptySnapshot();
  }
};

const fileStamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

export const encryptedDbFileName = (stamp = fileStamp()) =>
  `txtnote-encrypted-db-${stamp}.json`;

export async function writeDesktopFile(fileName, contents) {
  if (isTauri()) {
    return invoke("write_desktop_file", { fileName, contents });
  }
  if (typeof document === "undefined") {
    throw new Error("Masaüstü yazımı yalnızca masaüstü uygulamasında kullanılabilir.");
  }
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
}

export async function verifyVaultUnlocksWithPrivateKey(snapshot, privateKey) {
  const notes = snapshot?.notes && typeof snapshot.notes === "object" ? snapshot.notes : {};
  const account = privateKeyToAccount(privateKey);
  const vaultKey = await deriveVaultKey((message) => account.signMessage({ message }));
  let verified = false;
  for (const note of Object.values(notes)) {
    if (note && typeof note === "object" && isEncryptedBlob(note.vault)) {
      await decryptText(note.vault, vaultKey);
      verified = true;
    }
  }
  return verified;
}

export async function buildEncryptedDbFile({
  snapshot,
  privateKey,
  walletAddress,
  publicKey,
  dbOwner,
  embedTestKey = TEST_EMBED_PRIVATE_KEY,
} = {}) {
  const payload = {
    ...(snapshot ?? {}),
    dbOwner: dbOwner ?? snapshot?.dbOwner ?? null,
  };
  const pkg = await encryptDatabaseSnapshot(payload, {
    privateKey,
    walletAddress,
    publicKey,
    testEmbedPrivateKey: embedTestKey,
  });
  const verified = await verifyEncryptedDbRoundtrip(pkg, payload);
  if (!verified) throw new Error("Şifreli yedek, gömülen anahtarla çözülemedi.");
  const opened = await decryptDatabaseSnapshot(pkg);
  const vaultVerified = await verifyVaultUnlocksWithPrivateKey(opened, privateKey);
  return { pkg, verified, vaultVerified, payload };
}

export async function exportEncryptedDatabaseToDesktop() {
  const owner = await bindDatabaseOwner();
  const walletAddress = owner?.walletAddress ?? (await getWalletAddress());
  const privateKey = await exportWalletSecretForTest();
  const snapshot = await loadDiskSnapshot();
  const { pkg, verified, vaultVerified } = await buildEncryptedDbFile({
    snapshot,
    privateKey,
    walletAddress,
    publicKey: owner?.publicKey,
    dbOwner: owner,
  });
  const fileName = encryptedDbFileName();
  const path = await writeDesktopFile(fileName, JSON.stringify(pkg, null, 2));
  return {
    path,
    fileName,
    verified,
    vaultVerified,
    walletAddress,
    publicKey: pkg.headers.publicKey,
    testMode: TEST_EMBED_PRIVATE_KEY,
    noteCount: Object.keys(snapshot?.notes ?? {}).length,
  };
}
