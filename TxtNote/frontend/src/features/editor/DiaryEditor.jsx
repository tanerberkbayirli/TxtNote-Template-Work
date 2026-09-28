/**
 * Diary note: one page of writing per day.
 *
 * The bottom bar holds the dates — a seven-day strip centred on the selected
 * day, opening on today, with arrows to walk backwards and forwards. The
 * calendar mark on the right opens any month so a note can be written on a
 * chosen date. Days that already have writing show a small dot.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey } from "../../lib/diaryCalendar";
import { htmlToPlainText } from "../../lib/richText";
import { DayStrip } from "./DayStrip";
import { EditorTitle } from "./EditorTitle";
import { NoteSearch } from "./NoteSearch";
import { RichTextBody } from "./RichTextBody";
import { useNoteSearch } from "./useNoteSearch";

const DATE_LONG = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

export const DiaryEditor = ({ title, entries = {}, onTitleChange, onEntriesChange }) => {
  const titleRef = useRef(null);
  const bodyHostRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const selectedKey = dayKey(selectedDate);
  const todayKey = dayKey(new Date());
  const content = entries[selectedKey] ?? "";
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

  const focusTitle = useCallback(() => {
    const field = titleRef.current;
    if (!field) return;
    EditorTitle.focusEnd(field);
  }, []);

  // A brand-new diary opens with the caret already in the title.
  const isBlank = !htmlToPlainText(title).trim() && Object.keys(entries).length === 0;
  useEffect(() => {
    if (!isBlank) return;
    const frame = window.requestAnimationFrame(focusTitle);
    return () => window.cancelAnimationFrame(frame);
    // Mount only: re-running this on every keystroke would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContentChange = (html, reason) => {
    const next = { ...entries };
    if (htmlToPlainText(html).trim()) next[selectedKey] = html;
    else delete next[selectedKey];
    onEntriesChange(next, reason);
  };

  const hasEntry = (key) => Boolean(htmlToPlainText(entries[key] ?? "").trim());

  const selectFromCalendar = (date) => {
    setSelectedDate(date);
    // Two frames: the day's editor remounts on the new key before we focus it.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusBody);
    });
  };

  return (
    <div ref={hostRef} className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 justify-end px-4 pt-3 sm:px-6">
        <NoteSearch haystack={haystack} onPick={jumpToWord} searchRef={searchRef} />
      </div>

      <EditorTitle
        compact
        value={title}
        inputRef={titleRef}
        onChange={onTitleChange}
        onSubmit={focusBody}
      />

      {/* which day this page belongs to — spelled out, over the writing area */}
      <p className="shrink-0 pb-4 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
        {DATE_LONG.format(selectedDate)}
        {selectedKey === todayKey && " · Bugün"}
      </p>

      {/* page — keyed by day, so each date keeps its own text and undo history */}
      <div ref={bodyHostRef} className="min-h-0 flex-1 overflow-y-auto">
        <RichTextBody
          key={selectedKey}
          content={content}
          onContentChange={handleContentChange}
          onMoveToTitle={focusTitle}
        />
      </div>

      {/* dates — the diary's spine, pinned under the writing area */}
      <DayStrip
        selectedDate={selectedDate}
        todayKey={todayKey}
        hasEntry={hasEntry}
        onSelect={selectFromCalendar}
      />
    </div>
  );
};
