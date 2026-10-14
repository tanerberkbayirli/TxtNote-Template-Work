/**
 * Right-side academic toolbox: heading size, image, link, bibliography toggle, PDF / Word.
 */

import { AlignCenter, AlignLeft, AlignRight, Bold, BookMarked, Code, CornerDownRight, Eraser, FileDown, FileType, FileUp, FunctionSquare, Heading1, Heading2, Heading3, Image as ImageIcon, Italic, LayoutTemplate, Link2, ListOrdered, SeparatorHorizontal, Strikethrough, Superscript, Table as TableIcon, Type, Underline, X } from "lucide-react";
import { useRef, useState } from "react";
import { FORMAT_ALIGNS, FORMAT_POINTS, FORMAT_SIZES } from "../../config/format";
import { normalizeHttpUrl } from "../../lib/academicCite";
import { figureHtml, imageDimensions, readImageAsDataUrl } from "../../lib/academicMedia";
import { ACADEMIC_TEMPLATES } from "../../lib/academicTemplates";
import { PAGE_NUMBER_POSITIONS, tableHtml } from "../../lib/academicDocument";
import { cn } from "../../lib/cn";

const SECTIONS = [
  { id: "biblio", label: "Kaynakça", icon: BookMarked },
  { id: "template", label: "Şablon", icon: LayoutTemplate },
  { id: "text", label: "Yazı", icon: Type },
  { id: "math", label: "Formül", icon: FunctionSquare },
  { id: "code", label: "Kod", icon: Code },
  { id: "image", label: "Görsel", icon: ImageIcon },
  { id: "link", label: "Bağlantı", icon: Link2 },
  { id: "files", label: "Dosya", icon: FileDown },
];

const ALIGN_ICONS = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
};

const STYLE_OPTIONS = [
  { id: "bold", label: "Kalın", icon: Bold },
  { id: "italic", label: "İtalik", icon: Italic },
  { id: "underline", label: "Altı çizili", icon: Underline },
  { id: "overline", label: "Üstünden çiz", icon: Underline, flip: true },
  { id: "strike", label: "Üstü çizili", icon: Strikethrough },
];

const inputClass =
  "mt-1 h-8 w-full rounded-md border border-neutral-300 bg-white px-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus-visible:ring-neutral-500";

const labelClass = "text-[11px] font-medium text-neutral-500 dark:text-neutral-400";

const actionClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-3 text-[12px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white";

const keepCaret = (event) => event.preventDefault();

const Field = ({ label, value, onChange, placeholder, type = "text", min, max }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  </label>
);

export const AcademicTools = ({
  activeFormat,
  bibliographyEnabled,
  onBibliographyEnabledChange,
  onApplySize,
  onApplyAlign,
  onToggleStyle,
  onClearLines,
  onInsertHtml,
  onApplyTemplate,
  onInsertHeading,
  onInsertFootnote,
  onInsertToc,
  onInsertPageBreak,
  onInsertXref,
  onInsertTable,
  onToggleEquationNumber,
  xrefTargets,
  pageNumberPosition,
  onPageNumberPositionChange,
  onInsertFormula,
  onInsertCode,
  onInsertLink,
  onImportFile,
  onExportPdf,
  onExportDocx,
  exporting,
  exportError,
  exportResult,
  onClose,
}) => {
  const [section, setSection] = useState("biblio");
  const [caption, setCaption] = useState("");
  const [imageError, setImageError] = useState("");
  const [busyImage, setBusyImage] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const [linkText, setLinkText] = useState("");
  const [footnoteText, setFootnoteText] = useState("");
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [tableCaption, setTableCaption] = useState("");
  const fileRef = useRef(null);
  const importRef = useRef(null);

  const insertImage = async (file) => {
    if (!file) return;
    setImageError("");
    setBusyImage(true);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      const size = await imageDimensions(dataUrl);
      onInsertHtml(figureHtml(dataUrl, caption, size));
      setCaption("");
    } catch (error) {
      setImageError(error?.message || "Görsel eklenemedi");
    } finally {
      setBusyImage(false);
    }
  };

  return (
    <aside
      className="flex h-full min-h-0 w-[min(24rem,100%)] shrink-0 border-l border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
      aria-label="Akademik araçlar"
    >
      <nav className="flex w-12 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 p-1.5 dark:border-neutral-800">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const on = section === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={on}
              onClick={() => setSection(id)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-md transition-colors",
                on
                  ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700"
                  : "text-neutral-500 hover:bg-white/70 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/80 dark:hover:text-neutral-100",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
          <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">
            {SECTIONS.find((item) => item.id === section)?.label ?? "Araçlar"}
          </p>
          {onClose ? (
            <button
              type="button"
              aria-label="Araçları kapat"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {section === "biblio" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kaynakça</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Her kaynak solda siyah noktalı ayrı bir maddedir. PDF ve Word çıktısı da aynı görünür.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={bibliographyEnabled}
                  onClick={() => onBibliographyEnabledChange?.(true)}
                  className={cn(
                    "rounded-md px-2 py-2 text-[12px] font-medium transition-colors",
                    bibliographyEnabled
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800",
                  )}
                >
                  Kaynakça olsun
                </button>
                <button
                  type="button"
                  aria-pressed={!bibliographyEnabled}
                  onClick={() => onBibliographyEnabledChange?.(false)}
                  className={cn(
                    "rounded-md px-2 py-2 text-[12px] font-medium transition-colors",
                    !bibliographyEnabled
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800",
                  )}
                >
                  Kaynakça olmasın
                </button>
              </div>
              {bibliographyEnabled ? (
                <p className="mt-3 text-[12px] text-emerald-700 dark:text-emerald-300">
                Kaynakça alanı sayfanın altında açık. Her kaynağı ayrı madde olarak yazın.
                </p>
              ) : (
                <p className="mt-3 text-[12px] text-neutral-400">Kaynakça alanı kapalı.</p>
              )}
            </div>
          )}

          {section === "template" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Şablonlar</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Kapak alanları (başlık, yazar, kurum, özet) durur. Seçilen şablon yeni akademik
                belge açar; not hâlâ boşsa buraya yazılır.
              </p>
              <div className="mt-3 space-y-2">
                {ACADEMIC_TEMPLATES.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg bg-white p-3 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700"
                  >
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">{item.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{item.hint}</p>
                    <ol className="mt-2 max-h-16 overflow-hidden rounded-md bg-neutral-50 px-2 py-1.5 text-[10px] leading-relaxed text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      {item.preview.slice(0, 6).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      onMouseDown={keepCaret}
                      onClick={() => onApplyTemplate?.(item)}
                      className={cn(actionClass, "mt-2 w-full")}
                    >
                      Bu şablonu kullan
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {section === "text" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Yazı</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                İmleci metne koy, sonra punto, boyut veya hizayı seç.
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Başlık yapısı</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[
                  { level: 1, label: "Başlık 1", icon: Heading1 },
                  { level: 2, label: "Başlık 2", icon: Heading2 },
                  { level: 3, label: "Başlık 3", icon: Heading3 },
                ].map(({ level, label, icon: Icon }) => (
                  <button
                    key={level}
                    type="button"
                    title={label}
                    onMouseDown={keepCaret}
                    onClick={() => onInsertHeading?.(level)}
                    className="flex h-8 items-center justify-center gap-1 rounded-md text-[11px] text-neutral-700 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    H{level}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onInsertToc?.()}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] text-neutral-600 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
              >
                <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.75} />
                İçindekiler ekle
              </button>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onInsertPageBreak?.()}
                className="mt-1 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] text-neutral-600 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
              >
                <SeparatorHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                Sayfa sonu
              </button>
              <Field label="Dipnot metni" value={footnoteText} onChange={setFootnoteText} placeholder="Sayfa altı not" />
              <button
                type="button"
                disabled={!footnoteText.trim()}
                onMouseDown={keepCaret}
                onClick={() => {
                  onInsertFootnote?.(footnoteText.trim());
                  setFootnoteText("");
                }}
                className={cn(actionClass, "mt-2 w-full disabled:opacity-40")}
              >
                <Superscript className="h-3.5 w-3.5" strokeWidth={1.75} />
                Dipnot ekle
              </button>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Punto</p>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {FORMAT_POINTS.map(({ id, pt }) => (
                  <button
                    key={id}
                    type="button"
                    title={`${pt} punto`}
                    onMouseDown={keepCaret}
                    onClick={() => onApplySize(id)}
                    className={cn(
                      "h-8 rounded-md text-[12px] tabular-nums transition-colors",
                      activeFormat.size === id
                        ? "bg-white text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700"
                        : "text-neutral-700 hover:bg-white/80 dark:text-neutral-200 dark:hover:bg-neutral-800/80",
                    )}
                  >
                    {pt}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Boyut</p>
              <div className="mt-2 space-y-1">
                {FORMAT_SIZES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onMouseDown={keepCaret}
                    onClick={() => onApplySize(id)}
                    className={cn(
                      "flex w-full items-center rounded-md px-2.5 py-1.5 text-left transition-colors",
                      activeFormat.size === id
                        ? "bg-white text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700"
                        : "text-neutral-700 hover:bg-white/80 dark:text-neutral-200 dark:hover:bg-neutral-800/80",
                      id === "heading" && "text-[18px] leading-tight",
                      id === "subheading" && "text-[15px] leading-snug",
                      id === "body" && "text-[13px]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Hizalama</p>
              <div className="mt-2 flex gap-1">
                {FORMAT_ALIGNS.map(({ id, label }) => {
                  const Icon = ALIGN_ICONS[id];
                  const on = (activeFormat.align ?? "left") === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      aria-label={label}
                      onMouseDown={keepCaret}
                      onClick={() => onApplyAlign(id)}
                      className={cn(
                        "flex h-8 flex-1 items-center justify-center rounded-md transition-colors",
                        on
                          ? "bg-white text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700"
                          : "text-neutral-500 hover:bg-white/80 dark:hover:bg-neutral-800/80",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Stil</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                Açık stil tekrar basınca kalkar. İmleci çizili sözcüğün içine koyman yeterli.
              </p>
              <div className="mt-2 space-y-1">
                {STYLE_OPTIONS.map(({ id, label, icon: Icon, flip }) => {
                  const on = Boolean(activeFormat[id]);
                  return (
                    <button
                      key={id}
                      type="button"
                      title={on ? `${label} · kaldır` : label}
                      aria-pressed={on}
                      onMouseDown={keepCaret}
                      onClick={() => onToggleStyle(id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                        on
                          ? "bg-white text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700"
                          : "text-neutral-700 hover:bg-white/80 dark:text-neutral-200 dark:hover:bg-neutral-800/80",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", flip && "-scale-y-100")} strokeWidth={1.75} />
                      <span
                        className={cn(
                          "flex-1",
                          id === "bold" && "font-bold",
                          id === "italic" && "italic",
                          id === "underline" && "underline underline-offset-2",
                          id === "overline" && "overline",
                          id === "strike" && "line-through",
                        )}
                      >
                        {on ? `${label} · kaldır` : label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onClearLines?.()}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] text-neutral-600 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
              >
                <Eraser className="h-3.5 w-3.5" strokeWidth={1.75} />
                Çizgileri kaldır
              </button>
            </div>
          )}

          {section === "math" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Formül</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                İmlecin olduğu yere bir matematik kutusu eklenir. LaTeX yazın veya kutudaki aramadan formül seçin.
                PDF ve Word çıktısında da görünür.
              </p>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onInsertFormula?.(true)}
                className={cn(actionClass, "mt-3 w-full")}
              >
                <FunctionSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                Blok formül ekle
              </button>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onInsertFormula?.(false)}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] text-neutral-600 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
              >
                Satır içi formül ekle
              </button>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onToggleEquationNumber?.()}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[12px] text-neutral-600 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
              >
                Denklem numarası aç/kapat
              </button>
            </div>
          )}

          {section === "code" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kod</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Sayfaya hizalı düz metin olarak eklenir: renk ve kutu yok, girintiler korunur.
              </p>
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => onInsertCode?.()}
                className={cn(actionClass, "mt-3 w-full")}
              >
                <Code className="h-3.5 w-3.5" strokeWidth={1.75} />
                Kod ekle
              </button>
            </div>
          )}

          {section === "image" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Görsel</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                JPEG, PNG veya WebP. İmlecin olduğu yere yerleşir.
              </p>
              <Field label="Şekil yazısı" value={caption} onChange={setCaption} placeholder="Şekil 1. …" />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void insertImage(file);
                }}
              />
              <button
                type="button"
                disabled={busyImage}
                onMouseDown={keepCaret}
                onClick={() => fileRef.current?.click()}
                className={cn(actionClass, "mt-3 w-full", busyImage && "opacity-60")}
              >
                <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {busyImage ? "Ekleniyor…" : "Görsel seç"}
              </button>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tablo</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Paragrafın içine gömülmez; satır ve sütun sayısı kadar ızgara eklenir.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Satır" type="number" min="2" max="20" value={tableRows} onChange={setTableRows} placeholder="3" />
                <Field label="Sütun" type="number" min="1" max="12" value={tableCols} onChange={setTableCols} placeholder="3" />
              </div>
              <Field label="Tablo yazısı" value={tableCaption} onChange={setTableCaption} placeholder="Tablo başlığı" />
              <button
                type="button"
                onMouseDown={keepCaret}
                onClick={() => {
                  const rows = tableRows;
                  const cols = tableCols;
                  const title = tableCaption;
                  if (onInsertTable) onInsertTable(rows, cols, title);
                  else onInsertHtml?.(tableHtml(rows, cols, title));
                  setTableCaption("");
                }}
                className={cn(actionClass, "mt-3 w-full")}
              >
                <TableIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                Tablo ekle
              </button>
              {imageError ? (
                <p className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">{imageError}</p>
              ) : null}
            </div>
          )}

          {section === "link" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Bağlantı</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Seçili yazıyı bağla veya yeni bir bağlantı ekle. Açmak için Ctrl+tık.
              </p>
              <Field label="Adres" value={linkHref} onChange={setLinkHref} placeholder="https://" />
              <Field label="Görünen metin" value={linkText} onChange={setLinkText} placeholder="İsteğe bağlı" />
              <button
                type="button"
                disabled={!normalizeHttpUrl(linkHref)}
                onMouseDown={keepCaret}
                onClick={() => {
                  onInsertLink(linkHref, linkText);
                  setLinkHref("");
                  setLinkText("");
                }}
                className={cn(actionClass, "mt-3 w-full disabled:opacity-40")}
              >
                <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Bağlantı ekle
              </button>
              {(xrefTargets?.length ?? 0) > 0 ? (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Çapraz başvuru</p>
                  <p className="mt-1 text-[11px] text-neutral-400">Şekil veya tablo numarası değişince metin güncellenir.</p>
                  <div className="mt-2 space-y-1">
                    {xrefTargets.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={keepCaret}
                        onClick={() => onInsertXref?.(item)}
                        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] text-neutral-700 ring-1 ring-neutral-200 hover:bg-white dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                      >
                        <CornerDownRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {section === "files" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">İçe / dışa aktar</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                PDF aktarımında sayfa, metin, tablo ve OCR önizlemesini inceleyip düzeltin.
                PDF'nin tüm sayfaları tez düzenleyicisinde açılır. Word aktarımında başlık,
                yazarlar ve özet tanınır. Kaynakça için sağdaki
                «Kaynakça olsun» düğmesini kullanın.
              </p>
              <input
                ref={importRef}
                type="file"
                accept=".pdf,.docx,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onImportFile?.(file);
                }}
              />
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => importRef.current?.click()}
                className={cn(actionClass, "mt-3 w-full disabled:opacity-40")}
              >
                <FileUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                {exporting === "import" ? "Okunuyor…" : "PDF veya Word içe aktar"}
              </button>
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={onExportPdf}
                className={cn(actionClass, "mt-2 w-full disabled:opacity-40")}
              >
                <FileDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                {exporting === "pdf" ? "Hazırlanıyor…" : "PDF olarak kaydet"}
              </button>
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={onExportDocx}
                className={cn(actionClass, "mt-2 w-full disabled:opacity-40")}
              >
                <FileType className="h-3.5 w-3.5" strokeWidth={1.75} />
                {exporting === "docx" ? "Hazırlanıyor…" : "Word (.docx) olarak kaydet"}
              </button>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Sayfa numarası</p>
              <div className="mt-2 grid grid-cols-1 gap-1">
                {PAGE_NUMBER_POSITIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={pageNumberPosition === item.id}
                    onClick={() => onPageNumberPositionChange?.(item.id)}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-left text-[12px] font-medium transition-colors",
                      pageNumberPosition === item.id
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {exportResult ? (
                <p role="status" className="mt-2 break-all text-[12px] text-emerald-700 dark:text-emerald-300">
                  {exportResult}
                </p>
              ) : null}
              {exportError ? (
                <p className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">{exportError}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
