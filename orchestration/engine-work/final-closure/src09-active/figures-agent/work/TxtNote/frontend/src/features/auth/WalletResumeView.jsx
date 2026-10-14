/**
 * Shown after logout or auto-lock when this device already has a wallet in the
 * OS keychain — no full register flow, just unlock the session again.
 */

import { useCallback, useState } from "react";
import { bootstrapWallet, unlockVault } from "@shared/services";
import { TxtNoteWordmark } from "../../brand/TxtNoteWordmark.jsx";
export default function WalletResumeView({ onAuthenticated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleContinue = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const wallet = await bootstrapWallet();
      await unlockVault();
      onAuthenticated({
        method: "vault",
        displayName: wallet.address
          ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
          : null,
      });
    } catch (cause) {
      console.error("Cüzdan oturumu açılamadı", cause);
      setError("Cüzdan kilidi açılamadı. Tekrar dene veya kayıt ekranından devam et.");
    } finally {
      setBusy(false);
    }
  }, [onAuthenticated]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-neutral-950">
      <TxtNoteWordmark className="h-8 w-auto invert dark:invert-0" />
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Oturum kilitlendi</h1>
        <p className="text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Notların cihazda şifreli duruyor. Bu cihazdaki cüzdanla oturumu yeniden açabilirsin.
        </p>
      </div>
      {error && (
        <p className="max-w-md text-[13px] text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleContinue()}
        className="h-10 rounded-md bg-neutral-900 px-5 text-[14px] font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        {busy ? "Açılıyor…" : "Bu cihazdaki cüzdanla devam et"}
      </button>
    </div>
  );
}
