/**
 * Encrypted package built from the local read-model + the active wallet.
 * packageUUID is new on every change. The private key never enters this object.
 */

import { getWalletAddress } from "../wallet/index.js";
import { sealNoteVaultBody } from "../crypto/envelope.js";
import { localPackageSource } from "./packageSource.js";

const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pkg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function buildEncryptedPackage({
  workspace = null,
  file = null,
  item = null,
  note = null,
  deviceUUID = "",
  walletAddress = null,
} = {}) {
  const source = localPackageSource({ workspace, file, item, note });
  const address = walletAddress ?? (await getWalletAddress());
  const vault = source.note
    ? await sealNoteVaultBody({
        noteName: source.note.noteName,
        content: source.note.content,
      })
    : null;

  return {
    v: 1,
    packageUUID: newId(),
    deviceUUID: deviceUUID || "",
    walletAddress: address,
    createdAt: Date.now(),
    workspace: source.workspace,
    file: source.file,
    note: source.note
      ? {
          noteUUID: source.note.noteUUID,
          revision: source.note.revision,
          createdAt: source.note.createdAt,
          updatedAt: source.note.updatedAt,
          vault,
        }
      : null,
  };
}

export function packageContainsPlaintext(pkg, needle) {
  if (!needle) return false;
  return JSON.stringify(pkg).includes(needle);
}
