/**
 * Academic article/thesis: A4 paper whose cover fields (title, authors,
 * abstract) are first-class and round-trip through PDF / Word import-export.
 */

import { ACADEMIC_CSS, layoutAcademicPages, PAGE_GAP_PX, PAGE_HEIGHT_PX } from "../../lib/academicLayout";
import { GraduationCap } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FORMAT } from "../../config/format";
import {
  bibliographyItemsFromResearch,
  normalizeBibliographyItems,
} from "../../lib/academicBibliography";
import { downloadAcademicDocx } from "../../lib/academicExport";
import { importAcademicFile } from "../../lib/academicImport";
import { isBlankAcademicNote } from "../../lib/academicDocument";
import { downloadAcademicPdf } from "../../lib/academicPdf";
import { instantiateAcademicTemplate } from "../../lib/academicTemplates";
import { cn } from "../../lib/cn";
import { htmlToPlainText, noteBodyStats } from "../../lib/richText";
import { AcademicTools } from "./AcademicTools";
import { NoteSearch } from "./NoteSearch";
import { RichTextBody } from "./RichTextBody";
import { useNoteSearch } from "./useNoteSearch";
import {PdfImportSetup,PdfImportReview} from './PdfImportReview.jsx';
import genericThesis from '../../../../../engine/src/templates/generic.js';

const NO_SOURCES = [];

const sameFormat = (left, right) =>
  left.size === right.size &&
  left.align === right.align &&
  left.bold === right.bold &&
  left.italic === right.italic &&
  left.strike === right.strike &&
  left.underline === right.underline &&
  left.overline === right.overline;

const fitAutoTextarea = (el, minHeight = 28) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
};

export const AcademicEditor = ({
  title,
  content,
  researchData,
  onTitleChange,
  onContentChange,
  onResearchDataChange,
  onDocumentChange,
  onCreateFromTemplate,
}) => {
  const titleRef = useRef(null);
  const authorsRef = useRef(null);
  const abstractRef = useRef(null);
  const bibliographyRefs = useRef([]);
  const articleRef = useRef(null);
  const bodyHostRef = useRef(null);
  const bodyRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState(DEFAULT_FORMAT);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportResult, setExportResult] = useState("");
  const [pdfFile,setPdfFile]=useState(null),[pendingPdf,setPendingPdf]=useState(null);
  const pdfAbort=useRef(null);
  useEffect(()=>()=>pdfAbort.current?.abort(),[]);
  const importPdf=async options=>{
    const file=pdfFile;setPdfFile(null);if(!file)return;
    const controller=new AbortController();pdfAbort.current?.abort();pdfAbort.current=controller;
    setExporting('import');setExportError('');
    try{
      const {importThesisPdfFile}=await import('../../../../../engine/src/importPdf.js');
      const next=await importThesisPdfFile(file,{title,content,researchData:{...researchData,thesis:{...researchData?.thesis,templateId:researchData?.thesis?.templateId||genericThesis.id}}},{...options,signal:controller.signal,
        onProgress:p=>{if(!controller.signal.aborted)setExportResult(`${p.stage} · ${p.page}/${p.total}`);}});
      if(!controller.signal.aborted){setPendingPdf(next);setExportResult('');}
    }catch(error){if(error.name!=='AbortError')setExportError(error.message||'PDF içe aktarılamadı');}
    finally{if(!controller.signal.aborted)setExporting('');}
  };
  const [pageCount, setPageCount] = useState(1);
  const savedSources = researchData?.sources;
  const sources = useMemo(
    () => (Array.isArray(savedSources) ? savedSources : NO_SOURCES),
    [savedSources],
  );
  const docAuthors = researchData?.docAuthors ?? "";
  const institution = researchData?.institution ?? "";
  const keywords = researchData?.keywords ?? "";
  const docAbstract = researchData?.docAbstract ?? "";
  const bibliographyEnabled = Boolean(researchData?.bibliographyEnabled);
  const pageNumberPosition = researchData?.pageNumberPosition || "bottom-center";
  const pageNumbering = researchData?.pageNumbering || { front: "arabic", body: "arabic" };
  const [xrefTargets, setXrefTargets] = useState([]);
  const bibliographyItems = useMemo(
    () => normalizeBibliographyItems(bibliographyItemsFromResearch(researchData)),
    [researchData],
  );
  const liveFootnotes = useMemo(() => {
    const items = [];
    const re = /<(?:sup|span)[^>]*academic-footnote[^>]*>/gi;
    let match;
    const html = String(content ?? "");
    while ((match = re.exec(html))) {
      const tag = match[0];
      const index = tag.match(/data-fn-index="(\d+)"/)?.[1];
      const text = tag.match(/data-fn-text="([^"]*)"/)?.[1];
      if (index) {
        items.push({
          index,
          text: String(text ?? "")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">"),
        });
      }
    }
    return items;
  }, [content]);
  const plainTitle = htmlToPlainText(title);
  const { hostRef, searchRef, haystack, jumpToWord } = useNoteSearch({
    title,
    body: content,
    titleRef,
    bodyHostRef,
  });

  const focusBody = useCallback(() => {
    const editable = bodyHostRef.current?.querySelector("[contenteditable]");
    if (!editable) return;
    RichTextBody.focusStart(editable);
    editable.scrollTop = 0;
  }, []);

  const persistResearch = useCallback(
    (patch) => {
      onResearchDataChange?.({
        sources,
        docAuthors,
        institution,
        keywords,
        docAbstract,
        bibliographyEnabled,
        docBibliographyItems: bibliographyItems,
        pageNumberPosition,
        pageNumbering,
        templateId: researchData?.templateId,
        footnotes: researchData?.footnotes,
        ...patch,
      });
    },
    [
      bibliographyEnabled,
      bibliographyItems,
      docAbstract,
      docAuthors,
      institution,
      keywords,
      onResearchDataChange,
      pageNumberPosition,
      pageNumbering,
      researchData?.footnotes,
      researchData?.templateId,
      sources,
    ],
  );

  const exportDoc = useCallback(
    () => ({
      title: plainTitle,
      html: bodyRef.current?.getHtml?.() || content,
      docAuthors,
      institution,
      keywords,
      docAbstract,
      bibliographyEnabled,
      docBibliographyItems: bibliographyItems,
      pageNumberPosition,
      pageNumbering,
      sources,
    }),
    [
      bibliographyEnabled,
      bibliographyItems,
      content,
      docAbstract,
      docAuthors,
      institution,
      keywords,
      pageNumberPosition,
      pageNumbering,
      plainTitle,
      sources,
    ],
  );

  const focusBibliographyItem = useCallback((index) => {
    window.requestAnimationFrame(() => {
      const el = bibliographyRefs.current[index];
      if (!el) return;
      el.focus();
      fitAutoTextarea(el);
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, []);

  const setBibliographyEnabled = useCallback(
    (next) => {
      const items = next && bibliographyItems.every((item) => !item.trim())
        ? [""]
        : bibliographyItems;
      persistResearch({ bibliographyEnabled: next, docBibliographyItems: items });
      if (next) focusBibliographyItem(0);
    },
    [bibliographyItems, focusBibliographyItem, persistResearch],
  );

  const updateBibliographyItem = useCallback(
    (index, value) => {
      const next = bibliographyItems.map((item, i) => (i === index ? value : item));
      persistResearch({ docBibliographyItems: next });
    },
    [bibliographyItems, persistResearch],
  );

  const addBibliographyItem = useCallback(
    (afterIndex = bibliographyItems.length - 1) => {
      const next = [...bibliographyItems];
      next.splice(afterIndex + 1, 0, "");
      persistResearch({ docBibliographyItems: next });
      focusBibliographyItem(afterIndex + 1);
    },
    [bibliographyItems, focusBibliographyItem, persistResearch],
  );

  const removeBibliographyItem = useCallback(
    (index) => {
      if (bibliographyItems.length <= 1) {
        persistResearch({ docBibliographyItems: [""] });
        focusBibliographyItem(0);
        return;
      }
      const next = bibliographyItems.filter((_, i) => i !== index);
      persistResearch({ docBibliographyItems: next });
      focusBibliographyItem(Math.max(0, index - 1));
    },
    [bibliographyItems, focusBibliographyItem, persistResearch],
  );

  useLayoutEffect(() => {
    fitAutoTextarea(abstractRef.current, 18);
    bibliographyRefs.current.forEach((el) => fitAutoTextarea(el));
  }, [bibliographyItems, bibliographyEnabled, docAbstract]);

  const liveExportDoc = useCallback(() => {
    const article = articleRef.current;
    if (article) layoutAcademicPages(article);
    return { ...exportDoc(), article };
  }, [exportDoc]);

  const handleExportPdf = useCallback(async () => {
    setExportError("");
    setExportResult("");
    setExporting("pdf");
    try {
      const path = await downloadAcademicPdf(liveExportDoc());
      setExportResult(path ? `Kaydedildi: ${path}` : "PDF indirmeler klasörüne düştü.");
    } catch (error) {
      setExportError(error?.message || "PDF kaydedilemedi");
    } finally {
      setExporting("");
    }
  }, [liveExportDoc]);

  const handleExportDocx = useCallback(async () => {
    setExportError("");
    setExportResult("");
    setExporting("docx");
    try {
      const path = await downloadAcademicDocx(liveExportDoc());
      setExportResult(path ? `Kaydedildi: ${path}` : "Word indirmeler klasörüne düştü.");
    } catch (error) {
      setExportError(error?.message || "Word dosyası oluşturulamadı");
    } finally {
      setExporting("");
    }
  }, [liveExportDoc]);

  const handleImport = useCallback(
    async (file) => {
      if(/\.pdf$/i.test(file?.name||'')){
        if(!onDocumentChange){setExportError('Kontrollü PDF aktarımı için belgeyi çalışma alanında açın.');return;}
        setPdfFile(file);setToolsOpen(false);return;
      }
      setExportError("");
      setExportResult("");
      setExporting("import");
      try {
        const paper = await importAcademicFile(file);
        onTitleChange(paper.title || "");
        persistResearch({
          docAuthors: paper.authors,
          institution: paper.institution,
          keywords: paper.keywords,
          docAbstract: paper.abstract,
        });
        onContentChange(paper.bodyHtml || "");
        setExportResult("Belge içe aktarıldı. Başlık, yazar, özet ve metin tanındı.");
        setToolsOpen(false);
        window.requestAnimationFrame(() => titleRef.current?.focus());
      } catch (error) {
        setExportError(error?.message || "Belge içe aktarılamadı");
      } finally {
        setExporting("");
      }
    },
    [onContentChange, onTitleChange, persistResearch,onDocumentChange],
  );

  const isBlankNote = !plainTitle.trim() && !htmlToPlainText(content).trim() && !docAuthors && !docAbstract;
  useEffect(() => {
    if (!isBlankNote) return;
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = bodyRef.current?.activeFormat;
      if (!next) return;
      setActiveFormat((current) => (sameFormat(current, next) ? current : { ...next }));
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setXrefTargets(bodyRef.current?.xrefTargets?.() || []);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content]);

  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return undefined;
    let frames = 0;
    const relayout = () => {
      if (frames) return;
      frames = 2;
      const next = layoutAcademicPages(article);
      setPageCount((count) => (count === next ? count : next));
      const unlock = () => {
        frames -= 1;
        if (frames > 0) window.requestAnimationFrame(unlock);
      };
      window.requestAnimationFrame(unlock);
    };
    relayout();
    const observer = new ResizeObserver(relayout);
    observer.observe(article);
    return () => observer.disconnect();
  }, [
    bibliographyEnabled,
    bibliographyItems,
    content,
    docAbstract,
    docAuthors,
    institution,
    keywords,
    plainTitle,
  ]);

  const { words, paragraphs, letters } = noteBodyStats(content);
  const hint = toolsOpen
    ? "Sağdaki çubuktan biçim, görsel ve PDF / Word içe-dışa aktarma"
    : focusedField === "title"
      ? "Enter — yazar satırına geç"
      : focusedField === "body"
        ? "Bu sayfa A4 belgedir · başlık, yazar ve özet tanınır"
        : "A4 makale · başlık, yazarlar, özet ve metin";

  return (
    <div ref={hostRef} className="flex h-full min-h-0">
      <style>{ACADEMIC_CSS}</style>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 justify-end px-4 pt-3 sm:px-6">
          <NoteSearch haystack={haystack} onPick={jumpToWord} searchRef={searchRef} />
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="academic-canvas h-full overflow-auto px-3 py-4 sm:px-6">
            <div
              className="academic-stack"
              style={{
                height: pageCount * PAGE_HEIGHT_PX + Math.max(0, pageCount - 1) * PAGE_GAP_PX,
              }}
            >
              {Array.from({ length: pageCount }, (_, index) => (
                <div
                  key={index}
                  className="academic-sheet"
                  aria-hidden="true"
                  style={{ top: index * (PAGE_HEIGHT_PX + PAGE_GAP_PX) }}
                />
              ))}
            <article
              ref={articleRef}
              className="academic-page academic-document"
              onContextMenu={(event) => {
                if (event.target.closest("input, textarea, button")) return;
                event.preventDefault();
                bodyRef.current?.openFormatMenu?.(event);
              }}
            >
              <textarea
                ref={titleRef}
                rows={2}
                value={plainTitle}
                data-undo-app="true"
                placeholder="Makale veya tez başlığı"
                aria-label="Makale başlığı"
                onChange={(event) => onTitleChange(event.target.value)}
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  authorsRef.current?.focus();
                }}
                className="document-title academic-title-field"
              />

              <input
                ref={authorsRef}
                type="text"
                value={docAuthors}
                data-undo-app="true"
                placeholder="Yazar(lar)"
                aria-label="Yazarlar"
                onChange={(event) => persistResearch({ docAuthors: event.target.value })}
                onFocus={() => setFocusedField("authors")}
                className="authors academic-meta"
              />
              <input
                type="text"
                value={institution}
                data-undo-app="true"
                placeholder="Üniversite / kurum"
                aria-label="Üniversite veya kurum"
                onChange={(event) => persistResearch({ institution: event.target.value })}
                className="institution academic-meta"
              />
              <input
                type="text"
                value={keywords}
                data-undo-app="true"
                placeholder="Anahtar kelimeler"
                aria-label="Anahtar kelimeler"
                onChange={(event) => persistResearch({ keywords: event.target.value })}
                className="keywords academic-meta academic-meta--keywords"
              />

              <label className="abstract academic-abstract">
                <span>Özet</span>
                <textarea
                  ref={abstractRef}
                  value={docAbstract}
                  data-undo-app="true"
                  placeholder="Makale veya tezin kısa özeti"
                  aria-label="Özet"
                  rows={1}
                  onChange={(event) => {
                    persistResearch({ docAbstract: event.target.value });
                    fitAutoTextarea(event.target, 18);
                  }}
                  onFocus={() => setFocusedField("abstract")}
                />
              </label>

              <div ref={bodyHostRef}>
                <RichTextBody
                  ref={bodyRef}
                  compact
                  academic
                  className="academic-body body"
                  content={content}
                  onContentChange={onContentChange}
                  onFormatChange={(next) =>
                    setActiveFormat((current) => (sameFormat(current, next) ? current : { ...next }))
                  }
                  onFocus={() => setFocusedField("body")}
                  onBlur={() => setFocusedField(null)}
                  onMoveToTitle={() => titleRef.current?.focus()}
                  ariaLabel="Akademik yazı"
                />
              </div>

              {liveFootnotes.length ? (
                <ol className="academic-footnote-list">
                  {liveFootnotes.map((note) => (
                    <li key={note.index}>
                      <sup>{note.index}</sup> {note.text}
                    </li>
                  ))}
                </ol>
              ) : null}

              {bibliographyEnabled ? (
                <div className="bibliography academic-bibliography-field">
                  <span>Kaynakça</span>
                  <ul className="academic-bibliography-list">
                    {bibliographyItems.map((item, index) => (
                      <li key={`bib-${index}`}>
                        <textarea
                          ref={(el) => {
                            bibliographyRefs.current[index] = el;
                          }}
                          rows={1}
                          value={item}
                          data-undo-app="true"
                          placeholder="Kaynak…"
                          aria-label={`Kaynakça maddesi ${index + 1}`}
                          onChange={(event) => {
                            updateBibliographyItem(index, event.target.value);
                            fitAutoTextarea(event.target);
                          }}
                          onFocus={() => setFocusedField("bibliography")}
                          onBlur={() => setFocusedField(null)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              addBibliographyItem(index);
                              return;
                            }
                            if (event.key === "Backspace" && !item && bibliographyItems.length > 1) {
                              event.preventDefault();
                              removeBibliographyItem(index);
                            }
                          }}
                        />
                        {bibliographyItems.length > 1 ? (
                          <button
                            type="button"
                            className="academic-bibliography-remove"
                            title="Maddeyi sil"
                            aria-label={`Kaynakça maddesini sil ${index + 1}`}
                            onClick={() => removeBibliographyItem(index)}
                          >
                            ×
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="academic-bibliography-add"
                    onClick={() => addBibliographyItem(bibliographyItems.length - 1)}
                  >
                    + Madde ekle
                  </button>
                </div>
              ) : null}
            </article>
            </div>
          </div>

          {!toolsOpen ? (
            <button
              type="button"
              aria-label="Akademik araçları aç"
              onClick={() => setToolsOpen(true)}
              className={cn(
                "absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full",
                "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20",
                "hover:bg-neutral-800",
                "dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
              )}
            >
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-8 shrink-0 flex-wrap items-center justify-between gap-x-4 border-t border-neutral-200 px-6 py-1.5 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500 sm:px-10">
          <span>{hint}</span>
          <span className="tabular-nums">
            {words} kelime · {paragraphs} paragraf · {letters} harf
          </span>
        </div>
      </div>

      {pdfFile?<PdfImportSetup file={pdfFile} onCancel={()=>setPdfFile(null)} onStart={options=>void importPdf(options)}/>:null}
      {pendingPdf?<PdfImportReview note={pendingPdf} onChange={setPendingPdf} onCancel={()=>setPendingPdf(null)} onApply={next=>{onDocumentChange(next);setPendingPdf(null);}}/>:null}
      {exporting==='import'?<div className="p-2 text-xs" role="status">{exportResult}<button type="button" className="mx-2 border p-1" onClick={()=>{pdfAbort.current?.abort();setExporting('');setExportResult('İçe aktarma iptal edildi.');}}>İçe aktarmayı iptal et</button></div>:null}
      {exportError?<p role="alert" className="p-2 text-sm">{exportError}</p>:null}
      {toolsOpen ? (
        <AcademicTools
          activeFormat={activeFormat}
          bibliographyEnabled={bibliographyEnabled}
          onBibliographyEnabledChange={setBibliographyEnabled}
          exporting={exporting}
          exportError={exportError}
          exportResult={exportResult}
          onApplySize={(size) => bodyRef.current?.applySize(size)}
          onApplyAlign={(align) => bodyRef.current?.applyAlign(align)}
          onToggleStyle={(style) => bodyRef.current?.toggleStyle(style)}
          onClearLines={() => bodyRef.current?.clearLineDecorations()}
          onInsertHtml={(html) => bodyRef.current?.insertHtml(html)}
          onInsertHeading={(level) => bodyRef.current?.insertHeading(level)}
          onInsertFootnote={(text) => bodyRef.current?.insertFootnote(text)}
          onInsertToc={() => bodyRef.current?.insertToc()}
          onInsertPageBreak={() => bodyRef.current?.insertPageBreak()}
          onInsertXref={(target) => bodyRef.current?.insertXref(target)}
          onInsertTable={(rows, cols, caption) => bodyRef.current?.insertTable(rows, cols, caption)}
          onToggleEquationNumber={() => bodyRef.current?.toggleEquationNumber()}
          xrefTargets={xrefTargets}
          pageNumberPosition={pageNumberPosition}
          onPageNumberPositionChange={(value) => persistResearch({ pageNumberPosition: value })}
          onApplyTemplate={(template) => {
            const seeded = instantiateAcademicTemplate(template, researchData);
            if (!seeded) return;
            const blank = isBlankAcademicNote({ title, content, researchData });
            if (blank || !onCreateFromTemplate) {
              onContentChange(seeded.content);
              persistResearch(seeded.researchData);
              return;
            }
            onCreateFromTemplate(seeded);
          }}
          onInsertFormula={(display) => bodyRef.current?.insertFormula(display)}
          onInsertCode={(language) => bodyRef.current?.insertCode(language)}
          onInsertLink={(href, text) => bodyRef.current?.insertLink(href, text)}
          onImportFile={(file) => void handleImport(file)}
          onExportPdf={() => void handleExportPdf()}
          onExportDocx={() => void handleExportDocx()}
          onClose={() => setToolsOpen(false)}
        />
      ) : null}
    </div>
  );
};
