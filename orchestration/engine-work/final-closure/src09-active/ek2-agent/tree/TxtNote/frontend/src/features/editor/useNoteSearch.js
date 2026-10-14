/**
 * Shared find-in-note wiring: haystack, jump, Ctrl/Cmd+F.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { htmlToCountableText } from "../../lib/richText";
import { clearNoteSearchFlash, flashWordInRoot } from "../../lib/noteSearch";

const editableIn = (host) => host?.querySelector("[contenteditable]") ?? null;

export const useNoteSearch = ({ title, body, titleRef, bodyHostRef }) => {
  const hostRef = useRef(null);
  const searchRef = useRef(null);

  const haystack = useMemo(
    () => `${htmlToCountableText(title)}\n${htmlToCountableText(body)}`,
    [title, body],
  );

  const jumpToWord = useCallback(
    (word) => {
      const bodyEl = editableIn(bodyHostRef.current);
      if (bodyEl && flashWordInRoot(bodyEl, word)) return;
      const titleEl = titleRef.current;
      if (titleEl) flashWordInRoot(titleEl, word);
    },
    [titleRef, bodyHostRef],
  );

  useEffect(() => {
    const onKey = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return;
      if (event.key.toLowerCase() !== "f") return;
      if (!hostRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => {
      clearNoteSearchFlash(titleRef.current);
      clearNoteSearchFlash(editableIn(bodyHostRef.current));
    },
    [titleRef, bodyHostRef],
  );

  return { hostRef, searchRef, haystack, jumpToWord };
};
