/**
 * services/contracts.ts — the seam between the UI and whatever is behind it.
 *
 * The frontend depends on these interfaces and never on an implementation.
 * `services/mock` satisfies them in memory; `services/http` will satisfy them
 * over the wire. Neither can change shape without this file changing first,
 * which is exactly the property that lets you work on one side alone.
 *
 * Every method is async even where the mock answers instantly — otherwise call
 * sites bake in a synchronous assumption that the HTTP adapter cannot honour.
 */

import type {
  ContentItem,
  CreateItemInput,
  CreateWorkspaceInput,
  DeleteWorkspaceResult,
  ItemId,
  Note,
  NoteSyncPayload,
  NoteVersion,
  TrashEntry,
  UpdateItemInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceId,
} from "../types";

export interface WorkspaceService {
  list(): Promise<Workspace[]>;
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  update(id: WorkspaceId, patch: UpdateWorkspaceInput): Promise<Workspace>;
  /** Cascades to the workspace's items — see `DeleteWorkspaceResult`. */
  remove(id: WorkspaceId): Promise<DeleteWorkspaceResult>;
}

export interface ContentService {
  /** Metadata only. Note bodies come from `NoteService`. */
  listByWorkspace(workspaceId: WorkspaceId): Promise<ContentItem[]>;
  create(input: CreateItemInput): Promise<ContentItem>;
  update(id: ItemId, patch: UpdateItemInput): Promise<ContentItem>;
  /** Honours the bin setting: soft-deletes when on, hard-deletes when off. */
  remove(id: ItemId): Promise<void>;
}

export interface NoteService {
  get(id: ItemId): Promise<Note | null>;
  /** Debounce at the call site; this fires a write every time it is called. */
  save(id: ItemId, note: Note): Promise<void>;
}

export interface TrashService {
  list(): Promise<TrashEntry[]>;
  restore(id: ItemId): Promise<ContentItem>;
  purge(id: ItemId): Promise<void>;
  empty(): Promise<void>;
  isEnabled(): Promise<boolean>;
  /** Switching the bin off empties it — the implementation must do both. */
  setEnabled(enabled: boolean): Promise<void>;
}

/**
 * Long-running work that must not block a render. Today the only member is the
 * retention sweep, which the shell drives on an interval; once a backend
 * exists it becomes a server-side cron and this method disappears from the
 * client adapter without any component noticing.
 */
export interface BackgroundService {
  /** Removes entries past the retention window. Returns the ids it dropped. */
  sweepExpiredTrash(): Promise<ItemId[]>;
  /** Reads a picture into whatever form the active backend stores. */
  uploadAvatar(file: File): Promise<string>;
}

/**
 * Device-to-device fan-out and cloud backup. Local crash-recovery writes do
 * not go through here — they stay on the device (IndexedDB / localStorage).
 *
 * BACKEND ENTEGRASYON NOKTASI — fill `services/http` and these four methods
 * are the whole job. Payload: `NoteSyncPayload` in `types/index.ts`.
 */
export interface SyncService {
  /** Push a snapshot to the account's other live devices. */
  emitToPeers(payload: NoteSyncPayload): Promise<void>;
  /** Persist a snapshot on the server. Success creates a `NoteVersion`. */
  saveToCloud(payload: NoteSyncPayload): Promise<NoteVersion>;
  /** Newest first. Empty array when the note has never been backed up. */
  listHistory(noteId: ItemId): Promise<NoteVersion[]>;
  getVersion(noteId: ItemId, versionId: string): Promise<NoteVersion | null>;
}

/** The single object the app is handed. Swap this, swap the whole backend. */
export interface AppServices {
  workspaces: WorkspaceService;
  content: ContentService;
  notes: NoteService;
  trash: TrashService;
  background: BackgroundService;
  sync: SyncService;
}
