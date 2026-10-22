/**
 * services/index.ts — adapter selection. The only module `frontend/` imports.
 *
 *   import { services } from "@shared/services";
 *
 * No component may import from `services/mock`, `services/http` or
 * `services/local` directly. One grep for those paths outside this file is
 * your architecture test.
 *
 * The desktop app always uses `local` (SQLite under Tauri, IndexedDB in the
 * browser). `mock/` and `http/` stay in the tree for tests and the future
 * backend; they are not imported here so they stay out of the startup bundle.
 */

import type { AppServices } from "./contracts";
import { localServices } from "./local";

export const services: AppServices = localServices;

export type { AppServices } from "./contracts";
export * from "./contracts";
export { loadSnapshot, loadShell, loadNotes, saveSnapshot, saveNote, flushWrites, writeMedia, rememberFileHandle, hydrateFileUrl, forgetNote, isTauriRuntime, onSaveStatus } from "./local";
export { localPackageSource, fileUuidForItem, nextNoteRevision } from "./local/packageSource.js";
export { buildEncryptedPackage } from "./local/encryptedPackage.js";
export { bindDatabaseOwner, loadDbOwner } from "./local/dbOwner.js";
export { exportEncryptedDatabaseToDesktop } from "./local/encryptedDbExport.js";
export {
  sendSnapshotToBlindServer,
  openBlindPackageAsPeerDevice,
  wipeDeviceData,
  restoreFromEncryptedPackage,
  normalizePastedPrivateKey,
} from "./local/blindRelay.js";
export {
  bootstrapWallet,
  getWalletAddress,
  getWalletPublicKey,
  getWalletProvider,
  isDurableWallet,
  setWalletProvider,
  signWalletMessage,
} from "./wallet/index.js";
export { unlockVault, isVaultReady, lockVault } from "./crypto/vault.js";
export { sealSyncPayload, unsealSyncPayload, clearSealedCache } from "./crypto/envelope.js";
export type { Snapshot } from "./local";
export { DEFAULT_PROFILE, DEFAULT_ITEMS, DEFAULT_TRASH, DEFAULT_WORKSPACES } from "./mock/fixtures";
