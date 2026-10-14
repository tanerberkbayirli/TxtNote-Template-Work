/**
 * Turn a list of relative paths into nested folder items, then parent each
 * file under the folder that owns it. Sibling order follows the incoming list.
 */

import { stampCreated } from "./entity.js";
import { FOLDER_NOTE_TYPE } from "./folder.js";
import { splitSafePath } from "./filePath.js";
import { folderTitleFromName } from "./fileType.js";

const pathPartsOf = (relative) => {
  if (!relative) return null;
  if (Array.isArray(relative)) return relative.filter(Boolean);
  if (typeof relative === "object" && relative.parts) {
    return Array.isArray(relative.parts) ? relative.parts.filter(Boolean) : splitSafePath(relative.parts);
  }
  return splitSafePath(relative);
};

export function collectDirectoryPaths(relativePaths) {
  const dirs = new Set();
  for (const relative of relativePaths ?? []) {
    const parts = pathPartsOf(relative);
    if (!parts || parts.length === 0) continue;
    const asDirectory = Boolean(relative?.isDirectory);
    const folderParts = asDirectory ? parts : parts.slice(0, -1);
    for (let depth = 1; depth <= folderParts.length; depth += 1) {
      dirs.add(folderParts.slice(0, depth).join("/"));
    }
  }
  return [...dirs]
    .filter(Boolean)
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b, "tr"));
}

export function buildFolderRecords(
  relativePaths,
  { workspaceId, parentId = null, createId, now = Date.now } = {},
) {
  const paths = collectDirectoryPaths(relativePaths);
  const idByPath = new Map();
  const folders = [];

  for (const dirPath of paths) {
    const parts = splitSafePath(dirPath);
    if (!parts) continue;
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const folderParent = parentPath ? (idByPath.get(parentPath) ?? parentId) : parentId;
    const folder = stampCreated(
      {
        id: createId("itm"),
        workspaceId,
        title: folderTitleFromName(name),
        type: "folder",
        noteType: FOLDER_NOTE_TYPE,
        parentId: folderParent ?? null,
        isPinned: false,
        isPrivate: false,
        isFavorite: false,
      },
      now(),
    );
    idByPath.set(dirPath, folder.id);
    folders.push(folder);
  }

  return { folders, idByPath };
}

export function parentIdForPath(relativePath, idByPath, fallbackParentId = null) {
  const parts = pathPartsOf(relativePath);
  if (!parts || parts.length < 2) return fallbackParentId ?? null;
  const dirPath = parts.slice(0, -1).join("/");
  return idByPath.get(dirPath) ?? fallbackParentId ?? null;
}
