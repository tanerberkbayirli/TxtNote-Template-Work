/**
 * Local persistent adapter. Desktop talks to the SQLite file in the Tauri
 * app data directory; the browser falls back to IndexedDB with the same
 * snapshot shape so `vite` still remembers a session.
 */

import type { AppServices, SyncService } from "../contracts";
import type {
  Note,
  NoteSyncPayload,
  NoteVersion,
  ServiceError,
} from "../../types";
import { mergeLivingNotes } from "./notesMerge.js";
import { nextNoteRevision } from "./packageSource.js";
import { sealNoteRecord, sealNotesMap, sealSyncPayload, unsealNotesMap, unsealSyncPayload } from "../crypto/envelope.js";
import { isVaultReady } from "../crypto/vault.js";
import { getWalletAddress } from "../wallet/index.js";

export type Snapshot = {
  workspaces: unknown[];
  items: unknown[];
  trash: unknown[];
  notes: Record<string, unknown>;
  trashEnabled: boolean;
  session: Record<string, unknown>;
  profile: unknown;
};

const emptySnapshot = (): Snapshot => ({
  workspaces: [],
  items: [],
  trash: [],
  notes: {},
  trashEnabled: true,
  session: {},
  profile: {},
});

const fail = (error: ServiceError): never => {
  throw error;
};

const isTauri = () => {
  if (typeof window === "undefined") return false;
  const w = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
};

const LS_SNAPSHOT = "txtnote.disk.snapshot.v1";
const LS_VERSIONS = "txtnote.disk.versions.v1";

const IDB_NAME = "txtnote-local-db";
const IDB_STATE = "state";
const IDB_MEDIA = "media";
const IDB_HANDLES = "fileHandles";
const IDB_VERSION = 2;

let idbPromise: Promise<IDBDatabase | null> | null = null;

const openIdb = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!idbPromise) {
    idbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_STATE)) db.createObjectStore(IDB_STATE);
          if (!db.objectStoreNames.contains(IDB_MEDIA)) db.createObjectStore(IDB_MEDIA);
          if (!db.objectStoreNames.contains(IDB_HANDLES)) db.createObjectStore(IDB_HANDLES);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return idbPromise;
};

const idbGet = async <T,>(store: string, key: string): Promise<T | null> => {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => resolve(null);
  });
};

const idbSet = async (store: string, key: string, value: unknown): Promise<void> => {
  const db = await openIdb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(store).put(value, key);
  });
};

const idbDelete = async (store: string, key: string): Promise<void> => {
  const db = await openIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.objectStore(store).delete(key);
  });
};

const invoke = async <T,>(command: string, args?: Record<string, unknown>): Promise<T> => {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(command, args);
};

let writeChain: Promise<void> = Promise.resolve();

const enqueueWrite = (work: () => Promise<void>): Promise<void> => {
  writeChain = writeChain
    .catch(() => undefined)
    .then(work)
    .catch((error) => {
      console.error("Yerel kayıt yazılamadı", error);
    });
  return writeChain;
};

export const isTauriRuntime = () => isTauri();

const richness = (snapshot: Snapshot | null | undefined) => {
  if (!snapshot) return 0;
  return (
    (snapshot.workspaces?.length ?? 0) * 1000 +
    (snapshot.items?.length ?? 0) * 10 +
    Object.keys(snapshot.notes ?? {}).length
  );
};

const SECRET_KEY = /private[_-]?key|mnemonic|seedPhrase|secretKey/i;

const stripSecretFields = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const next = { ...(value as Record<string, unknown>) };
  Object.keys(next).forEach((key) => {
    if (SECRET_KEY.test(key)) delete next[key];
  });
  return next;
};

const withTime = (row: Record<string, unknown>, now: number) => {
  if (typeof row.createdAt !== "number") row.createdAt = now;
  if (typeof row.updatedAt !== "number") row.updatedAt = row.createdAt;
  return row;
};

const sanitize = (snapshot: Snapshot): Snapshot => {
  const now = Date.now();
  const notesIn =
    snapshot.notes && typeof snapshot.notes === "object" && !Array.isArray(snapshot.notes)
      ? snapshot.notes
      : {};
  const notes: Record<string, unknown> = {};
  Object.entries(notesIn).forEach(([id, note]) => {
    const next = withTime({ ...(note as Record<string, unknown>) }, now);
    if (typeof next.revision !== "number" || (next.revision as number) < 1) next.revision = 1;
    notes[id] = next;
  });

  return {
    ...snapshot,
    workspaces: (Array.isArray(snapshot.workspaces) ? snapshot.workspaces : []).map((row) =>
      withTime({ ...(row as Record<string, unknown>) }, now),
    ),
    items: (Array.isArray(snapshot.items) ? snapshot.items : []).map((item) => {
      const next = withTime({ ...(item as Record<string, unknown>) }, now);
      if (typeof next.url === "string" && next.url.startsWith("blob:")) delete next.url;
      if (next.parentId === undefined) next.parentId = null;
      if (next.fileName && next.fileExtension === undefined) {
        const match = /\.([^./\\]+)$/.exec(String(next.fileName));
        if (match) next.fileExtension = match[1].toLowerCase();
      }
      return next;
    }),
    trash: Array.isArray(snapshot.trash) ? snapshot.trash : [],
    notes,
    trashEnabled: snapshot.trashEnabled !== false,
    session:
      snapshot.session && typeof snapshot.session === "object"
        ? (stripSecretFields(snapshot.session) as Record<string, unknown>)
        : {},
    profile: stripSecretFields(snapshot.profile ?? {}) ?? {},
  };
};

const readLocalStorageSnapshot = (): Snapshot | null => {
  try {
    const raw = window.localStorage.getItem(LS_SNAPSHOT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writeLocalStorageSnapshot = (snapshot: Snapshot) => {
  try {
    window.localStorage.setItem(LS_SNAPSHOT, JSON.stringify(snapshot));
  } catch (error) {
    console.error("localStorage yazılamadı", error);
  }
};

const readLocalStorageVersions = (): Record<string, NoteVersion[]> => {
  try {
    const raw = window.localStorage.getItem(LS_VERSIONS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NoteVersion[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeLocalStorageVersions = (store: Record<string, NoteVersion[]>) => {
  try {
    window.localStorage.setItem(LS_VERSIONS, JSON.stringify(store));
  } catch {
    // quota
  }
};

const pickRichest = (...candidates: Array<Snapshot | null | undefined>): Snapshot => {
  let best = emptySnapshot();
  let score = -1;
  for (const candidate of candidates) {
    const next = richness(candidate);
    if (candidate && next > score) {
      best = { ...emptySnapshot(), ...candidate };
      score = next;
    }
  }
  return best;
};

const idbHas = async (store: string, key: string): Promise<boolean> => {
  const db = await openIdb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, "readonly");
      const request = tx.objectStore(store).getKey(key);
      request.onsuccess = () => resolve(request.result !== undefined);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

const hydrateUrls = async (snapshot: Snapshot): Promise<Snapshot> => {
  const items = await Promise.all(
    (snapshot.items as Array<Record<string, unknown>>).map(async (item) => {
      const id = String(item.id ?? "");
      if (!id) return item;
      const isFile = item.type === "file" || Boolean(item.fileName);
      if (!isFile) return item;

      if (isTauri()) {
        const mediaPath = item.mediaPath;
        if (typeof mediaPath === "string" && mediaPath) {
          return {
            ...item,
            persistentAccess: true,
            needsReselect: false,
            accessKind: item.accessKind || "mediaPath",
          };
        }
        return item;
      }

      if (await idbHas(IDB_MEDIA, id)) {
        return {
          ...item,
          persistentAccess: true,
          needsReselect: false,
          accessKind: item.accessKind || "idb",
        };
      }

      const handle = await idbGet<{
        queryPermission?: (opts: { mode: "read" }) => Promise<string>;
        getFile: () => Promise<File>;
      }>(IDB_HANDLES, id);
      if (handle) {
        return {
          ...item,
          persistentAccess: true,
          needsReselect: false,
          accessKind: "fileHandle",
        };
      }

      if (item.storageMode && item.storageMode !== "inline") {
        return { ...item, needsReselect: true, persistentAccess: false };
      }
      return item;
    }),
  );
  return { ...snapshot, items };
};

export const hydrateFileUrl = async (
  id: string,
  mediaPath?: string | null,
): Promise<{ url: string | null; file?: File; handle?: unknown } | null> => {
  if (!id) return null;
  if (isTauri()) {
    if (typeof mediaPath === "string" && mediaPath) {
      try {
        const { convertFileSrc } = await import("@tauri-apps/api/core");
        return { url: convertFileSrc(mediaPath) };
      } catch {
        return { url: mediaPath };
      }
    }
    return null;
  }

  const blob = await idbGet<Blob>(IDB_MEDIA, id);
  if (blob) {
    const file =
      blob instanceof File
        ? blob
        : new File([blob], id, { type: blob.type || "application/octet-stream" });
    return { url: URL.createObjectURL(blob), file };
  }

  const handle = await idbGet<{
    queryPermission?: (opts: { mode: "read" }) => Promise<string>;
    requestPermission?: (opts: { mode: "read" }) => Promise<string>;
    getFile: () => Promise<File>;
  }>(IDB_HANDLES, id);
  if (handle && typeof handle.getFile === "function") {
    try {
      let permission = "granted";
      if (typeof handle.queryPermission === "function") {
        permission = await handle.queryPermission({ mode: "read" });
      }
      if (permission !== "granted" && typeof handle.requestPermission === "function") {
        permission = await handle.requestPermission({ mode: "read" });
      }
      if (permission === "granted") {
        const file = await handle.getFile();
        return { url: URL.createObjectURL(file), file, handle };
      }
    } catch {
      return null;
    }
  }
  return null;
};

const dropBrowserMirrors = () => {
  try {
    window.localStorage.removeItem(LS_SNAPSHOT);
  } catch {
    // ignore
  }
  void idbDelete(IDB_STATE, "snapshot");
};

const readSqliteSnapshot = async (): Promise<Snapshot | null> => {
  try {
    return sanitize(await invoke<Snapshot>("load_snapshot"));
  } catch (error) {
    console.error("SQLite okunamadı", error);
    try {
      const json = await invoke<string>("load_snapshot_json");
      return sanitize(JSON.parse(json) as Snapshot);
    } catch (fallbackError) {
      console.error("SQLite yedek okuma da başarısız", fallbackError);
      return null;
    }
  }
};

const writeSqliteSnapshot = async (snapshot: Snapshot): Promise<void> => {
  try {
    await invoke("save_snapshot", { snapshot });
  } catch (error) {
    console.error("SQLite yazılamadı", error);
    try {
      await invoke("save_snapshot_json", { json: JSON.stringify(snapshot) });
    } catch (fallbackError) {
      console.error("SQLite json yazılamadı", fallbackError);
    }
  }
};

const adoptBrowserSnapshotIfSqliteEmpty = async (sqlite: Snapshot): Promise<Snapshot> => {
  if (richness(sqlite) > 0) {
    queueMicrotask(dropBrowserMirrors);
    return sqlite;
  }

  const fromMemory = readLocalStorageSnapshot();
  const fromIdb = await idbGet<Snapshot>(IDB_STATE, "snapshot");
  const browser = sanitize(pickRichest(fromMemory, fromIdb));
  if (richness(browser) === 0) return sqlite;

  await enqueueWrite(() => writeSqliteSnapshot(browser));
  queueMicrotask(dropBrowserMirrors);
  return browser;
};

const openSnapshot = async (snapshot: Snapshot): Promise<Snapshot> => {
  const notes = await unsealNotesMap(snapshot.notes as Record<string, unknown>);
  return hydrateUrls({ ...snapshot, notes });
};

export const loadSnapshot = async (): Promise<Snapshot> => {
  if (isTauri()) {
    const fromSqlite = await readSqliteSnapshot();
    if (fromSqlite) {
      const adopted = await adoptBrowserSnapshotIfSqliteEmpty(fromSqlite);
      return openSnapshot(adopted);
    }
  }

  const fromMemory = readLocalStorageSnapshot();
  const fromIdb = await idbGet<Snapshot>(IDB_STATE, "snapshot");
  return openSnapshot(pickRichest(fromMemory, fromIdb));
};

/** Workspace/item/session shell without note bodies — first paint. */
export const loadShell = async (): Promise<Snapshot> => {
  if (isTauri()) {
    try {
      const shell = sanitize(await invoke<Snapshot>("load_shell"));
      const adopted = await adoptBrowserSnapshotIfSqliteEmpty(shell);
      return hydrateUrls({ ...adopted, notes: {} });
    } catch (error) {
      console.error("SQLite kabuk okunamadı", error);
      const full = await loadSnapshot();
      return { ...full, notes: {} };
    }
  }

  const full = await loadSnapshot();
  return { ...full, notes: {} };
};

/** Note bodies for the given ids only. Missing ids are omitted. */
export const loadNotes = async (ids: string[] = []): Promise<Record<string, unknown>> => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};

  if (isTauri()) {
    try {
      const raw = (await invoke<Record<string, unknown>>("load_notes", { ids: unique })) ?? {};
      return unsealNotesMap(raw);
    } catch (error) {
      console.error("SQLite notlar okunamadı", error);
      return {};
    }
  }

  const snapshot = await loadSnapshot();
  const out: Record<string, unknown> = {};
  unique.forEach((id) => {
    if (snapshot.notes[id]) out[id] = snapshot.notes[id];
  });
  return out;
};

export const saveSnapshot = async (snapshot: Snapshot): Promise<void> => {
  const serializable = sanitize(snapshot);
  if (isTauri() && !isVaultReady()) {
    serializable.notes = {};
  } else {
    serializable.notes = await sealNotesMap(serializable.notes as Record<string, unknown>);
  }

  if (isTauri()) {
    await enqueueWrite(() => writeSqliteSnapshot(serializable));
    return;
  }

  await enqueueWrite(async () => {
    const existing = readLocalStorageSnapshot();
    if (richness(serializable) === 0 && richness(existing) > 0) return;

    const merged: Snapshot = {
      ...serializable,
      notes: mergeLivingNotes(
        existing?.notes as Record<string, unknown> | undefined,
        serializable.notes,
        serializable.items,
        serializable.trash,
      ),
    };
    writeLocalStorageSnapshot(merged);

    try {
      const stored = (await idbGet<Snapshot>(IDB_STATE, "snapshot")) ?? emptySnapshot();
      await idbSet(IDB_STATE, "snapshot", {
        ...stored,
        ...merged,
        notes: mergeLivingNotes(
          stored.notes as Record<string, unknown> | undefined,
          serializable.notes,
          serializable.items,
          serializable.trash,
        ),
      });
    } catch (error) {
      console.error("IndexedDB yazılamadı", error);
    }
  });
};

export const saveNote = async (id: string, note: unknown): Promise<void> => {
  if (!id) return;
  if (isTauri() && !isVaultReady()) return;

  await enqueueWrite(async () => {
    if (isTauri()) {
    try {
      const incoming =
        note && typeof note === "object" ? (note as Record<string, unknown>) : { content: note };
      await invoke("save_note", { id, note: await sealNoteRecord(id, incoming) });
    } catch (error) {
      console.error("SQLite not yazılamadı", error);
    }
    return;
  }

    const existing = readLocalStorageSnapshot() ?? emptySnapshot();
    const previous = existing.notes[id];
    const incoming =
      note && typeof note === "object"
        ? (note as Record<string, unknown>)
        : { content: note };
    const revision = nextNoteRevision(
      previous && typeof previous === "object"
        ? (previous as { title?: string; content?: string; revision?: number })
        : null,
      incoming,
    );
    const createdAt =
      typeof incoming.createdAt === "number"
        ? incoming.createdAt
        : previous && typeof previous === "object" && typeof (previous as { createdAt?: number }).createdAt === "number"
          ? (previous as { createdAt: number }).createdAt
          : Date.now();
    const storedNote = await sealNoteRecord(id, {
      ...incoming,
      createdAt,
      updatedAt: Date.now(),
      revision,
    });
    existing.notes = { ...existing.notes, [id]: storedNote };
    writeLocalStorageSnapshot(existing);

    try {
      const stored = (await idbGet<Snapshot>(IDB_STATE, "snapshot")) ?? emptySnapshot();
      stored.notes = { ...stored.notes, [id]: storedNote };
      await idbSet(IDB_STATE, "snapshot", stored);
    } catch {
      // ignore
    }
  });
};

export const flushWrites = (): Promise<void> => writeChain;

const MEDIA_CHUNK = 256 * 1024;

const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export type WrittenMedia = { url: string | null; mediaPath: string | null };

export const writeMedia = async (
  id: string,
  file: File | Blob,
  mime = file.type,
  onProgress?: (written: number, total: number) => void,
): Promise<WrittenMedia> => {
  if (isTauri()) {
    const size = file.size;
    let path: string | null = null;
    if (size === 0) {
      path = await invoke<string>("write_media_chunk", {
        id,
        mime,
        data: [],
        append: false,
      });
    } else {
      for (let offset = 0; offset < size; offset += MEDIA_CHUNK) {
        const end = Math.min(offset + MEDIA_CHUNK, size);
        const slice = file.slice(offset, end);
        const buffer = new Uint8Array(await slice.arrayBuffer());
        path = await invoke<string>("write_media_chunk", {
          id,
          mime,
          data: Array.from(buffer),
          append: offset > 0,
        });
        onProgress?.(end, size);
        if (end < size) await yieldToMain();
      }
    }
    if (!path) return { url: null, mediaPath: null };
    try {
      const { convertFileSrc } = await import("@tauri-apps/api/core");
      return { url: convertFileSrc(path), mediaPath: path };
    } catch {
      return { url: path, mediaPath: path };
    }
  }

  await idbSet(IDB_MEDIA, id, file);
  return { url: URL.createObjectURL(file), mediaPath: null };
};

export const rememberFileHandle = async (id: string, handle: unknown): Promise<void> => {
  if (!id || !handle) return;
  try {
    await idbSet(IDB_HANDLES, id, handle);
  } catch {
    // File System Access handles are optional.
  }
};

export const forgetNote = async (id: string): Promise<void> => {
  if (!id) return;

  await enqueueWrite(async () => {
    if (isTauri()) {
      try {
        await invoke("delete_media", { id });
      } catch {
        // ignore
      }
      return;
    }

    const fromMemory = readLocalStorageSnapshot();
    if (fromMemory?.notes && id in fromMemory.notes) {
      const next = { ...fromMemory, notes: { ...fromMemory.notes } };
      delete next.notes[id];
      writeLocalStorageSnapshot(next);
    }

    await idbDelete(IDB_MEDIA, id);
    await idbDelete(IDB_HANDLES, id);
    try {
      const stored = await idbGet<Snapshot>(IDB_STATE, "snapshot");
      if (stored?.notes && id in stored.notes) {
        const notes = { ...stored.notes };
        delete notes[id];
        await idbSet(IDB_STATE, "snapshot", { ...stored, notes });
      }
    } catch {
      // ignore
    }
  });
};

let versionSeq = 0;
const nextLocalVersionId = () => {
  versionSeq += 1;
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `ver-${Date.now().toString(36)}-${versionSeq}-${rand}`;
};

const stampPackageMeta = async (payload: NoteSyncPayload): Promise<NoteSyncPayload> => {
  const sealed = (await sealSyncPayload(payload)) as NoteSyncPayload;
  let walletAddress = sealed.walletAddress;
  try {
    walletAddress = (await getWalletAddress()) ?? walletAddress;
  } catch {
    // Public address is optional on a failed wallet read.
  }
  const packageUUID =
    sealed.packageUUID ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : nextLocalVersionId());
  return { ...sealed, walletAddress, packageUUID };
};

const openVersion = async (version: NoteVersion | null): Promise<NoteVersion | null> => {
  if (!version) return null;
  return {
    ...version,
    payload: (await unsealSyncPayload(version.payload)) as NoteSyncPayload,
  };
};

const appendVersion = async (payload: NoteSyncPayload): Promise<NoteVersion> => {
  if (!payload?.noteId) fail({ code: "VALIDATION", field: "noteId", message: "noteId gerekli." });
  if (!payload.hash) fail({ code: "VALIDATION", field: "hash", message: "hash gerekli." });

  const store = readLocalStorageVersions();
  const current = store[payload.noteId] ?? [];
  if (current[0]?.hash === payload.hash) {
    if (isTauri()) {
      try {
        return (await openVersion(await invoke<NoteVersion>("append_version", { payload: await stampPackageMeta(payload) }))) ?? current[0];
      } catch {
        return (await openVersion(current[0])) ?? current[0];
      }
    }
    return (await openVersion(current[0])) ?? current[0];
  }
  const sealedPayload = await stampPackageMeta(payload);
  const version: NoteVersion = {
    id: nextLocalVersionId(),
    noteId: payload.noteId,
    createdAt: payload.updatedAt ?? Date.now(),
    hash: payload.hash,
    payload: sealedPayload,
    source: "local",
  };
  store[payload.noteId] = [version, ...current].slice(0, 50);
  writeLocalStorageVersions(store);

  if (isTauri()) {
    try {
      const stored = await invoke<NoteVersion>("append_version", { payload: sealedPayload });
      return (await openVersion(stored)) ?? { ...version, payload };
    } catch (error) {
      console.error("SQLite geçmiş yazılamadı", error);
    }
  }
  await idbSet(IDB_STATE, "versions", store);
  return { ...version, payload };
};

const localSync: SyncService = {
  async emitToPeers(payload) {
    if (!payload?.noteId) fail({ code: "VALIDATION", field: "noteId", message: "noteId gerekli." });
  },
  saveToCloud: appendVersion,
  async listHistory(noteId) {
    const local = readLocalStorageVersions()[noteId] ?? [];
    let rows = local;
    if (isTauri()) {
      try {
        const remote = await invoke<NoteVersion[]>("list_history", { noteId });
        if (remote.length > 0) rows = remote;
      } catch {
        rows = local;
      }
    } else {
      const store = (await idbGet<Record<string, NoteVersion[]>>(IDB_STATE, "versions")) ?? {};
      const fromIdb = store[noteId] ?? [];
      if (fromIdb.length > 0) rows = fromIdb;
    }
    return (await Promise.all(rows.map((row) => openVersion(row)))).filter(Boolean) as NoteVersion[];
  },
  async getVersion(noteId, versionId) {
    const local = (readLocalStorageVersions()[noteId] ?? []).find((row) => row.id === versionId) ?? null;
    if (isTauri()) {
      try {
        return await openVersion((await invoke<NoteVersion | null>("get_version", { noteId, versionId })) ?? local);
      } catch {
        return openVersion(local);
      }
    }
    return openVersion(local);
  },
};

export const localServices: AppServices = {
  workspaces: {
    list: async () => (await loadSnapshot()).workspaces as never,
    create: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
    update: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
    remove: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
  },
  content: {
    listByWorkspace: async () => [],
    create: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
    update: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
    remove: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
  },
  notes: {
    async get(id) {
      const notes = await loadNotes([id]);
      return (notes[id] as Note) ?? null;
    },
    async save() {
      return undefined;
    },
  },
  trash: {
    list: async () => (await loadSnapshot()).trash as never,
    restore: async () => fail({ code: "UNKNOWN", message: "Yerel kayıt App üzerinden yazılır." }),
    purge: async () => undefined,
    empty: async () => undefined,
    isEnabled: async () => (await loadSnapshot()).trashEnabled,
    setEnabled: async () => undefined,
  },
  background: {
    sweepExpiredTrash: async () => [],
    uploadAvatar: async (file) => {
      if (!file.type.startsWith("image/")) {
        fail({ code: "VALIDATION", field: "avatar", message: "Yalnızca görsel dosyaları." });
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject({ code: "UNKNOWN", message: "Görsel okunamadı." } satisfies ServiceError);
        reader.readAsDataURL(file);
      });
    },
  },
  sync: localSync,
};
