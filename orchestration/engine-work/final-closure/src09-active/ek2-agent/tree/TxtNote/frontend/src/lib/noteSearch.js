/**
 * In-note search: Turkish-aware matching and a two-second jump flash.
 */

const WORD_RE = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu;
export const NOTE_SEARCH_FLASH_CLASS = "note-search-flash";
export const MAX_NOTE_SEARCH_HITS = 5;
export const NOTE_SEARCH_FLASH_MS = 2000;

const BLOCK_BREAK = /^(BR|DIV|P|H[1-6]|LI|BLOCKQUOTE|TR|TABLE)$/;

/** Fold so "İ", "i" and "ı" hit the same letters. */
export const foldSearch = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("û", "u");

/** True when a note title contains the query, with the same Turkish folding. */
export const titleMatchesQuery = (title, query) => {
  const needle = foldSearch(query).trim();
  if (!needle) return true;
  return foldSearch(title).includes(needle);
};

export function uniqueMatchingWords(plainText, query, limit = MAX_NOTE_SEARCH_HITS) {
  const needle = foldSearch(query).trim();
  if (!needle || limit <= 0) return [];

  const seen = new Set();
  const starts = [];
  const rest = [];
  const re = new RegExp(WORD_RE.source, WORD_RE.flags);
  let match;
  while ((match = re.exec(plainText ?? ""))) {
    const word = match[0];
    const folded = foldSearch(word);
    if (seen.has(folded) || !folded.includes(needle)) continue;
    seen.add(folded);

    if (folded.startsWith(needle)) {
      starts.push(word);
      if (starts.length >= limit) break;
    } else if (starts.length + rest.length < limit) {
      rest.push(word);
    }
  }
  return starts.length >= limit ? starts : [...starts, ...rest].slice(0, limit);
}

let muteInput = 0;
const flashTimers = new WeakMap();

export const isSearchFlashMutating = () => muteInput > 0;

const withSilentDom = (fn) => {
  muteInput += 1;
  try {
    return fn();
  } finally {
    muteInput -= 1;
  }
};

const unwrapFlashes = (root) => {
  root.querySelectorAll(`mark.${NOTE_SEARCH_FLASH_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
};

/** Drop leftover find-highlights so they never get saved into the note. */
export const unwrapNoteSearchFlashes = (root) => {
  if (!root?.querySelector?.(`mark.${NOTE_SEARCH_FLASH_CLASS}`)) return;
  withSilentDom(() => unwrapFlashes(root));
};

const collectText = (root) => {
  let full = "";
  const pieces = [];

  const pushBreak = () => {
    full += "\n";
  };

  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) {
        pieces.push({ node, start: full.length, length: text.length });
        full += text;
      }
      return;
    }
    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach(visit);
      return;
    }
    if (node.tagName === "MARK" && node.classList.contains(NOTE_SEARCH_FLASH_CLASS)) {
      node.childNodes.forEach(visit);
      return;
    }
    if (node.classList.contains("math-formula") || node.classList.contains("code-block")) {
      if (
        node.classList.contains("math-formula--block") ||
        node.classList.contains("code-block") ||
        BLOCK_BREAK.test(node.tagName)
      ) {
        pushBreak();
      }
      return;
    }
    if (node.tagName === "BR") {
      pushBreak();
      return;
    }
    node.childNodes.forEach(visit);
    if (node !== root && BLOCK_BREAK.test(node.tagName)) pushBreak();
  };

  visit(root);
  return { full, pieces };
};

const locate = (pieces, index) => {
  for (const piece of pieces) {
    if (index < piece.start || index >= piece.start + piece.length) continue;
    return { node: piece.node, offset: index - piece.start };
  }
  return null;
};

const rangeForWord = (root, word) => {
  const needle = foldSearch(word);
  if (!needle) return null;

  const { full, pieces } = collectText(root);
  const re = new RegExp(WORD_RE.source, WORD_RE.flags);
  let match;
  while ((match = re.exec(full))) {
    if (foldSearch(match[0]) !== needle) continue;
    const start = locate(pieces, match.index);
    const end = locate(pieces, match.index + match[0].length - 1);
    if (!start || !end) continue;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset + 1);
    return range;
  }
  return null;
};

const wrapRange = (range) => {
  const mark = document.createElement("mark");
  mark.className = NOTE_SEARCH_FLASH_CLASS;
  try {
    range.surroundContents(mark);
  } catch {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
  }
  return mark;
};

export function clearNoteSearchFlash(root) {
  if (!root) return;
  const timer = flashTimers.get(root);
  if (timer) {
    window.clearTimeout(timer);
    flashTimers.delete(root);
  }
  unwrapNoteSearchFlashes(root);
}

/** Scroll to the first matching word and blink it for two seconds. */
export function flashWordInRoot(root, word) {
  if (!root || typeof document === "undefined") return false;
  clearNoteSearchFlash(root);

  const range = rangeForWord(root, word);
  if (!range) return false;

  const mark = withSilentDom(() => wrapRange(range));
  mark.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });

  flashTimers.set(
    root,
    window.setTimeout(() => {
      flashTimers.delete(root);
      unwrapNoteSearchFlashes(root);
    }, NOTE_SEARCH_FLASH_MS),
  );
  return true;
}
