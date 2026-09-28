/**
 * Temporary end-to-end encryption lab (Profile screen).
 *
 *   1. Notes exist        — user's own data, untouched here
 *   2. Device A encrypts  — writes encrypted .json + private-key .txt to Desktop
 *   3. Files ready        — show both paths
 *   4. Clean slate        — wipe SQLite, media, browser mirrors; keep wallet secret
 *   5. Welcome back       — paste key + pick .json → decrypt → restore
 *
 * Delete this file when the real sync server lands.
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  Download,
  FileKey2,
  FileLock2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "../../lib/cn";

const StepCard = ({ index, title, icon: Icon, tone = "neutral", children }) => {
  const tones = {
    neutral:
      "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50",
    amber:
      "border-amber-200/80 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20",
    rose: "border-rose-200/80 bg-rose-50/60 dark:border-rose-700/40 dark:bg-rose-950/20",
    emerald:
      "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-700/40 dark:bg-emerald-950/20",
  };
  const labelTones = {
    neutral: "text-neutral-600 dark:text-neutral-300",
    amber: "text-amber-800 dark:text-amber-300",
    rose: "text-rose-800 dark:text-rose-300",
    emerald: "text-emerald-800 dark:text-emerald-300",
  };
  return (
    <div className={cn("rounded-md border p-3", tones[tone])}>
      <p
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
          labelTones[tone],
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        Adım {index} · {title}
      </p>
      <div className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </div>
  );
};

const btn = (variant) =>
  cn(
    "mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-medium disabled:opacity-50",
    variant === "amber" &&
      "border-amber-400 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70",
    variant === "rose" &&
      "border-rose-400 bg-white text-rose-950 hover:bg-rose-100 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-100 dark:hover:bg-rose-950/70",
    variant === "emerald" &&
      "border-emerald-400 bg-white text-emerald-950 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70",
    variant === "neutral" &&
      "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
  );

const readJsonFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result || "")));
      } catch {
        reject(new Error("JSON paket okunamadı."));
      }
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsText(file);
  });

export const E2ETestLab = ({ onSend, onWipe, onRestore, onReload }) => {
  const [sendBusy, setSendBusy] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wiped, setWiped] = useState(false);
  const [pastedKey, setPastedKey] = useState("");
  const [pkg, setPkg] = useState(null);
  const [pkgName, setPkgName] = useState("");
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async (setBusy, work, onDone) => {
    setError(null);
    setBusy(true);
    try {
      const result = await work();
      onDone?.(result);
    } catch (err) {
      setError(err?.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Geçici uçtan uca test
      </p>
      <div className="mt-2 rounded-lg border border-amber-300 p-4 dark:border-amber-600/60">
        <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          Cihaz A verisini private key ile AES-256 kilitler, not verileri temizlenir, sonra
          yalnızca .json + private key ile veri geri gelir. Sunucu ve ikinci cihaz yokken
          aynı yolculuk burada yapılır.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StepCard index={1} title="Notlar hazır" icon={FileLock2} tone="neutral">
            Çalışma alanında zaten notların var; bu adım için bir şey yapmana gerek yok. Emin
            olmak için en az bir notun içine tanıyacağın bir cümle yaz.
          </StepCard>

          <StepCard index={2} title="Cihaz A şifrele" icon={Download} tone="amber">
            SQLite verisini private key ile AES-256 kilitle. Masaüstüne iki dosya düşer.
            <button
              type="button"
              disabled={sendBusy || !onSend}
              onClick={() =>
                run(setSendBusy, () => onSend(), (result) => {
                  setSendResult(result);
                  setRestoreResult(null);
                })
              }
              className={btn("amber")}
            >
              <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {sendBusy ? "Şifreleniyor…" : "Şifrele ve masaüstüne yaz"}
            </button>
          </StepCard>

          <StepCard index={3} title="Dosya hazır" icon={FileKey2} tone="neutral">
            {sendResult ? (
              <div className="space-y-1.5">
                <p>
                  Pakete gömüldü: <strong>{sendResult.noteCount} not</strong> ·{" "}
                  {sendResult.workspaceCount} çalışma alanı
                </p>
                {sendResult.noteCount === 0 && (
                  <p className="text-amber-800 dark:text-amber-300">
                    Pakette not yok. Önce bir not yaz, sonra 2. adımı tekrar çalıştır.
                  </p>
                )}
                <p className="flex items-start gap-1.5 break-all font-mono text-[11px]">
                  <FileLock2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {sendResult.path}
                </p>
                <p className="flex items-start gap-1.5 break-all font-mono text-[11px]">
                  <FileKey2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {sendResult.keyPath}
                </p>
                <p
                  className={
                    sendResult.plaintextLeaked || sendResult.serverSeesPrivateKey
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  }
                >
                  {sendResult.plaintextLeaked
                    ? ".json içinde not metni açık görünüyor"
                    : sendResult.serverSeesPrivateKey
                      ? ".json içinde private key var"
                      : ".json okunaksız; private key yalnızca .txt dosyasında"}
                </p>
              </div>
            ) : (
              <p>Henüz dosya yok. 2. adımı çalıştır.</p>
            )}
          </StepCard>

          <StepCard index={4} title="Artık temiz" icon={Trash2} tone="rose">
            Bu cihazdaki not verilerini siler: SQLite tabloları, medya ve tarayıcı
            yedekleri. Mevcut private key güvenli kasada korunur; public key değişmez.
            Notları geri getirmek için 3. adımdaki dosyaları kullan.
            {!wipeConfirm ? (
              <button
                type="button"
                disabled={wipeBusy || !onWipe}
                onClick={() => setWipeConfirm(true)}
                className={btn("rose")}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Not verilerini temizle
              </button>
            ) : (
              <div className="mt-3 rounded-md border border-rose-300 bg-white p-2.5 dark:border-rose-700 dark:bg-rose-950/40">
                <p className="flex items-start gap-1.5 text-[12px] text-rose-900 dark:text-rose-100">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  3. adımdaki .json ve .txt masaüstünde duruyor mu? Silme geri alınamaz.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={wipeBusy}
                    onClick={() => setWipeConfirm(false)}
                    className="h-8 flex-1 rounded-md border border-neutral-300 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={wipeBusy}
                    onClick={() =>
                      run(setWipeBusy, () => onWipe(), () => {
                        setWiped(true);
                        setWipeConfirm(false);
                      })
                    }
                    className="h-8 flex-1 rounded-md bg-rose-700 text-[12px] font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    {wipeBusy ? "Siliniyor…" : "Evet, not verilerini sil"}
                  </button>
                </div>
              </div>
            )}
            {wiped && (
              <p className="mt-2 text-emerald-700 dark:text-emerald-300">
                Temizlendi. Uygulama yeniden yükleniyor…
              </p>
            )}
          </StepCard>
        </div>

        <div className="mt-3">
          <StepCard index={5} title="Tekrar hoş geldiniz" icon={KeyRound} tone="emerald">
            .txt içindeki private key&apos;i yapıştır, .json dosyasını seç. Veri çözülür, bu
            cihazın cüzdanı o anahtara döner ve notlar SQLite&apos;a geri yazılır.
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                value={pastedKey}
                onChange={(event) => setPastedKey(event.target.value)}
                placeholder="0x… (txtnote-private-key-….txt dosyasındaki satır)"
                rows={2}
                spellCheck={false}
                autoComplete="off"
                className={cn(
                  "w-full resize-none rounded-md border border-emerald-300 bg-white px-3 py-2 font-mono text-[12px] text-neutral-900",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                  "dark:border-emerald-700 dark:bg-neutral-900 dark:text-neutral-100",
                )}
              />
              <label
                className={cn(
                  "inline-flex h-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-[12px] font-medium",
                  pkg
                    ? "border-emerald-500 text-emerald-800 dark:text-emerald-200"
                    : "border-neutral-300 text-neutral-600 hover:bg-white dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-900",
                )}
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                {pkgName ? pkgName : "Şifreli .json seç"}
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setError(null);
                    readJsonFile(file)
                      .then((parsed) => {
                        setPkg(parsed);
                        setPkgName(file.name);
                      })
                      .catch((err) => setError(err.message));
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={restoreBusy || !onRestore || !pkg || !pastedKey.trim()}
              onClick={() =>
                run(
                  setRestoreBusy,
                  () => onRestore({ pkg, privateKey: pastedKey }),
                  (result) => setRestoreResult(result),
                )
              }
              className={btn("emerald")}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {restoreBusy ? "Çözülüyor…" : "Private key ile çöz ve geri yükle"}
            </button>

            {restoreResult && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 dark:border-emerald-800 dark:bg-neutral-900">
                <p className="flex items-center gap-2 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                  {restoreResult.wrongKeyRejected ? (
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <ShieldX className="h-4 w-4 text-rose-600" strokeWidth={2} />
                  )}
                  Çözüldü: {restoreResult.noteCount} not · {restoreResult.workspaceCount} çalışma
                  alanı
                  {restoreResult.wrongKeyRejected
                    ? " · rastgele key reddedildi"
                    : " · rastgele key testi başarısız"}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  Cüzdan geri yüklendi: {restoreResult.openedWithAddress}
                  {restoreResult.walletDurable ? " (OS kasasına yazıldı)" : " (yalnızca bellekte)"}
                </p>
                {restoreResult.notes.length === 0 ? (
                  <p className="mt-2 text-[12px] text-neutral-500">Pakette not yoktu.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {restoreResult.notes.slice(0, 8).map((note) => (
                      <li
                        key={note.id}
                        className="rounded-md bg-neutral-50 px-3 py-2 dark:bg-neutral-800/80"
                      >
                        <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
                          {note.title}
                          {note.vaultOpened && (
                            <span className="ml-2 text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
                              kasa açıldı
                            </span>
                          )}
                        </p>
                        {note.contentPreview ? (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {note.contentPreview}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[12px] italic text-neutral-400">İçerik boş</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={onReload} className={btn("neutral")}>
                  <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Uygulamayı yenile ve notlara dön
                </button>
              </div>
            )}
          </StepCard>
        </div>

        {error && (
          <p className="mt-3 text-[12px] leading-relaxed text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          .json kabuğu: kind, headers (walletAddress, publicKey, alg), iv, ciphertext. İçerik
          AES-256-GCM ile kilitlidir; private key yalnızca .txt dosyasındadır. Test bitince
          .txt dosyasını sil.
        </p>
      </div>
    </>
  );
};
