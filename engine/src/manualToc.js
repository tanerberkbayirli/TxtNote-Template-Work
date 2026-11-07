export function contentsPanelUniversity(templateId = '') {
  const names = { mcbu:'MCBÜ', aku:'AKÜ', afsu:'AFSÜ' };
  const prefix = String(templateId ?? '').split('-')[0];
  return Object.hasOwn(names, prefix) ? names[prefix] : null;
}

/** Repair recovered identities before sorting, so edits never address another row. */
export function normalizeManualTocRows(rows) {
  if (!Array.isArray(rows)) return [];
  const requested = rows.map(row => row && typeof row === 'object' ? String(row.id ?? '').toWellFormed() : '');
  const reserved = new Set(requested.filter(Boolean)), used = new Set();
  return rows.map((input, index) => {
    const row = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    let id = requested[index];
    if (!id || used.has(id)) {
      const base = id || `toc-row-${index + 1}`;
      id = base;
      let suffix = 2;
      while (used.has(id) || reserved.has(id)) id = `${base}~${suffix++}`;
    }
    used.add(id);
    return { ...row, id, title:String(row.title ?? ''), page:String(row.page ?? ''),
      literalTitle:row.literalTitle === true || !Number.isInteger(row.level) };
  });
}

export function contentsTitleParts(value) {
  const title = String(value ?? '').trim();
  const match = title.match(/^(\d+(?:\.\d+)*\.?)\s*([\s\S]*)$/);
  if (!match) return { label: '', title, level: 0 };
  return { label: match[1], title: match[2], level: Math.min(6, match[1].replace(/\.$/, '').split('.').length) };
}

function pageOrder(value) {
  const label = String(value ?? '').normalize('NFKC').trim().toUpperCase();
  if (/^\d+$/.test(label)) return [1, label.replace(/^0+(?=\d)/, '')];
  if (label && /^(?=[MDCLXVI]+$)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(label)) {
    const values = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
    return [0, String([...label].reduce((sum, char, i) => sum + (values[char] < (values[label[i + 1]] || 0) ? -values[char] : values[char]), 0))];
  }
  return [2, ''];
}

/** Match printed labels across ordinary/Word Roman glyphs and leading zeroes. */
export function contentsPageKey(value) {
  const [kind, number] = pageOrder(value);
  return kind < 2 ? `${kind}:${number}` : null;
}

export function sortManualTocRows(rows = []) {
  return normalizeManualTocRows(rows).sort((a, b) => {
    const left = pageOrder(a.page), right = pageOrder(b.page);
    return left[0] - right[0] || left[1].length - right[1].length || (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0);
  });
}

/** Authored contents rows keep their printed page labels through pagination and export. */
export function manualTocEntries(rows = []) {
  const counters = [];
  let previousLevel = 0;
  return sortManualTocRows(rows).map((row, index) => {
    if (row.literalTitle) {
      const parts = contentsTitleParts(row.title);
      return { kind:'toc', anchor:`manual-toc-${encodeURIComponent(row.id || index)}`, level:parts.level || 1,
        unnumbered:parts.level <= 1, label:parts.label, title:parts.title, rowTitle:parts.title,
        text:String(row.title || '').trim(), page:String(row.page ?? '').trim(), pageResolved:true, manualPage:true, literalTitle:true };
    }
    const unnumbered = Number(row.level) === 0;
    const level = unnumbered ? 1 : Math.min(Math.max(1, Number(row.level) || 1), previousLevel + 1, 6);
    let label = "";
    if (!unnumbered) {
      counters.length = level;
      counters[level - 1] = (counters[level - 1] || 0) + 1;
      label = counters.join(".");
      previousLevel = level;
    }
    const title = String(row.title ?? "").trim();
    return { kind: "toc", anchor: `manual-toc-${encodeURIComponent(row.id || index)}`, level, unnumbered, label,
      title, rowTitle: title, text: [label, title].filter(Boolean).join(" "),
      page: String(row.page ?? "").trim(), pageResolved: true, manualPage: true };
  });
}
