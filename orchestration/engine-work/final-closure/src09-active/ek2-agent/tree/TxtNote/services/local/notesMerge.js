/**
 * Merge note bodies for a partial in-memory map.
 *
 * Loaded notes (`incoming`) win. Bodies for items/trash that were not loaded
 * stay. Bodies whose item is gone for good are dropped so a later persist
 * cannot resurrect a deleted note.
 */
export function mergeLivingNotes(storedNotes, incomingNotes, items, trash) {
  const living = new Set();
  const takeId = (row) => {
    if (!row || typeof row !== "object") return;
    const id = row.id;
    if (typeof id === "string" && id) living.add(id);
  };
  (Array.isArray(items) ? items : []).forEach(takeId);
  (Array.isArray(trash) ? trash : []).forEach(takeId);

  const stored =
    storedNotes && typeof storedNotes === "object" && !Array.isArray(storedNotes)
      ? storedNotes
      : {};
  const incoming =
    incomingNotes && typeof incomingNotes === "object" && !Array.isArray(incomingNotes)
      ? incomingNotes
      : {};

  const merged = {};
  living.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(incoming, id)) {
      merged[id] = incoming[id];
      return;
    }
    if (Object.prototype.hasOwnProperty.call(stored, id)) {
      merged[id] = stored[id];
    }
  });
  return merged;
}
