/**
 * Right-click format menu wiring for a contentEditable host.
 * Shared by the note body and the title so a pick only changes that attribute.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FORMAT } from "../../config/format";
import {
  applyFormatAtCursor,
  applyFormatToRange,
  captureSelection,
  expandRangeForStyleToggle,
  isRangeInRoot,
  readFormatFromRange,
} from "../../lib/richText";
import { applyAlignToRange, readAlignFromRange } from "../../lib/richTextAlign";

/** Academic and thesis bodies keep the selection after a format so marks can be stacked (B then I). */
const keepsSelection = (root) => root.classList.contains("academic-body") || root.classList.contains("thesis-content");
const listFromRange = (range, root) => {
  const start = range?.startContainer;
  const element = start?.nodeType === 3 ? start.parentElement : start;
  const list = element?.closest?.('ul,ol');
  return list && root?.contains(list) ? list.tagName.toLowerCase() : null;
};

const computeSizeFromStart = (range, root) => {
  if (!range || !root) return undefined;
  const startNode = range.startContainer;
  const el = startNode.nodeType === 3 ? startNode.parentElement : startNode;
  if (!el) return undefined;
  const style = window.getComputedStyle(el);
  const pxStr = style.fontSize || "";
  const px = parseFloat(pxStr);
  if (isNaN(px)) return undefined;
  const scale = parseFloat(window.getComputedStyle(root).transform?.match(/scale\(([\d.]+)\)/)?.[1] || "1");
  const pt = (px / scale) / (96 / 72);
  return Math.round(pt * 2) / 2;
};

export const useFormatMenu = (rootRef, emitChange) => {
  const savedRangeRef = useRef(null);
  const hadSelectionRef = useRef(false);
  /** Right-click collapses selection in most browsers — keep the last drag/Ctrl+A range. */
  const lastNonCollapsedRangeRef = useRef(null);

  const [activeFormat, setActiveFormat] = useState(DEFAULT_FORMAT);
  const [menu, setMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const rootRef2 = rootRef;

  const computeBlock = useCallback((range) => {
    if (!range) return undefined;
    const block = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
    if (!block) return undefined;
    const closest = block.closest("[data-thesis-style]");
    if (closest) return `style:${closest.getAttribute("data-thesis-style")}`;
    for (let node = block; node?.closest?.(".thesis-content"); node = node.parentElement) {
      const match = node.tagName?.match(/^H([1-6])$/i);
      if (match) return match[1];
    }
    return "0";
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const rememberSelection = () => {
      const { range, hadSelection } = captureSelection(root);
      if (!range) return;
      const sizeComputedPt = !readFormatFromRange(range).sizePt ? computeSizeFromStart(range, root) : undefined;
      const block = computeBlock(range);
      setActiveFormat({ ...readFormatFromRange(range), align: readAlignFromRange(range, root), sizeComputedPt, block, list: listFromRange(range, root) });
      savedRangeRef.current = range.cloneRange();
      hadSelectionRef.current = hadSelection;
      if (hadSelection) lastNonCollapsedRangeRef.current = range;
    };

    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, [rootRef]);

  const rememberSelectionState = useCallback((range, hadSelection) => {
    if (!range) return;
    savedRangeRef.current = range.cloneRange();
    hadSelectionRef.current = hadSelection;
    if (hadSelection) {
      lastNonCollapsedRangeRef.current = range.cloneRange();
    }
  }, []);

  const formatFromRange = useCallback((range) => {
    const root = rootRef.current;
    return {
      ...readFormatFromRange(range),
      align: readAlignFromRange(range, root),
      block: computeBlock(range),
      list: listFromRange(range, root),
    };
  }, [rootRef, computeBlock]);

  const closeMenu = useCallback(() => {
    setMenu((state) => (state.isOpen ? { ...state, isOpen: false } : state));
  }, []);

  const applyPatch = useCallback(
    (patch) => {
      const root = rootRef.current;
      if (!root) return;

      setActiveFormat((current) => ({ ...current, ...patch }));
      root.focus();

      const sel = window.getSelection();
      const range = savedRangeRef.current;

      if (range && sel) {
        sel.removeAllRanges();
        sel.addRange(range);

        if (hadSelectionRef.current) {
          applyFormatToRange(range, patch, keepsSelection(root));
        } else {
          applyFormatAtCursor(range, patch);
        }
      }

      if (sel?.rangeCount) {
        const next = sel.getRangeAt(0);
        rememberSelectionState(next, !sel.isCollapsed);
        const sizeComputedPt = !readFormatFromRange(next).sizePt ? computeSizeFromStart(next, rootRef.current) : undefined;
        setActiveFormat({ ...formatFromRange(next), sizeComputedPt });
      }

      lastNonCollapsedRangeRef.current = null;
      emitChange("format");
    },
    [emitChange, formatFromRange, rememberSelectionState, rootRef],
  );

  const applyAlign = useCallback(
    (align) => {
      const root = rootRef.current;
      if (!root) return;

      setActiveFormat((current) => ({ ...current, align }));
      root.focus();

      const sel = window.getSelection();
      let range = savedRangeRef.current;
      if (!range || !isRangeInRoot(range, root)) {
        range = captureSelection(root).range;
      }
      if (range && sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          range = captureSelection(root).range;
        }
      }

      applyAlignToRange(root, range, align);

      if (sel?.rangeCount) {
        const next = sel.getRangeAt(0);
        rememberSelectionState(next, !sel.isCollapsed);
        const sizeComputedPt = !readFormatFromRange(next).sizePt ? computeSizeFromStart(next, rootRef.current) : undefined;
        setActiveFormat({ ...formatFromRange(next), sizeComputedPt });
      }

      lastNonCollapsedRangeRef.current = null;
      emitChange("format");
    },
    [emitChange, formatFromRange, rememberSelectionState, rootRef],
  );

  const withRange = useCallback(
    (fn) => {
      const root = rootRef.current;
      if (!root) return;

      root.focus();
      const sel = window.getSelection();
      let range = savedRangeRef.current;
      if (!range || !isRangeInRoot(range, root)) {
        const live = captureSelection(root);
        range = live.range;
        hadSelectionRef.current = live.hadSelection;
      }
      if (range && sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          range = captureSelection(root).range;
        }
      }

      fn(root, range);

      if (sel?.rangeCount) {
        const next = sel.getRangeAt(0);
        rememberSelectionState(next, !sel.isCollapsed);
        setActiveFormat(formatFromRange(next));
      }

      emitChange("action");
    },
    [emitChange, formatFromRange, rememberSelectionState, rootRef],
  );

  const applyStyleToggle = useCallback(
    (style, seedRange = null) => {
      const root = rootRef.current;
      if (!root) return;

      root.focus();

      let range = seedRange?.cloneRange?.() ?? null;
      let hadSelection = Boolean(seedRange && !seedRange.collapsed);

      if (!range) {
        const live = captureSelection(root);
        if (!live.range) return;
        range = live.range;
        hadSelection = live.hadSelection;
      }

      let format = readFormatFromRange(range);

      if (!hadSelection) {
        const expanded = expandRangeForStyleToggle(range, root, style);
        if (expanded && !expanded.collapsed) {
          range = expanded;
          hadSelection = true;
          format = readFormatFromRange(range);
        }
      }

      const patch = { [style]: !format[style] };
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      if (hadSelection) {
        applyFormatToRange(range, patch, keepsSelection(root));
      } else {
        applyFormatAtCursor(range, patch);
      }

      if (sel?.rangeCount) {
        const next = sel.getRangeAt(0);
        rememberSelectionState(next, !sel.isCollapsed);
        setActiveFormat(formatFromRange(next));
      } else {
        setActiveFormat({ ...format, ...patch });
      }

      lastNonCollapsedRangeRef.current = null;
      emitChange("format");
    },
    [emitChange, formatFromRange, rememberSelectionState, rootRef],
  );

  const clearLineDecorations = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    root.focus();
    const live = captureSelection(root);
    let range = savedRangeRef.current && isRangeInRoot(savedRangeRef.current, root)
      ? savedRangeRef.current.cloneRange()
      : live.range;
    if (!range) return;

    let hadSelection = !range.collapsed;
    if (!hadSelection) {
      for (const style of ["strike", "overline", "underline"]) {
        const expanded = expandRangeForStyleToggle(range, root, style);
        if (expanded && !expanded.collapsed) {
          range = expanded;
          hadSelection = true;
          break;
        }
      }
    }

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const patch = { strike: false, overline: false, underline: false };
    if (hadSelection) {
      applyFormatToRange(range, patch, keepsSelection(root));
    } else {
      applyFormatAtCursor(range, patch);
    }

    if (sel?.rangeCount) {
      const next = sel.getRangeAt(0);
      rememberSelectionState(next, !sel.isCollapsed);
      setActiveFormat(formatFromRange(next));
    }

    lastNonCollapsedRangeRef.current = null;
    emitChange("format");
  }, [emitChange, formatFromRange, rememberSelectionState, rootRef]);

  const handleMouseUp = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const { range, hadSelection } = captureSelection(root);
    if (hadSelection && range) lastNonCollapsedRangeRef.current = range;
  }, [rootRef]);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const root = rootRef.current;
    if (!root) return;

    const live = captureSelection(root);
    let menuRange = live.range;
    let menuHadSelection = live.hadSelection;

    if (!menuHadSelection && menuRange) {
      // Never reuse a stale pre-format selection — read format from the click point.
      menuRange = menuRange.cloneRange();
    } else if (
      !menuHadSelection &&
      lastNonCollapsedRangeRef.current &&
      isRangeInRoot(lastNonCollapsedRangeRef.current, root)
    ) {
      menuRange = lastNonCollapsedRangeRef.current.cloneRange();
      menuHadSelection = true;
    }

    if (menuRange) {
      rememberSelectionState(menuRange, menuHadSelection);
      setActiveFormat(formatFromRange(menuRange));
    } else {
      savedRangeRef.current = null;
      hadSelectionRef.current = false;
      setActiveFormat(DEFAULT_FORMAT);
    }

    setMenu({ isOpen: true, x: event.clientX, y: event.clientY });
  }, [formatFromRange, rememberSelectionState, rootRef]);

  /** An external toolbar calls this before a command: a live selection inside the root wins over the last queued one. */
  const rememberLiveSelection = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const { range, hadSelection } = captureSelection(root);
    if (range) rememberSelectionState(range, hadSelection);
  }, [rememberSelectionState, rootRef]);

  const rememberAll = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    window.requestAnimationFrame(() => {
      const { range, hadSelection } = captureSelection(root);
      if (hadSelection && range) lastNonCollapsedRangeRef.current = range;
    });
  }, [rootRef]);

  const toggleStyle = useCallback(
    (style) => {
      applyStyleToggle(style, savedRangeRef.current && isRangeInRoot(savedRangeRef.current, rootRef.current) ? savedRangeRef.current : null);
    },
    [applyStyleToggle, rootRef],
  );

  const toggleStyleFromMenu = useCallback(
    (style) => {
      closeMenu();
      applyStyleToggle(style, savedRangeRef.current);
    },
    [applyStyleToggle, closeMenu],
  );

  const clearLineDecorationsFromMenu = useCallback(() => {
    closeMenu();
    clearLineDecorations();
  }, [clearLineDecorations, closeMenu]);

  return {
    menu,
    activeFormat,
    applyPatch,
    applyAlign,
    toggleStyle,
    toggleStyleFromMenu,
    clearLineDecorations,
    clearLineDecorationsFromMenu,
    closeMenu,
    handleContextMenu,
    handleMouseUp,
    rememberAll,
    rememberLiveSelection,
    withRange,
  };
};
