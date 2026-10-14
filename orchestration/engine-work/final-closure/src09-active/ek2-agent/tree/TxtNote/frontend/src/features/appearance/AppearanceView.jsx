/**
 * The Görünüm screen: pick one of three themes, or hand the choice to the
 * clock — "at 18:00 go dark, at 05:00 come back to white".
 */

import React from "react";
import { Check, Clock, Palette } from "lucide-react";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/cn";
import { scheduledThemeFor, THEME_LABEL, THEME_OPTIONS } from "./theme";

/** Little painting of the theme: page, a panel, two lines of pretend text. */
const ThemePreview = ({ preview }) => (
  <span
    aria-hidden="true"
    className="block h-16 w-full overflow-hidden rounded-md border"
    style={{ backgroundColor: preview.page, borderColor: preview.line }}
  >
    <span className="flex h-full">
      <span
        className="block h-full w-1/3 border-r"
        style={{ backgroundColor: preview.panel, borderColor: preview.line }}
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-2.5">
        <span
          className="block h-1.5 w-3/4 rounded-full"
          style={{ backgroundColor: preview.ink, opacity: 0.85 }}
        />
        <span
          className="block h-1.5 w-1/2 rounded-full"
          style={{ backgroundColor: preview.ink, opacity: 0.35 }}
        />
      </span>
    </span>
  </span>
);

/** The same switch the bin uses, free of its wording. */
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

export const AppearanceView = ({
  theme,
  onThemeChange,
  schedule,
  onScheduleToggle,
  onScheduleRuleChange,
}) => {
  // Keeps the "plana göre şu an" line honest while the screen sits open.
  useNow(30 * 1000);
  const scheduledNow = schedule.isEnabled ? scheduledThemeFor(schedule.rules) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-8 py-10">
        {/* header — same face as the bin screen */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Palette className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Görünüm</h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              Temanı seç ya da saate bağla — gün içinde kendiliğinden değişsin.
            </p>
          </div>
        </div>

        {/* themes — three cards, the chosen one carries the ring and the tick */}
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Tema
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
          {THEME_OPTIONS.map((option) => {
            const isSelected = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onThemeChange(option.id)}
                className={cn(
                  "relative rounded-lg border p-3 text-left transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                  isSelected
                    ? "border-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600",
                )}
              >
                <ThemePreview preview={option.preview} />
                <span className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check
                      className="h-4 w-4 shrink-0 text-neutral-900 dark:text-neutral-100"
                      strokeWidth={2.5}
                    />
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* the clock — two rules: at this time, put this theme on */}
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Saate bağlı tema
        </p>
        <div className="mt-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-900 dark:text-neutral-50">
                <Clock className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" strokeWidth={2} />
                Temayı saate göre değiştir
              </p>
              <p className="mt-1 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                Kuralın saati geldiğinde tema kendiliğinden değişir. Aradaki elle seçimin, sıradaki
                kurala kadar korunur.
              </p>
            </div>
            <Switch
              isEnabled={schedule.isEnabled}
              onToggle={onScheduleToggle}
              label="Temayı saate göre değiştir"
            />
          </div>

          <div className="mt-4 space-y-2.5">
            {schedule.rules.map((rule) => (
              <div key={rule.id} className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
                  Saat
                  <input
                    type="time"
                    value={rule.time}
                    disabled={!schedule.isEnabled}
                    onChange={(event) => onScheduleRuleChange(rule.id, { time: event.target.value })}
                    className={cn(fieldClass, "tabular-nums")}
                  />
                </label>
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">
                  →
                </span>
                <label className="flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
                  <span className="sr-only">Geçilecek tema</span>
                  <select
                    value={rule.theme}
                    disabled={!schedule.isEnabled}
                    onChange={(event) => onScheduleRuleChange(rule.id, { theme: event.target.value })}
                    className={fieldClass}
                  >
                    {THEME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-[13px] text-neutral-500 dark:text-neutral-400">temasına geç</span>
              </div>
            ))}
          </div>

          {schedule.isEnabled && scheduledNow && (
            <p className="mt-4 border-t border-neutral-200 pt-3 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Plana göre şu an: <span className="font-medium text-neutral-800 dark:text-neutral-200">{THEME_LABEL[scheduledNow]}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
