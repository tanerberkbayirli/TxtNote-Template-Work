/**
 * Compact find-in-note field. Suggests up to five words from the open note.
 */

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { SearchField } from "../../components/ui/SearchField";
import { cn } from "../../lib/cn";
import { MAX_NOTE_SEARCH_HITS, uniqueMatchingWords } from "../../lib/noteSearch";

export const NoteSearch = ({ haystack, onPick, className, searchRef }) => {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits = useMemo(
    () => uniqueMatchingWords(haystack, query, MAX_NOTE_SEARCH_HITS),
    [haystack, query],
  );
  const showList = open && query.trim().length > 0;

  useImperativeHandle(
    searchRef,
    () => ({
      focus: () => {
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      },
    }),
    [],
  );

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(hits.length - 1, 0)));
  }, [hits]);

  const pick = useCallback(
    (word) => {
      if (!word) return;
      setQuery("");
      setOpen(false);
      onPick?.(word);
    },
    [onPick],
  );

  const dismiss = useCallback(() => {
    setOpen(false);
    inputRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!showList) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      dismiss();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [showList, dismiss]);

  return (
    <div ref={rootRef} className={cn("relative z-20 min-w-0", className)}>
      <SearchField
        className="w-52 max-w-full"
        inputRef={inputRef}
        value={query}
        placeholder="Notta ara"
        aria-label="Notta ara"
        aria-expanded={showList}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, Math.max(hits.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            pick(hits[active] ?? hits[0]);
          }
        }}
      />

      {showList && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg bg-white py-1 shadow-lg shadow-neutral-900/10 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:shadow-black/40 dark:ring-neutral-700"
        >
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-neutral-400 dark:text-neutral-500">
              Eşleşme yok
            </li>
          ) : (
            hits.map((word, index) => (
              <li key={`${word}-${index}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(word)}
                  className={cn(
                    "flex w-full px-3 py-1.5 text-left text-[13px] text-neutral-800 dark:text-neutral-100",
                    index === active && "bg-neutral-100 dark:bg-neutral-800",
                  )}
                >
                  &quot;{word}&quot;
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
