/**
 * services/mock/index.ts — an in-memory `AppServices` implementation.
 *
 * This is what the UI runs against by default. It is deliberately a little
 * slow and a little strict: `LATENCY_MS` makes loading states real instead of
 * theoretical, and the validation below mirrors what the server will enforce,
 * so an error path that works here works there.
 *
 * Rules for this file:
 *   - No network, no storage, no timers beyond the artificial latency.
 *   - Every mutation returns the persisted shape, the way an API would.
 *   - Throws `ServiceError`, never a bare `Error`.
 */

import type {
  AppServices,
  BackgroundService,
  ContentService,
  NoteService,
  TrashService,
  WorkspaceService,
} from "../contracts";
import type {
  ContentItem,
  CreateItemInput,
  CreateWorkspaceInput,
  DeleteWorkspaceResult,
  ItemId,
  Note,
  ServiceError,
  TrashEntry,
  UpdateItemInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceId,
} from "../../types";
import { nextNoteRevision } from "../local/packageSource.js";
import { DEFAULT_ITEMS, DEFAULT_TRASH, DEFAULT_WORKSPACES } from "./fixtures";
import { mockSyncService, __resetMockSync } from "./sync";

/* -- knobs ------------------------------------------------------------------
 * Set LATENCY_MS to 0 in tests. Leave it non-zero in development: a UI built
 * against an instant backend hides every missing spinner. */
const LATENCY_MS = 180;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const NAME_MAX = 32;
const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

const fail = (error: ServiceError): never => {
  throw error;
};

const nextId = (prefix: string) => {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
};

const nowMs = () => Date.now();

const normalise = (value: string) => value.trim().replace(/\s+/g, " ");

const badgeOf = (value: string) => {
  const [first] = Array.from(normalise(value));
  return first ? first.toLocaleUpperCase("tr-TR") : "?";
};

/* -- store ------------------------------------------------------------------
 * Module-level so every adapter below reads the same data. Cloned out of the
 * fixtures at import time so a mutation in one test does not leak into the
 * next through the shared fixture arrays. */
const db = {
  workspaces: structuredClone(DEFAULT_WORKSPACES) as Workspace[],
  items: structuredClone(DEFAULT_ITEMS) as ContentItem[],
  trash: structuredClone(DEFAULT_TRASH) as TrashEntry[],
  notes: new Map<ItemId, Note>(),
  trashEnabled: true,
};

/** Test helper. Not part of the contract — the HTTP adapter has no equivalent. */
export const __resetMockDb = () => {
  db.workspaces = structuredClone(DEFAULT_WORKSPACES);
  db.items = structuredClone(DEFAULT_ITEMS);
  db.trash = structuredClone(DEFAULT_TRASH);
  db.notes = new Map();
  db.trashEnabled = true;
  __resetMockSync();
};

/* -- workspaces ------------------------------------------------------------ */

const workspaces: WorkspaceService = {
  async list() {
    return delay(structuredClone(db.workspaces));
  },

  async create({ name }: CreateWorkspaceInput) {
    const clean = normalise(name);
    if (!clean) fail({ code: "VALIDATION", field: "name", message: "Çalışma alanı adı boş olamaz.", });
    if (clean.length > NAME_MAX)
      fail({ code: "VALIDATION", field: "name", message: `En fazla ${NAME_MAX} karakter.` });
    const at = nowMs();
    const created: Workspace = {
      id: nextId("ws"),
      name: clean,
      badge: badgeOf(clean),
      isPinned: false,
      avatar: null,
      createdAt: at,
      updatedAt: at,
    };
    db.workspaces.push(created);
    return delay({ ...created });
  },

  async update(id: WorkspaceId, patch: UpdateWorkspaceInput) {
    const found = db.workspaces.find((w) => w.id === id);
    if (!found) fail({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı." });

    if (patch.name !== undefined) {
      const clean = normalise(patch.name);
      if (!clean) fail({ code: "VALIDATION", field: "name", message: "Çalışma alanı adı boş olamaz." });
      if (clean.length > NAME_MAX)
        fail({ code: "VALIDATION", field: "name", message: `En fazla ${NAME_MAX} karakter.` });
      found!.name = clean;
      found!.badge = badgeOf(clean);
    }
    if (patch.avatar !== undefined) found!.avatar = patch.avatar;
    if (patch.isPinned !== undefined) found!.isPinned = patch.isPinned;
    found!.updatedAt = nowMs();

    return delay({ ...found! });
  },

  async remove(id: WorkspaceId): Promise<DeleteWorkspaceResult> {
    const workspace = db.workspaces.find((w) => w.id === id);
    if (!workspace) fail({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı." });

    const removed = db.items.filter((item) => item.workspaceId === id);
    db.items = db.items.filter((item) => item.workspaceId !== id);
    db.workspaces = db.workspaces.filter((w) => w.id !== id);

    if (db.trashEnabled) {
      const deletedAt = Date.now();
      db.trash.unshift(
        ...removed.map((item) => ({ ...item, deletedAt, workspaceName: workspace!.name })),
      );
    } else {
      removed.forEach((item) => db.notes.delete(item.id));
    }

    return delay({
      workspaceId: id,
      removedItemIds: removed.map((item) => item.id),
      movedToTrash: db.trashEnabled,
    });
  },
};

/* -- content --------------------------------------------------------------- */

const content: ContentService = {
  async listByWorkspace(workspaceId: WorkspaceId) {
    const scoped = db.items.filter((item) => item.workspaceId === workspaceId);
    // Pinned first, insertion order otherwise — the same order the sidebar renders.
    return delay([
      ...scoped.filter((item) => item.isPinned),
      ...scoped.filter((item) => !item.isPinned),
    ].map((item) => ({ ...item })));
  },

  async create({ workspaceId, title = "Başlıksız not", type = "document" }: CreateItemInput) {
    if (!db.workspaces.some((w) => w.id === workspaceId))
      fail({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı." });

    const at = nowMs();
    const created: ContentItem = {
      id: nextId("itm"),
      workspaceId,
      title,
      type,
      parentId: null,
      createdAt: at,
      updatedAt: at,
      isPinned: false,
      isPrivate: false,
      isFavorite: false,
    };
    db.items.push(created);
    return delay({ ...created });
  },

  async update(id: ItemId, patch: UpdateItemInput) {
    const found = db.items.find((item) => item.id === id);
    if (!found) fail({ code: "NOT_FOUND", message: "İçerik bulunamadı." });
    const { id: _ignored, ...safePatch } = patch as UpdateItemInput & { id?: ItemId };
    Object.assign(found!, safePatch, { updatedAt: nowMs() });
    return delay({ ...found! });
  },

  async remove(id: ItemId) {
    const found = db.items.find((item) => item.id === id);
    if (!found) fail({ code: "NOT_FOUND", message: "İçerik bulunamadı." });

    db.items = db.items.filter((item) => item.id !== id);

    if (db.trashEnabled) {
      const workspace = db.workspaces.find((w) => w.id === found!.workspaceId);
      db.trash.unshift({
        ...found!,
        deletedAt: Date.now(),
        workspaceName: workspace?.name ?? "—",
      });
    } else {
      db.notes.delete(id);
    }

    return delay(undefined);
  },
};

/* -- notes ----------------------------------------------------------------- */

const notes: NoteService = {
  async get(id: ItemId) {
    return delay(db.notes.get(id) ?? null);
  },

  async save(id: ItemId, note: Note) {
    const previous = db.notes.get(id);
    const at = nowMs();
    db.notes.set(id, {
      ...note,
      createdAt: note.createdAt ?? previous?.createdAt ?? at,
      updatedAt: at,
      revision: nextNoteRevision(previous ?? null, note),
    });
    return delay(undefined);
  },
};

/* -- trash ----------------------------------------------------------------- */

const trash: TrashService = {
  async list() {
    // Newest first — the bin reads as a history.
    return delay([...db.trash].sort((a, b) => b.deletedAt - a.deletedAt));
  },

  async restore(id: ItemId) {
    const entry = db.trash.find((row) => row.id === id);
    if (!entry) fail({ code: "NOT_FOUND", message: "Çöp kutusunda bulunamadı." });

    const { deletedAt: _deletedAt, workspaceName: _workspaceName, ...item } = entry!;

    // Its workspace may be gone. Re-home rather than restore into nothing.
    const target = db.workspaces.some((w) => w.id === item.workspaceId)
      ? item.workspaceId
      : db.workspaces[0]?.id;
    if (!target) fail({ code: "CONFLICT", message: "Geri yüklenecek bir çalışma alanı yok." });

    const restored: ContentItem = { ...item, workspaceId: target! };
    if (db.items.some((row) => row.id === restored.id)) {
      db.trash = db.trash.filter((row) => row.id !== id);
      const existing = db.items.find((row) => row.id === restored.id)!;
      return delay({ ...existing });
    }
    db.items.push(restored);
    db.trash = db.trash.filter((row) => row.id !== id);
    return delay({ ...restored });
  },

  async purge(id: ItemId) {
    db.trash = db.trash.filter((row) => row.id !== id);
    db.notes.delete(id);
    return delay(undefined);
  },

  async empty() {
    db.trash.forEach((row) => db.notes.delete(row.id));
    db.trash = [];
    return delay(undefined);
  },

  async isEnabled() {
    return delay(db.trashEnabled);
  },

  async setEnabled(enabled: boolean) {
    db.trashEnabled = enabled;
    // Switching the bin off is itself a delete — whatever is inside goes now.
    if (!enabled) await trash.empty();
    return delay(undefined);
  },
};

/* -- background ------------------------------------------------------------ */

const background: BackgroundService = {
  async sweepExpiredTrash() {
    if (!db.trashEnabled) return [];
    const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;
    const expired = db.trash.filter((row) => row.deletedAt <= cutoff);
    if (expired.length === 0) return [];

    db.trash = db.trash.filter((row) => row.deletedAt > cutoff);
    expired.forEach((row) => db.notes.delete(row.id));
    return expired.map((row) => row.id);
  },

  async uploadAvatar(file: File) {
    if (!file.type.startsWith("image/"))
      fail({ code: "VALIDATION", field: "avatar", message: "Yalnızca görsel dosyaları." });
    if (file.size > AVATAR_MAX_BYTES)
      fail({ code: "PAYLOAD_TOO_LARGE", field: "avatar", message: "Görsel 2 MB'tan büyük olamaz." });

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject({ code: "UNKNOWN", message: "Görsel okunamadı." } satisfies ServiceError);
      reader.readAsDataURL(file);
    });
  },
};

export const mockServices: AppServices = {
  workspaces,
  content,
  notes,
  trash,
  background,
  sync: mockSyncService,
};

export { mockApiSaveToCloud, mockSocketEmit } from "./sync";
