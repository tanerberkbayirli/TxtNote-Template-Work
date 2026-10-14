/**
 * Local entity metadata: UUID identity is assigned at create time, timestamps
 * are epoch ms, and names are labels only.
 */

export const INITIAL_NOTE_REVISION = 1;

export const nowMs = () => Date.now();

/** Stamp create + update times without overwriting an existing createdAt. */
export const stampCreated = (entity, at = nowMs()) => ({
  ...entity,
  createdAt: typeof entity?.createdAt === "number" ? entity.createdAt : at,
  updatedAt: typeof entity?.updatedAt === "number" ? entity.updatedAt : at,
});

export const stampUpdated = (entity, at = nowMs()) => ({
  ...entity,
  updatedAt: at,
});

/** Folders and uploaded files are the File entity for a future package. */
export const isFileEntity = (item) =>
  item?.type === "folder" ||
  item?.type === "file" ||
  item?.type === "media" ||
  item?.noteType === "folder";

/**
 * Note.fileUUID. Null when the note sits directly on its workspace.
 * `parentId` is the folder's UUID — never a name.
 */
export const fileUuidForItem = (item) => {
  const parentId = item?.parentId;
  return typeof parentId === "string" && parentId ? parentId : null;
};
