/**
 * Title + body note editor. Fully controlled; owns no note state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { htmlToPlainText, noteBodyStats } from "../../lib/richText";
import { EditorTitle } from "./EditorTitle";
import { NoteSearch } from "./NoteSearch";
import { RichTextBody } from "./RichTextBody";
import { useNoteSearch } from "./useNoteSearch";

/**
 * One note: a centred title that grows with its own text, and a blank
 * full-width page underneath.
 *
 * Caret handoff — Enter, ArrowDown or Tab drop into the first line of the page;
 * ArrowUp or Backspace on that first line lift back to the end of the title.
 */
export const NoteEditor = ({ title, content, onTitleChange, onContentChange }) => {
  const titleRef = useRef(null);
  const bodyHostRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const { hostRef, searchRef, haystack, jumpToWord } = useNoteSearch({
    title,
    body: content,
    titleRef,
    bodyHostRef,
  });

  /* -- caret handoff -------------------------------------------------------- */

  const focusBody = useCallback(() => {
    const editable = bodyHostRef.current?.querySelector("[contenteditable]");
    if (!editable) return;
    RichTextBody.focusStart(editable);
    editable.scrollTop = 0;
  }, []);

  const focusTitle = useCallback(() => {
    const field = titleRef.current;
    if (!field) return;
    EditorTitle.focusEnd(field);
  }, []);

  // A brand-new note opens with the caret already in the title.
  const plainContent = htmlToPlainText(content);
  const isBlankNote = !htmlToPlainText(title).trim() && !plainContent.trim();
  useEffect(() => {
    if (!isBlankNote) return;
    const frame = window.requestAnimationFrame(focusTitle);
    return () => window.cancelAnimationFrame(frame);
    // Mount only: re-running this on every keystroke would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { words, paragraphs, letters } = noteBodyStats(content);
  const hint =
    focusedField === "title"
        ? "Enter — yazı alanına geç · ** kalın · $$ formül $$ · ##math## Enter · ##code## Enter kod · Ctrl+Z geri al"
        : focusedField === "body" && !plainContent.trim()
          ? "Enter — yeni paragraf · $$formül$$ · ##math## Enter formül · ##code## Enter kod · Ctrl+Z geri al"
          : focusedField === "body"
            ? "Enter — yeni paragraf · $$formül$$ · ##code## Enter kod · ##math## Enter formül · Ctrl+B kalın · Ctrl+Z geri al"
            : "";

  return (
    <div ref={hostRef} className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 justify-end px-4 pt-3 sm:px-6">
        <NoteSearch haystack={haystack} onPick={jumpToWord} searchRef={searchRef} />
      </div>

      {/* title — dead centre of the page, over a rule the width of its own text */}
      <EditorTitle
        compact
        value={title}
        inputRef={titleRef}
        onChange={onTitleChange}
        onSubmit={focusBody}
        onFocus={() => setFocusedField("title")}
        onBlur={() => setFocusedField(null)}
      />

      {/* page — rich text with right-click formatting */}
      <div ref={bodyHostRef} className="min-h-0 flex-1 overflow-y-auto">
        <RichTextBody
          content={content}
          onContentChange={onContentChange}
          onFocus={() => setFocusedField("body")}
          onBlur={() => setFocusedField(null)}
          onMoveToTitle={focusTitle}
        />
      </div>

      {/* status — the quietest row in the app; also where the shortcut lives */}
      <div className="flex min-h-8 shrink-0 flex-wrap items-center justify-between gap-x-4 border-t border-neutral-200 px-6 py-1.5 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500 sm:px-10">
        <span>{hint}</span>
        <span className="tabular-nums">
          {words} kelime · {paragraphs} paragraf · {letters} harf
        </span>
      </div>
    </div>
  );
};
