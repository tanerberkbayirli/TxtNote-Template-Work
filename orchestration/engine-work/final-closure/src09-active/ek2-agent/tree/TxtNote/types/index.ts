/**
 * types/index.ts — the single source of truth for every data shape that
 * crosses a module boundary.
 *
 * Nothing here imports from `frontend/` or `backend/`. Both sides import from
 * here, which is what stops the two drifting apart.
 *
 * Consuming from a `.jsx` file (no build change needed):
 *
 *   /** @type {import("@shared/types").ContentItem} *\/
 *   const item = ...;
 */

/* ==========================================================================
 * Domain entities
 * ========================================================================== */

/** A content item is a text note, an uploaded file, or a classification folder. */
export type ContentType = "document" | "media" | "folder" | "file";

export type FileStorageMode = "inline" | "reference" | "session";
export type FileAccessKind = "idb" | "mediaPath" | "fileHandle" | "session" | "none";

/**
 * Stable identifiers. `id` on each entity is its UUID — names are labels only.
 * Aliased so a future switch to branded types is one edit.
 */
export type WorkspaceId = string;
export type ItemId = string;
export type NoteId = ItemId;

/** Epoch milliseconds. Same format on every device-local entity. */
export type EpochMs = number;

/** A container. Items belong to exactly one workspace, keyed by UUID. */
export interface Workspace {
  /** workspaceUUID — identity. Two workspaces may share a name. */
  id: WorkspaceId;
  name: string;
  createdAt: EpochMs;
  updatedAt: EpochMs;
  /** First letter of the name, Turkish-cased. Derived — never typed by hand. */
  badge: string;
  /** Pinned workspaces sort above the rest in the switcher. */
  isPinned: boolean;
  /** Data URL today; becomes a CDN URL once the media service exists. */
  avatar: string | null;
}

/**
 * A row in the sidebar list. Metadata only — note text lives in `Note`.
 *
 * Folders and uploaded files are the File entity for a future package
 * (`fileUUID` = `id`). Documents are the Note's sidebar row (`noteUUID` = `id`).
 * `parentId` is the File UUID when a row sits in a folder; null means it is
 * attached directly to its workspace. Folders nest, so a folder's `parentId`
 * may be another folder — the chain is only ever walked upwards, and a row
 * may never become its own ancestor.
 *
 * Sibling order is the order of the array the workspace hands back: moving a
 * row up or down rewrites that order, there is no separate rank column.
 */
export interface ContentItem {
  id: ItemId;
  workspaceId: WorkspaceId;
  title: string;
  type: ContentType;
  createdAt: EpochMs;
  updatedAt: EpochMs;
  isPinned: boolean;
  isPrivate: boolean;
  isFavorite: boolean;
  /** Editor kind for documents: standard, todo, diary, mindmap. */
  noteType?: string;
  /** File UUID (folder) this item sits in, if any. Never a name. Folders nest. */
  parentId?: ItemId | null;
  /** Original file name including extension, for uploaded files. */
  fileName?: string;
  fileExtension?: string;
  fileSize?: number;
  mimeType?: string;
  fileKind?: string;
  /** Relative path from a folder or archive upload. */
  relativePath?: string;
  storageMode?: FileStorageMode;
  accessKind?: FileAccessKind;
  /** Desktop media folder path. Never a blob: URL. */
  mediaPath?: string | null;
  persistentAccess?: boolean;
  needsReselect?: boolean;
  encoding?: string | null;
}

/**
 * The editable text behind a `document` item, keyed by the item's id
 * (`noteUUID`). Kept apart from `ContentItem` so listing a workspace never
 * drags note bodies over the wire.
 *
 * `fileId` is nullable: null = note belongs to the workspace only;
 * a UUID = note belongs to that File (folder). Identity is never a name.
 *
 * `revision` is a local monotonic version for a future sync package.
 * It is not a distributed clock and is not merged across devices here.
 *
 * Soft-delete today uses `trash` keyed by the same UUID. A future
 * tombstone/delete-event can reuse that UUID; do not recycle ids.
 */
/** ThesisDocument is the editable state within a normal TxtNote note.
 * The note's title and content fields hold the thesis title and main section.
 * This object holds the template reference, metadata and remaining sections.
 */
export interface ThesisDocument {
  selection: Record<string, string>;
  templateId: string;
  templateVersion: string;
  schemaVersion: number;
  fallback?: boolean;
  fallbackReason?: string;
  values: Record<string, string>;
  sectionContent: Record<string, string>;
  enabledSections: string[];
}

export interface ResearchData {
  sourceTitle?: string;
  authors?: string;
  publicationYear?: string;
  publication?: string;
  doi?: string;
  url?: string;
  keywords?: string;
  /** Rich-text HTML, using the same representation as a standard note body. */
  abstract?: string;
  researchQuestion?: string;
  methodology?: string;
  findings?: string;
  quotes?: { id: string; text: string; page: string; comment: string }[];
  personalNotes?: string;
  /** Free text only; future note links can live in a separate optional field. */
  relatedWorks?: string;
  sources?: AcademicSource[];
  /** Cover line for the exported paper — not the cited work's authors. */
  docAuthors?: string;
  institution?: string;
  docAbstract?: string;
  /** When true, the paper shows a Kaynakça block at the bottom (manual entries). */
  bibliographyEnabled?: boolean;
  /** One bibliography entry per item; preferred over legacy `docBibliography`. */
  docBibliographyItems?: string[];
  /** Legacy newline-separated bibliography text. */
  docBibliography?: string;
  /** Template id, version, field values and editable structural sections for thesis notes. */
  thesis?: ThesisDocument;
}

export interface AcademicSource {
  id: string;
  kind?: string;
  authors?: string;
  title?: string;
  year?: string;
  publication?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  accessed?: string;
  doi?: string;
  url?: string;
}

export interface FlashcardDeck {
  cards: Array<{
    id: string;
    front: string;
    back: string;
    image?: string | null;
  }>;
}

export interface Note {
  researchData?: ResearchData;
  flashcards?: FlashcardDeck;
  title: string;
  content: string;
  createdAt?: EpochMs;
  updatedAt?: EpochMs;
  revision?: number;
  workspaceId?: WorkspaceId;
  /** File UUID, or null when the note sits directly on the workspace. */
  fileId?: ItemId | null;
  encoding?: string;
  languageId?: string;
  languageLocked?: boolean;
}

export type NoteMap = Record<ItemId, Note>;

/**
 * A deleted item, plus the bookkeeping the bin adds. `workspaceName` is
 * denormalised on purpose: the workspace may be gone by the time the bin is
 * read, and the row still has to say where the item came from.
 */
export interface TrashEntry extends ContentItem {
  /** Epoch ms. Retention is measured from here. */
  deletedAt: number;
  workspaceName: string;
}

/* ==========================================================================
 * Account profile
 * ========================================================================== */

export type AccountPlanTier = "freemium" | "lite" | "premium";

export type BillingCycle = "monthly" | "yearly";

/** The paid side of the account. Free accounts carry nulls across the board. */
export interface AccountPlan {
  tier: AccountPlanTier;
  /** null while the account is on Freemium. */
  billingCycle: BillingCycle | null;
  /** Epoch ms of the next charge; null when nothing is due. */
  nextPaymentAt: number | null;
  /** Epoch ms the current plan started; null on Freemium. */
  startedAt: number | null;
}

export interface LinkedDevice {
  id: string;
  name: string;
  platform: "desktop" | "mobile" | "tablet";
  /** Free-form line under the name: browser, OS, app build. */
  detail: string;
  /** Epoch ms of this device's last successful sync. */
  lastSyncAt: number;
  /** True for the device this session is running on. */
  isCurrent: boolean;
}

export interface AccountUsage {
  /** Non-note storage consumed, in bytes. Notes do not count toward this quota. */
  storageUsedBytes: number;
}

/** Public wallet metadata. The private key never lives on this object. */
export interface WalletPublicMeta {
  address: string;
  publicKey?: string;
  providerId: string;
  createdAt: EpochMs | null;
}

/** SQLite row that binds the local database to one wallet key pair. */
export interface DatabaseOwner {
  walletAddress: string;
  publicKey?: string;
  walletProvider?: string;
  boundAt?: EpochMs;
  ownershipProof?: string;
}

/** AES-256-GCM box written to disk / packages. */
export interface EncryptedBlob {
  v: 1;
  alg: "AES-256-GCM";
  iv: string;
  ciphertext: string;
}

/** Temporary encrypted SQLite dump written to the Desktop. */
export interface EncryptedDbFile {
  v: 1;
  kind: "txtnote-encrypted-db";
  headers: {
    alg: "AES-256-GCM";
    walletAddress: string;
    publicKey: string;
    createdAt: EpochMs;
    testMode: boolean;
    /** Present only while the test export is enabled. Never persist this. */
    testPrivateKey?: string;
    testNote?: string;
  };
  iv: string;
  ciphertext: string;
}

export interface EncryptedDbExportResult {
  path: string;
  fileName: string;
  verified: boolean;
  vaultVerified: boolean;
  walletAddress: string;
  publicKey?: string;
  testMode: boolean;
  noteCount: number;
}

export interface BlindRelaySendResult {
  path: string;
  fileName: string;
  walletAddress: string;
  noteCount: number;
  workspaceCount: number;
  serverSeesPrivateKey: boolean;
  plaintextLeaked: boolean;
  ciphertextPreview: string;
  alg: string;
}

export interface BlindRelayNotePreview {
  id: string;
  title: string;
  contentPreview: string;
  vaultOpened: boolean;
}

export interface BlindRelayOpenResult {
  openedWithAddress: string;
  ownerAddress: string | null;
  workspaceNames: string[];
  notes: BlindRelayNotePreview[];
  noteCount: number;
  wrongKeyRejected: boolean;
}

export interface AccountProfile {
  /** Shown wherever shared content says which account it came from. */
  displayName: string;
  /**
   * How the account was created — "Gmail ile kaydolundu", "kripto yöntemleri
   * ile bağlanılıyor", … Filled in by the backend; null until it says.
   */
  registrationMethod: string | null;
  /** Checksummed 0x address. Safe to persist. */
  walletAddress?: string | null;
  /** `local-keyring` today; later `privy`. */
  walletProvider?: string | null;
  plan: AccountPlan;
  /** Storage consumption for the current billing period. */
  usage: AccountUsage;
  /** Epoch ms the account was created; null until the backend knows. */
  createdAt: number | null;
  /** Epoch ms of the most recent sign-in; null until the backend knows. */
  lastLoginAt: number | null;
  devices: LinkedDevice[];
}

/* ==========================================================================
 * UI state
 * ========================================================================== */

export type NavId = "settings" | "profile" | "appearance" | "premium" | "help" | "trash";

export interface NavLink {
  id: NavId;
  label: string;
  /** A lucide-react component. Typed loosely to keep this file dependency-free. */
  icon: unknown;
}

/** An open tab. A projection of `ContentItem`, not a second copy of it. */
export interface Tab {
  id: ItemId;
  workspaceId: WorkspaceId;
  title: string;
  type: ContentType;
}

export interface Point {
  x: number;
  y: number;
}

export interface ItemMenuState {
  isOpen: boolean;
  position: Point;
  selectedItemId: ItemId | null;
}

export interface WorkspaceMenuState {
  isOpen: boolean;
  position: Point;
  workspaceId: WorkspaceId | null;
}

/** Output of `formatRetentionLeft`. `isUrgent` drives the amber accent. */
export interface RetentionLabel {
  label: string;
  isUrgent: boolean;
}

/* ==========================================================================
 * Transport
 * ========================================================================== */

/** Payload accepted when creating a workspace. Server assigns id and badge. */
export interface CreateWorkspaceInput {
  name: string;
}

/** Every field optional — this is a PATCH, not a PUT. */
export interface UpdateWorkspaceInput {
  name?: string;
  avatar?: string | null;
  isPinned?: boolean;
}

export interface CreateItemInput {
  workspaceId: WorkspaceId;
  title?: string;
  type?: ContentType;
}

export interface UpdateItemInput {
  title?: string;
  isPinned?: boolean;
  isPrivate?: boolean;
  isFavorite?: boolean;
}

/**
 * What a workspace deletion took with it. The shell needs the id list to close
 * the matching tabs in one pass.
 */
export interface DeleteWorkspaceResult {
  workspaceId: WorkspaceId;
  removedItemIds: ItemId[];
  /** False when the bin is off — the caller must then drop the note text too. */
  movedToTrash: boolean;
}

/* ==========================================================================
 * Sync / backup
 * ========================================================================== */

/**
 * Local fields an encrypted package is built from.
 * Not a package, not stored as JSON in SQLite, and not a transport object.
 *
 * packageUUID / deviceUUID are generated per change — never equal to
 * noteUUID. One note produces many packages over time.
 */
export interface LocalPackageSource {
  workspace: {
    workspaceUUID: WorkspaceId;
    workspaceName: string;
    createdAt: EpochMs | null;
    updatedAt: EpochMs | null;
  } | null;
  file: {
    exists: boolean;
    fileUUID: ItemId | null;
    fileName: string | null;
  };
  note: {
    noteUUID: NoteId;
    noteName: string;
    content: string;
    createdAt: EpochMs | null;
    updatedAt: EpochMs | null;
    revision: number;
  } | null;
}

/**
 * Sealed package ready to leave the device. `vault` holds note name + body.
 * The signing key is not included.
 */
export interface EncryptedPackage {
  v: 1;
  packageUUID: string;
  deviceUUID: string;
  walletAddress: string;
  createdAt: EpochMs;
  workspace: LocalPackageSource["workspace"];
  file: LocalPackageSource["file"];
  note: {
    noteUUID: NoteId;
    revision: number;
    createdAt: EpochMs | null;
    updatedAt: EpochMs | null;
    vault: EncryptedBlob;
  } | null;
}

/**
 * Canonical note snapshot sent on every sync lane.
 *
 * BACKEND ENTEGRASYON NOKTASI — keep this JSON shape stable. The mock, the
 * HTTP adapter and the future WebSocket all speak this object. Add fields
 * here first; do not invent a second payload on the server.
 */
export interface NoteSyncPayload {
  noteId: ItemId;
  workspaceId: WorkspaceId;
  title: string;
  content: string;
  /** Editor-specific slices (todos, diary entries, mindmap). */
  extras: {
    todos: unknown[];
    entries: Record<string, string>;
    mindmap: { nodes: unknown[]; edges: unknown[] };
    researchData?: ResearchData;
    flashcards?: FlashcardDeck;
    todoDaily?: boolean;
    todoPlan?: {
      persistent?: boolean;
      days?: Record<string, unknown[]>;
      marks?: Record<string, Record<string, { done?: boolean; failed?: boolean }>>;
    };
  };
  /** Epoch ms of this snapshot. */
  updatedAt: number;
  /** Checksum of the canonical body (noteId, title, content, extras). */
  hash: string;
  /** Device that produced this snapshot. */
  deviceId: string;
  /** Public wallet that sealed this snapshot, when encryption is on. */
  walletAddress?: string;
  /** Unique per change — never equal to noteId. */
  packageUUID?: string;
  /** Sealed title/content/extras. Present on disk and on the wire. */
  vault?: EncryptedBlob;
}

/** One cloud backup, shown in the note's "Not Geçmişi" menu. */
export interface NoteVersion {
  id: string;
  noteId: ItemId;
  /** Epoch ms the cloud accepted this snapshot. */
  createdAt: number;
  hash: string;
  payload: NoteSyncPayload;
  source: "cloud" | "local";
}

/** Uniform failure shape. Adapters throw this; the UI renders `message`. */
export interface ServiceError {
  code:
    | "NOT_FOUND"
    | "VALIDATION"
    | "CONFLICT"
    | "PAYLOAD_TOO_LARGE"
    | "UNAUTHORIZED"
    | "NETWORK"
    | "UNKNOWN";
  /** Already localised — safe to show to the user. */
  message: string;
  /** Field name, when `code` is `VALIDATION`. */
  field?: string;
}
