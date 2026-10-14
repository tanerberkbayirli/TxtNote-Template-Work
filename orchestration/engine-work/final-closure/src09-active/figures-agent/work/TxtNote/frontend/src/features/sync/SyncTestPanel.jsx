/**
 * Temporary sync test strip. Sits under the note editor while the mock
 * backend is in play — remove this file when the real service is wired.
 *
 * geçici denetleme barı — kullanıcı ikinci bir komut verene kadar gizli.
 * `return null` kaldırılınca panel tekrar görünür.
 */

import { Cloud, HardDrive, SkipForward, Smartphone, WifiOff } from "lucide-react";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/cn";

const formatAgo = (savedAt, now) => {
  if (!savedAt) return null;
  const elapsed = Math.max(0, now - savedAt);
  if (elapsed < 10000) return `${(elapsed / 1000).toFixed(1)}s önce`;
  if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s önce`;
  const minutes = Math.floor(elapsed / 60000);
  return `${minutes} dk önce`;
};

const formatCountdown = (dueAt, now) => {
  const remaining = Math.max(0, (dueAt ?? 0) - now);
  const total = Math.ceil(remaining / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return {
    remaining,
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    secondsLabel: `${(remaining / 1000).toFixed(1)}s`,
  };
};

const localCopy = (lane, now) => {
  if (lane.status === "saving") return "Kaydediliyor…";
  if (lane.status === "error") return `Hata — ${lane.error}`;
  if (lane.status === "success" && lane.savedAt) {
    return `${formatAgo(lane.savedAt, now)} kaydedildi`;
  }
  if (lane.status === "pending") return "Yazılıyor — kayıt bekleniyor";
  return "Henüz kayıt yok";
};

const peerCopy = (lane, now, debounceMs) => {
  if (lane.status === "saving") return "İletiliyor…";
  if (lane.status === "error") return `Hata — ${lane.error}`;
  if (lane.status === "pending" && lane.dueAt) {
    const { remaining, secondsLabel } = formatCountdown(lane.dueAt, now);
    if (remaining > 0) return `${secondsLabel} geri sayıyor…`;
    return "İletiliyor…";
  }
  if (lane.status === "success") return "İletildi";
  return `Yazma bekleniyor… (${Math.round(debounceMs / 1000)}s)`;
};

const cloudCopy = (lane, now) => {
  const { label } = formatCountdown(lane.dueAt, now);
  let state = "Değişiklik bekleniyor";
  if (lane.status === "saving") state = "İletiliyor…";
  else if (lane.status === "error") state = `Hata — ${lane.error}`;
  else if (lane.status === "success") state = "İletildi";
  else if (lane.status === "skipped") state = "Değişiklik yok — atlandı";
  else if (lane.status === "pending") state = "Gönderilecek";
  const countdown = lane.dueAt ? `Kalan ${label}` : "Bekleniyor";
  return `${countdown} · ${state}`;
};

const PLAN_OPTIONS = [
  { id: "freemium", label: "Freemium" },
  { id: "lite", label: "Lite" },
  { id: "premium", label: "Premium" },
];

const Row = ({ icon: Icon, label, value, tone = "neutral" }) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Icon
      className={cn(
        "h-3.5 w-3.5 shrink-0",
        tone === "ok" && "text-emerald-600 dark:text-emerald-400",
        tone === "warn" && "text-amber-600 dark:text-amber-400",
        tone === "err" && "text-red-600 dark:text-red-400",
        tone === "neutral" && "text-neutral-400 dark:text-neutral-500",
      )}
      strokeWidth={2}
    />
    <p className="min-w-0 truncate text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
      <span className="font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
      {": "}
      {value}
    </p>
  </div>
);

const toneFor = (status) => {
  if (status === "success") return "ok";
  if (status === "error") return "err";
  if (status === "pending" || status === "saving") return "warn";
  return "neutral";
};

export const SyncTestPanel = ({
  lanes,
  peerDebounceMs,
  networkErrorEnabled,
  onToggleNetworkError,
  onSkipCloud,
  planTier,
  onPlanTierChange,
}) => {
  // geçici denetleme barı — kullanıcı ikinci bir komut verene kadar gizli
  void lanes;
  void peerDebounceMs;
  void networkErrorEnabled;
  void onToggleNetworkError;
  void onSkipCloud;
  void planTier;
  void onPlanTierChange;
  return null;

  /* geçici denetleme barı — panel gövdesi (ikinci komutta return null kaldırılacak)
  const now = useNow(250);
  const local = lanes?.local ?? {};
  const peer = lanes?.peer ?? {};
  const cloud = lanes?.cloud ?? {};

  return (
    <section
      aria-label="Senkronizasyon test paneli"
      className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-3">
          <Row
            icon={HardDrive}
            label="Yerel"
            value={localCopy(local, now)}
            tone={toneFor(local.status)}
          />
          <Row
            icon={Smartphone}
            label="Cihaz"
            value={peerCopy(peer, now, peerDebounceMs)}
            tone={toneFor(peer.status)}
          />
          <Row
            icon={Cloud}
            label="Yedek"
            value={cloudCopy(cloud, now)}
            tone={toneFor(cloud.status)}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>Plan</span>
            <select
              value={planTier}
              onChange={(event) => onPlanTierChange(event.target.value)}
              aria-label="Test planı"
              className="h-7 rounded-md border border-neutral-200 bg-white px-1.5 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
            >
              {PLAN_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onSkipCloud}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <SkipForward className="h-3.5 w-3.5" strokeWidth={2} />
            10 dk atla
          </button>

          <button
            type="button"
            onClick={onToggleNetworkError}
            aria-pressed={networkErrorEnabled}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors",
              networkErrorEnabled
                ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800",
            )}
          >
            <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
            {networkErrorEnabled ? "Ağ hatası açık" : "Ağ hatası"}
          </button>
        </div>
      </div>
    </section>
  );
  */
};
