/**
 * Keyboard shortcuts shared by the note body and the title field.
 */

const isMod = (event) => event.ctrlKey || event.metaKey;

/**
 * Handles Ctrl/Cmd+B, I, Shift+X. Returns true when the event was consumed.
 * Enter is left to the caller — title and body treat it differently.
 */
export const applyFormatHotkey = (event, toggleStyle) => {
  if (!isMod(event) || event.altKey) return false;
  const key = event.key.toLowerCase();

  if (key === "b" && !event.shiftKey) {
    event.preventDefault();
    toggleStyle?.("bold");
    return true;
  }
  if (key === "i" && !event.shiftKey) {
    event.preventDefault();
    toggleStyle?.("italic");
    return true;
  }
  if (key === "u" && !event.shiftKey) {
    event.preventDefault();
    toggleStyle?.("underline");
    return true;
  }
  if (key === "x" && event.shiftKey) {
    event.preventDefault();
    toggleStyle?.("strike");
    return true;
  }
  return false;
};

export const isSelectAllHotkey = (event) =>
  isMod(event) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "a";
