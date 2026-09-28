/**
 * Compact corner notice when peer or cloud sync cannot reach the network.
 */

import { useEffect, useState } from "react";
import { HelpCircle, WifiOff, X } from "lucide-react";

export const SyncNetworkToast = ({ visible, onOpenHelp, onOpenContact }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!visible) setDismissed(false);
  }, [visible]);

  if (!visible || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto absolute bottom-4 right-4 z-50 w-[min(22rem,calc(100%-1.5rem))] rounded-lg border border-amber-200 bg-white p-3 shadow-lg shadow-neutral-900/10 dark:border-amber-900/50 dark:bg-neutral-900 dark:shadow-black/40"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        >
          <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">
            Ağ ayarlarında meydana gelen beklenmeyen aksaklıklardan dolayı son güncelleme
            sunucularımıza iletilmedi. Lütfen ağ ayarlarını kontrol edin. Daha fazla bilgi için{" "}
            <button
              type="button"
              onClick={onOpenHelp}
              title="Yardım ve destek"
              aria-label="Yardım ve destek"
              className="inline-flex translate-y-px items-center rounded text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={2} />
            </button>{" "}
            işaretine tıklayın ya da{" "}
            <button
              type="button"
              onClick={onOpenContact}
              className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500 dark:text-neutral-100 dark:decoration-neutral-600"
            >
              bizimle iletişime geçin
            </button>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Uyarıyı kapat"
          className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
