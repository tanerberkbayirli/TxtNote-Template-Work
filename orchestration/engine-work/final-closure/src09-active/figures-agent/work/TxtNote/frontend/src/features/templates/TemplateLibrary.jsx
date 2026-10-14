import { useMemo } from "react";
import { LayoutTemplate, Pin, PinOff } from "lucide-react";
import { cn } from "../../lib/cn";
import { TEMPLATES } from "../../lib/templates";
import { ThesisCreator } from "./ThesisCreator";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

export const TemplateLibrary = ({ pinnedTemplateIds = [], onTogglePinned, onUseTemplate, onCreateThesis }) => {
  const pinnedIds = useMemo(() => new Set(pinnedTemplateIds), [pinnedTemplateIds]);

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <LayoutTemplate className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Şablonlar</h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              İhtiyacına uygun bir şablon seç veya sık kullandıklarını kısayollarına ekle.
            </p>
          </div>
        </div>

        <ThesisCreator onCreate={onCreateThesis} />

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isPinned = pinnedIds.has(template.id);
            return (
              <article
                key={template.id}
                className="flex min-h-52 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <button
                  type="button"
                  onClick={() => onUseTemplate?.(template.id)}
                  className={cn(
                    "flex min-h-0 flex-1 flex-col items-start p-5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
                    focusRing,
                  )}
                  aria-label={`${template.name} şablonunu kullan`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </span>
                  <span className="mt-4 text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                    {template.name}
                  </span>
                  <span className="mt-1.5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {template.description}
                  </span>
                </button>

                <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => onTogglePinned?.(template.id)}
                    aria-pressed={isPinned}
                    aria-label={
                      isPinned
                        ? `${template.name} şablonunu kısayollardan çıkar`
                        : `${template.name} şablonunu kısayollara ekle`
                    }
                    title={isPinned ? "Kısayollardan çıkar" : "Kısayollara ekle"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                      focusRing,
                    )}
                  >
                    {isPinned ? (
                      <PinOff className="h-4 w-4" strokeWidth={1.8} />
                    ) : (
                      <Pin className="h-4 w-4" strokeWidth={1.8} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUseTemplate?.(template.id)}
                    className={cn(
                      "h-8 rounded-md bg-neutral-900 px-3 text-[12px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
                      focusRing,
                    )}
                  >
                    Kullan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
