/**
 * The Profil screen: the account's display name (with the little "i" that
 * explains where the name shows up), the facts that matter about the account,
 * and every device it is signed in on with its last sync.
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  HardDrive,
  Info,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
  User,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { E2ETestLab } from "./E2ETestLab";
import { PLAN_LIMITS } from "../../config/plans";
import { useNow } from "../../hooks/useNow";
import { formatRelativePast } from "../../lib/time";

/* -- formatting -------------------------------------------------------------- */

const DATE_LONG = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_WITH_TIME = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/* -- plan copy ---------------------------------------------------------------- */

const PLAN_TIER = {
  freemium: {
    label: "Freemium",
    badgeClass:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  },
  lite: {
    label: "Lite Premium",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  premium: {
    label: "Premium",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

const BILLING_CYCLE_LABEL = {
  monthly: "Aylık abonelik",
  yearly: "Yıllık abonelik",
};

/** "Aylık abonelik · Sonraki ödeme: 29 Ağustos 2026" — or the free-plan line. */
const planDetails = (plan) => {
  if (plan.tier === "freemium") {
    return "Ücretsiz plan. Yükseltme seçenekleri buradan sunulacak.";
  }
  return [
    BILLING_CYCLE_LABEL[plan.billingCycle],
    plan.startedAt && `Başlangıç: ${DATE_LONG.format(plan.startedAt)}`,
    plan.nextPaymentAt && `Sonraki ödeme: ${DATE_LONG.format(plan.nextPaymentAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");
};

/* -- small pieces ------------------------------------------------------------- */

/** The little "i": hover or focus it and the explanation appears above. */
const InfoHint = ({ text }) => (
  <span className="group/info relative inline-flex">
    <button
      type="button"
      aria-label="Bilgi"
      className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-500 dark:hover:text-neutral-200 dark:focus-visible:ring-neutral-500"
    >
      <Info className="h-4 w-4" strokeWidth={2} />
    </button>
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2",
        "rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-neutral-700 shadow-sm",
        "opacity-0 transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100",
        "dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
      )}
    >
      {text}
    </span>
  </span>
);

/** One fact: muted label on the left, the value on the right. */
const FactRow = ({ label, children }) => (
  <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <dt className="shrink-0 text-[13px] text-neutral-500 dark:text-neutral-400">{label}</dt>
    <dd className="min-w-0 text-[13px] text-neutral-800 sm:text-right dark:text-neutral-200">
      {children}
    </dd>
  </div>
);

const DEVICE_ICON = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

const formatStorage = (bytes) => {
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) {
    return `${gb.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} GB`;
  }
  const mb = bytes / (1024 ** 2);
  return `${mb.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} MB`;
};

const usagePercent = (used, limit) => Math.min(100, Math.round((used / limit) * 100));

/** Progress bar with a short summary underneath. */
const UsageMeter = ({ label, icon: Icon, used, limit, summary, hint }) => {
  const percent = usagePercent(used, limit);
  const barTone =
    percent >= 90
      ? "bg-rose-500"
      : percent >= 75
        ? "bg-amber-500"
        : "bg-neutral-900 dark:bg-neutral-100";

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" strokeWidth={2} />
        <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", barTone)}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] leading-snug text-neutral-700 dark:text-neutral-300">
        {summary}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
};

/* -- the screen ---------------------------------------------------------------- */

export const ProfileView = ({
  profile,
  onDisplayNameChange,
  isCryptoUser = false,
  onLogout,
  onBlindRelaySend,
  onDeviceWipe,
  onRestoreFromKey,
  onReloadApp,
}) => {
  const now = useNow(60 * 1000);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutAck, setLogoutAck] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const tier = PLAN_TIER[profile.plan.tier] ?? PLAN_TIER.freemium;
  const limits = PLAN_LIMITS[profile.plan.tier] ?? PLAN_LIMITS.freemium;
  const storageUsed = profile.usage?.storageUsedBytes ?? 0;
  const storageLimit = limits.storageBytes;
  const storageRemaining = Math.max(0, storageLimit - storageUsed);
  const storagePercent = usagePercent(storageUsed, storageLimit);
  const connectedDevices = profile.devices.length;
  const maxDevices = limits.maxDevices;
  const remainingDevices =
    maxDevices !== null ? Math.max(0, maxDevices - connectedDevices) : null;
  const isPremium = profile.plan.tier === "premium";
  const cardClass =
    "rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-8 py-10">
        {/* header — same face as the other system screens */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Profil</h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              Hesabın hakkında önemli bilgiler ve bağlı cihazların.
            </p>
          </div>
        </div>

        {/* display name — with the "i" that says where this name appears */}
        <div className="mt-8">
          <label
            htmlFor="profile-display-name"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
          >
            Hesabın görünen ismi
            <InfoHint text="Bu isim siz bir içeriği paylaştığınızda hangi hesaptan paylaşıldığını gösteren kısımda yazacaktır." />
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={profile.displayName}
            placeholder="Görünen isim"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            className={cn(
              "mt-2 h-10 w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 text-[15px] text-neutral-900",
              "transition-colors placeholder:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
              "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus-visible:ring-neutral-500",
            )}
          />
        </div>

        {/* account facts — registration method first, then the plan, the dates */}
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Hesap bilgileri
        </p>
        <dl className={cn("mt-2", cardClass)}>
          <FactRow label="Kayıt yöntemi">
            {profile.registrationMethod ?? (
              <span className="italic text-neutral-400 dark:text-neutral-500">
                Henüz belirlenmedi
              </span>
            )}
          </FactRow>

          <FactRow label="Cüzdan">
            {profile.walletAddress ? (
              <span className="break-all font-mono text-[12px]" title={profile.walletAddress}>
                {profile.walletAddress}
              </span>
            ) : (
              <span className="italic text-neutral-400 dark:text-neutral-500">
                Henüz oluşturulmadı
              </span>
            )}
          </FactRow>

          <FactRow label="Hesap türü">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                tier.badgeClass,
              )}
            >
              {profile.plan.tier !== "freemium" && (
                <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {tier.label}
            </span>
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
              {planDetails(profile.plan)}
            </span>
          </FactRow>

          <FactRow label="Kayıt tarihi">
            {profile.createdAt != null ? (
              DATE_LONG.format(profile.createdAt)
            ) : (
              <span className="italic text-neutral-400 dark:text-neutral-500">Henüz belirlenmedi</span>
            )}
          </FactRow>

          <FactRow label="Son giriş">
            {profile.lastLoginAt != null ? (
              DATE_WITH_TIME.format(profile.lastLoginAt)
            ) : (
              <span className="italic text-neutral-400 dark:text-neutral-500">Henüz belirlenmedi</span>
            )}
          </FactRow>
        </dl>

        {(onBlindRelaySend || onDeviceWipe || onRestoreFromKey) && (
          <E2ETestLab
            onSend={onBlindRelaySend}
            onWipe={onDeviceWipe}
            onRestore={onRestoreFromKey}
            onReload={onReloadApp}
          />
        )}

        {/* usage — storage for every plan; device quota only below Premium */}
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Kullanım
        </p>
        <div className={cn("mt-2", cardClass)}>
          <UsageMeter
            label="Depolama"
            icon={HardDrive}
            used={storageUsed}
            limit={storageLimit}
            summary={
              <>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatStorage(storageUsed)}
                </span>{" "}
                kullandın (toplam alanın{" "}
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  %{storagePercent}&apos;i
                </span>
                ). Kalan depolama hakkın{" "}
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatStorage(storageRemaining)}
                </span>
                .
              </>
            }
            hint="Not tutma bu kotaya dahil değildir; yalnızca yüklenen dosyalar ve medya sayılır."
          />

          {!isPremium && maxDevices !== null && (
            <UsageMeter
              label="Bağlı cihazlar"
              icon={Monitor}
              used={connectedDevices}
              limit={maxDevices}
              summary={
                <>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {connectedDevices} / {maxDevices}
                  </span>{" "}
                  cihaz bağlı. Kalan cihaz hakkın{" "}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {remainingDevices}
                  </span>
                  .
                </>
              }
            />
          )}
        </div>

        {/* devices — every signed-in device and when it last synced */}
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Bağlı cihazlar ({profile.devices.length})
        </p>
        <ul className={cn("mt-2", cardClass)}>
          {profile.devices.length === 0 ? (
            <li className="px-4 py-6 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
              Henüz bağlı cihaz yok.
            </li>
          ) : (
          profile.devices.map((device) => {
            const Icon = DEVICE_ICON[device.platform] ?? Monitor;
            return (
              <li key={device.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
                    <span className="truncate">{device.name}</span>
                    {device.isCurrent && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Bu cihaz
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                    {device.detail}
                  </p>
                </div>

                <p className="shrink-0 text-right text-[12px] text-neutral-500 dark:text-neutral-400">
                  Son senkronizasyon
                  <span className="block font-medium text-neutral-700 dark:text-neutral-300">
                    {formatRelativePast(device.lastSyncAt, now)}
                  </span>
                </p>
              </li>
            );
          })
          )}
        </ul>

        <>
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Oturum
          </p>
          <div className={cn("mt-2 p-4", cardClass)}>
            {isCryptoUser ? (
              <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                Kripto ile bağlı hesaplarda çıkış, şifreleme anahtarını bellekten siler. Kurtarma
                ifadesi veya cüzdan yedeğin yoksa hesabına ve şifreli notlarına{" "}
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  bizim tarafımızdan geri dönüş yapılamaz
                </span>
                .
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                Bu cihazdaki oturumdan çıkarsın. Notların cihazda kalır; aynı yöntemle tekrar
                giriş yapabilirsin.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setLogoutAck(false);
                setLogoutOpen(true);
              }}
              className={cn(
                "mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 px-3 text-[13px] font-medium",
                "text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900",
              )}
            >
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Çıkış yap
            </button>
          </div>

          {logoutOpen && (
            <div
              className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 px-4 pt-[18vh] backdrop-blur-[1px] dark:bg-black/60"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !logoutBusy) setLogoutOpen(false);
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="logout-dialog-title"
                className={cn(
                  "w-full max-w-md rounded-xl border bg-white p-4 shadow-xl dark:bg-neutral-800",
                  isCryptoUser
                    ? "border-amber-300 dark:border-amber-600/60"
                    : "border-neutral-200 dark:border-neutral-700",
                )}
              >
                {isCryptoUser ? (
                  <>
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                      >
                        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <h2
                          id="logout-dialog-title"
                          className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50"
                        >
                          Çıkış yap — hesabı geri getiremeyiz
                        </h2>
                        <p className="mt-2 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                          Kripto hesabın yalnızca senin cüzdanın ve kurtarma bilgilerinle açılır.
                          TxtNote sunucularında private key veya kurtarma ifadesi tutulmaz; çıkış
                          yaptıktan sonra yedeğin yoksa{" "}
                          <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                            hesabına erişimi biz de dahil kimse geri sağlayamaz
                          </strong>
                          .
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                          Devam etmeden önce kurtarma ifadesini, seed yedeğini veya harici cüzdan
                          erişimini güvenli bir yerde sakladığından emin ol.
                        </p>
                      </div>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-left dark:border-amber-700/50 dark:bg-amber-950/30">
                      <input
                        type="checkbox"
                        checked={logoutAck}
                        onChange={(event) => setLogoutAck(event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 dark:border-neutral-600"
                      />
                      <span className="text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                        Tekrar giriş yapabilmek için gerekli verileri depoladım; geri dönüşün
                        mümkün olmayabileceğini anlıyorum ve çıkış yapmak istiyorum.
                      </span>
                    </label>
                  </>
                ) : (
                  <>
                    <h2
                      id="logout-dialog-title"
                      className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50"
                    >
                      Çıkış yap
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                      Bu cihazdaki oturumdan çıkmak istediğine emin misin?
                    </p>
                  </>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={logoutBusy}
                    onClick={() => setLogoutOpen(false)}
                    className="h-9 rounded-md px-3 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={(isCryptoUser && !logoutAck) || logoutBusy || !onLogout}
                    onClick={() => {
                      if (!onLogout) return;
                      setLogoutBusy(true);
                      void Promise.resolve(onLogout()).finally(() => {
                        setLogoutBusy(false);
                        setLogoutOpen(false);
                      });
                    }}
                    className={cn(
                      "h-9 rounded-md px-3 text-[13px] font-medium text-white disabled:opacity-40",
                      isCryptoUser
                        ? "bg-amber-800 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
                        : "bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900",
                    )}
                  >
                    {logoutBusy ? "Çıkılıyor…" : "Çıkış yap"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      </div>
    </div>
  );
};
