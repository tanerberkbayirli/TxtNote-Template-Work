/**
 * The Ayarlar screen: update alerts, language, auto lock and backup tools.
 */

import { useState } from "react";
import { Archive, Download, Settings, Upload } from "lucide-react";
import { cn } from "../../lib/cn";
import { PEER_DEBOUNCE_PRESETS } from "../../config/limits";
import {
  CLOUD_INTERVAL_OPTIONS,
  clampCloudInterval,
  clampPeerDebounce,
  formatCloudIntervalLabel,
  formatPeerPresetLabel,
  syncLimitsFor,
} from "../../config/sync";
import { AUTO_LOCK_OPTIONS } from "./useSettings";
import { UPDATE_MANIFEST_PATH } from "../../config/updates";

const Switch = ({ isEnabled, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isEnabled}
    aria-label={label}
    onClick={() => onToggle(!isEnabled)}
    className="flex items-center gap-2.5 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-950"
  >
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        isEnabled
          ? "bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-white"
          : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-neutral-900",
          isEnabled ? "left-[22px]" : "left-0.5",
        )}
      />
    </span>
    <span
      className={cn(
        "text-[13px] font-medium transition-colors duration-150",
        isEnabled
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-500 dark:text-neutral-400",
      )}
    >
      {isEnabled ? "Açık" : "Kapalı"}
    </span>
  </button>
);

const fieldClass = cn(
  "h-9 rounded-md border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-800",
  "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus-visible:ring-neutral-500",
);

const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500";

const cardClass =
  "rounded-lg border border-neutral-200 dark:border-neutral-800";

/** Placeholder action — visible but inert until the backend lands. */
const PlaceholderAction = ({ icon: Icon, label, description }) => (
  <button
    type="button"
    disabled
    aria-disabled="true"
    className={cn(
      "flex w-full items-start gap-3 rounded-md px-3 py-3 text-left",
      "cursor-not-allowed opacity-60",
    )}
  >
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
    <span className="min-w-0">
      <span className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
        {label}
      </span>
      <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
        {description}
      </span>
    </span>
  </button>
);

export const SettingsView = ({
  updateNotificationsEnabled,
  onUpdateNotificationsToggle,
  updateAvailable = false,
  updateVersion = "",
  updateStatus = "idle",
  updateProgress = 0,
  updateError = "",
  onCheckUpdate,
  onInstallUpdate,
  autoLock,
  onAutoLockChange,
  planTier = "freemium",
  peerDebounceSeconds,
  onPeerDebounceChange,
  cloudIntervalMinutes,
  onCloudIntervalChange,
}) => {
  const showUpdateBanner = updateNotificationsEnabled && updateAvailable;
  const busy = updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "installing";
  const limits = syncLimitsFor(planTier);
  const isPremium = planTier === "premium";
  const effectivePeer = clampPeerDebounce(peerDebounceSeconds, planTier);
  const effectiveCloud = clampCloudInterval(cloudIntervalMinutes, planTier);
  const [customPeer, setCustomPeer] = useState(String(effectivePeer));
  const isCustomPeer = !PEER_DEBOUNCE_PRESETS.includes(effectivePeer);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-8 py-10">
        {/* header — same face as the other system screens */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Ayarlar</h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              Uygulama tercihlerin ve hesap güvenliği seçenekleri.
            </p>
          </div>
        </div>

        {/* update notification */}
        <p className={cn("mt-8", sectionLabelClass)}>Güncelleme bildirimi</p>
        <div className={cn("mt-2 p-4", cardClass)}>
          {showUpdateBanner && (
            <div
              role="status"
              className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[13px] leading-snug text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              Daha güncel bir sürüm mevcut{updateVersion ? ` (${updateVersion})` : ""}.
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
                Güncelleme bildirimleri
              </p>
            </div>
            <Switch
              isEnabled={updateNotificationsEnabled}
              onToggle={onUpdateNotificationsToggle}
              label="Güncelleme bildirimleri"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCheckUpdate}
              disabled={busy || !onCheckUpdate}
              className={cn(
                "h-8 rounded-md border border-neutral-300 bg-white px-2.5 text-[12px] font-medium text-neutral-700",
                "hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
              )}
            >
              {updateStatus === "checking" ? "Denetleniyor…" : "Güncellemeleri denetle"}
            </button>
            {updateAvailable && (
              <button
                type="button"
                onClick={onInstallUpdate}
                disabled={busy || !onInstallUpdate}
                className={cn(
                  "h-8 rounded-md bg-neutral-900 px-2.5 text-[12px] font-medium text-white",
                  "hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
                )}
              >
                {updateStatus === "downloading" || updateStatus === "installing"
                  ? "Yükleniyor…"
                  : "Şimdi güncelle"}
              </button>
            )}
            {updateStatus === "upToDate" && !updateAvailable && (
              <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                Uygulama güncel.
              </span>
            )}
          </div>

          {(updateStatus === "downloading" || updateStatus === "installing") && (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(updateProgress * 100)}
            >
              <div
                className="h-full rounded-full bg-neutral-900 transition-[width] duration-150 dark:bg-neutral-100"
                style={{ width: `${Math.round(updateProgress * 100)}%` }}
              />
            </div>
          )}

          {updateError && (
            <p className="mt-3 text-[12px] leading-snug text-red-600 dark:text-red-400">
              {updateError}
            </p>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            Yeni bir sürüm yayınlandığında, bu seçenek açıksa uygulama seni bilgilendirir.
            Güncellemeler sunucudaki {UPDATE_MANIFEST_PATH} adresinden denetlenir.
          </p>
        </div>

        {/* language */}
        <p className={cn("mt-10", sectionLabelClass)}>Dil</p>
        <div className={cn("mt-2 p-4", cardClass)}>
          <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
              Uygulama dili
            </span>
            <select value="tr" disabled className={cn(fieldClass, "sm:w-44")} aria-label="Uygulama dili">
              <option value="tr">Türkçe</option>
            </select>
          </label>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            Şimdilik yalnızca Türkçe destekleniyor. Diğer diller yakında eklenecek.
          </p>
        </div>

        {/* auto lock */}
        <p className={cn("mt-10", sectionLabelClass)}>Otomatik kilitleme</p>
        <div className={cn("mt-2 p-4", cardClass)}>
          <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
              Hareketsizlik süresi
            </span>
            <select
              value={autoLock}
              onChange={(event) => onAutoLockChange(event.target.value)}
              className={cn(fieldClass, "sm:w-44")}
              aria-label="Otomatik kilitleme süresi"
            >
              {AUTO_LOCK_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
            Bu süre boyunca fare, klavye veya dokunma olmazsa oturum kilitlenir. Notlar
            cihazda şifreli kalır; yeniden açmak için cüzdan ekranını kullanırsın.
          </p>
        </div>

        {/* sync cadence */}
        <p className={cn("mt-10", sectionLabelClass)}>Senkronizasyon</p>
        <div className={cn("mt-2 space-y-0 divide-y divide-neutral-200 dark:divide-neutral-800", cardClass)}>
          <div className="p-4">
            <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
              Cihazlar arası iletim
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Yazmayı bıraktıktan sonra diğer cihazlara gönderilmeden önce beklenecek süre.
              {isPremium
                ? " Premium: 1 saniyeden 1 dakikaya kadar veya özel süre."
                : ` ${planTier === "lite" ? "Lite" : "Freemium"}: en az ${limits.peerMinSeconds} saniye.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PEER_DEBOUNCE_PRESETS.map((seconds) => {
                const locked = seconds < limits.peerMinSeconds;
                const selected = effectivePeer === seconds;
                return (
                  <button
                    key={seconds}
                    type="button"
                    disabled={locked}
                    onClick={() => onPeerDebounceChange(seconds)}
                    className={cn(
                      "h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                      selected
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                      locked && "cursor-not-allowed opacity-40 hover:bg-white dark:hover:bg-neutral-900",
                    )}
                  >
                    {formatPeerPresetLabel(seconds)}
                    {locked ? " · Premium" : ""}
                  </button>
                );
              })}
            </div>
            {isPremium && (
              <label className="mt-3 flex items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-300">
                <span>Özel süre</span>
                <input
                  type="number"
                  min={limits.peerMinSeconds}
                  step={1}
                  value={isCustomPeer ? customPeer : effectivePeer}
                  onChange={(event) => {
                    setCustomPeer(event.target.value);
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= limits.peerMinSeconds) {
                      onPeerDebounceChange(next);
                    }
                  }}
                  className={cn(fieldClass, "w-20")}
                  aria-label="Özel cihaz senkronizasyon süresi (saniye)"
                />
                <span>saniye</span>
              </label>
            )}
          </div>

          <div className="p-4">
            <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
              Bulut yedekleme aralığı
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Not geçmişi bu sıklıkta oluşur. Değişmeyen notlar ağa gönderilmez.
              {isPremium
                ? " Premium: 5 dakikadan 1 güne kadar."
                : ` ${planTier === "lite" ? "Lite" : "Freemium"}: en az ${limits.cloudMinMinutes} dakika.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CLOUD_INTERVAL_OPTIONS.map((minutes) => {
                const locked = minutes < limits.cloudMinMinutes;
                const selected = effectiveCloud === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    disabled={locked}
                    onClick={() => onCloudIntervalChange(minutes)}
                    className={cn(
                      "h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                      selected
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                      locked && "cursor-not-allowed opacity-40 hover:bg-white dark:hover:bg-neutral-900",
                    )}
                  >
                    {formatCloudIntervalLabel(minutes)}
                    {locked ? " · Premium" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
              Yerel yedekleme
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              Cihaz çökmesine karşı not her 0,5 saniyede bir bu cihaza yazılır. Bu süre değiştirilemez.
            </p>
          </div>
        </div>

        {/* backup / export / import */}
        <p className={cn("mt-10", sectionLabelClass)}>Yedekleme</p>
        <div className={cn("mt-2 divide-y divide-neutral-200 dark:divide-neutral-800", cardClass)}>
          <PlaceholderAction
            icon={Download}
            label="Dışa aktar"
            description="Notlarını ve içeriklerini bir dosyaya aktar."
          />
          <PlaceholderAction
            icon={Upload}
            label="İçe aktar"
            description="Daha önce dışa aktardığın yedeği geri yükle."
          />
          <PlaceholderAction
            icon={Archive}
            label="Tam yedek indir"
            description="Hesabın tam bir kopyasını dosya olarak al — yakında."
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          Dışa/içe aktarma yakında kullanılabilir olacak. Canlı senkronizasyon yukarıdaki ayarlarla çalışır.
        </p>
      </div>
    </div>
  );
};
