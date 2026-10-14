/**
 * Corner notice when a newer signed build is waiting on the update server.
 */

import { Download, X } from "lucide-react";

export const UpdateAvailableToast = ({
  visible,
  version,
  installing = false,
  onInstall,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto absolute bottom-4 right-4 z-50 w-[min(22rem,calc(100%-1.5rem))] rounded-lg border border-neutral-200 bg-white p-3 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-50">
            Yeni sürüm hazır{version ? ` · ${version}` : ""}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            İmzalı güncelleme sunucudan indirilip kurulabilir.
          </p>
          <button
            type="button"
            onClick={onInstall}
            disabled={installing}
            className="mt-2 h-8 rounded-md bg-neutral-900 px-2.5 text-[12px] font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {installing ? "Yükleniyor…" : "Şimdi güncelle"}
          </button>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Uyarıyı kapat"
          className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
