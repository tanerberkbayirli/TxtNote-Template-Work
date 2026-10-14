import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import generic from '../../../../engine/src/templates/generic.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const corpusPath = resolve(root, 'orchestration/validation/word-compat/phase-5.2/corpus.json');
const specs = resolve(root, 'orchestration/specs');
const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
const cases = corpus.cases;
const esc = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sourceHtml = (item, tag) => {
  const body = item.runs?.map((run) => `${run.bold ? '<strong>' : ''}${run.italic ? '<em>' : ''}${esc(run.text)}${run.italic ? '</em>' : ''}${run.bold ? '</strong>' : ''}`).join('') ?? esc(item.text).replaceAll('\n', '<br>');
  const index = Number(tag.slice(1));
  const label = `${tag}-1 `;
  const text = item.runs ? `${label}${body}` : `${label}${body}`;
  return `<p lang="${item.lang}" data-thesis-style="s${String(index).padStart(2, '0')}">${text}</p>`;
};

const target = 'phase52-justify';
const checks = [];
for (const item of cases) {
  const tag = `J${String(Number(item.id.slice(1))).padStart(2, '0')}`;
  const fixture = item.measurePt === 240 ? 'default' : 'wide';
  for (const [suffix, kind, expected, tolerance] of [
    ['line-breaks', 'line_breaks_match', 'Word line texts', undefined],
    ['last-line-words', 'last_line_words_match', 'Word last-line glyph word x positions', 0.25],
  ]) {
    checks.push({
      id: `${item.id}-${suffix}`,
      kind,
      params: { tag, fixture, includeMeasurements: true, caseScope: 'tagged', caseFooterRegex: '^\\d{1,3}$' },
      ...(tolerance === undefined ? {} : { tolerance }),
      expected,
      source: { file: 'real Word render of phase 5.2 frozen corpus fixture', locator: `${item.id}: ${item.font} ${item.pt} pt, ${item.lang}, ${item.measurePt} pt measure` },
      evidence: 'MEASURED',
    });
  }
}
await writeFile(resolve(specs, `${target}.checks.json`), `${JSON.stringify(checks, null, 1)}\n`, 'utf8');

for (const [variant, measurePt] of [['default', 240], ['wide', 360]]) {
  const measureMm = measurePt * 25.4 / 72;
  const template = structuredClone(generic);
  template.id = 'phase52-justify-v1';
  template.status = 'demo';
  template.source = { type: 'manual', documentName: 'Phase 5.2 frozen typography corpus' };
  template.page.margins = { ...template.page.margins, leftMm: (210 - measureMm) / 2, rightMm: (210 - measureMm) / 2 };
  template.sections = [template.sections.find((section) => section.id === 'main')];
  template.sections[0].pageBreakBefore = false;
  template.sections[0].overrides = { ...template.sections[0].overrides, page: { ...template.sections[0].overrides.page, margins: template.page.margins } };
  template.typography.body = { ...template.typography.body, lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 };
  template.typography.paragraphStyles = {};
  const selected = cases.filter((item) => (variant === 'default' ? item.measurePt === 240 : item.measurePt === 360));
  const paragraphs = selected.map((item) => {
    const number = Number(item.id.slice(1));
    const styleId = `s${String(number).padStart(2, '0')}`;
    template.typography.paragraphStyles[styleId] = {
      fontFamily: item.font,
      fontSizePt: item.pt,
      fontWeight: 400,
      align: 'justify',
      lineHeight: 1,
      firstLineIndentMm: 0,
      spaceBeforePt: 0,
      spaceAfterPt: 3,
    };
    return sourceHtml(item, `J${String(number).padStart(2, '0')}`);
  }).join('');
  const doc = {
    title: 'Phase 5.2 frozen typography corpus',
    content: paragraphs,
    __template: template,
    researchData: { thesis: {
      templateId: template.id,
      templateVersion: template.templateVersion,
      selection: { universityId: template.universityId, degreeType: template.degreeType, language: 'tr' },
      values: { YEAR: '2026' },
      sectionContent: {},
      enabledSections: [],
    } },
  };
  await writeFile(resolve(specs, `${target}.fixture${variant === 'default' ? '' : `.${variant}`}.json`), `${JSON.stringify(doc, null, 1)}\n`, 'utf8');
}

console.log(`Generated ${checks.length} measurement checks and 2 width fixtures for ${cases.length} frozen corpus cases.`);
