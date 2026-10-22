// Isolated engine acceptance fixture (justified-text line breaking), never a university formatting source.
// Regenerate: node engine/tools/justify-fixture.mjs
import { writeFile } from 'node:fs/promises';
import generic from '../../engine/src/templates/generic.js';
const id = 'engine-word-justify';
const words = 'tezin hazırlanması sırasında üniversite öğrencileri tarafından kullanılan yöntemler ve bulgular değerlendirilmiş olup sonuçlar araştırmacılar için önemli katkılar sağlamaktadır bu çalışmada elde edilen veriler istatistiksel olarak analiz edilmiş the quick brown fox jumps over a lazy dog while committee members review each chapter of the dissertation carefully and thoroughly ÖZDOĞAN KABUL ONAY yüksek lisans doktora anabilim dalı'.split(' ');
let seed = 20261004;
const rnd = (n) => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
const cases = [];
for (const fontFamily of ['Times New Roman', 'Arial', 'Calibri']) for (const fontSizePt of [10, 12]) cases.push({ fontFamily, fontSizePt, align: 'justify' });
cases.push({ fontFamily: 'Times New Roman', fontSizePt: 12, align: 'left' }, { fontFamily: 'Arial', fontSizePt: 10, align: 'left' });
const sections = [], sectionContent = {}, checks = [];
cases.forEach((c, i) => {
  const code = `J${String(i + 1).padStart(2, '0')}`;
  sections.push({ id: code, type: i === 0 ? 'mainContent' : 'custom', title: code, status: 'required', group: 'body', mode: 'editable', pageBreakBefore: true, showTitle: false, tocEntry: 'none',
    overrides: { body: { fontFamily: c.fontFamily, fontSizePt: c.fontSizePt, align: c.align, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 6, lineSpacing: { rule: 'auto', value: 1, baseline: 'word' } } } });
  const paras = [];
  const count = 4, len = c.fontSizePt === 10 ? 100 : 80;
  for (let p = 0; p < count; p++) {
    const n = len - 10 + rnd(20), ws = [`${code}-${p + 1}`];
    while (ws.length < n) ws.push(words[rnd(words.length)]);
    paras.push(`<p>${ws.join(' ')}</p>`);
  }
  sectionContent[code] = paras.join('');
  checks.push({ id: `${code}-${c.fontFamily.replaceAll(' ', '-')}-${c.fontSizePt}-${c.align}-line-breaks`, kind: 'line_breaks_match', params: { tag: code }, expected: 'Word line texts',
    source: { file: 'real Word render of exported fixture DOCX', locator: `${code}: ${c.fontFamily} ${c.fontSizePt} pt ${c.align}` }, evidence: 'MEASURED' });
  if (c.align === 'justify') checks.push({ id: `${code}-${c.fontFamily.replaceAll(' ', '-')}-${c.fontSizePt}-${c.align}-last-line-words`, kind: 'last_line_words_match', params: { tag: code }, tolerance: 0.25, expected: 'Word last-line word x positions (natural spaces)',
    source: { file: 'real Word render of exported fixture DOCX', locator: `${code}: last line of each paragraph, ${c.fontFamily} ${c.fontSizePt} pt` }, evidence: 'MEASURED' });
});
const template = { ...generic, id, universityId: 'engine-test', universityName: 'Engine acceptance test', placeholders: {},
  source: { type: 'manual', documentName: 'Isolated justified line-breaking acceptance matrix (no university values)' },
  typography: { ...generic.typography, body: { ...generic.typography.body, firstLineIndentMm: 0 } },
  page: { ...generic.page, header: { ...generic.page.header, content: '' }, footer: { ...generic.page.footer, content: '' }, numbering: { ...generic.page.numbering, enabled: false } }, sections };
checks.push(...['word_opens', 'page_count_match', 'docx_no_undefined'].map(kind => ({ id: kind, kind, params: {}, expected: true,
  source: { file: 'Word engine acceptance fixture', locator: 'physical page sequence and OOXML validity' }, evidence: 'MEASURED' })));
await writeFile(`engine/specs/${id}.fixture.json`, JSON.stringify({ title: 'Justify line breaking matrix', __template: template,
  content: sectionContent.J01, researchData: { thesis: { templateId: id, templateVersion: template.templateVersion, values: {}, sectionContent } } }, null, 1));
await writeFile(`engine/specs/${id}.checks.json`, JSON.stringify(checks, null, 1));
console.log(`${id}: ${sections.length} cases, ${checks.length} checks`);
