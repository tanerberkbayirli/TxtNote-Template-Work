// Real editor -> DOCX -> Word acceptance. These are ENGINE test values,
// not university requirements. Regenerate from the repository root.
import { writeFile } from 'node:fs/promises';
import generic from '../../engine/src/templates/generic.js';
import { validateThesisTemplate } from '../../engine/src/validation.js';

const id = 'engine-word-structure';
const sections = [], sectionContent = {}, checks = [];
const source = (locator) => ({ file: 'real Word render of engine-word-structure DOCX', locator });
let variant = null;
const check = (name, kind, params, expected, tolerance = .25) => checks.push({ id: name, kind, params: variant ? { ...params, fixture: variant } : params, expected, tolerance, source: source(name), evidence: 'MEASURED' });
const match = (name, regex, attr = 'baseline', tolerance = .25) => check(name, 'line_attr_match', { regex, attr }, 'equal measured editor and Word geometry', tolerance);
const words = (name, regex, tolerance = .5, extra = {}) => check(name, 'line_words_match', { regex, ...extra }, 'equal word and leader extents in Word and PDF', tolerance);
const exact = (name, regex, attr, value, tolerance = .25) => {
  for (const output of ['layout', 'word']) {
    check(`${name}-${output}`, 'line_attr', { source: output, regex, attr }, value, tolerance);
    Object.assign(checks.at(-1), { source: { file: 'orchestration/tools/word-structure-fixture.mjs', locator: `${name}: explicit engine input ${attr}=${value}` }, evidence: 'EXPLICIT' });
  }
};
const add = (code, html, overrides = {}, extra = {}) => {
  sections.push({ id: code, type: sections.length ? 'custom' : 'mainContent', title: code, status: 'required', group: 'body', mode: 'editable', pageBreakBefore: true, showTitle: false, tocEntry: 'none', overrides, ...extra });
  sectionContent[code] = html;
};
const paragraphLines = (code, count) => `<p>${Array.from({ length: count }, (_, i) => `${code} ${String(i + 1).padStart(3, '0')} Abcdefg gjpqy`).join('<br>')}</p>`;
const makeTable = (code, count, overflow = false) => `<table><caption>${code} live sequence caption</caption><colgroup><col data-col-width="25"><col data-col-width="75"></colgroup><thead><tr><th>${code}_HEAD left</th><th>${code}_HEAD right</th></tr></thead><tbody>${Array.from({ length: count }, (_, i) => `<tr><td>${code}_${String(i + 1).padStart(3, '0')} left</td><td>${code}_${String(i + 1).padStart(3, '0')} right${overflow ? '<br>Second overflowing line<br>Third overflowing line<br>Fourth overflowing line' : ''}</td></tr>`).join('')}</tbody></table>`;

// Compact row fixtures; the overflowing exact cells are deliberately taller
// than their specified content height, so clipping is part of acceptance.
for (const [code, rule, valueMm, verticalAlign, overflow] of [
  ['TABLE_AUTO', 'auto', undefined, 'top', false],
  ['TABLE_MIN', 'atLeast', 9, 'center', false],
  ['TABLE_EXACT', 'exact', 6, 'bottom', true],
]) {
  add(code, makeTable(code, 5, overflow), { tables: { rowHeight: { rule, ...(valueMm === undefined ? {} : { valueMm }) }, verticalAlign, cantSplit: true, repeatHeader: true } });
  match(`${code}-first-row-baseline`, `${code}_001`);
  match(`${code}-last-row-baseline`, `${code}_005`);
  match(`${code}-header-baseline`, `${code}_HEAD`);
  match(`${code}-caption-baseline`, `${code} live sequence caption`);
  // The narrow left cell deliberately wraps its marker; the wide right cell
  // has a whole marker on its first line and identifies each row unambiguously.
  check(`${code}-row-pitch`, 'line_pitch_match', { regex: `${code}_00[1-5] right` }, 'Word row pitch', .25);
}
add('TABLE_REPEAT', makeTable('TABLE_REPEAT', 47), { tables: {
  rowHeight: { rule: 'atLeast', valueMm: 5 }, cantSplit: false, repeatHeader: true, verticalAlign: 'top',
  borders: { top: { style: 'double', widthPt: 1, color: '123456' }, bottom: { style: 'single', widthPt: 1.5 }, left: { style: 'dashed', widthPt: .5 }, right: { style: 'dotted', widthPt: .5 }, insideHorizontal: { style: 'single', widthPt: .5 }, insideVertical: { style: 'none', widthPt: 0 } },
} });
match('repeated-header-baselines', 'TABLE_REPEAT_HEAD');
match('table-break-last-row', 'TABLE_REPEAT_047');

// The five-line keep paragraph would otherwise cross the first page boundary.
add('KEEP', `${paragraphLines('KEEP_FILL', 48)}<p data-thesis-style="keep">${Array.from({ length: 5 }, (_, i) => `KEEP_BLOCK_${i + 1} kept line`).join('<br>')}</p><p data-thesis-style="widow">${Array.from({ length: 5 }, (_, i) => `WIDOW_BLOCK_${i + 1} protected line`).join('<br>')}</p><p data-thesis-style="forced">FORCED_PAGE_TOP</p>`);
for (const marker of ['KEEP_BLOCK_1', 'KEEP_BLOCK_5', 'WIDOW_BLOCK_1', 'WIDOW_BLOCK_5', 'FORCED_PAGE_TOP']) match(`${marker}-position`, `^${marker}`);

add('TABS', '<p data-thesis-style="tabLeft">TAB_LEFT\tLEFT-END</p><p data-thesis-style="tabCenter">TAB_CENTER\tCENTER-END</p><p data-thesis-style="tabRight">TAB_RIGHT\tRIGHT-END</p><p data-thesis-style="tabDecimal">TAB_DECIMAL\t123.45</p>');
for (const code of ['TAB_LEFT', 'TAB_CENTER', 'TAB_RIGHT', 'TAB_DECIMAL']) match(`${code}-end`, `^${code}`, 'x1', .5);
exact('right-tab-end', '^TAB_RIGHT', 'x1', 140, .5);
checks.find((item) => item.id === 'right-tab-end-word').params.trim_trailing_whitespace = true;
for (const code of ['TAB_LEFT', 'TAB_CENTER', 'TAB_RIGHT', 'TAB_DECIMAL']) words(`${code}-words`, `^${code}`);

// TOC-like rows: hanging indent, wrapped titles, right tab with dot leader; decimal tabs with leaders.
add('TOCROWS', [
  '<p data-thesis-style="tocRow">TOC_A short title	5</p>',
  `<p data-thesis-style="tocRow">TOC_B ${'wrapped title words keep going and going across the measure '.repeat(3)}endB	12</p>`,
  '<p data-thesis-style="tocRow">TOC_C medium title that fits on one line only	123</p>',
  `<p data-thesis-style="tocRow">TOC_D ${'another long entry that wraps '.repeat(5)}endD	7</p>`,
  '<p data-thesis-style="tabDecimalLeader">DEC_A	1234.5</p><p data-thesis-style="tabDecimalLeader">DEC_B	7.25</p><p data-thesis-style="tabDecimalLeader">DEC_C	99.125</p><p data-thesis-style="tabDecimalLeader">DEC_D	8</p>',
].join(''));
for (const code of ['TOC_A', 'TOC_C', 'endB', 'endD', 'DEC_A', 'DEC_B', 'DEC_C', 'DEC_D']) words(`${code}-row-words`, code);
for (const code of ['TOC_B', 'TOC_D']) match(`${code}-first-line-left`, `^${code}`, 'x0');
for (const code of ['endB', 'endD', 'TOC_A', 'TOC_C']) match(`${code}-row-right`, code, 'x1', .5);

// One paragraph with 115 physical lines crosses both odd/even page boundaries.
// Its asymmetrical left/right indents keep total line width constant.
add('MIRROR', paragraphLines('MIRROR_LINE', 115), { body: { indent: { leftMm: 12, rightMm: 4, firstLineMm: 0, mirror: true } }, page: {
  differentFirstPage: true,
  header: { content: 'CHROME_ODD', firstContent: 'CHROME_FIRST', evenContent: 'CHROME_EVEN' },
  footer: { content: 'TOTAL {{NUMPAGES}}', distanceMm: 12.5, trailingBlankLines: 1 },
} });
for (const code of ['001', '055', '110', '115']) {
  match(`mirror-${code}-left`, `^MIRROR_LINE ${code}`, 'x0');
  match(`mirror-${code}-baseline`, `^MIRROR_LINE ${code}`);
}
for (const output of ['layout', 'word']) {
  check(`number-baseline-${output}`, 'page_number_attr', { source: output, pages: { until: '^LAND_LINE 001' }, attr: 'baseline' }, 276, .25);
  Object.assign(checks.at(-1), { source: { file: 'orchestration/tools/word-structure-fixture.mjs', locator: 'page.numbering.baselineFromTopMm=276' }, evidence: 'EXPLICIT' });
}
for (const marker of ['CHROME_FIRST', 'CHROME_EVEN', 'CHROME_ODD']) match(`${marker}-baseline`, `^${marker}`);

add('SPACING', '<p data-thesis-style="spaceA">SPACE_A_FIRST</p><p data-thesis-style="spaceA">SPACE_A_SECOND</p><p data-thesis-style="spaceB">SPACE_B_FIRST</p><p data-thesis-style="spaceA">SPACE_A_RETURN</p>' + paragraphLines('SPACE_FILL', 45) + '<p data-thesis-style="spaceB">SPACE_NATURAL_TOP</p><p data-thesis-style="forced">SPACE_FORCED_TOP</p>');
for (const marker of ['SPACE_A_FIRST', 'SPACE_A_SECOND', 'SPACE_B_FIRST', 'SPACE_A_RETURN', 'SPACE_NATURAL_TOP', 'SPACE_FORCED_TOP']) match(`${marker}-baseline`, `^${marker}`);
exact('body-left', '^SPACE_A_FIRST', 'x0', 30);
exact('body-size', '^SPACE_A_FIRST', 'size', 12, .05);

for (const verticalAlign of ['center', 'bottom']) {
  const code = `ALIGN_${verticalAlign.toUpperCase()}`;
  add(code, '', {}, { mode: 'static', verticalAlign, blocks: [{ type: 'text', value: `${code} marker`, style: { spaceBeforePt: 0, spaceAfterPt: 0 } }] });
  match(`${code}-baseline`, `^${code}`);
}

// Mirror indents with a hanging indent over several paragraphs: every line's left and right edge, odd and even pages.
// Word quirk (MEASURED, probe docs: ind left/right + mirrorIndents, TNR 12): with a POSITIVE first-line indent F the even-page right limit shrinks
// to left+F (first-line start of the odd page), so Word re-wraps even pages narrower by F; the engine only shifts glyph spans (width preserving).
// The engine models this with a transient right float of width F on every even-page fragment (paragraphMirror.js narrowEvenPages); MIRF rows below compare every wrapped line.
// Explicit line breaks keep every line well inside the measure (no wrap-boundary dependence): x0 shows first/continuation edges, right-aligned copies show the right limit.
const mirrorParagraphs = (code, count, align = '') => Array.from({ length: count }, (_, i) => `<p${align}>${[0, 1, 2].map((k) => `${code}_${String(i + 1).padStart(2, '0')}_${k} line text`).join('<br>')}</p>`).join('');
add('MIR_HANG', mirrorParagraphs('MIR_HANG', 60, ' data-thesis-style="noWidow"'), { body: { indent: { hangingMm: 8, leftMm: 14, rightMm: 2, mirror: true } } });
add('MIR_RIGHT', mirrorParagraphs('MIR_RIGHT', 60, ' data-thesis-style="alignRight"'), { body: { indent: { hangingMm: 8, leftMm: 14, rightMm: 2, mirror: true } } });
for (const code of ['MIR_HANG', 'MIR_RIGHT']) {
  const rx = `^${code}_`;
  match(`${code}-all-lines-left`, rx, 'x0');
  match(`${code}-all-lines-right`, rx, 'x1');
  match(`${code}-all-lines-baseline`, rx);
}


// (Token digits avoid the TNR '11' kerning pair, which Chrome applies and Word does not: unrelated to mirror indents.)
// Positive first-line indent with mirror indents: wrapped paragraphs (no hard breaks) over odd and even pages; every line's word extents must equal Word's,
// so the even-page wraps (narrowed by the first-line indent) are compared, not only the edges.
const mirfText = (code, tokens) => `<p>${Array.from({ length: tokens }, (_, i) => `MIRF_${code}${(i + 1).toString(8).padStart(3, '0').replace(/[01]/g, (d) => (d === '0' ? '8' : '9'))}`).join(' ')}</p>`;
add('MIRF', mirfText('A', 260) + mirfText('B', 120), { body: { indent: { leftMm: 12, rightMm: 4, firstLineMm: 10, mirror: true } } });
words('MIRF-all-lines-words', '^MIRF_', .25);
match('MIRF-all-lines-baseline', '^MIRF_');
match('MIRF-all-lines-left', '^MIRF_', 'x0');
match('MIRF-all-lines-right', '^MIRF_', 'x1');

// Landscape section followed by a portrait return: page size, margins and the text box are compared PDF vs Word.
add('LANDSCAPE', paragraphLines('LAND_LINE', 75), { page: { orientation: 'landscape', widthMm: 297, heightMm: 210, margins: { topMm: 20, bottomMm: 22, leftMm: 25, rightMm: 35 }, numbering: { baselineFromTopMm: 195 } } });
for (const code of ['001', '036', '037', '075']) { match(`landscape-${code}-left`, `^LAND_LINE ${code}`, 'x0'); match(`landscape-${code}-baseline`, `^LAND_LINE ${code}`); }
check('landscape-number-baseline', 'page_number_attr_match', { pages: { find: '^LAND_LINE 001' }, attr: 'baseline' }, 'equal', .25);
match('landscape-first-right', '^LAND_LINE 001', 'x1');
add('PORTRAIT_RETURN', paragraphLines('PORT_RET', 3));
match('portrait-return-left', '^PORT_RET 001', 'x0');
match('portrait-return-baseline', '^PORT_RET 001');
check('page-size-match', 'page_size_match', {}, 'identical page sizes', .25);

const buildTemplate = (tid, secs, explicitBaseline = true) => {
const template = structuredClone(generic);
Object.assign(template, { id: tid, universityId: 'engine-test', universityName: 'Word structure acceptance', placeholders: {}, sections: secs, source: { type: 'manual', documentName: 'Isolated structural Word semantics (no university values)' } });
template.page.margins = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 };
template.page.header = { distanceMm: 10, heightMm: 0, content: '' };
template.page.footer = { distanceMm: 12.5, heightMm: 0, content: '' };
template.page.numbering = { enabled: true, position: 'bottom', align: 'center', format: 'arabic', restart: false, ...(explicitBaseline ? { baselineFromTopMm: 276 } : {}), style: { fontFamily: 'Times New Roman', fontSizePt: 11 } };
template.typography.body = { fontFamily: 'Times New Roman', fontSizePt: 12, align: 'left', fontWeight: 400, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } };
template.typography.lineSpacing = { rule: 'auto', value: 1, baseline: 'word', paragraphSpacing: 'collapse', suppressSpaceBeforeAtPageTop: true };
template.typography.paragraphStyles = {
  keep: { keepLines: true, keepWithNext: true, widowControl: true },
  widow: { keepLines: false, widowControl: true },
  forced: { pageBreakBefore: true, spaceBeforePt: 24 },
  spaceA: { spaceBeforePt: 8, spaceAfterPt: 10, contextualSpacing: true },
  spaceB: { spaceBeforePt: 16, spaceAfterPt: 6 },
  tabLeft: { tabStops: [{ positionMm: 40, align: 'left', leader: 'dots' }] },
  tabCenter: { tabStops: [{ positionMm: 80, align: 'center', leader: 'hyphen' }] },
  tabRight: { tabStops: [{ positionMm: 110, align: 'right', leader: 'dots' }] },
  noWidow: { widowControl: false },
  alignRight: { align: 'right', widowControl: false },
  tocRow: { indent: { leftMm: 10, hangingMm: 10 }, tabStops: [{ positionMm: 148, align: 'right', leader: 'dots' }] },
  tabDecimalLeader: { tabStops: [{ positionMm: 100, align: 'decimal', leader: 'dots' }] },
  tabDecimal: { tabStops: [{ positionMm: 100, align: 'decimal', leader: 'underscore' }] },
};
template.tables.cellPadding = { topMm: .5, bottomMm: .5, leftMm: 1, rightMm: 1 };
template.tables.numbering = { scope: 'document', format: '{n}', sequence: 'arabic', liveField: true };
template.tables.cellStyle = { fontFamily: 'Times New Roman', fontSizePt: 12, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } };
const errors = validateThesisTemplate(template);
if (errors.length) throw new Error(`${tid}: ${errors.join('; ')}`);
return template;
};
const template = buildTemplate(id, sections);
// ---- Variant 'footer' (MOTOR 2.8): page number in the footer part (no explicit baseline). Source footer distance and trailing blank lines place the
// number baseline in Word; the editor/PDF must put it at the same y. Each section is one page (pageBreakBefore) with its own footer geometry.
const writeVariant = async (name, tid, secs, content, tweak = (tpl) => tpl) => {
  const tpl = tweak(buildTemplate(tid, secs, false));
  await writeFile(`orchestration/specs/${id}.fixture.${name}.json`, JSON.stringify({ title: `Word structure acceptance (${name})`, __template: tpl, content: content[secs.find((section) => section.type === 'mainContent').id], researchData: { thesis: { templateId: tid, templateVersion: tpl.templateVersion, values: {}, sectionContent: content } } }, null, 1));
};
const variantSections = (list, content) => (code, html, overrides = {}, extra = {}) => {
  list.push({ id: code, type: list.length ? 'custom' : 'mainContent', title: code, status: 'required', group: 'body', mode: 'editable', pageBreakBefore: true, showTitle: false, tocEntry: 'none', overrides, ...extra });
  content[code] = html;
};
const footSections = [], footContent = {};
const addFoot = variantSections(footSections, footContent);
variant = 'footer';
for (const [code, distanceMm, trailingBlankLines, align] of [['FOOT_A', 12.5, 0, 'center'], ['FOOT_B', 8, 0, 'center'], ['FOOT_C', 15, 1, 'center'], ['FOOT_D', 10, 2, 'right'], ['FOOT_E', 17.5, 3, 'left']]) {
  addFoot(code, `<p>${code} body</p>`, { page: { footer: { distanceMm, heightMm: 0, content: '', trailingBlankLines }, numbering: { align } } });
  check(`${code}-number-baseline`, 'page_number_attr_match', { pages: { find: `^${code}` }, attr: 'baseline' }, 'equal', .25);
  check(`${code}-number-x`, 'page_number_attr_match', { pages: { find: `^${code}` }, attr: 'cx' }, 'equal', .25);
  check(`${code}-number-size`, 'page_number_attr_match', { pages: { find: `^${code}` }, attr: 'size' }, 'equal', .05);
}
for (const kind of ['page_count_match', 'page_labels_match']) check(`footer-${kind}`, kind, {}, true);
variant = null;
await writeVariant('footer', `${id}-footer`, footSections, footContent);

// ---- Variant 'fields' (MOTOR 2.9): TOC / list of tables (PAGEREF), live SEQ captions, PAGE and NUMPAGES. Word's render of the cached DOCX must equal
// Word's render after updating every field (twice, with repagination), and the page order/labels must be correct.
const fieldSections = [], fieldContent = {};
const addField = variantSections(fieldSections, fieldContent);
const romanPage = { numbering: { format: 'roman-lower' } };
const chapterHeading = { '1': { align: 'left', numbering: { enabled: false } } };
addField('FIELD_TOC', '', { page: romanPage }, { type: 'tableOfContents', mode: 'generated', group: 'front', title: 'FIELD_TOC_TITLE', showTitle: true, tocEntry: 'none', generatedIndex: { kind: 'toc', title: 'FIELD_TOC_TITLE', leader: 'dots', leaderFlow: 'inline' } });
addField('FIELD_LOT', '', { page: romanPage }, { type: 'listOfTables', mode: 'generated', group: 'front', title: 'FIELD_LOT_TITLE', showTitle: true, tocEntry: 'none', generatedIndex: { kind: 'tables', title: 'FIELD_LOT_TITLE', leader: 'dots', leaderFlow: 'inline' } });
addField('FIELD_CH1', `${paragraphLines('FIELD_FILL_A', 20)}${makeTable('FIELD_T1', 3)}${paragraphLines('FIELD_FILL_B', 30)}`, { page: { numbering: { format: 'arabic', restart: true, startAt: 1 } }, headings: chapterHeading }, { type: 'mainContent', title: 'FIELD_CHAPTER_ONE', showTitle: true, tocEntry: 'title' });
addField('FIELD_CH2', `${paragraphLines('FIELD_FILL_C', 70)}${makeTable('FIELD_T2', 8)}${paragraphLines('FIELD_FILL_D', 10)}${makeTable('FIELD_T3', 5)}`, { headings: chapterHeading }, { title: 'FIELD_CHAPTER_TWO', showTitle: true, tocEntry: 'title' });
variant = 'fields';
check('fields-refresh-match', 'fields_refresh_match', {}, 'cached field results equal Word-refreshed results', .25);
check('fields-cached-match', 'fields_cached_match', {}, 'cached field results equal Word-updated results', .25);
for (const kind of ['page_count_match', 'page_labels_match', 'word_opens']) check(`fields-${kind}`, kind, {}, true);
check('fields-docx-balance', 'docx_no_undefined', {}, true);
variant = null;
await writeVariant('fields', `${id}-fields`, fieldSections, fieldContent, (tpl) => { tpl.page.footer = { ...tpl.page.footer, content: 'FIELD_TOTAL {{NUMPAGES}}' }; return tpl; });

for (const kind of ['word_opens', 'page_count_match', 'page_labels_match', 'docx_no_undefined']) check(kind, kind, {}, true);
await writeFile(`orchestration/specs/${id}.fixture.json`, JSON.stringify({ title: 'Word structure acceptance', __template: template, content: sectionContent.TABLE_AUTO, researchData: { thesis: { templateId: id, templateVersion: template.templateVersion, values: {}, sectionContent } } }, null, 1));
await writeFile(`orchestration/specs/${id}.checks.json`, JSON.stringify(checks, null, 1));
console.log(`${id}: ${sections.length} sections, ${checks.length} checks; real export still required`);
