/**
 * Start-to-finish guide for the mindmap editor, with small UI figures.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { NOTE_SHAPE, NOTE_SHAPE_PAINT, NOTE_SHAPE_LABEL } from "./constants";
import { elongatedHexagon, pointsAttr } from "./noteShape";

const Figure = ({ caption, children }) => (
  <figure
    aria-hidden="true"
    className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
  >
    <div className="flex items-center justify-center p-3">{children}</div>
    {caption ? (
      <figcaption className="border-t border-neutral-100 px-3 py-1.5 text-[11px] leading-snug text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        {caption}
      </figcaption>
    ) : null}
  </figure>
);

const AddFigure = () => (
  <Figure caption="Tıkla: ortaya düşer. Sürükle: bıraktığın yere konar.">
    <div className="flex w-full items-center gap-3">
      <div className="w-28 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
          Tuval araçları
        </p>
        <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-1 text-[10px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-300" />
          Not
        </div>
      </div>
      <span className="text-[11px] text-neutral-400">→</span>
      <div
        className="relative h-16 flex-1 overflow-hidden rounded-lg"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(128,128,128,0.28) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      >
        <span className="absolute left-1/3 top-1/3 h-8 w-12 rounded-md border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-950/50" />
      </div>
    </div>
  </Figure>
);

const ImageFigure = () => (
  <Figure caption="Saf görsel · yazılı görsel · uyarılı görsel (önce onay).">
    <div className="flex w-full justify-center gap-2">
      <div className="w-[72px] overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <div className="h-10 bg-gradient-to-br from-violet-200 to-indigo-300 dark:from-violet-800 dark:to-indigo-900" />
      </div>
      <div className="w-[72px] overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <div className="h-8 bg-gradient-to-br from-indigo-200 to-sky-300 dark:from-indigo-800 dark:to-sky-900" />
        <div className="h-4 bg-white px-1 pt-0.5 dark:bg-neutral-800">
          <div className="h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-600" />
        </div>
      </div>
      <div className="relative w-[72px] overflow-hidden rounded-md border border-rose-300 dark:border-rose-800">
        <div className="h-10 bg-rose-300/80 blur-[2px] dark:bg-rose-900" />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
          !
        </span>
      </div>
    </div>
  </Figure>
);

const NoteShapeMini = ({ shape }) => {
  const w = 56;
  const h = 36;
  const paint = NOTE_SHAPE_PAINT.yellow;

  if (shape === NOTE_SHAPE.RECTANGLE) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-14", paint)} aria-hidden="true">
        <rect x="1" y="1" width={w - 2} height={h - 2} rx="4" fill="inherit" stroke="inherit" strokeWidth="1.25" />
      </svg>
    );
  }
  if (shape === NOTE_SHAPE.HEXAGON) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-14", paint)} aria-hidden="true">
        <polygon points={pointsAttr(elongatedHexagon(w, h))} fill="inherit" stroke="inherit" strokeWidth="1.25" />
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-14", paint)} aria-hidden="true">
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 1.4} ry={h / 2 - 1.4} fill="inherit" stroke="inherit" strokeWidth="1.25" />
    </svg>
  );
};

const NoteFigure = () => (
  <Figure caption="Üst şeritten taşı, sağ alttan boyut, sağ üstten renk ve şekil.">
    <div className="flex items-end justify-center gap-3">
      {[NOTE_SHAPE.RECTANGLE, NOTE_SHAPE.HEXAGON, NOTE_SHAPE.OVAL].map((shape) => (
        <div key={shape} className="flex flex-col items-center gap-1">
          <NoteShapeMini shape={shape} />
          <span className="text-[9px] text-neutral-500">{NOTE_SHAPE_LABEL[shape]}</span>
        </div>
      ))}
    </div>
  </Figure>
);

const FileFigure = () => (
  <Figure caption="Klasör yüzüne bırak veya + ile seç. Görsele tıkla: önizleme.">
    <div className="flex w-36 flex-col items-center rounded-lg border border-dashed border-sky-300 bg-sky-50/70 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/30">
      <span className="text-[11px] font-medium text-sky-800 dark:text-sky-200">Dosya</span>
      <div className="mt-1.5 flex gap-1">
        {["PDF", "PNG", "MP3"].map((ext) => (
          <span
            key={ext}
            className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700"
          >
            {ext}
          </span>
        ))}
      </div>
    </div>
  </Figure>
);

const DotFigure = () => (
  <Figure caption="Gri: sıradan not. Mavi: URL. Kırmızı: önce onay.">
    <div className="flex items-center gap-5">
      {[
        { ring: "border-neutral-400", label: "Nötr" },
        { ring: "border-sky-400", label: "Bağlantı" },
        { ring: "border-rose-400", label: "Hassas" },
      ].map((dot) => (
        <div key={dot.label} className="flex flex-col items-center gap-1.5">
          <span className={cn("h-5 w-5 rounded-full border-2 bg-white dark:bg-neutral-900", dot.ring)} />
          <span className="text-[9px] text-neutral-500">{dot.label}</span>
        </div>
      ))}
    </div>
  </Figure>
);

const ArrowFigure = () => (
  <Figure caption="Önce ok türünü seç, sonra A’ya ve B’ye tıkla. Çift tık: etiket.">
    <svg viewBox="0 0 220 36" className="h-8 w-full max-w-sm text-neutral-600 dark:text-neutral-300">
      <defs>
        <marker id="help-arrow-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 8 4 L 0 7 z" fill="currentColor" />
        </marker>
        <marker id="help-arrow-tail" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 8 1 L 0 4 L 8 7 z" fill="currentColor" />
        </marker>
      </defs>
      <line x1="8" y1="18" x2="62" y2="18" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#help-arrow-head)" />
      <text x="35" y="12" textAnchor="middle" className="fill-current text-[8px]">A → B</text>
      <line x1="84" y1="18" x2="138" y2="18" stroke="currentColor" strokeWidth="1.5" markerStart="url(#help-arrow-tail)" />
      <text x="111" y="12" textAnchor="middle" className="fill-current text-[8px]">B → A</text>
      <line
        x1="160"
        y1="18"
        x2="212"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        markerStart="url(#help-arrow-tail)"
        markerEnd="url(#help-arrow-head)"
      />
      <text x="186" y="12" textAnchor="middle" className="fill-current text-[8px]">A ↔ B</text>
    </svg>
  </Figure>
);

const PinFigure = () => (
  <Figure caption="İğneyi oka bırak. Taşıyınca ok onun içinden gider. Çift tık: ipten ayrılır.">
    <svg viewBox="0 0 200 48" className="h-10 w-full max-w-xs text-neutral-600 dark:text-neutral-300">
      <defs>
        <marker id="help-pin-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 8 4 L 0 7 z" fill="currentColor" />
        </marker>
        <radialGradient id="help-pin-sphere" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#7a7a7a" />
          <stop offset="45%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
      </defs>
      <path
        d="M 12 24 C 50 24, 70 8, 100 8 C 130 8, 150 24, 188 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        markerEnd="url(#help-pin-head)"
      />
      <circle cx="100" cy="8" r="5" fill="url(#help-pin-sphere)" stroke="#111" strokeWidth="0.5" />
    </svg>
  </Figure>
);

const NavFigure = () => (
  <Figure caption="Boş zemin: kaydır. Sağ sürükle: kutu seçimi. Tekerlek: zoom.">
    <div className="flex items-center gap-3">
      <div
        className="relative h-14 w-28 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(128,128,128,0.28) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      >
        <span className="absolute left-3 top-3 h-5 w-8 rounded-sm border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50" />
        <span className="absolute left-10 top-5 h-8 w-12 rounded border border-sky-400/70 bg-sky-400/10" />
      </div>
      <div className="flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white p-0.5 text-[10px] font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        <span className="px-1.5">−</span>
        <span className="px-1">100%</span>
        <span className="px-1.5">+</span>
      </div>
    </div>
  </Figure>
);

const SECTIONS = [
  {
    title: "1. Tuvale öğe ekle",
    body: "Soldaki paletten bir araca tıkla — öğe tuvalin ortasına düşer. Ya da basılı tutup sürükle; bıraktığın yere konar.",
    Figure: AddFigure,
  },
  {
    title: "2. Görsel",
    body: "Üç tür var. Saf görsel yalnızca resmi tutar. Yazılı görselin altında yazı alanı vardır. Uyarılı görsel buğulu kırmızıdır; tıklayınca hassas içerik uyarısı çıkar. Çift tık lightbox’ta orijinal boyutu gösterir.",
    Figure: ImageFigure,
  },
  {
    title: "3. Not",
    body: "Tek bir not bloğu. Üst şeritten taşı, sağ alttan büyüt veya küçült. Sağ üstteki paletten rengini ve şeklini değiştir: dikdörtgen, uzun altıgen veya oval.",
    Figure: NoteFigure,
  },
  {
    title: "4. Dosya",
    body: "Klasör yüzüne PDF, görsel veya başka bir dosya bırak; ya da + ile seç. En fazla 12 dosya. Görsele tıklayınca önizleme, diğerlerine tıklayınca indirme açılır.",
    Figure: FileFigure,
  },
  {
    title: "5. İşaret yazı",
    body: "Tıklayınca konuşma balonu açılır. Nötr sıradan not, mavi dış bağlantı (URL + yeni sekmede aç), kırmızı hassas içeriktir — kırmızıda önce onay istenir.",
    Figure: DotFigure,
  },
  {
    title: "6. Oklar",
    body: "Paletten türü seç, sonra iki öğeye tıkla. A → B ileri, B → A geri, A ↔ B çift yön. Aynı çifte aynı tür ikinci kez eklenmez. Oka tıkla, Delete ile sil. Etiket için oka çift tıkla.",
    Figure: ArrowFigure,
  },
  {
    title: "7. İğne",
    body: "Küçük koyu küre. Oka sürükleyerek bağla; aynı ipe istediğin kadar iğne tak. Başka bir okun üzerine bırakınca eski ipten çıkar, yenisine geçer. Çift tıklayınca ipten ayrılır (silinmez). İğneyi taşıyınca ok onun içinden gider.",
    Figure: PinFigure,
  },
  {
    title: "8. Tuval gezintisi",
    body: "Boş zemini sürükleyerek kaydır. Sağ tıkla basılı tutup sürükleyince o kutunun içindeki her şey seçilir; sonra Delete ile sil veya tutup başka yere taşı. Tekerlek yakınlaştırır. Sağ alttaki panelden +, − veya Sıfırla kullan.",
    Figure: NavFigure,
  },
  {
    title: "9. Klavye kısayolları",
    body: "Tab: öğeler arasında gez. Enter / Space: seç veya işaret yazıyı aç. Delete / Backspace: seçili öğeyi (veya alanı) siler; yalnızca yazı işaretliyse metni siler. Ctrl+Z: geri al, Ctrl+Y / Ctrl+Shift+Z: yinele. Escape: seçimi, lightbox, uyarı, ok aracı veya balonu kapat.",
    Figure: null,
  },
];

export const MindmapHelp = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const root = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const focusables = () =>
      [...(root?.querySelectorAll("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])") ?? [])].filter(
        (el) => !el.hasAttribute("disabled"),
      );

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !root) return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-neutral-950/40 p-6 backdrop-blur-[2px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mindmap-help-title"
        className="max-h-[min(40rem,85vh)] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="mindmap-help-title"
              className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Yardım / Nasıl kullanılır?
            </h2>
            <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
              Haritalandırmalı Not — 2D tuval, baştan sona
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            title="Kapat"
            aria-label="Kapat"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <ol className="space-y-3">
          {SECTIONS.map((section) => (
            <li
              key={section.title}
              className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-800/50"
            >
              <h3 className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                {section.title}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {section.body}
              </p>
              {section.Figure ? <section.Figure /> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
