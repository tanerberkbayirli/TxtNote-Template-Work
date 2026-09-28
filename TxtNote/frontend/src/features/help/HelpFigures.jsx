/**
 * Decorative UI miniatures for the help article. Hidden from assistive tech;
 * the surrounding copy already says the same thing in words.
 */

import {
  CalendarDays,
  Code2,
  FileText,
  Folder,
  GraduationCap,
  HardDrive,
  ListTodo,
  Lock,
  Palette,
  Pin,
  Save,
  Search,
  Shield,
  Smartphone,
  SquareSigma,
  Trash2,
  Upload,
  Waypoints,
  WifiOff,
} from "lucide-react";
import { cn } from "../../lib/cn";

export const HelpFigure = ({ caption, children, className }) => (
  <figure
    aria-hidden="true"
    className={cn(
      "mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40",
      className,
    )}
  >
    <div className="p-3 sm:p-4">{children}</div>
    {caption ? (
      <figcaption className="border-t border-neutral-200 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:px-4">
        {caption}
      </figcaption>
    ) : null}
  </figure>
);

const Chip = ({ children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
      className,
    )}
  >
    {children}
  </span>
);

/** Sidebar + page: the first screen a new user sees. */
export const AppShellFigure = () => (
  <HelpFigure caption="Sol kenar çubuğu, üstte sekmeler, ortada açık not.">
    <div className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="w-[38%] border-r border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-800 text-[8px] font-bold text-white dark:bg-neutral-200 dark:text-neutral-900">
            İ
          </span>
          <span className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        <div className="mb-2 h-5 rounded-md bg-white ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700" />
        {["Toplantı", "Alışveriş", "Ağustos günlüğü"].map((label, index) => (
          <div
            key={label}
            className={cn(
              "mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1",
              index === 0 && "bg-neutral-200/80 dark:bg-neutral-800",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            <span className="truncate text-[10px] text-neutral-600 dark:text-neutral-300">{label}</span>
          </div>
        ))}
        <div className="mt-2 flex h-6 items-center justify-center rounded-md border border-dashed border-neutral-300 text-[10px] text-neutral-400 dark:border-neutral-600">
          + Ekle
        </div>
      </div>
      <div className="min-w-0 flex-1 p-2">
        <div className="mb-2 flex gap-1">
          <span className="rounded-t-md bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700">
            Toplantı
          </span>
          <span className="px-2 py-1 text-[10px] text-neutral-400">Alışveriş</span>
        </div>
        <div className="space-y-1.5 px-2 pt-2">
          <div className="mx-auto h-2 w-16 rounded-full bg-neutral-800 dark:bg-neutral-200" />
          <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1.5 w-4/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1.5 w-2/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  </HelpFigure>
);

const TYPE_CARDS = [
  { icon: FileText, label: "Standart", tint: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" },
  { icon: ListTodo, label: "To-Do", tint: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300" },
  { icon: CalendarDays, label: "Günlük", tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" },
  { icon: Waypoints, label: "Harita", tint: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" },
  { icon: GraduationCap, label: "Akademik", tint: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" },
  { icon: Folder, label: "Dosya", tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" },
];

export const NoteTypesFigure = () => (
  <HelpFigure caption="Ekle menüsündeki not türleri.">
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
      {TYPE_CARDS.map(({ icon: Icon, label, tint }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-1 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tint)}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-200">{label}</span>
        </div>
      ))}
    </div>
  </HelpFigure>
);

export const SidebarToolsFigure = () => (
  <HelpFigure caption="Ara, sabitle, klasöre bırak veya dosya / klasör yükle.">
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Chip>
        <Search className="h-3 w-3" strokeWidth={2} />
        Başlık ara
      </Chip>
      <Chip>
        <Pin className="h-3 w-3" strokeWidth={2} />
        Sabitle
      </Chip>
      <Chip>
        <Folder className="h-3 w-3" strokeWidth={2} />
        Dosyaya bırak
      </Chip>
      <Chip>
        <Upload className="h-3 w-3" strokeWidth={2} />
        Yükle
      </Chip>
    </div>
    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1">
        <Folder className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">Proje</span>
      </div>
      <div className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-700">
        {["Taslak", "Toplantı notu"].map((label) => (
          <div key={label} className="flex items-center gap-1.5 py-0.5">
            <FileText className="h-3 w-3 text-neutral-400" strokeWidth={2} />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </HelpFigure>
);

export const SplitPanesFigure = () => (
  <HelpFigure caption="Bir sekmeyi kenara sürükle: çalışma alanı ikiye bölünür. En fazla 9 panel.">
    <div className="flex h-24 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-1 flex-col border-r border-neutral-200 p-2 dark:border-neutral-700">
        <span className="mb-2 self-start rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          Toplantı
        </span>
        <div className="space-y-1">
          <div className="h-1.5 w-4/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1.5 w-3/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
      <div className="w-1 bg-neutral-300 dark:bg-neutral-600" />
      <div className="flex flex-1 flex-col p-2">
        <span className="mb-2 self-start rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          To-Do
        </span>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border border-neutral-400" />
            <div className="h-1.5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-neutral-700 dark:bg-neutral-300" />
            <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
        </div>
      </div>
    </div>
  </HelpFigure>
);

export const FormatFigure = () => (
  <HelpFigure caption="Yazıyı seç, sağ tıkla: boyut, hizalama, renk, kalın / italik / üstü çizili.">
    <div className="relative mx-auto max-w-xs">
      <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        Toplantı özeti:{" "}
        <span className="rounded-sm bg-sky-100 font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
          bütçe onayı
        </span>{" "}
        bekleniyor.
      </p>
      <div className="mt-3 w-40 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
        <p className="px-1.5 pb-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">Boyut</p>
        {["Başlık", "Alt başlık", "Normal"].map((label, index) => (
          <div
            key={label}
            className={cn(
              "rounded-[4px] px-1.5 py-0.5 text-[11px]",
              index === 2
                ? "bg-neutral-100 font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
                : "text-neutral-500",
            )}
          >
            {label}
          </div>
        ))}
        <div className="mt-1 grid grid-cols-3 items-center gap-1 px-1.5 py-0.5">
          <span className="block h-0.5 w-3/4 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          <span className="mx-auto block h-0.5 w-3/4 rounded-full bg-neutral-800 dark:bg-neutral-200" />
          <span className="ml-auto block h-0.5 w-3/4 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        <div className="mt-1 flex gap-1 px-1.5 pt-1">
          <span className="h-3 w-3 rounded-full bg-neutral-800 ring-1 ring-neutral-400 dark:bg-neutral-200" />
          <span className="h-3 w-3 rounded-full bg-[#e8a0a0]" />
          <span className="h-3 w-3 rounded-full bg-[#9bb8de]" />
          <span className="h-3 w-3 rounded-full bg-[#9cc9ae]" />
        </div>
      </div>
    </div>
  </HelpFigure>
);

export const SearchFigure = () => (
  <HelpFigure caption="Notun sağ üstünde «Notta ara». Kısayol: Ctrl + F (Mac: ⌘F).">
    <div className="mx-auto flex max-w-sm items-center justify-end">
      <div className="flex w-44 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
        <Search className="h-3 w-3 text-neutral-400" strokeWidth={2} />
        <span className="text-[11px] text-neutral-400">Notta ara</span>
      </div>
    </div>
  </HelpFigure>
);

export const ThemeFigure = () => (
  <HelpFigure caption="Beyaz, siyah ve karanlık. İstersen saate bağla; tema kendiliğinden değişir.">
    <div className="grid grid-cols-3 gap-2">
      {[
        { page: "#fafafa", panel: "#ffffff", ink: "#171717", line: "#e5e5e5", label: "Beyaz" },
        { page: "#000000", panel: "#101010", ink: "#f5f5f5", line: "#1c1c1c", label: "Siyah" },
        { page: "#0a0a0a", panel: "#171717", ink: "#f5f5f5", line: "#262626", label: "Karanlık" },
      ].map((theme) => (
        <div key={theme.label} className="text-center">
          <span
            className="block h-12 overflow-hidden rounded-md border"
            style={{ backgroundColor: theme.page, borderColor: theme.line }}
          >
            <span className="flex h-full">
              <span
                className="block h-full w-1/3 border-r"
                style={{ backgroundColor: theme.panel, borderColor: theme.line }}
              />
              <span className="flex flex-1 flex-col justify-center gap-1 px-1.5">
                <span className="block h-1 w-3/4 rounded-full" style={{ backgroundColor: theme.ink, opacity: 0.85 }} />
                <span className="block h-1 w-1/2 rounded-full" style={{ backgroundColor: theme.ink, opacity: 0.35 }} />
              </span>
            </span>
          </span>
          <span className="mt-1.5 block text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
            {theme.label}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
      <Palette className="h-3 w-3" strokeWidth={2} />
      18:00 karanlık · 05:00 beyaz
    </div>
  </HelpFigure>
);

/** Tiny graph of nodes — the storage network, not a cloud. */
const NetworkGlyph = ({ className }) => (
  <svg
    viewBox="0 0 48 40"
    className={cn("h-10 w-12 text-sky-600 dark:text-sky-300", className)}
    fill="currentColor"
    aria-hidden="true"
  >
    <line x1="24" y1="10" x2="8" y2="28" stroke="currentColor" strokeWidth="1.4" />
    <line x1="24" y1="10" x2="40" y2="28" stroke="currentColor" strokeWidth="1.4" />
    <line x1="8" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1.4" />
    <line x1="24" y1="10" x2="24" y2="28" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="24" cy="8" r="4" />
    <circle cx="8" cy="30" r="4" />
    <circle cx="40" cy="30" r="4" />
    <circle cx="24" cy="28" r="3.25" className="text-sky-400 dark:text-sky-200" />
  </svg>
);

export const SyncFigure = () => (
  <HelpFigure caption="Önce cihazına yazılır. Kısa süre sonra diğer cihazların ve ağ yedeğin güncellenir.">
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-14 w-9 items-center justify-center rounded-md border-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800">
          <span className="h-8 w-5 rounded-sm bg-neutral-100 dark:bg-neutral-700" />
        </span>
        <span className="text-[10px] text-neutral-500">Telefon</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 text-neutral-400">
        <span className="text-[11px]">↔</span>
        <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-600" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-11 w-16 items-center justify-center rounded-md border-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800">
          <span className="h-6 w-12 rounded-sm bg-neutral-100 dark:bg-neutral-700" />
        </span>
        <span className="text-[10px] text-neutral-500">Bilgisayar</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 text-neutral-400">
        <span className="text-[11px]">→</span>
        <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-600" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40">
          <NetworkGlyph className="h-8 w-10" />
        </span>
        <span className="text-[10px] text-neutral-500">Ağ</span>
      </div>
    </div>
  </HelpFigure>
);

export const IrysFigure = () => (
  <HelpFigure caption="Kullanım bulut gibi. Arka planda Irys blokzinciri; veri AES-256 ile şifreli.">
    <div className="flex items-center justify-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40">
        <NetworkGlyph />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">Irys ağı</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
          AES-256 · şifre sende · blokzincirden teslim
        </p>
      </div>
    </div>
  </HelpFigure>
);

export const MindmapTeaserFigure = () => (
  <HelpFigure caption="Sol paletten bırak, okla bağla. Ayrıntılı adımlar tuvaldeki yardım düğmesinde.">
    <div
      className="relative h-24 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(128,128,128,0.28) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      <span className="absolute left-6 top-6 h-10 w-16 rounded-md border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-950/50" />
      <span className="absolute right-8 top-8 h-9 w-14 overflow-hidden rounded-md border border-violet-200 bg-gradient-to-br from-violet-200 to-indigo-300 dark:border-violet-800 dark:from-violet-800 dark:to-indigo-900" />
      <span className="absolute bottom-5 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-sky-400 bg-white dark:bg-neutral-900" />
      <svg className="absolute inset-0 h-full w-full text-neutral-400" aria-hidden="true">
        <line x1="88" y1="44" x2="168" y2="52" stroke="currentColor" strokeWidth="1.25" />
        <line x1="88" y1="52" x2="50%" y2="76" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </div>
  </HelpFigure>
);

export const HistoryFigure = () => (
  <HelpFigure caption="Kenar çubuğunda nota sağ tıkla → Not Geçmişi. Bir sürüme tıklayınca not o haline döner.">
    <div className="mx-auto w-44 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      {["Sabitle", "Not Geçmişi  ›", "Sil"].map((label, index) => (
        <div
          key={label}
          className={cn(
            "rounded-[5px] px-2 py-1.5 text-[11px]",
            index === 1
              ? "bg-neutral-100 font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
              : "text-neutral-600 dark:text-neutral-300",
          )}
        >
          {label}
        </div>
      ))}
    </div>
  </HelpFigure>
);

/** Auto-save: no save button, writing lands on the device immediately. */
export const IntroFigure = () => (
  <HelpFigure caption="Kaydet düğmesi yok. Yazmayı bıraktığın anda kayıt cihazında başlamış demektir.">
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
      <div className="relative w-full max-w-[16rem] overflow-hidden rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-2 flex items-center justify-between">
          <span className="h-1.5 w-16 rounded-full bg-neutral-800 dark:bg-neutral-200" />
          <span className="rounded-md border border-dashed border-neutral-300 px-1.5 py-0.5 text-[9px] text-neutral-400 line-through dark:border-neutral-600">
            Kaydet
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1.5 w-4/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1.5 w-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
          <Save className="h-2.5 w-2.5" strokeWidth={2.25} />
          Kayıtlı
        </span>
      </div>
      <div className="flex flex-col gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
        <Chip>
          <HardDrive className="h-3 w-3" strokeWidth={2} />
          Önce cihazın
        </Chip>
        <Chip>
          <Smartphone className="h-3 w-3" strokeWidth={2} />
          Sonra diğer cihazlar
        </Chip>
        <Chip>
          <Lock className="h-3 w-3" strokeWidth={2} />
          Uçtan uca şifreli
        </Chip>
      </div>
    </div>
  </HelpFigure>
);

export const MathFigure = () => (
  <HelpFigure caption="$$…$$, $…$, \\[…\\] veya \\begin{align} yazınca gri kutuda çizilir. Kutuya tıklayınca LaTeX’i düzenlersin.">
    <div className="space-y-2.5">
      <p className="text-[12px] text-neutral-600 dark:text-neutral-300">
        Kuvvet{" "}
        <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-serif text-[12px] dark:border-neutral-700 dark:bg-neutral-800">
          <span className="text-[9px] text-neutral-400">⧉</span>
          <em>E = mc²</em>
        </span>{" "}
        ve
      </p>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/80">
        <div className="flex items-center justify-between px-2.5 pt-2">
          <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] text-neutral-400 ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:ring-neutral-700">
            Formül ara
          </span>
          <span className="text-[10px] text-neutral-400">Kopyala</span>
        </div>
        <p className="px-3 py-3 text-center font-serif text-[15px] text-neutral-800 dark:text-neutral-100">
          <em>
            x = (−b ± √(b² − 4ac)) / 2a
          </em>
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {["$$E=mc^2$$", "$x^2$", "\\begin{align}", "\\ce{H2O}"].map((token) => (
          <Chip key={token} className="font-mono text-[9px]">
            <SquareSigma className="h-3 w-3" strokeWidth={2} />
            {token}
          </Chip>
        ))}
      </div>
    </div>
  </HelpFigure>
);

export const CodeFigure = () => (
  <HelpFigure caption="##code## yazıp Enter’a bas veya kod yapıştır. Dil «seçilmedi» kalır; bulunursa oto-Js gibi görünür.">
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-[#f6f8fa] dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-2.5 py-1.5 dark:border-neutral-800">
        <Chip className="font-mono text-[9px]">oto-Js</Chip>
        <span className="text-[10px] text-neutral-400">Kopyala</span>
      </div>
      <pre className="px-3 py-2.5 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-600 dark:text-violet-300">const</span>
        {" "}
        <span className="text-neutral-800 dark:text-neutral-100">x</span>
        {" = "}
        <span className="text-sky-700 dark:text-sky-300">1</span>
        <span className="text-neutral-400">;</span>
        {"\n"}
        <span className="text-violet-600 dark:text-violet-300">console</span>
        <span className="text-neutral-400">.</span>
        <span className="text-amber-700 dark:text-amber-300">log</span>
        <span className="text-neutral-400">(</span>
        <span className="text-neutral-800 dark:text-neutral-100">x</span>
        <span className="text-neutral-400">);</span>
      </pre>
      <div className="flex justify-center px-2 pb-2">
        <Chip>
          <Code2 className="h-3 w-3" strokeWidth={2} />
          ##code##  Enter
        </Chip>
      </div>
    </div>
  </HelpFigure>
);

export const ShortcutsFigure = () => (
  <HelpFigure caption="Mac’te Ctrl yerine ⌘. Yazarken ** * ~~ kapanınca biçim uygulanır.">
    <div className="flex flex-wrap items-center justify-center gap-2">
      {[
        ["Ctrl", "B"],
        ["Ctrl", "I"],
        ["Ctrl", "Z"],
        ["Ctrl", "F"],
      ].map((parts) => (
        <span key={parts.join("+")} className="inline-flex items-center gap-1">
          {parts.map((part, index) => (
            <span key={part} className="inline-flex items-center gap-1">
              {index > 0 ? <span className="text-[10px] text-neutral-400">+</span> : null}
              <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-md border border-neutral-200 bg-white px-1.5 py-1 font-mono text-[11px] font-medium text-neutral-800 shadow-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100">
                {part}
              </span>
            </span>
          ))}
        </span>
      ))}
    </div>
    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
      {["**kalın**", "*italik*", "~~çizili~~", "$$ formül $$"].map((mark) => (
        <Chip key={mark} className="font-mono">
          {mark}
        </Chip>
      ))}
    </div>
  </HelpFigure>
);

export const SecurityFigure = () => (
  <HelpFigure caption="İçerik uçtan uca şifrelenir. TxtNote önce senin cihazında çalışır, sonra ağa gider.">
    <div className="flex items-center justify-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
        <Shield className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">Cihazda kilitli</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
          E2EE · AES-256 · şifre sende
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>
            <Lock className="h-3 w-3" strokeWidth={2} />
            Okuyan yalnız sen
          </Chip>
          <Chip>
            <HardDrive className="h-3 w-3" strokeWidth={2} />
            Yerelde durur
          </Chip>
        </div>
      </div>
    </div>
  </HelpFigure>
);

export const NetworkToastFigure = () => (
  <HelpFigure caption="Sağ alttaki uyarı: son güncelleme ağa ulaşamamış. Yazdıkların cihazında durur; bağlantı gelince gider.">
    <div className="relative mx-auto h-28 max-w-sm overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="absolute inset-x-3 top-3 space-y-1.5 opacity-50">
        <div className="h-1.5 w-2/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-1.5 w-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="absolute bottom-2 right-2 w-[min(100%-1rem,14rem)] rounded-lg border border-amber-200 bg-white p-2 shadow-md dark:border-amber-900/60 dark:bg-neutral-800">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <WifiOff className="h-3 w-3" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-neutral-800 dark:text-neutral-100">Ağ ulaşılmadı</p>
            <p className="mt-0.5 text-[9px] leading-snug text-neutral-500 dark:text-neutral-400">
              Not cihazında duruyor. Bağlantı gelince gönderilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  </HelpFigure>
);

export const PlansFigure = () => (
  <HelpFigure caption="Freemium ücretsizdir. Lite ve Premium daha çok cihaz, alan ve daha sık yedek sunar.">
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {[
        { name: "Freemium", meta: "5 cihaz · 1 GB", featured: false },
        { name: "Lite", meta: "10 cihaz · 50 GB", featured: false },
        { name: "Premium", meta: "Sınırsız · 250 GB", featured: true },
      ].map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "rounded-lg border bg-white px-2 py-2.5 text-center dark:bg-neutral-900",
            plan.featured
              ? "border-amber-300 ring-1 ring-amber-200 dark:border-amber-700 dark:ring-amber-900/50"
              : "border-neutral-200 dark:border-neutral-700",
          )}
        >
          <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">{plan.name}</p>
          <p className="mt-1 text-[9px] leading-snug text-neutral-500 dark:text-neutral-400">{plan.meta}</p>
        </div>
      ))}
    </div>
  </HelpFigure>
);

export const TrashFigure = () => (
  <HelpFigure caption="Sildiğin notlar çöpte otuz gün kalır. Çöpü kapatırsan içindeki her şey anında silinir.">
    <div className="flex items-center justify-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        <Trash2 className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <div className="text-left">
        <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">Çöp kutusu</p>
        <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">30 gün · geri yükle veya kalıcı sil</p>
        <Chip className="mt-2">Ctrl+Z ile hemen geri al</Chip>
      </div>
    </div>
  </HelpFigure>
);
