/**
 * Keep UI chrome (labels, help, menus) unselectable. Chromium still paints a
 * drag-selection on `user-select: none` ancestors, so CSS alone is not enough.
 */

const EDITABLE =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="color"]):not([type="hidden"]), textarea, [contenteditable="true"], [contenteditable="plaintext-only"]';

const isEditableNode = (node) => {
  const el = node instanceof Element ? node : node?.parentElement;
  return Boolean(el?.closest?.(EDITABLE));
};

const clearUiSelection = () => {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  if (isEditableNode(sel.anchorNode) && isEditableNode(sel.focusNode)) return;
  sel.removeAllRanges();
};

export const blockUiSelection = () => {
  document.addEventListener(
    "selectstart",
    (event) => {
      if (!isEditableNode(event.target)) event.preventDefault();
    },
    true,
  );

  document.addEventListener("selectionchange", clearUiSelection);

  document.addEventListener(
    "mousemove",
    (event) => {
      if (event.buttons !== 1) return;
      if (isEditableNode(event.target) || isEditableNode(document.activeElement)) return;
      clearUiSelection();
    },
    true,
  );

  document.addEventListener(
    "copy",
    (event) => {
      const sel = document.getSelection();
      const fromSelection = Boolean(sel && !sel.isCollapsed && isEditableNode(sel.anchorNode));
      const fromField = isEditableNode(event.target) || isEditableNode(document.activeElement);
      if (!fromSelection && !fromField) event.preventDefault();
    },
    true,
  );
};
