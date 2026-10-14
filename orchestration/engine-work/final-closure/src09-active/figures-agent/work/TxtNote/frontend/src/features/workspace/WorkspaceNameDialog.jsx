/**
 * Create/rename workspace dialog. One component, two modes.
 */

import { useEffect, useRef } from "react";
import { Check, Plus, X } from "lucide-react";
import { WORKSPACE_NAME_MAX } from "../../config/limits";
import { WorkspaceBadge } from "./WorkspaceBadge";
import { cn } from "../../lib/cn";
import { badgeFromName, normalizeName } from "../../lib/text";
import { TxtNoteWordmark } from "../../brand/TxtNoteWordmark.jsx";

export const WORKSPACE_NAME_COPY = {
  setup: {
    title: "TxtNote'a hoş geldin",
    hint: "Başlamak için ilk çalışma alanına bir ad ver.",
    label: "Çalışma alanı adı",
    placeholder: "Örn. Kişisel",
    submit: "Başla",
    icon: Plus,
  },
  create: {
    title: "Yeni çalışma alanı",
    hint: "Oluşturduğun alan hemen açılır.",
    label: "Çalışma alanı adı",
    placeholder: "Örn. Okul projeleri",
    submit: "Oluştur",
    icon: Plus,
  },
  rename: {
    title: "Çalışma ortamının adını değiştir",
    hint: "Yeni ad her yerde anında görünür.",
    label: "Çalışma ortamı adı",
    placeholder: "Örn. Okul projeleri",
    submit: "Kaydet",
    icon: Check,
  },
};

/**
 * Modal name prompt, shared by creating a workspace and renaming one.
 * No <form> element on purpose (Artifact sandbox); Enter submits, ESC cancels.
 */
export const WorkspaceNameDialog = ({
  isOpen,
  mode = "create",
  workspace,
  name,
  error,
  onNameChange,
  onSubmit,
  onClose,
  allowDismiss = true,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Renaming opens on the current name, selected, so typing replaces it.
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (mode === "rename") inputRef.current?.select();
    });
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && allowDismiss) {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, mode, onClose, allowDismiss]);

  if (!isOpen) return null;

  const copy = WORKSPACE_NAME_COPY[mode];
  const SubmitIcon = copy.icon;

  // Backdrop click cancels; clicks that land on the panel bubble up but are ignored
  // because the target is no longer the backdrop element itself.
  return (
    <div
      onMouseDown={(event) => {
        if (allowDismiss && event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 px-4 pt-[18vh] backdrop-blur-[1px] dark:bg-black/60"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {mode === "setup" && (
              <TxtNoteWordmark className="mb-3 h-7 w-auto invert dark:invert-0" />
            )}
            <h2
              id="create-workspace-title"
              className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {copy.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
              {copy.hint}
            </p>
          </div>

          {allowDismiss && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>

        <label
          htmlFor="create-workspace-name"
          className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
        >
          {copy.label}
        </label>

        <div className="mt-1.5 flex items-center gap-2">
          {/* Live badge preview — same square the sidebar header shows. A
              workspace with a picture keeps showing it; the letter is a fallback. */}
          <WorkspaceBadge
            workspace={workspace}
            size="md"
            tone="solid"
            letter={badgeFromName(name)}
          />

          <input
            id="create-workspace-name"
            ref={inputRef}
            type="text"
            value={name}
            maxLength={WORKSPACE_NAME_MAX}
            autoComplete="off"
            placeholder={copy.placeholder}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "create-workspace-error" : undefined}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
            className={cn(
              "h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500",
              error
                ? "border-red-400 focus:ring-red-400/60 dark:border-red-500"
                : "border-neutral-300 focus:ring-neutral-400 dark:border-neutral-600 dark:focus:ring-neutral-500",
            )}
          />
        </div>

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <p
            id="create-workspace-error"
            role="alert"
            className="min-h-[16px] text-[12px] text-red-600 dark:text-red-400"
          >
            {error}
          </p>
          <span className="shrink-0 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
            {normalizeName(name).length}/{WORKSPACE_NAME_MAX}
          </span>
        </div>

        <div className={cn("mt-4 flex gap-2", allowDismiss ? "justify-end" : "justify-stretch")}>
          {allowDismiss && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full border border-neutral-300 px-4 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Vazgeç
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!normalizeName(name)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[12px] font-medium text-neutral-50 transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:ring-offset-neutral-800",
              !allowDismiss && "w-full",
            )}
          >
            <SubmitIcon className="h-4 w-4" strokeWidth={2} />
            {copy.submit}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*  Workspace picture dialog                                                   */
/* ========================================================================== */
