/**
 * The bin screen.
 */

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { TRASH_RETENTION_DAYS, TRASH_TICK_MS } from "../../config/limits";
import { TrashRow } from "./TrashRow";
import { TrashToggle } from "./TrashToggle";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/cn";
import { nestWorkspaceItems } from "../../lib/folder";

/**
 * The trash screen: the deleted items in the order they were thrown out, with
 * the on/off switch and the empty-everything button parked at the bottom.
 */
export const TrashView = ({ entries, isEnabled, onToggle, onRestore, onDeleteForever, onEmptyAll }) => {
  const now = useNow(TRASH_TICK_MS);
  // null | "all" | "disable" | the entry waiting on a yes.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => new Set());
  const tree = useMemo(() => nestWorkspaceItems(entries), [entries]);

  const isEmpty = entries.length === 0;

  const closeConfirm = useCallback(() => setPendingDelete(null), []);
  const toggleFolder = useCallback((id) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Switching off wipes the bin, so an occupied bin asks first. An empty one
   * has nothing to lose and flips straight away.
   */
  const requestToggle = (next) => {
    if (next || isEmpty) onToggle(next);
    else setPendingDelete("disable");
  };

  const runPendingDelete = () => {
    if (pendingDelete === "all") onEmptyAll();
    else if (pendingDelete === "disable") onToggle(false);
    else if (pendingDelete) onDeleteForever(pendingDelete.id);
    setPendingDelete(null);
  };

  const confirmCopy = {
    all: {
      title: "Tüm öğeler kalıcı olarak silinsin mi?",
      description: `Çöp kutusundaki ${entries.length} öğe kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: "Hepsini sil",
    },
    disable: {
      title: "Çöp kutusu kapatılsın mı?",
      description: `İçindeki ${entries.length} öğe hemen ve kalıcı olarak silinecek. Bundan sonra sildiklerin de çöp kutusuna uğramadan gider.`,
      confirmLabel: "Kapat ve sil",
    },
    one: {
      title: "Bu öğe kalıcı olarak silinsin mi?",
      description: `“${pendingDelete?.title ?? ""}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: "Kalıcı olarak sil",
    },
  }[typeof pendingDelete === "string" ? pendingDelete : "one"];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* deleted items — kept in the order they arrived, newest first */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-8 py-10">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </span>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Çöp kutusu
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {!isEnabled
                  ? "Çöp kutusu kapalı."
                  : isEmpty
                    ? `Sildiğin içerikler önce buraya düşer ve ${TRASH_RETENTION_DAYS} gün bekler.`
                    : `${entries.length} öğe bekliyor. Geri yükle ya da kalıcı olarak sil.`}
              </p>
            </div>
          </div>

          {!isEnabled && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-[12px] leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <p>
                Sildiğin içerikler buraya uğramadan kalıcı olarak siliniyor. Geri alabilmek için
                aşağıdaki anahtarı aç.
              </p>
            </div>
          )}

          {isEmpty ? (
            <div className="mt-6 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700">
              <Trash2
                className="mx-auto h-6 w-6 text-neutral-300 dark:text-neutral-600"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Çöp kutusu boş
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {isEnabled
                  ? `Bir içeriği sildiğinde burada listelenir; ${TRASH_RETENTION_DAYS} gün boyunca geri alabilirsin.`
                  : "Çöp kutusu kapalıyken burada hiçbir şey birikmez."}
              </p>
            </div>
          ) : (
            <TrashTree
              rows={tree.roots}
              childrenByParent={tree.childrenByParent}
              expandedFolderIds={expandedFolderIds}
              now={now}
              onToggleFolder={toggleFolder}
              onRestore={onRestore}
              onRequestDelete={setPendingDelete}
            />
          )}
        </div>
      </div>

      {/* settings + actions — the one row that stays put while the list scrolls */}
      <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-8 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Çöp kutusunu kullan
            </p>

            <div className="mt-1.5">
              <TrashToggle isEnabled={isEnabled} onToggle={requestToggle} />
            </div>

            <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              {isEnabled
                ? `Silinen içerikler ${TRASH_RETENTION_DAYS} gün burada bekler, sonra kendiliğinden gider.`
                : "Kapalıyken silinen içerikler doğrudan ve kalıcı olarak gider."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPendingDelete("all")}
            disabled={isEmpty}
            title={isEmpty ? "Çöp kutusu zaten boş" : "Tüm çöp kutusunu boşalt"}
            className={cn(
              "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-[12px] font-medium",
              "transition-colors duration-150 active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50",
              "border-red-200 bg-white text-red-600 hover:bg-red-50",
              "dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:ring-offset-neutral-900",
              "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-transparent disabled:text-neutral-400 disabled:hover:bg-transparent",
              "dark:disabled:border-neutral-800 dark:disabled:text-neutral-600 dark:disabled:hover:bg-transparent",
            )}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Tüm çöp kutusunu boşalt
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        onConfirm={runPendingDelete}
        onClose={closeConfirm}
      />
    </div>
  );
};

/** The bin uses the same parentId tree as the sidebar, but keeps it collapsed by default. */
const TrashTree = ({
  rows,
  childrenByParent,
  expandedFolderIds,
  now,
  onToggleFolder,
  onRestore,
  onRequestDelete,
  depth = 0,
}) => (
  <ul className={depth === 0 ? "mt-6 space-y-1.5" : "ml-5 mt-1.5 space-y-1.5 border-l border-neutral-200 pl-3 dark:border-neutral-800"}>
    {rows.map((entry) => {
      const children = childrenByParent.get(entry.id) ?? [];
      const expanded = expandedFolderIds.has(entry.id);
      return (
        <li key={entry.id}>
          <TrashRow
            entry={entry}
            childCount={children.length}
            depth={depth}
            isExpanded={expanded}
            now={now}
            onToggleFolder={onToggleFolder}
            onRestore={onRestore}
            onRequestDelete={onRequestDelete}
          />
          {expanded && children.length > 0 && (
            <TrashTree
              rows={children}
              childrenByParent={childrenByParent}
              expandedFolderIds={expandedFolderIds}
              now={now}
              onToggleFolder={onToggleFolder}
              onRestore={onRestore}
              onRequestDelete={onRequestDelete}
              depth={depth + 1}
            />
          )}
        </li>
      );
    })}
  </ul>
);

/* ========================================================================== */
/*  Canvas router                                                              */
/* ========================================================================== */
