/**
 * The Premium screen: three tiers, billing choices and shared guarantees.
 */

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Cloud,
  Crown,
  HardDrive,
  Lock,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/cn";

const PREMIUM_BILLING = [
  { id: "monthly", label: "Aylık", price: "$2.99" },
  { id: "semiannual", label: "6 Aylık", price: "$14.99" },
  { id: "yearly", label: "Yıllık", price: "$23.99" },
];

const PLANS = [
  {
    id: "freemium",
    name: "Freemium",
    tagline: "Sınırsız ve ücretsiz kullanım",
    price: "Ücretsiz",
    priceNote: null,
    accent: "neutral",
    features: [
      "Sınırsız not tutma",
      "Sınırsız cihazlar arası senkronizasyon (en fazla 5 cihaz)",
      "Not tutma hariç 1 GB'a kadar depolama",
    ],
  },
  {
    id: "lite",
    name: "Lite Premium",
    tagline: "Daha fazla alan, daha çok cihaz",
    price: "$4.99",
    priceNote: "yıllık",
    accent: "sky",
    features: [
      "Sınırsız not tutma",
      "Sınırsız senkronizasyon (10 cihaza kadar)",
      "50 GB'a kadar depolama",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Tam kapasite ve öncelik",
    price: null,
    priceNote: null,
    accent: "amber",
    featured: true,
    features: [
      "Sınırsız not tutma",
      "Sınırsız senkronizasyon (sınırsız cihaz)",
      "Senkronizasyonda diğer kişilere göre öncelik hakkı",
      "Depolamada öncelik hakkı",
      "250 GB'a kadar depolama",
    ],
  },
];

const SHARED_GUARANTEES = [
  {
    icon: Lock,
    title: "E2EE Şifreleme",
    description:
      "TxtNote her kullanıcı için uçtan uca şifreleme sunar. Buradaki hiçbir veriyi siz ve izin verdiğiniz kişiler haricinde kimse okuyamaz.",
    accent: "violet",
  },
  {
    icon: Cloud,
    title: "Merkeziyetsiz depolama",
    description:
      "TxtNote, Irys depolama yöntemini kullanır. Hesabınız merkeziyetsiz ortamlarda saklanır; verilerinizi kendi isteğimiz doğrultusunda silemeyiz.",
    accent: "cyan",
  },
  {
    icon: Smartphone,
    title: "Önce yerel deneyim",
    description:
      "TxtNote bulutta çalışan bir uygulama değildir. Önce cihazınızda çalışır, ardından bize iletilir. Uygulamayı silmediğiniz sürece TxtNote'u yerel olarak sonsuza dek kullanabilirsiniz.",
    accent: "emerald",
  },
];

const accentStyles = {
  neutral: {
    card: "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
    badge: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    icon: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    check: "text-neutral-500 dark:text-neutral-400",
  },
  sky: {
    card: "border-sky-200 bg-gradient-to-b from-sky-50/80 to-white dark:border-sky-500/30 dark:from-sky-950/40 dark:to-neutral-900",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    icon: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
    check: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    card: "border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60 shadow-lg shadow-amber-500/10 dark:border-amber-500/40 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-rose-950/20 dark:shadow-amber-500/5",
    badge: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
    icon: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30",
    check: "text-amber-600 dark:text-amber-400",
  },
};

const guaranteeAccent = {
  violet: "border-violet-200 bg-violet-50/50 dark:border-violet-500/25 dark:bg-violet-950/20",
  cyan: "border-cyan-200 bg-cyan-50/50 dark:border-cyan-500/25 dark:bg-cyan-950/20",
  emerald: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-emerald-950/20",
};

const guaranteeIcon = {
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const FeatureList = ({ features, checkClass }) => (
  <ul className="mt-4 space-y-2.5">
    {features.map((feature) => (
      <li key={feature} className="flex items-start gap-2.5 text-[13px] leading-snug text-neutral-700 dark:text-neutral-300">
        <Check className={cn("mt-0.5 h-4 w-4 shrink-0", checkClass)} strokeWidth={2.5} />
        <span>{feature}</span>
      </li>
    ))}
  </ul>
);

const PlanCard = ({ plan, currentTier, billing, onBillingChange }) => {
  const styles = accentStyles[plan.accent];
  const isCurrent = currentTier === plan.id;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border p-5 transition-shadow",
        styles.card,
        plan.featured && "ring-2 ring-amber-400/50 dark:ring-amber-500/40",
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md shadow-amber-500/30">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          En popüler
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", styles.icon)}
        >
          {plan.id === "premium" ? (
            <Crown className="h-5 w-5" strokeWidth={1.75} />
          ) : plan.id === "lite" ? (
            <Zap className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <HardDrive className="h-5 w-5" strokeWidth={1.75} />
          )}
        </span>
        {isCurrent && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium", styles.badge)}>
            <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
            Mevcut plan
          </span>
        )}
      </div>

      <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">{plan.name}</h2>
      <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">{plan.tagline}</p>

      {plan.id === "premium" ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Premium fatura dönemi">
            {PREMIUM_BILLING.map((option) => {
              const isSelected = billing === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onBillingChange(option.id)}
                  className={cn(
                    "flex min-w-[5.5rem] flex-1 flex-col items-center rounded-lg border px-2 py-2.5 transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                    isSelected
                      ? "border-amber-400 bg-gradient-to-b from-amber-100 to-orange-100 shadow-sm dark:border-amber-500/60 dark:from-amber-950/60 dark:to-orange-950/40"
                      : "border-neutral-200 bg-white hover:border-amber-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-amber-500/40",
                  )}
                >
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-[15px] font-bold text-neutral-900 dark:text-neutral-50">
                    {option.price}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-4 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{plan.price}</span>
          {plan.priceNote && (
            <span className="text-[13px] text-neutral-500 dark:text-neutral-400">/ {plan.priceNote}</span>
          )}
        </p>
      )}

      <FeatureList features={plan.features} checkClass={styles.check} />

      <button
        type="button"
        disabled={isCurrent}
        className={cn(
          "mt-6 w-full rounded-lg py-2.5 text-[14px] font-semibold transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isCurrent
            ? "cursor-default bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            : plan.featured
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 focus-visible:ring-amber-400 dark:focus-visible:ring-offset-neutral-950"
              : plan.id === "lite"
                ? "bg-sky-500 text-white hover:bg-sky-600 focus-visible:ring-sky-400 dark:focus-visible:ring-offset-neutral-950"
                : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-950",
        )}
      >
        {isCurrent ? "Aktif plan" : plan.id === "freemium" ? "Ücretsiz kullan" : "Yükselt"}
      </button>
    </article>
  );
};

export const PremiumView = ({ currentTier = "freemium" }) => {
  const [premiumBilling, setPremiumBilling] = useState("yearly");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-10">
        {/* header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 dark:border-amber-500/20 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-rose-950/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-300/40 to-rose-300/30 blur-2xl dark:from-amber-500/20 dark:to-rose-500/10"
          />
          <div className="relative flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-white shadow-lg shadow-amber-500/30"
            >
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                Premium&apos;a geç
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                İhtiyacına göre planını seç. Hangi pakette olursan ol, tüm planlarda aynı güvenlik
                ve yerel deneyim garantileri geçerlidir.
              </p>
            </div>
          </div>
        </div>

        {/* plan cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-4 lg:pt-2">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentTier={currentTier}
              billing={premiumBilling}
              onBillingChange={setPremiumBilling}
            />
          ))}
        </div>

        {/* shared guarantees */}
        <p className="mt-12 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Tüm planlarda dahil
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SHARED_GUARANTEES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn("rounded-xl border p-4", guaranteeAccent[item.accent])}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    guaranteeIcon[item.accent],
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
