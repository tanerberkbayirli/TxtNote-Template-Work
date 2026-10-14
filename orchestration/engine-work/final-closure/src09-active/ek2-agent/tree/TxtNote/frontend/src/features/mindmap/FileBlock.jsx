/**
 * A file pocket on the map: drop PDFs, pictures and other documents onto the
 * folder face, or pick them from disk.
 */

import { memo, useRef, useState } from "react";
import { GripHorizontal, Plus, X } from "lucide-react";
import { FileTypeIcon } from "../../components/ui/FileTypeIcon";
import { UPLOAD_MAX_BYTES, UPLOAD_MAX_LABEL } from "../../config/limits";
import { createId } from "../../lib/id";
import { FILE_KIND, detectFileKind, formatFileSize } from "../../lib/fileType";
import { cn } from "../../lib/cn";
import { FILE_SLOT_MAX, NODE_KIND, NODE_SIZE } from "./constants";

const stopPointer = (event) => event.stopPropagation();

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("unreadable"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("unreadable"));
    reader.readAsDataURL(file);
  });

export const FileBlock = memo(function FileBlock({
  node,
  highlight,
  zIndex = 10,
  isConnecting,
  onPointerDown,
  onSelect,
  onChange,
  onPreviewImage,
}) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [isOver, setIsOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const size = NODE_SIZE[NODE_KIND.FILE];
  const files = node.files ?? [];
  const bodyClass = isConnecting ? "pointer-events-none" : null;

  const ingest = async (list) => {
    const incoming = [...list].filter(Boolean);
    if (incoming.length === 0) return;

    const room = FILE_SLOT_MAX - files.length;
    if (room <= 0) {
      setError(`En fazla ${FILE_SLOT_MAX} dosya eklenebilir.`);
      return;
    }

    setBusy(true);
    const next = [...files];
    let message = "";

    for (const file of incoming.slice(0, room)) {
      if (file.size > UPLOAD_MAX_BYTES) {
        message = `${file.name} çok büyük. En fazla ${UPLOAD_MAX_LABEL}.`;
        continue;
      }
      try {
        const data = await readFile(file);
        next.push({
          id: createId("file"),
          name: file.name,
          type: file.type,
          size: file.size,
          kind: detectFileKind({ name: file.name, type: file.type }),
          data,
        });
      } catch {
        message = `${file.name} okunamadı.`;
      }
    }

    if (incoming.length > room) {
      message = `En fazla ${FILE_SLOT_MAX} dosya eklenebilir.`;
    }

    setBusy(false);
    setError(message);
    if (next.length !== files.length) onChange(node.id, { files: next });
  };

  const openFile = (entry) => {
    if (!entry?.data) return;
    if (entry.kind === FILE_KIND.IMAGE || entry.type?.startsWith("image/")) {
      onPreviewImage?.(entry.data);
      return;
    }
    const link = document.createElement("a");
    link.href = entry.data;
    link.download = entry.name || "dosya";
    link.rel = "noopener";
    link.click();
  };

  return (
    <div
      data-node-id={node.id}
      role="group"
      tabIndex={0}
      aria-label="Dosya"
      onPointerDown={(event) => onPointerDown(event, node)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onSelect?.(node.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isConnecting) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsOver(false);
        if (!isConnecting) ingest(event.dataTransfer.files);
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm",
        "border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800",
        isOver && "ring-2 ring-neutral-400 dark:ring-neutral-500",
        highlight,
      )}
      style={{
        left: node.x,
        top: node.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
    >
      <div className="flex h-7 shrink-0 cursor-grab items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-1.5 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900/60">
        <GripHorizontal
          className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500"
          strokeWidth={2}
        />
        <span className="mr-auto select-none text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Dosya
        </span>
        <button
          type="button"
          tabIndex={-1}
          title="Dosya ekle"
          aria-label="Dosya ekle"
          onPointerDown={stopPointer}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
            bodyClass,
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="shrink-0 border-b border-red-100 bg-red-50 px-2.5 py-1 text-[10px] leading-snug text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClass)}>
        {files.length === 0 ? (
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={stopPointer}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-2 px-3 text-center",
              "text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900/40",
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-400 dark:bg-sky-950/40 dark:text-sky-300">
              <FileTypeIcon kind={FILE_KIND.DOCUMENT} className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <span className="text-[11px] font-medium leading-snug">
              {busy ? "Ekleniyor…" : "PDF, görsel veya dosya bırak"}
            </span>
          </button>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1">
            {files.map((entry) => (
              <li key={entry.id} className="group flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900/60">
                <button
                  type="button"
                  title={entry.name}
                  onPointerDown={stopPointer}
                  onClick={() => openFile(entry)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                  <FileTypeIcon kind={entry.kind} className="h-4 w-4" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-neutral-800 dark:text-neutral-100">
                      {entry.name}
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      {formatFileSize(entry.size)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  title="Kaldır"
                  aria-label={`${entry.name} dosyasını kaldır`}
                  onPointerDown={stopPointer}
                  onClick={() =>
                    onChange(node.id, { files: files.filter((item) => item.id !== entry.id) })
                  }
                  className="rounded p-0.5 text-neutral-400 opacity-0 hover:bg-neutral-200 hover:text-neutral-800 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(event) => {
          ingest(event.target.files ?? []);
          event.target.value = "";
        }}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
});
