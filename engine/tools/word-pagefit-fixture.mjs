// Isolated engine acceptance fixture (MOTOR 2.10 follow-up): Word's last-line fit (page.lastLineFit "word") for blocks that are not
// the 1.5-spaced body (single-spaced paragraphs, other sizes, exact), plus guard cases (heading, figure, table, keep-with-next, footnote note
// page) landing at the column bottom with different offsets. ENGINE test values, not university requirements.
// Regenerate from the repository root: node orchestration/tools/word-pagefit-fixture.mjs
import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import generic from '../../engine/src/templates/generic.js';
import { validateThesisTemplate } from '../../engine/src/validation.js';

const id = 'engine-word-pagefit';
const checks = [];
const source = (locator) => ({ file: 'real Word render of engine-word-pagefit DOCX', locator });
const lines = (code, tag, count, style = '') => `<p data-thesis-style="${style || 'fill'}">${Array.from({ length: count }, (_, i) => `${code}_${tag}${String(i + 1).padStart(2, '0')} Abcdefg gjpqy`).join('<br>')}</p>`;

function png(width, height) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) { raw[y * (width * 3 + 1)] = 0; for (let x = 0; x < width; x += 1) { const o = y * (width * 3 + 1) + 1 + x * 3; raw[o] = 200; raw[o + 1] = 210; raw[o + 2] = 230; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64')}`;
}
const IMAGE = png(300, 150);
const figure = (code) => `<figure class="academic-figure" data-kind="figure" contenteditable="false"><img width="300" height="150" src="${IMAGE}" alt=""><figcaption>${code}_CAP figure caption</figcaption></figure>`;
const table = (code, rows = 3) => `<table><caption>${code}_TCAP table caption</caption><colgroup><col data-col-width="50"><col data-col-width="50"></colgroup><thead><tr><th>${code}_H a</th><th>${code}_H b</th></tr></thead><tbody>${Array.from({ length: rows }, (_, i) => i + 1).map((n) => `<tr><td>${code}_R${n} a</td><td>${code}_R${n} b</td></tr>`).join('')}</tbody></table>`;


// Variants (separate real exports; each is one template): default = guards in a 1.5 body, styles = paragraph styles with other leading,
// tab = tables on the block-gap grid, notes = 3+ fragment paragraphs across a page-bottom-note page.
const variants = { default: { sections: [], content: {} }, styles: { sections: [], content: {} }, tab: { sections: [], content: {} }, notes: { sections: [], content: {} } };
let current = 'default';
const add = (code, html, overrides = {}) => {
  const v = variants[current];
  v.sections.push({ id: code, type: v.sections.length ? 'custom' : 'mainContent', title: code, status: 'required', group: 'body', mode: 'editable', pageBreakBefore: true, showTitle: false, tocEntry: 'none', overrides });
  v.content[code] = html;
  checks.push({ id: `${code}-lines`, kind: 'line_attr_match', params: { regex: current === 'tab' ? `^${code}_(?!T)` : `^${code}_`, attr: 'baseline', ...(current === 'default' ? {} : { fixture: current }) }, expected: 'same physical pages and baselines as Word', tolerance: .25, source: source(code), evidence: 'MEASURED' });
  if (current === 'tab') checks.push({ id: `${code}-tail-lines`, kind: 'line_attr_match', params: { regex: `^${code}_T[0-9]`, attr: 'baseline', fixture: 'tab' }, expected: 'same physical pages and baselines as Word', tolerance: .25, source: source(`${code} paragraph after table`), evidence: 'MEASURED' });
};
const SHIFTS = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27];
const shifted = (code, k, make) => `${lines(code, 'F', k)}<p data-thesis-style="shift${code.match(/S(\d+)$/)[1]}">${code}_SH shift</p>${make(code)}`;

// ---- styles: paragraphs whose own line spacing differs from the body (Word grants a line only its own terminal leading). 8 lines of the
// style under test after k=31 body lines (7.30 mm pitch) and a shift paragraph moving the page end through the allowance window.
current = 'styles';
for (const [tag, style] of [['SGL', 'single'], ['BIG', 'big'], ['SML', 'small'], ['EXC', 'exactCap'], ['EXB', 'exactBig'], ['ALM', 'atLeastBig'], ['DBL', 'double']]) for (const shift of SHIFTS) {
  const code = `${tag}31S${shift}`;
  add(code, shifted(code, 31, (c) => `${lines(c, 'T', 8, style)}${lines(c, 'U', 3)}`));
}
// Mixed sizes: one 18 pt run inside single-spaced / body lines near the page end (own leading of that line differs from its neighbours).
for (const shift of SHIFTS) {
  const code = `MIX31S${shift}`;
  add(code, shifted(code, 31, (c) => `<p data-thesis-style="single">${Array.from({ length: 8 }, (_, i) => `${c}_T${String(i + 1).padStart(2, '0')} Abcdefg${i % 3 === 1 ? ' <span style="font-size:18pt">Big</span>' : ''} gjpqy`).join('<br>')}</p>${lines(c, 'U', 3)}`));
}
// ---- default: guards (heading, keep-with-next, figure) at the column bottom, with and without the allowance (shift steps through 6.9 pt window).
current = 'default';
for (const [tag, ks, make] of [
  ['HEAD', [32], (code) => `<h1>${code}_HEAD heading</h1>${lines(code, 'T', 3)}`],
  ['KEEP', [32], (code) => `${lines(code, 'K', 1, 'keepNext')}${lines(code, 'T', 3)}`],
  ['FIG', [24, 25], (code) => `${figure(code)}${lines(code, 'T', 3)}`],
]) for (const k of ks) for (const shift of SHIFTS) {
  const code = `${tag}${k}S${shift}`;
  add(code, shifted(code, k, make));
}
// ---- tab: table (caption, header, 14 rows) crossing the column bottom; rows and cells are guarded.
current = 'tab';
for (const k of [28, 29, 30]) for (const shift of [0, 3, 6, 9, 12, 15, 18]) {
  const code = `TAB${k}S${shift}`;
  add(code, shifted(code, k, (c) => `${table(c, 14)}${lines(c, 'T', 3)}`));
}
// Control: the same table on one page (tail lines included) - separates the table exit gap from the page-fit rule.
for (const k of [5, 10]) { const code = `TABN${k}S0`; add(code, shifted(code, k, (c) => `${table(c, 5)}${lines(c, 'T', 3)}`)); }
// ---- notes (2.10c): a 100-line paragraph (4 pages) with a footnote reference; the note page is the first or the second fragment.
current = 'notes';
const noteRef = (code, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${code}" data-fn-text="${text}">1</sup>`;
for (const [fill, refLine, noteWords] of [[10, 3, 6], [20, 2, 40], [28, 3, 6], [5, 40, 20], [14, 36, 60], [30, 2, 120]]) {
  const code = `NOTE${fill}R${refLine}W${noteWords}`;
  const text = Array.from({ length: noteWords }, (_, i) => `note${i + 1}`).join(' ');
  const body = Array.from({ length: 100 }, (_, i) => `${code}_P${String(i + 1).padStart(3, '0')} Abcdefg gjpqy${i + 1 === refLine ? noteRef(code, text) : ''}`).join('<br>');
  add(code, `${lines(code, 'F', fill)}<p data-thesis-style="fill">${body}</p>${lines(code, 'U', 3)}`);
}
// Combined paragraph-style guard + footnote reserve/break: smaller-leading paragraphs must keep balanced native padding/cancellation
// when a break stamp moves them; reserve stamps capture the original padding and retain its cancellation.
for (const [code, fill, refLine, noteWords, count, style] of [
  ['NOTESGL10R3W20', 10, 3, 20, 200, 'single'],
  ['NOTESGL5R60W60', 5, 60, 60, 200, 'single'],
  ['NOTEKEEP20R1W120', 20, 1, 120, 15, 'singleKeep'],
]) {
  const text = Array.from({ length: noteWords }, (_, i) => `note${i + 1}`).join(' ');
  const body = Array.from({ length: count }, (_, i) => `${code}_P${String(i + 1).padStart(3, '0')} Abcdefg gjpqy${i + 1 === refLine ? noteRef(code, text) : ''}`).join('<br>');
  add(code, `${lines(code, 'F', fill)}<p data-thesis-style="${style}">${body}</p>${lines(code, 'U', 3)}`);
}
// Validate the split note area itself on both pages selected by semantic body markers, independent of absolute page numbers.
for (const [part, marker] of [['start', 'P001'], ['continuation', 'U01']]) checks.push({
  id: `NOTEKEEP20R1W120-note-${part}-lines`, kind: 'line_attr_match',
  params: { fixture: 'notes', regex: '^note', attr: 'baseline', pages: { find: `NOTEKEEP20R1W120_${marker}` } },
  expected: 'same physical pages, note line counts and baselines as Word', tolerance: .25,
  source: source(`NOTEKEEP20R1W120 note ${part} area`), evidence: 'MEASURED',
});
const variantChecks = (name) => {
  const params = name === 'default' ? {} : { fixture: name };
  for (const kind of ['page_count_match', 'page_labels_match', 'word_opens', 'docx_no_undefined']) checks.push({ id: `${name}-${kind}`, kind, params, expected: true, tolerance: .25, source: source(`${name} ${kind}`), evidence: 'MEASURED' });
};
Object.keys(variants).forEach(variantChecks);

const buildTemplate = (kind) => {
  const template = structuredClone(generic);
  template.page.margins = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 };
  template.page.header = { distanceMm: 10, heightMm: 0, content: '' };
  template.page.footer = { distanceMm: 12.5, heightMm: 0, content: '' };
  template.page.numbering = { enabled: true, position: 'bottom', align: 'center', format: 'arabic', restart: false, baselineFromTopMm: 276, style: { fontFamily: 'Times New Roman', fontSizePt: 11 } };
  const tnr = { rule: 'auto', value: 1.5, baseline: 'word' };
  template.typography.body = { fontFamily: 'Times New Roman', fontSizePt: 12, align: 'left', fontWeight: 400, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineSpacing: tnr };
  template.typography.lineSpacing = { ...tnr, paragraphSpacing: kind === 'tab' ? 'additive' : 'collapse', ...(kind === 'tab' ? { blockGap: 'paragraphPitch' } : {}), suppressSpaceBeforeAtPageTop: true };
  template.typography.headings = { ...template.typography.headings, '1': { fontFamily: 'Times New Roman', fontSizePt: 12, fontWeight: 700, align: 'left', spaceBeforePt: 0, spaceAfterPt: 0, keepWithNext: true, numbering: { enabled: false, format: '{1}' }, lineSpacing: tnr } };
  template.typography.paragraphStyles = {
    fill: { widowControl: false },
    keepNext: { keepWithNext: true, keepLines: true },
    ...(kind === 'notes' ? {
      single: { widowControl: false, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } },
      singleKeep: { widowControl: false, keepLines: true, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } },
    } : {}),
    ...(kind === 'styles' ? {
      single: { widowControl: false, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } },
      double: { widowControl: false, lineSpacing: { rule: 'auto', value: 2, baseline: 'word' } },
      big: { widowControl: false, fontSizePt: 16 },
      small: { widowControl: false, fontSizePt: 10 },
      exactBig: { widowControl: false, lineSpacing: { rule: 'exact', value: 20, baseline: 'word' } },
      atLeastBig: { widowControl: false, lineSpacing: { rule: 'atLeast', value: 20, baseline: 'word' } },
      exactCap: { widowControl: false, lineSpacing: { rule: 'exact', value: 14, baseline: 'word' } },
    } : {}),
    ...Object.fromEntries(SHIFTS.map((s) => [`shift${s}`, { widowControl: false, spaceAfterPt: s }])),
  };
  const single = { rule: 'auto', value: 1, baseline: 'word' };
  template.tables = { ...template.tables, style: { fontFamily: 'Times New Roman', fontSizePt: 12, align: 'center', lineSpacing: single, spaceBeforePt: 0, spaceAfterPt: 0 }, spacingBeforePt: 0, spacingAfterPt: 0 };
  template.tables.cellPadding = { topMm: .5, bottomMm: .5, leftMm: 1, rightMm: 1 };
  template.tables.numbering = { scope: 'document', format: '{n}', sequence: 'arabic', liveField: true };
  template.tables.cellStyle = { fontFamily: 'Times New Roman', fontSizePt: 12, lineSpacing: single };
  if (kind === 'notes') template.typography.footnotes = { placement: 'pageBottom', fontFamily: 'Times New Roman', fontSizePt: 12, lineHeight: 1, lineSpacing: { rule: 'auto', value: 1, singleLineEm: 1.15 },
    // MEASURED in the Word render of the exported DOCX: the separator paragraph is one single 12 pt line (13.8 pt) with the rule 7.5 pt below its top.
    separator: { widthPercent: 33.87, thicknessPt: .5, spaceBeforePt: 7.5, spaceAfterPt: 5.8 } };
  return template;
};
for (const [name, v] of Object.entries(variants)) {
  const tid = name === 'default' ? id : `${id}-${name}`;
  const template = buildTemplate(name);
  Object.assign(template, { id: tid, universityId: 'engine-test', universityName: 'Word page-fit acceptance', placeholders: {}, sections: v.sections, source: { type: 'manual', documentName: 'Isolated Word last-line fit (no university values)' } });
  const errors = validateThesisTemplate(template);
  if (errors.length) throw new Error(`${tid}: ${errors.join('; ')}`);
  await writeFile(`orchestration/specs/${id}.fixture${name === 'default' ? '' : `.${name}`}.json`, JSON.stringify({ title: `Word page-fit acceptance (${name})`, __template: template, content: v.content[v.sections[0].id], researchData: { thesis: { templateId: tid, templateVersion: template.templateVersion, values: {}, sectionContent: v.content } } }, null, 1));
}
await writeFile(`orchestration/specs/${id}.checks.json`, JSON.stringify(checks, null, 1));
console.log(`${id}: ${Object.entries(variants).map(([k, v]) => `${k}=${v.sections.length}`).join(' ')}, ${checks.length} checks`);
