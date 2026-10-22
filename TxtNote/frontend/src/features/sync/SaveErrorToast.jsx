/**
 * Corner notice while local saving fails (disk full, storage quota, database refused the write). It stays until a
 * save succeeds again: the app keeps retrying, and until then the latest changes exist only in this window (HE-VB-05).
 */

import { AlertTriangle } from "lucide-react";

export const SaveErrorToast = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      data-save-error
      className="pointer-events-auto absolute bottom-4 left-4 z-50 w-[min(22rem,calc(100%-1.5rem))] rounded-lg border border-red-200 bg-white p-3 shadow-lg shadow-neutral-900/10 dark:border-red-900/50 dark:bg-neutral-900 dark:shadow-black/40"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
        >
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-neutral-900 dark:text-neutral-100">Değişiklikler kaydedilemedi</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">
            Son değişiklikleriniz yalnız bu pencerede duruyor; uygulamayı kapatmayın. Kayıt birkaç saniyede bir yeniden
            deneniyor. Neden: {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 text-[12px] font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500 dark:text-neutral-100 dark:decoration-neutral-600"
          >
            Şimdi yeniden dene
          </button>
        </div>
      </div>
    </div>
  );
};
