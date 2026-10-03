// Isolated engine acceptance fixture, never a university formatting source.
// Run once to regenerate: node orchestration/tools/word-parity-fixture.mjs
import { writeFile } from 'node:fs/promises';
import generic from '../../TxtNote/frontend/src/thesis/templates/generic.js';
const id = 'engine-word-parity';
const sections = [], sectionContent = {}, checks = [];
let index = 0;
for (const fontFamily of ['Times New Roman', 'Arial', 'Calibri']) for (const fontSizePt of [10, 11, 12]) {
  for (const [rule, value] of [['auto', 1], ['auto', 1.15], ['auto', 1.5], ['auto', 2], ['exact', 14], ['atLeast', 14]]) {
    const code = `LP${String(++index).padStart(3, '0')}`;
    sections.push({ id: code, type: index === 1 ? 'mainContent' : 'custom', title: code, status: 'required', group: 'body', mode: 'editable',
      pageBreakBefore: true, showTitle: false, tocEntry: 'none',
      overrides: { body: { fontFamily, fontSizePt, align: 'left', firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0,
        lineSpacing: { rule, value, baseline: 'word' } } } });
    sectionContent[code] = `<p>${[1, 2, 3, 4, 5].map(n => `${code} Line ${n}: Abcdefg gjpqy 0123456789`).join('<br>')}</p>`;
    checks.push({ id: `${code}-${fontFamily.replaceAll(' ', '-')}-${fontSizePt}-${rule}-${value}`, kind: 'line_pitch_match',
      params: { regex: `^${code} Line` }, expected: 'Word pitch', tolerance: .2 * 25.4 / 72,
      source: { file: 'real Word render of exported fixture DOCX', locator: `${code}: ${fontFamily} ${fontSizePt} pt ${rule} ${value}` }, evidence: 'MEASURED' });
  }
}
const template = { ...generic, id, universityId: 'engine-test', universityName: 'Engine acceptance test', placeholders: {},
  source: { type: 'manual', documentName: 'Isolated Word semantics acceptance matrix (no university values)' },
  typography: { ...generic.typography, body: { ...generic.typography.body, firstLineIndentMm: 0 } },
  page: { ...generic.page, header: { ...generic.page.header, content: '' }, footer: { ...generic.page.footer, content: '' }, numbering: { ...generic.page.numbering, enabled: false } }, sections };
checks.push({ id: 'exact-embedded-font-programs', kind: 'fonts', params: { families: ['Times New Roman', 'Arial', 'Calibri'] },
  expected: ['TimesNewRomanPSMT', 'ArialMT', 'Calibri'], source: { file: 'word-parity-fixture.mjs', locator: 'explicit canonical font families; PDF font-program family names' }, evidence: 'EXPLICIT' });
checks.push(...['word_opens', 'page_count_match', 'page_labels_match', 'docx_no_undefined'].map(kind => ({ id: kind, kind, params: {}, expected: true,
  source: { file: 'Word engine acceptance fixture', locator: 'physical page sequence and OOXML validity' }, evidence: 'MEASURED' })));
await writeFile(`orchestration/specs/${id}.fixture.json`, JSON.stringify({ title: 'Word semantics matrix', __template: template,
  content: sectionContent.LP001, researchData: { thesis: { templateId: id, templateVersion: template.templateVersion, values: {}, sectionContent } } }, null, 1));
await writeFile(`orchestration/specs/${id}.checks.json`, JSON.stringify(checks, null, 1));
console.log(`${id}: ${sections.length} typography cases, ${checks.length} checks`);
