/**
 * Workspace picture upload dialog. Reads the file client-side into a data URL;
 * swap the reader for an upload call when the media service exists.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Trash2, Upload, X } from "lucide-react";
import { WORKSPACE_AVATAR_MAX_BYTES } from "../../config/limits";
import { WorkspaceBadge } from "./WorkspaceBadge";
import { cn } from "../../lib/cn";

export const AVATAR_MAX_LABEL = `${Math.round(WORKSPACE_AVATAR_MAX_BYTES / (1024 * 1024))} MB`;

/**
 * Picks the square that stands in for a workspace. The file never leaves the
 * page: it is read to a data URL and held in state, so nothing is uploaded.
 */
export const WorkspaceAvatarDialog = ({ isOpen, workspace, onSave, onClose }) => {
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  const currentAvatar = workspace?.avatar ?? null;
  // Seeded at mount rather than in an effect, so the first paint already shows
  // the picture the workspace has. The caller keys this per workspace, so every
  // open is a fresh mount and there is no stale preview to clear.
  const [preview, setPreview] = useState(currentAvatar);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  const readFile = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Yalnızca görsel dosyası seçebilirsin.");
      return;
    }
    if (file.size > WORKSPACE_AVATAR_MAX_BYTES) {
      setError(`Görsel en fazla ${AVATAR_MAX_LABEL} olabilir. Daha küçük bir dosya seç.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setError("");
    };
    reader.onerror = () => setError("Görsel okunamadı. Başka bir dosya dene.");
    reader.readAsDataURL(file);
  }, []);

  if (!isOpen || !workspace) return null;

  const hasPreview = Boolean(preview);
  const isUnchanged = preview === currentAvatar;

  const pickFile = () => inputRef.current?.click();

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 px-4 pt-[18vh] backdrop-blur-[1px] dark:bg-black/60"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-avatar-title"
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="workspace-avatar-title"
              className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Profil resmini değiştir
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
              {workspace.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Drop zone doubles as the preview, so the result is what you see. */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            readFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mt-4 flex items-center gap-3 rounded-lg border border-dashed p-3 transition-colors duration-150",
            isDragging
              ? "border-neutral-500 bg-neutral-100 dark:border-neutral-400 dark:bg-neutral-700/50"
              : "border-neutral-300 dark:border-neutral-600",
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <WorkspaceBadge workspace={null} size="lg" tone="solid" letter={workspace.badge} />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200">
              {hasPreview ? "Bu resim kullanılacak" : "Resim yok — baş harf gösterilir"}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              Sürükleyip bırak ya da bir dosya seç. En fazla {AVATAR_MAX_LABEL}.
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={pickFile}
                className="flex h-8 items-center gap-1.5 rounded-full border border-neutral-300 px-3 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                {hasPreview ? "Değiştir" : "Dosya seç"}
              </button>

              {hasPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setError("");
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            readFile(event.target.files?.[0]);
            // Reset, so picking the same file twice still fires a change.
            event.target.value = "";
          }}
        />

        <p role="alert" className="mt-1.5 min-h-[16px] text-[12px] text-red-600 dark:text-red-400">
          {error}
        </p>

        <div className="mt-3 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="h-9 rounded-full border border-neutral-300 px-4 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => onSave(workspace.id, preview)}
            disabled={isUnchanged}
            className="flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[12px] font-medium text-neutral-50 transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:ring-offset-neutral-800"
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*  Confirm dialog                                                             */
/* ========================================================================== */
