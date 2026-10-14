/**
 * Centred note title: a single-line rich-text field that grows with its own
 * text, over a rule the same width. Right-click formats like the body —
 * size, colour, bold, italic, strikethrough, each applied on its own.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { UNTITLED_NOTE } from "../../config/strings";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import {
  applyMarkupAtCaret,
  applySentenceBreakAtCaret,
  ensureHtml,
  focusEditableEnd,
  htmlToPlainText,
  insertMarkupAtSelection,
} from "../../lib/richText";
import { cn } from "../../lib/cn";
import { isSearchFlashMutating, unwrapNoteSearchFlashes } from "../../lib/noteSearch";
import { applyFormatHotkey, isSelectAllHotkey } from "./formatHotkeys";
import { FormatContextMenu } from "./FormatContextMenu";
import { useFormatMenu } from "./useFormatMenu";

/** Keeps the title box clickable while it is still empty. */
export const TITLE_MIN_WIDTH = 112;

/** Shared by the field and its measuring twin — widths only match if these do. */
export const TITLE_TYPE = "font-serif text-[28px] tracking-tight";

/**
 * @param {{
 *   value: string,
 *   placeholder?: string,
 *   inputRef?: React.RefObject<HTMLElement>,
 *   onChange: (value: string, reason?: string) => void,
 *   onSubmit?: () => void,   // Enter / ArrowDown / Tab — hand the caret below
 *   onFocus?: () => void,
 *   onBlur?: () => void,
 *   compact?: boolean,
 * }} props
 */
export const EditorTitle = ({
  value,
  placeholder = UNTITLED_NOTE,
  inputRef,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  compact = false,
}) => {
  const innerRef = useRef(null);
  // null, not `value`: the first layout pass has to write the saved title in.
  const lastContentRef = useRef(null);
  const isInternalChange = useRef(false);
  const [titleWidth, setTitleWidth] = useState(TITLE_MIN_WIDTH);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(() => !htmlToPlainText(value).trim());

  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (!inputRef) return;
      if (typeof inputRef === "function") inputRef(node);
      else inputRef.current = node;
    },
    [inputRef],
  );

  const measureTitle = useCallback(() => {
    const field = innerRef.current;
    if (!field) return;
    const width = Math.ceil(field.getBoundingClientRect().width);
    setTitleWidth(Math.max(width, TITLE_MIN_WIDTH));
  }, []);

  const emitChange = useCallback((reason = "input") => {
    const field = innerRef.current;
    if (!field) return;
    unwrapNoteSearchFlashes(field);
    const html = field.innerHTML;
    isInternalChange.current = true;
    lastContentRef.current = html;
    setIsEmpty(!htmlToPlainText(html).trim());
    onChange(html, reason);
    measureTitle();
  }, [onChange, measureTitle]);

  const {
    menu,
    activeFormat,
    applyPatch,
    toggleStyle,
    toggleStyleFromMenu,
    clearLineDecorations,
    clearLineDecorationsFromMenu,
    closeMenu,
    handleContextMenu,
    handleMouseUp,
    rememberAll,
  } = useFormatMenu(innerRef, emitChange);

  useIsomorphicLayoutEffect(() => {
    const field = innerRef.current;
    if (!field) return;
    if (value === lastContentRef.current && isInternalChange.current) {
      isInternalChange.current = false;
      measureTitle();
      return;
    }
    if (value !== lastContentRef.current) {
      field.innerHTML = ensureHtml(value, { math: false });
      lastContentRef.current = value;
      setIsEmpty(!htmlToPlainText(value).trim());
    }
    isInternalChange.current = false;
    measureTitle();
  }, [value, measureTitle]);

  useEffect(() => {
    const field = innerRef.current;
    if (!field || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measureTitle);
    observer.observe(field);
    return () => observer.disconnect();
  }, [measureTitle]);

  // Native listener, not React's onBeforeInput: only the real InputEvent
  // carries inputType. A line break in a one-line field means "go to the body".
  useEffect(() => {
    const field = innerRef.current;
    if (!field) return undefined;

    const onBeforeInput = (event) => {
      if (event.inputType !== "insertParagraph" && event.inputType !== "insertLineBreak") return;
      event.preventDefault();
      onSubmit?.();
    };

    field.addEventListener("beforeinput", onBeforeInput);
    return () => field.removeEventListener("beforeinput", onBeforeInput);
  }, [onSubmit]);

  const handleKeyDown = (event) => {
    if (isSelectAllHotkey(event)) rememberAll();
    if (applyFormatHotkey(event, toggleStyle)) return;

    const goesDown =
      event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    if (!goesDown) return;
    event.preventDefault();
    onSubmit?.();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain")?.replace(/[\r\n]+/g, " ") ?? "";
    if (!text) return;

    insertMarkupAtSelection(text, { math: false });
    emitChange("paste");
  };

  const handleInput = () => {
    if (isSearchFlashMutating()) return;
    const field = innerRef.current;
    if (field) {
      applySentenceBreakAtCaret(field);
      applyMarkupAtCaret(field);
    }
    emitChange();
  };

  return (
    <>
      <div
        className={cn(
          "flex shrink-0 flex-col items-center px-6 pb-6",
          compact ? "pt-1" : "pt-10",
        )}
      >
        <div className="relative max-w-full">
          <div
            ref={setRefs}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="false"
            aria-label="Not başlığı"
            data-placeholder={placeholder}
            data-empty={isEmpty ? "true" : undefined}
            spellCheck={false}
            style={{ minWidth: TITLE_MIN_WIDTH }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            className={cn(
              "rich-text-title inline-block min-h-[1.2em] max-w-full overflow-hidden border-0 bg-transparent px-0 text-center outline-none",
              "text-neutral-900 caret-neutral-900",
              "dark:text-neutral-50 dark:caret-neutral-100",
              TITLE_TYPE,
            )}
          />
        </div>

        <span
          aria-hidden="true"
          style={{ width: titleWidth }}
          className={cn(
            "mt-3 h-px max-w-full rounded-full transition-colors duration-200",
            isFocused ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-800",
          )}
        />
      </div>

      <FormatContextMenu
        isOpen={menu.isOpen}
        position={{ x: menu.x, y: menu.y }}
        activeFormat={activeFormat}
        onPickSize={(size) => applyPatch({ size })}
        onPickColor={(color) => applyPatch({ color })}
        onToggleStyle={toggleStyleFromMenu}
        onClearLines={clearLineDecorationsFromMenu}
        onClose={closeMenu}
      />
    </>
  );
};

EditorTitle.focusEnd = focusEditableEnd;
