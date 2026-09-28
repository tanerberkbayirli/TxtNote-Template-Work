/**
 * Seal / unseal note bodies and sync payloads with the wallet vault key.
 * In-memory notes stay plaintext. Disk, history and packages carry `vault`.
 */

import { noteFingerprint } from "../local/packageSource.js";
import { getWalletAddress, isDurableWallet } from "../wallet/index.js";
import { decryptText, encryptText, isEncryptedBlob, isVaultReady, unlockVault } from "./vault.js";

const pickFlashcards = (source) => {
  const deck = source?.flashcards;
  if (!deck || typeof deck !== "object" || Array.isArray(deck) || !Array.isArray(deck.cards)) return {};
  return { flashcards: deck };
};

const pickTodoDaily = (note) => {
  if (!note?.todoDaily && !(note?.todoPlan && typeof note.todoPlan === "object")) return {};
  return {
    todoDaily: true,
    todoPlan:
      note.todoPlan && typeof note.todoPlan === "object" && !Array.isArray(note.todoPlan)
        ? note.todoPlan
        : { persistent: false, days: {}, marks: {} },
  };
};

const sealedCache = new Map();
let ownerAddressCache = null;

const META_KEYS = ["createdAt", "updatedAt", "revision", "workspaceId", "fileId", "walletAddress"];

const sensitiveFrom = (note) => ({
  title: note?.title ?? "",
  content: note?.content ?? "",
  todos: Array.isArray(note?.todos) ? note.todos : [],
  entries: note?.entries && typeof note.entries === "object" ? note.entries : {},
  mindmap: note?.mindmap ?? { nodes: [], edges: [] },
  ...(note?.researchData != null ? { researchData: note.researchData } : {}),
  ...pickFlashcards(note),
  ...pickTodoDaily(note),
});

const withMeta = (note, extra) => {
  const next = { ...extra };
  META_KEYS.forEach((key) => {
    if (note && note[key] !== undefined) next[key] = note[key];
  });
  return next;
};

const shouldSeal = () => isDurableWallet() && isVaultReady();

export const clearSealedCache = () => {
  sealedCache.clear();
  ownerAddressCache = null;
};

const currentOwnerAddress = async () => {
  if (ownerAddressCache) return ownerAddressCache;
  try {
    ownerAddressCache = await getWalletAddress();
  } catch {
    ownerAddressCache = "";
  }
  return ownerAddressCache || null;
};

const cachePut = (id, note, sealed) => {
  if (id) sealedCache.set(id, { fp: noteFingerprint(note), sealed });
};

export async function sealNoteRecord(id, note) {
  if (!note || typeof note !== "object") return note;
  const address = await currentOwnerAddress();
  const withOwner = (record) => (address ? { ...record, walletAddress: address } : record);
  if (note.__locked && isEncryptedBlob(note.vault)) {
    return withOwner(withMeta(note, { title: "", content: "", vault: note.vault }));
  }
  if (
    isEncryptedBlob(note.vault) &&
    !note.content &&
    !note.title &&
    !Array.isArray(note.flashcards?.cards)
  ) {
    return withOwner(note);
  }
  if (!shouldSeal()) return withOwner(note);

  const fp = noteFingerprint(note);
  const hit = sealedCache.get(id);
  if (hit && hit.fp === fp) return withOwner(hit.sealed);

  const vault = await encryptText(JSON.stringify(sensitiveFrom(note)));
  const sealed = withOwner(withMeta(note, { title: "", content: "", vault }));
  cachePut(id, note, sealed);
  return sealed;
}

export async function unsealNoteRecord(id, note) {
  if (!note || typeof note !== "object") return note;
  if (!isEncryptedBlob(note.vault)) {
    return note;
  }
  if (!shouldSeal()) {
    return withMeta(note, {
      title: "",
      content: "",
      todos: [],
      entries: {},
      mindmap: { nodes: [], edges: [] },
      vault: note.vault,
      __locked: true,
    });
  }

  try {
    const parsed = JSON.parse(await decryptText(note.vault));
    const plain = withMeta(note, {
      title: parsed.title ?? "",
      content: parsed.content ?? "",
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      entries: parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {},
      mindmap: parsed.mindmap ?? { nodes: [], edges: [] },
      ...(parsed.researchData != null ? { researchData: parsed.researchData } : {}),
      ...pickFlashcards(parsed),
      ...pickTodoDaily(parsed),
    });
    cachePut(id, plain, withMeta(note, { title: "", content: "", vault: note.vault }));
    return plain;
  } catch {
    return withMeta(note, {
      title: "",
      content: "",
      todos: [],
      entries: {},
      mindmap: { nodes: [], edges: [] },
      vault: note.vault,
      __locked: true,
    });
  }
}

export async function sealNotesMap(notes) {
  const out = {};
  for (const [id, note] of Object.entries(notes ?? {})) {
    out[id] = await sealNoteRecord(id, note);
  }
  return out;
}

export async function unsealNotesMap(notes) {
  const out = {};
  for (const [id, note] of Object.entries(notes ?? {})) {
    out[id] = await unsealNoteRecord(id, note);
  }
  return out;
}

export async function sealSyncPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (!shouldSeal()) return payload;
  const vault = await encryptText(
    JSON.stringify({
      title: payload.title ?? "",
      content: payload.content ?? "",
      extras: payload.extras ?? { todos: [], entries: {}, mindmap: { nodes: [], edges: [] } },
    }),
  );
  return {
    ...payload,
    title: "",
    content: "",
    extras: { todos: [], entries: {}, mindmap: { nodes: [], edges: [] } },
    vault,
  };
}

export async function unsealSyncPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (!isEncryptedBlob(payload.vault)) return payload;
  if (!isVaultReady()) {
    try {
      await unlockVault();
    } catch {
      return { ...payload, __locked: true };
    }
  }
  try {
    const parsed = JSON.parse(await decryptText(payload.vault));
    return {
      ...payload,
      title: parsed.title ?? "",
      content: parsed.content ?? "",
      extras: parsed.extras ?? { todos: [], entries: {}, mindmap: { nodes: [], edges: [] } },
    };
  } catch {
    return { ...payload, __locked: true };
  }
}

export async function sealNoteVaultBody(body) {
  return encryptText(JSON.stringify(body ?? {}));
}
