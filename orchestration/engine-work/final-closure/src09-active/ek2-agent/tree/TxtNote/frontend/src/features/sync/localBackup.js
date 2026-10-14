/**
 * Lane A — local crash-recovery store.
 *
 * IndexedDB first, localStorage as a fallback. This never leaves the device
 * and is not a backend concern.
 */

import { noteFromPayload } from "./payload";
import { sealSyncPayload, unsealSyncPayload } from "@shared/services";

const DB_NAME = "txtnote-local-backup";
const STORE = "notes";
const MEMORY = new Map();
const STORAGE_PREFIX = "txtnote.localNote.";

let dbPromise = null;

const openDb = () => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
};

const writeLocalStorage = (noteId, payload) => {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${noteId}`, JSON.stringify(payload));
  } catch {
    // Quota / private mode — memory still holds the latest snapshot.
  }
};

const readLocalStorage = (noteId) => {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${noteId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const peekLocalBackup = (noteId) => MEMORY.get(noteId) ?? null;

export const writeLocalBackup = async (payload) => {
  if (!payload?.noteId) return;
  MEMORY.set(payload.noteId, payload);
  const stored = (await sealSyncPayload(payload)) ?? payload;
  writeLocalStorage(payload.noteId, stored);

  const db = await openDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(stored, payload.noteId);
    });
  } catch {
    // IndexedDB rejected — localStorage already holds the snapshot.
  }
};

export const loadAllLocalBackups = async () => {
  const found = new Map();

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const payload = readLocalStorage(key.slice(STORAGE_PREFIX.length));
      if (payload?.noteId) found.set(payload.noteId, payload);
    }
  } catch {
    // ignore
  }

  const db = await openDb();
  if (db) {
    const fromDb = await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => resolve([]);
    });
    fromDb.forEach((payload) => {
      if (payload?.noteId) found.set(payload.noteId, payload);
    });
  }

  for (const [noteId, payload] of found) {
    const opened = (await unsealSyncPayload(payload)) ?? payload;
    if (opened?.__locked) continue;
    found.set(noteId, opened);
    MEMORY.set(noteId, opened);
  }
  return found;
};

export const notesMapFromBackups = (backups) => {
  const notes = {};
  backups.forEach((payload, noteId) => {
    notes[noteId] = noteFromPayload(payload);
  });
  return notes;
};

/** Drop a note from every local store once it is gone for good. */
export const deleteLocalBackup = async (noteId) => {
  if (!noteId) return;
  MEMORY.delete(noteId);
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${noteId}`);
  } catch {
    // ignore
  }

  const db = await openDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(noteId);
    });
  } catch {
    // IndexedDB rejected — memory and localStorage already dropped it.
  }
};
