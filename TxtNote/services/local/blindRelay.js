/**
 * Temporary E2E lab: Device A encrypts the SQLite snapshot with the wallet
 * private key, a "blind server" holds only ciphertext, Device B (same key,
 * as if another signed-in device) decrypts it. No real network yet.
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  decryptDatabaseSnapshot,
  encryptDatabaseSnapshot,
  exportContainsPlaintext,
} from "../crypto/encryptedDb.js";
import { clearSealedCache } from "../crypto/envelope.js";
import {
  decryptText,
  deriveVaultKey,
  encryptText,
  isEncryptedBlob,
  lockVault,
  unlockVault,
} from "../crypto/vault.js";
import {
  exportWalletSecretForTest,
  getWalletAddress,
  importWalletSecretForTest,
} from "../wallet/index.js";
import { bindDatabaseOwner } from "./dbOwner.js";
import {
  encryptedDbFileName,
  loadDiskSnapshot,
  verifyVaultUnlocksWithPrivateKey,
  writeDesktopFile,
} from "./encryptedDbExport.js";

const isTauri = () => {
  if (typeof window === "undefined") return false;
  const w = window;
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
};

const invoke = async (command, args) => {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke(command, args);
};

const isPrivateKey = (value) =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);

/** Accepts a pasted key with or without 0x, surrounding whitespace, or the whole .txt. */
export const normalizePastedPrivateKey = (raw) => {
  const text = String(raw ?? "");
  const match = text.match(/0x[0-9a-fA-F]{64}/);
  if (match) return match[0];
  const bare = text.trim().match(/^[0-9a-fA-F]{64}$/);
  return bare ? `0x${bare[0]}` : "";
};

export const privateKeyFileName = (stamp) => `txtnote-private-key-${stamp}.txt`;

export const privateKeyFileContents = ({ privateKey, walletAddress, encryptedFileName }) =>
  [
    "TxtNote — GEÇİCİ TEST ANAHTARI",
    "Bu dosya yalnızca uçtan uca şifreleme testi içindir. Test bitince sil.",
    "",
    `Cüzdan adresi : ${walletAddress}`,
    `Şifreli dosya : ${encryptedFileName}`,
    "",
    "PRIVATE KEY (5. adımda bu satırı kopyala):",
    privateKey,
    "",
  ].join("\r\n");

/** Last package the blind server would store. Lives in this process only. */
let lastBlindPackage = null;

export const getLastBlindPackage = () => lastBlindPackage;

export const rememberBlindPackage = (pkg) => {
  lastBlindPackage = pkg ?? null;
  return lastBlindPackage;
};

const asServerPackage = (pkg) => {
  const headers = { ...(pkg?.headers ?? {}) };
  delete headers.testPrivateKey;
  delete headers.testNote;
  headers.testMode = false;
  return {
    v: pkg.v,
    kind: pkg.kind,
    headers,
    iv: pkg.iv,
    ciphertext: pkg.ciphertext,
  };
};

const collectNoteNeedles = (snapshot) => {
  const out = [];
  const notes = snapshot?.notes && typeof snapshot.notes === "object" ? snapshot.notes : {};
  for (const note of Object.values(notes)) {
    if (!note || typeof note !== "object") continue;
    for (const value of [note.title, note.content]) {
      if (typeof value === "string" && value.trim().length >= 6) out.push(value.trim());
    }
  }
  return out;
};

const previewText = (value, max = 140) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

export async function previewNotesWithPrivateKey(snapshot, privateKey) {
  const notes = snapshot?.notes && typeof snapshot.notes === "object" ? snapshot.notes : {};
  const account = privateKeyToAccount(privateKey);
  const vaultKey = await deriveVaultKey((message) => account.signMessage({ message }));
  const opened = [];
  for (const [id, note] of Object.entries(notes)) {
    if (!note || typeof note !== "object") continue;
    let title = typeof note.title === "string" ? note.title : "";
    let content = typeof note.content === "string" ? note.content : "";
    let vaultOpened = false;
    if (isEncryptedBlob(note.vault)) {
      try {
        const parsed = JSON.parse(await decryptText(note.vault, vaultKey));
        title = parsed.title || title;
        content = parsed.content || content;
        vaultOpened = true;
      } catch {
        vaultOpened = false;
      }
    }
    opened.push({
      id,
      title: title || "Adsız not",
      contentPreview: previewText(content),
      vaultOpened,
    });
  }
  return opened;
}

export async function sealBlindServerPackage({
  snapshot,
  privateKey,
  walletAddress,
  publicKey,
  dbOwner,
} = {}) {
  const payload = {
    ...(snapshot ?? {}),
    dbOwner: dbOwner ?? snapshot?.dbOwner ?? null,
  };
  const sealed = await encryptDatabaseSnapshot(payload, {
    privateKey,
    walletAddress,
    publicKey,
    testEmbedPrivateKey: false,
  });
  const serverPackage = asServerPackage(sealed);
  const needles = collectNoteNeedles(payload);
  const plaintextLeaked = needles.some((needle) => exportContainsPlaintext(serverPackage, needle));
  return {
    serverPackage,
    payload,
    plaintextLeaked,
    serverSeesPrivateKey: Boolean(serverPackage.headers?.testPrivateKey),
  };
}

export async function openBlindServerPackage(serverPackage, privateKey, { tryWrongKey = true } = {}) {
  if (!serverPackage) throw new Error("Kör sunucuda paket yok.");
  const opened = await decryptDatabaseSnapshot(serverPackage, privateKey);
  const notes = await previewNotesWithPrivateKey(opened, privateKey);
  let wrongKeyRejected = false;
  if (tryWrongKey) {
    try {
      await decryptDatabaseSnapshot(serverPackage, generatePrivateKey());
      wrongKeyRejected = false;
    } catch {
      wrongKeyRejected = true;
    }
  }
  return {
    snapshot: opened,
    notes,
    workspaceNames: Array.isArray(opened?.workspaces)
      ? opened.workspaces.map((row) => row?.name).filter(Boolean)
      : [],
    ownerAddress: opened?.dbOwner?.walletAddress ?? null,
    wrongKeyRejected,
  };
}

export async function sendSnapshotToBlindServer() {
  const owner = await bindDatabaseOwner();
  const walletAddress = owner?.walletAddress ?? (await getWalletAddress());
  const privateKey = await exportWalletSecretForTest();
  const snapshot = await loadDiskSnapshot();
  await verifyVaultUnlocksWithPrivateKey(snapshot, privateKey);
  const { serverPackage, plaintextLeaked, serverSeesPrivateKey } = await sealBlindServerPackage({
    snapshot,
    privateKey,
    walletAddress,
    publicKey: owner?.publicKey,
    dbOwner: owner,
  });
  rememberBlindPackage(serverPackage);
  const stamp = fileStampNow();
  const fileName = encryptedDbFileName(stamp);
  const path = await writeDesktopFile(fileName, JSON.stringify(serverPackage, null, 2));
  const keyFileName = privateKeyFileName(stamp);
  const keyPath = await writeDesktopFile(
    keyFileName,
    privateKeyFileContents({ privateKey, walletAddress, encryptedFileName: fileName }),
  );
  return {
    path,
    fileName,
    keyPath,
    keyFileName,
    walletAddress,
    noteCount: Object.keys(snapshot?.notes ?? {}).length,
    workspaceCount: Array.isArray(snapshot?.workspaces) ? snapshot.workspaces.length : 0,
    serverSeesPrivateKey,
    plaintextLeaked,
    ciphertextPreview: String(serverPackage.ciphertext ?? "").slice(0, 96),
    alg: serverPackage.headers?.alg ?? "AES-256-GCM",
  };
}

const fileStampNow = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const LS_KEYS_TO_DROP = [
  "txtnote.disk.snapshot.v1",
  "txtnote.disk.versions.v1",
  "txtnote.db.owner.v1",
];
const IDB_TO_DROP = ["txtnote-local-db", "txtnote-local-backup"];

const dropIndexedDb = (name) =>
  new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve();
    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });

/**
 * Step 4 — "artık temiz": every row in SQLite, every media file and browser
 * mirrors. Keep the device's private key and auth session so
 * the app lands back on the Profile screen for step 5.
 */
export async function wipeDeviceData() {
  if (isTauri()) {
    await invoke("wipe_local_database");
  }
  if (typeof window !== "undefined") {
    try {
      LS_KEYS_TO_DROP.forEach((key) => window.localStorage.removeItem(key));
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith("txtnote.localNote.")) window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    await Promise.all(IDB_TO_DROP.map(dropIndexedDb));
  }
  lockVault();
  clearSealedCache();
  rememberBlindPackage(null);
  return { wiped: true };
}

/**
 * Step 5 — "tekrar hoş geldiniz": paste the private key from the .txt, pick
 * the encrypted .json, decrypt, adopt the key as this device's wallet and
 * write the snapshot back into SQLite.
 */
export async function restoreFromEncryptedPackage({ pkg, privateKey: rawKey } = {}) {
  const privateKey = normalizePastedPrivateKey(rawKey);
  if (!isPrivateKey(privateKey)) {
    throw new Error("Private key okunamadı. .txt dosyasındaki 0x ile başlayan satırı yapıştır.");
  }
  if (!pkg || typeof pkg !== "object") {
    throw new Error("Şifreli .json dosyası seçilmedi.");
  }

  const opened = await openBlindServerPackage(pkg, privateKey, { tryWrongKey: true });
  const snapshot = { ...opened.snapshot };
  const restoredOwner = snapshot.dbOwner ?? null;
  delete snapshot.dbOwner;

  // Validate every inner vault before changing the wallet or writing any data.
  // Legacy plaintext notes are encrypted with the same recovered key as well.
  const account = privateKeyToAccount(privateKey);
  const key = await deriveVaultKey((message) => account.signMessage({ message }));
  const notes = {};
  for (const [id, note] of Object.entries(snapshot.notes ?? {})) {
    if (!note || typeof note !== "object") throw new Error("Geçersiz not kaydı.");
    if (isEncryptedBlob(note.vault)) {
      try {
        JSON.parse(await decryptText(note.vault, key));
      } catch {
        throw new Error("Paketteki notların tamamı bu private key ile açılamıyor.");
      }
      notes[id] = { ...note, walletAddress: account.address };
    } else {
      const { title = "", content = "", todos = [], entries = {}, mindmap = { nodes: [], edges: [] }, researchData, todoDaily, todoPlan, ...meta } = note;
      notes[id] = {
        ...meta, title: "", content: "", walletAddress: account.address,
        vault: await encryptText(JSON.stringify({ title, content, todos, entries, mindmap, researchData, todoDaily, todoPlan }), key),
      };
    }
  }

  const imported = await importWalletSecretForTest(privateKey);
  lockVault();
  clearSealedCache();
  await unlockVault();
  await bindDatabaseOwner();

  const toSave = {
    workspaces: Array.isArray(snapshot.workspaces) ? snapshot.workspaces : [],
    items: Array.isArray(snapshot.items) ? snapshot.items : [],
    trash: Array.isArray(snapshot.trash) ? snapshot.trash : [],
    notes,
    trashEnabled: snapshot.trashEnabled !== false,
    session: snapshot.session && typeof snapshot.session === "object" ? snapshot.session : {},
    profile: snapshot.profile && typeof snapshot.profile === "object" ? snapshot.profile : {},
  };
  if (isTauri()) {
    await invoke("save_snapshot", { snapshot: toSave });
  } else if (typeof window !== "undefined") {
    window.localStorage.setItem("txtnote.disk.snapshot.v1", JSON.stringify(toSave));
  }

  return {
    openedWithAddress: imported.address,
    walletDurable: imported.durable,
    ownerAddress: restoredOwner?.walletAddress ?? opened.ownerAddress,
    workspaceNames: opened.workspaceNames,
    notes: opened.notes,
    noteCount: opened.notes.length,
    workspaceCount: toSave.workspaces.length,
    wrongKeyRejected: opened.wrongKeyRejected,
  };
}

export async function openBlindPackageAsPeerDevice(pkg = lastBlindPackage) {
  const privateKey = await exportWalletSecretForTest();
  const pair = privateKeyToAccount(privateKey);
  const opened = await openBlindServerPackage(pkg, privateKey, { tryWrongKey: true });
  return {
    openedWithAddress: pair.address,
    ownerAddress: opened.ownerAddress,
    workspaceNames: opened.workspaceNames,
    notes: opened.notes,
    noteCount: opened.notes.length,
    wrongKeyRejected: opened.wrongKeyRejected,
  };
}
