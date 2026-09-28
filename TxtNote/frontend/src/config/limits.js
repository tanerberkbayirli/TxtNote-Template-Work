/**
 * Policy limits: input ceilings, retention windows and timer intervals.
 * The backend must enforce the same numbers — see backend/README.md.
 */


export const WORKSPACE_NAME_MAX = 32;

/** Ceiling for a workspace picture. Data URLs live in memory, so keep it small. */
export const WORKSPACE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Ceiling for a picture on a mindmap card. Also held as a data URL. */
export const CARD_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const CARD_IMAGE_MAX_LABEL = `${Math.round(CARD_IMAGE_MAX_BYTES / (1024 * 1024))} MB`;

/**
 * Full bytes that may live in IndexedDB / SQLite media. Text, images and other
 * modest files stay here. Heavier binaries keep only metadata in the snapshot.
 */
export const UPLOAD_INLINE_MAX_BYTES = 8 * 1024 * 1024;

/** Source that the in-app code editor will load. Bigger text files stay download-only. */
export const UPLOAD_TEXT_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Hard ceiling for a single picked file. Large binaries are not copied into
 * IndexedDB; the desktop app may still write them to its media folder in chunks.
 */
export const UPLOAD_MAX_BYTES = 512 * 1024 * 1024;

/** The same number, said out loud in the picker's error line. */
export const UPLOAD_MAX_LABEL = `${Math.round(UPLOAD_MAX_BYTES / (1024 * 1024))} MB`;

export const UPLOAD_INLINE_MAX_LABEL = `${Math.round(UPLOAD_INLINE_MAX_BYTES / (1024 * 1024))} MB`;

export const UPLOAD_ZIP_MAX_COMPRESSED = 80 * 1024 * 1024;

export const UPLOAD_ZIP_MAX_UNCOMPRESSED = 200 * 1024 * 1024;

export const UPLOAD_ZIP_MAX_ENTRIES = 2000;

export const UPLOAD_ZIP_MAX_RATIO = 100;

/** Fixed stay. Everything the bin accepts leaves 30 days after it arrived. */
export const TRASH_RETENTION_DAYS = 30;

/** Bin starts on. Switching it off empties it on the spot — see App. */
export const DEFAULT_TRASH_ENABLED = true;

/** How often the trash view re-reads the clock to refresh its countdowns. */
export const TRASH_TICK_MS = 30000;

/** How often expired entries are swept out of the bin. */
export const TRASH_SWEEP_MS = 60000;

/* -- sync / backup --------------------------------------------------------- */

/** Lane A: write the latest note to local storage this often while dirty. */
export const LOCAL_BACKUP_MS = 500;

/** Lane B default: emit to other devices this long after typing stops. */
export const DEFAULT_PEER_DEBOUNCE_SECONDS = 3;

/** Lane C default: attempt a cloud backup this often. */
export const DEFAULT_CLOUD_INTERVAL_MINUTES = 10;

/** Cloud interval the settings panel offers (minutes). */
export const CLOUD_INTERVAL_MINUTES_MIN = 5;
export const CLOUD_INTERVAL_MINUTES_MAX = 24 * 60;

/** Bulut yedekleme aralığı seçenekleri (dakika). */
export const CLOUD_INTERVAL_OPTIONS = [5, 10, 30, 60, 24 * 60];

/** Peer debounce presets shown as chips. Premium may also type a custom value. */
export const PEER_DEBOUNCE_PRESETS = [1, 3, 5, 10, 60];