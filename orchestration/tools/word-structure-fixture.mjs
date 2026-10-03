// Real editor -> DOCX -> Word acceptance. These are ENGINE test values,
// not university requirements. Regenerate from the repository root.
import { writeFile } from 'node:fs/promises';
import generic from '../../TxtNote/frontend/src/thesis/templates/generic.js';
import { validateThesisTemplate } from '../../TxtNote/frontend/src/thesis/validation.js';

const id = 'engine-word-structure';
const sections = [], sectionContent = {}, checks = [];
const source = (locator) => ({ file: 'real Word render of engine-word-structure DOCX', locator });
const check = (name, kind, params, expected, tolerance = .25) => checks.push({ id: name, kind, params, expected, tolerance, source: source(name), evidence: 'MEASURED' });
const match = (name, regex, attr = 'baseline', tolerance = .25) => check(name, 'line_attr_match', { regex, attr }, 'equal measured editor and Word geometry', tolerance);
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
  check(`number-baseline-${output}`, 'page_number_attr', { source: output, pages: 'all', attr: 'baseline' }, 276, .25);
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

const template = structuredClone(generic);
Object.assign(template, { id, universityId: 'engine-test', universityName: 'Word structure acceptance', placeholders: {}, sections, source: { type: 'manual', documentName: 'Isolated structural Word semantics (no university values)' } });
template.page.margins = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 };
template.page.header = { distanceMm: 10, heightMm: 0, content: '' };
template.page.footer = { distanceMm: 12.5, heightMm: 0, content: '' };
template.page.numbering = { enabled: true, position: 'bottom', align: 'center', format: 'arabic', restart: false, baselineFromTopMm: 276, style: { fontFamily: 'Times New Roman', fontSizePt: 11 } };
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
  tabDecimal: { tabStops: [{ positionMm: 100, align: 'decimal', leader: 'underscore' }] },
};
template.tables.cellPadding = { topMm: .5, bottomMm: .5, leftMm: 1, rightMm: 1 };
template.tables.numbering = { scope: 'document', format: '{n}', sequence: 'arabic', liveField: true };
template.tables.cellStyle = { fontFamily: 'Times New Roman', fontSizePt: 12, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } };
const errors = validateThesisTemplate(template);
if (errors.length) throw new Error(errors.join('\n'));
for (const kind of ['word_opens', 'page_count_match', 'page_labels_match', 'docx_no_undefined']) check(kind, kind, {}, true);
await writeFile(`orchestration/specs/${id}.fixture.json`, JSON.stringify({ title: 'Word structure acceptance', __template: template, content: sectionContent.TABLE_AUTO, researchData: { thesis: { templateId: id, templateVersion: template.templateVersion, values: {}, sectionContent } } }, null, 1));
await writeFile(`orchestration/specs/${id}.checks.json`, JSON.stringify(checks, null, 1));
console.log(`${id}: ${sections.length} sections, ${checks.length} checks; real export still required`);
