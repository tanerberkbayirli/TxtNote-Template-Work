/**
 * Read-model for a future encrypted package.
 *
 * SQLite stays relational. This only lifts Workspace / File / Note fields
 * from local state. It does not create a package, packageUUID, deviceUUID,
 * or any transport.
 */

const INITIAL_NOTE_REVISION = 1;

const asId = (value) => (typeof value === "string" && value ? value : null);

const asTime = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const asRevision = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : INITIAL_NOTE_REVISION;

/**
 * File UUID for a note: the folder it sits in, or null when it is a
 * workspace-root note.
 */
export const fileUuidForItem = (item) => asId(item?.parentId);

/**
 * @param {{
 *   workspace?: { id?: string, name?: string, createdAt?: number, updatedAt?: number } | null,
 *   file?: { id?: string, title?: string, name?: string } | null,
 *   item?: { id?: string, title?: string, parentId?: string | null, createdAt?: number, updatedAt?: number } | null,
 *   note?: { title?: string, content?: string, createdAt?: number, updatedAt?: number, revision?: number, fileId?: string | null } | null,
 * }} parts
 */
export function localPackageSource({ workspace = null, file = null, item = null, note = null } = {}) {
  const fileUUID = asId(file?.id) ?? fileUuidForItem(item) ?? asId(note?.fileId);
  const noteUUID = asId(item?.id) ?? asId(note?.id);

  return {
    workspace: workspace
      ? {
          workspaceUUID: asId(workspace.id),
          workspaceName: workspace.name ?? "",
          createdAt: asTime(workspace.createdAt),
          updatedAt: asTime(workspace.updatedAt),
        }
      : null,
    file: {
      exists: Boolean(fileUUID),
      fileUUID,
      fileName: file?.title ?? file?.name ?? null,
    },
    note: noteUUID
      ? {
          noteUUID,
          noteName: note?.title ?? item?.title ?? "",
          content: note?.content ?? "",
          createdAt: asTime(note?.createdAt) ?? asTime(item?.createdAt),
          updatedAt: asTime(note?.updatedAt) ?? asTime(item?.updatedAt),
          revision: asRevision(note?.revision),
        }
      : null,
  };
}

/** Compare title/content/extras to decide whether a local revision should bump. */
export function noteFingerprint(note) {
  if (!note || typeof note !== "object") return "";
  return JSON.stringify({
    title: note.title ?? "",
    content: note.content ?? "",
    todos: note.todos ?? [],
    entries: note.entries ?? {},
    mindmap: note.mindmap ?? { nodes: [], edges: [] },
    ...(note.researchData != null ? { researchData: note.researchData } : {}),
    ...(note.flashcards && typeof note.flashcards === "object" ? { flashcards: note.flashcards } : {}),
    ...(note.todoDaily || note.todoPlan
      ? { todoDaily: Boolean(note.todoDaily || note.todoPlan), todoPlan: note.todoPlan ?? {} }
      : {}),
  });
}

export function nextNoteRevision(existing, incoming) {
  if (!existing) {
    const offered = incoming?.revision;
    return typeof offered === "number" && offered >= 1 ? offered : INITIAL_NOTE_REVISION;
  }
  const current =
    typeof existing.revision === "number" && existing.revision >= 1 ? existing.revision : INITIAL_NOTE_REVISION;
  if (noteFingerprint(existing) === noteFingerprint(incoming)) return current;
  return current + 1;
}
