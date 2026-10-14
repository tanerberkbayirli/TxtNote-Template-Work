/**
 * Turn picked files, folders and zip archives into sidebar items.
 *
 * Folder trees (from a directory pick or from an archive) are rebuilt as
 * nested folder items. Large / binary files keep metadata only; text and
 * modest files may have their bytes persisted.
 */

import {
  UPLOAD_MAX_LABEL,
} from "../config/limits.js";
import { stampCreated } from "./entity.js";
import { createId } from "./id.js";
import {
  accessKindFor,
  isOverHardLimit,
  storageModeFor,
} from "./fileStorage.js";
import { FOLDER_NOTE_TYPE } from "./folder.js";
import { buildFolderRecords, parentIdForPath } from "./folderImport.js";
import { joinPath, splitSafePath, yieldToMain } from "./filePath.js";
import { readFileBytes } from "./fileText.js";
import {
  detectFileKind,
  folderTitleFromName,
  isExtractableArchive,
  mimeFromExtension,
  titleFromFileName,
} from "./fileType.js";
import { uploadMetaOf } from "./filePick.js";
import { rememberSessionFile } from "./fileSession.js";
import { createUploadedItem } from "./upload.js";
import { extractZipEntries, isZipFile } from "./zipImport.js";

const asFileList = (files) => Array.from(files ?? []).filter(Boolean);

const relativePathOf = (file) => {
  const relative = uploadMetaOf(file).relativePath || file?.webkitRelativePath || "";
  return relative && relative !== file?.name ? relative : file?.name || "";
};

const fileFromBytes = (name, bytes, type) => {
  const payload = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  const mime = type || mimeFromExtension(name) || "application/octet-stream";
  try {
    return new File([payload], name, { type: mime });
  } catch {
    return new Blob([payload], { type: mime });
  }
};

const report = (onProgress, payload) => {
  onProgress?.(payload);
};

export async function ingestUploads({
  files,
  workspaceId,
  parentId = null,
  isTauri = false,
  writeMedia,
  saveNote,
  rememberHandle,
  onProgress,
  extractArchives = false,
} = {}) {
  const picked = asFileList(files);
  const items = [];
  const notes = {};
  const errors = [];
  const expandedFolderIds = [];
  const rootIds = [];

  if (!workspaceId) {
    return { items, notes, errors: ["Çalışma alanı yok."], expandedFolderIds, rootIds };
  }
  if (picked.length === 0) {
    return { items, notes, errors: [], expandedFolderIds, rootIds };
  }

  report(onProgress, { current: 0, total: picked.length, label: "Dosyalar listeleniyor…" });

  const entries = [];
  let processed = 0;

  for (const file of picked) {
    processed += 1;
    const name = file.name || "Adsız dosya";
    report(onProgress, {
      current: processed,
      total: picked.length,
      label: extractArchives && isExtractableArchive(file) ? `${name} açılıyor…` : `${name} ekleniyor…`,
    });

    if (isOverHardLimit(file.size)) {
      errors.push(`“${name}” en fazla ${UPLOAD_MAX_LABEL} olabilir.`);
      await yieldToMain();
      continue;
    }

    if ((isZipFile(file) || isExtractableArchive(file)) && extractArchives) {
      try {
        const bytes = await readFileBytes(file);
        const extracted = await extractZipEntries(bytes, { compressedSize: file.size });
        extracted.errors.forEach((message) => errors.push(message));
        if (extracted.entries.length === 0) {
          await yieldToMain();
          continue;
        }
        const wrap = splitSafePath(titleFromFileName(name) || "Arşiv");
        const wrapName = wrap ? wrap[0] : "Arşiv";
        for (const entry of extracted.entries) {
          const parts = [wrapName, ...entry.parts];
          entries.push({
            parts,
            relativePath: joinPath(parts),
            name: entry.name,
            bytes: entry.bytes,
            file: entry.isDirectory ? null : fileFromBytes(entry.name, entry.bytes, mimeFromExtension(entry.name)),
            handle: null,
            isDirectory: entry.isDirectory,
            fromArchive: true,
          });
        }
      } catch {
        errors.push(`“${name}” arşivi açılamadı.`);
      }
      await yieldToMain();
      continue;
    }

    const relative = relativePathOf(file);
    const parts = splitSafePath(relative) || splitSafePath(name);
    if (!parts) {
      errors.push(`“${name}” yolu geçersiz.`);
      await yieldToMain();
      continue;
    }
    entries.push({
      parts,
      relativePath: joinPath(parts),
      name: parts[parts.length - 1],
      bytes: null,
      file,
      handle: uploadMetaOf(file).handle,
      isDirectory: false,
      fromArchive: false,
    });
    if (processed % 16 === 0) await yieldToMain();
  }

  const { folders, idByPath } = buildFolderRecords(
    entries.map((entry) => ({ parts: entry.parts, isDirectory: entry.isDirectory })),
    { workspaceId, parentId, createId },
  );

  items.push(...folders);
  folders.forEach((folder) => {
    if ((folder.parentId ?? null) === (parentId ?? null)) {
      rootIds.push(folder.id);
      expandedFolderIds.push(folder.id);
    }
  });

  const fileEntries = entries.filter((entry) => !entry.isDirectory && entry.file);
  let stored = 0;
  for (const entry of fileEntries) {
    stored += 1;
    report(onProgress, {
      current: stored,
      total: fileEntries.length,
      label: `${entry.name} ekleniyor…`,
    });
    try {
      const created = await persistEntry(entry, {
        workspaceId,
        parentId,
        idByPath,
        isTauri,
        writeMedia,
        saveNote,
        rememberHandle,
        onProgress,
      });
      if (created.item) {
        items.push(created.item);
        if ((created.item.parentId ?? null) === (parentId ?? null)) rootIds.push(created.item.id);
      }
      if (created.note) notes[created.item.id] = created.note;
      if (created.error) errors.push(created.error);
    } catch (error) {
      errors.push(error?.message || `“${entry.name}” yüklenemedi.`);
    }
    if (stored % 16 === 0) await yieldToMain();
  }

  return {
    items,
    notes,
    errors,
    expandedFolderIds: [...new Set(expandedFolderIds)],
    rootIds: [...new Set(rootIds)],
  };
}

async function persistEntry(entry, ctx) {
  const file = entry.file;
  const fileName = entry.name || file.name;
  const mimeType = file.type || mimeFromExtension(fileName);
  const kind = detectFileKind({ name: fileName, type: mimeType });
  const size = file.size ?? entry.bytes?.length ?? 0;
  const hasHandle = Boolean(entry.handle);
  const parent = parentIdForPath(entry.parts, ctx.idByPath, ctx.parentId);
  const storageMode = storageModeFor({
    name: fileName,
    type: mimeType,
    size,
    kind,
    isTauri: ctx.isTauri,
    hasHandle,
  });
  const accessKind = accessKindFor({
    name: fileName,
    type: mimeType,
    size,
    kind,
    isTauri: ctx.isTauri,
    hasHandle,
  });

  const item = createUploadedItem(file, ctx.workspaceId, {
    fileName,
    mimeType,
    fileKind: kind,
    fileSize: size,
    parentId: parent,
    relativePath: entry.relativePath,
    storageMode,
    accessKind,
    persistentAccess: hasHandle,
    needsReselect: !hasHandle && !file,
    url: null,
  });

  rememberSessionFile(item.id, file, entry.handle || null);

  if (hasHandle && typeof ctx.rememberHandle === "function") {
    try {
      await ctx.rememberHandle(item.id, entry.handle);
      item.persistentAccess = true;
      item.needsReselect = false;
      item.accessKind = "fileHandle";
    } catch {
      item.persistentAccess = Boolean(file);
      item.needsReselect = !file;
    }
  }

  return { item, note: null };
}

export function createUploadFolder(workspaceId, title, parentId = null) {
  return stampCreated({
    id: createId("itm"),
    workspaceId,
    title: folderTitleFromName(title),
    type: "folder",
    noteType: FOLDER_NOTE_TYPE,
    parentId,
    isPinned: false,
    isPrivate: false,
    isFavorite: false,
  });
}
