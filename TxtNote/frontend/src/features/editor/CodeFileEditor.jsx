/**
 * Full-file source editor: line numbers, tab indent, syntax colour, and a
 * language chip in the bottom-right corner. HTML is never rendered as a page.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Download } from "lucide-react";
import { highlightSource } from "../../lib/codeBlock";
import {
  conflictMessage,
  FILE_CODE_LANGUAGES,
  languageLabel,
  resolveFileLanguage,
} from "../../lib/codeLanguage";
import { encodeFileText } from "../../lib/fileText";
import { downloadViaAnchor } from "../../lib/fileAccess";
import { cn } from "../../lib/cn";

const TAB = "  ";
const HIGHLIGHT_LIMIT = 200_000;
const GUTTER_LIMIT = 4_000;

const lineCountOf = (value) => {
  const text = String(value ?? "");
  if (!text) return 1;
  let count = 1;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) count += 1;
  }
  return count;
};

const leadingIndent = (line) => {
  const match = /^[ \t]*/.exec(line);
  return match ? match[0] : "";
};

export const CodeFileEditor = ({
  title,
  fileName,
  content,
  sourceUrl,
  encoding = "utf-8",
  languageId,
  languageLocked = false,
  mimeType,
  onTitleChange,
  onContentChange,
  onLanguageChange,
}) => {
  const text = String(content ?? "");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || text || !sourceUrl || !onContentChange) return undefined;
    if (text.length > HIGHLIGHT_LIMIT) return undefined;
    let cancelled = false;
    hydratedRef.current = true;
    fetch(sourceUrl)
      .then((response) => response.text())
      .then((body) => {
        if (!cancelled && body) onContentChange(body, "load");
      })
      .catch(() => {
        hydratedRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, text, onContentChange]);
  const resolved = useMemo(
    () =>
      resolveFileLanguage({
        fileName: fileName || title,
        content: text,
        manualLanguage: languageId,
        languageLocked,
      }),
    [fileName, title, text, languageId, languageLocked],
  );
  const language = resolved.language;
  const [html, setHtml] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(Boolean(resolved.conflict));
  const pickerRef = useRef(null);
  const preRef = useRef(null);
  const areaRef = useRef(null);

  useEffect(() => {
    setConflictOpen(Boolean(resolved.conflict) && !languageLocked);
  }, [resolved.conflict, languageLocked, fileName]);

  useEffect(() => {
    let cancelled = false;
    if (text.length > HIGHLIGHT_LIMIT) {
      setHtml("");
      return undefined;
    }
    highlightSource(text, language).then((result) => {
      if (!cancelled) setHtml(result.html || "");
    });
    return () => {
      cancelled = true;
    };
  }, [text, language]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const onDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const lines = lineCountOf(text);

  const emitContent = useCallback(
    (next, reason) => {
      onContentChange?.(next, reason);
    },
    [onContentChange],
  );

  const pickLanguage = (id, locked) => {
    setPickerOpen(false);
    setConflictOpen(false);
    onLanguageChange?.(id, locked);
  };

  const onKeyDown = (event) => {
    const area = event.currentTarget;
    if (event.key === "Tab") {
      event.preventDefault();
      const start = area.selectionStart;
      const end = area.selectionEnd;
      if (event.shiftKey) {
        const before = text.slice(0, start);
        const lineStart = before.lastIndexOf("\n") + 1;
        const head = text.slice(lineStart, start);
        const cut = head.startsWith("\t") ? 1 : head.startsWith(TAB) ? TAB.length : 0;
        if (!cut) return;
        const next = text.slice(0, lineStart) + head.slice(cut) + text.slice(start);
        emitContent(next, "input");
        requestAnimationFrame(() => {
          area.selectionStart = start - cut;
          area.selectionEnd = end - cut;
        });
        return;
      }
      const next = `${text.slice(0, start)}${TAB}${text.slice(end)}`;
      emitContent(next, "input");
      requestAnimationFrame(() => {
        const caret = start + TAB.length;
        area.selectionStart = caret;
        area.selectionEnd = caret;
      });
      return;
    }
    if (event.key === "Enter") {
      const start = area.selectionStart;
      const lineStart = text.slice(0, start).lastIndexOf("\n") + 1;
      const indent = leadingIndent(text.slice(lineStart, start));
      if (!indent) return;
      event.preventDefault();
      const next = `${text.slice(0, start)}\n${indent}${text.slice(area.selectionEnd)}`;
      emitContent(next, "input");
      requestAnimationFrame(() => {
        const caret = start + 1 + indent.length;
        area.selectionStart = caret;
        area.selectionEnd = caret;
      });
    }
  };

  const exportFile = () => {
    const bytes = encodeFileText(text, encoding);
    const blob = new Blob([bytes], { type: mimeType || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      downloadViaAnchor({ url, fileName: fileName || `${title || "dosya"}.txt` });
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 800);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div className="min-w-0 flex-1">
          <input
            value={title ?? ""}
            aria-label="Dosya adı"
            placeholder="Dosya adı"
            onChange={(event) => onTitleChange?.(event.target.value, "input")}
            className="w-full border-b border-neutral-300 bg-transparent pb-1 text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-600 dark:text-neutral-50 dark:focus:border-neutral-100"
          />
          {fileName && (
            <p className="mt-1 truncate text-[12px] text-neutral-500 dark:text-neutral-400">{fileName}</p>
          )}
        </div>
        <button
          type="button"
          onClick={exportFile}
          className="mt-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 px-3 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Dışa aktar
        </button>
      </div>

      <div className="code-file min-h-0 flex-1">
        {lines <= GUTTER_LIMIT && (
        <div className="code-file__gutter" aria-hidden="true">
          {Array.from({ length: lines }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        )}
        <div className="code-file__stack">
          <pre
            ref={preRef}
            className="code-file__highlight"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: `${html || escapeHtml(text)}\n` }}
          />
          <textarea
            ref={areaRef}
            value={text}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            aria-label="Kaynak kod"
            onChange={(event) => emitContent(event.target.value, "input")}
            onKeyDown={onKeyDown}
            className="code-file__input"
          />
        </div>
      </div>

      <div className="relative flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-1.5 dark:border-neutral-800">
        {conflictOpen && resolved.conflict && (
          <div
            role="status"
            className="absolute bottom-full right-3 mb-2 max-w-sm rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] leading-snug text-neutral-600 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <p>{conflictMessage(resolved.conflict)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => pickLanguage(resolved.conflict.extension, true)}
                className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                {resolved.conflict.extensionLabel} olarak kullan
              </button>
              <button
                type="button"
                onClick={() => pickLanguage(resolved.conflict.content, true)}
                className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-medium dark:border-neutral-600"
              >
                {resolved.conflict.contentLabel} olarak kullan
              </button>
            </div>
          </div>
        )}
        <span className="mr-auto text-[11px] text-neutral-400">{(encoding || "utf-8").toUpperCase()}</span>
        <div ref={pickerRef} className="relative">
          {pickerOpen && (
            <div
              role="listbox"
              aria-label="Programlama dili"
              className="absolute bottom-full right-0 mb-1 max-h-64 w-44 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
            >
              {FILE_CODE_LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={item.id === language}
                  onClick={() => pickLanguage(item.id, true)}
                  className={cn(
                    "flex w-full rounded-[5px] px-2 py-1.5 text-left text-[12px]",
                    item.id === language
                      ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            title="Dili değiştir"
            onClick={() => setPickerOpen((open) => !open)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {languageLabel(language)}
            <ChevronUp className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
