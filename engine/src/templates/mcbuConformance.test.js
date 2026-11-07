import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { mcbuMaster, mcbuPhd } from './mcbu.js';
import medical from './mcbu-tip.js';
import legacy from './generated/cbu-lee-master-tr-kilavuz.js';
import { compileThesisDocument, resolvePlaceholders } from '../engine.js';
import { validateThesisTemplate } from '../validation.js';
import { resolveGeneratedIndexes } from '../generatedIndex.js';
import { buildThesisDocx } from '../export.js';
import { walkSpecialPage } from '../specialPages.js';
import { normalizeFlowParagraphs, assertThesisExportReady, thesisExportIssues } from '../templateConformance.js';
import { mcbuOutputFixture } from '../../tools/mcbu-output-fixtures.mjs';
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from '../registry.js';

const templates = [mcbuMaster, mcbuPhd, medical, legacy];
const compile = (template, fixture = mcbuOutputFixture(template)) => compileThesisDocument(template, fixture.researchData.thesis, fixture.title, fixture.content);

test('empty-paragraph cleanup preserves text, objects, table cells, anchors, and typing/page-break paragraphs', () => {
  const html = '<p>A <strong>birinci</strong>.</p><p><span>&nbsp;</span><br></p><p>B ikinci.</p>';
  assert.equal(normalizeFlowParagraphs(html, 'omit'), '<p>A <strong>birinci</strong>.</p><p>B ikinci.</p>');
  const protectedHtml = '<p><br></p><p>A.</p><p id="bookmark"></p><p>B.</p><table><tr><td><p><br></p></td></tr></table><p><img src="a.png"></p><p><br></p><div data-academic-page-break="true"></div><p><br></p>';
  assert.equal(normalizeFlowParagraphs(protectedHtml, 'omit'), protectedHtml);
  assert.equal(normalizeFlowParagraphs(html), html);
  assert.equal(normalizeFlowParagraphs('<h1>Başlık</h1><p><br></p><p>Metin.</p>', 'omit'), '<h1>Başlık</h1><p>Metin.</p>');
  assert.doesNotMatch(normalizeFlowParagraphs('<p>İlk.</p>\n<p><br></p>\n<p>Son.</p>', 'omit'), /<br/);
});

test('name casing is display-only, Turkish-aware, and applied to text and metadata blocks', () => {
  const state = { STUDENT_NAME: 'Taner Berk Bayırlı' };
  assert.equal(resolvePlaceholders('{{STUDENT_NAME}}', mcbuMaster.placeholders, state).text, 'Taner Berk BAYIRLI');
  assert.equal(state.STUDENT_NAME, 'Taner Berk Bayırlı');
  const model = compile(mcbuMaster);
  const cover = [...walkSpecialPage(model.sections.find(s => s.id === 'inner-cover').layout)];
  assert.ok(cover.some(n => n.text === 'Taner Berk BAYIRLI'));
  assert.ok(cover.some(n => n.text?.includes('İlknur ÇİÇEK')));
});

for (const template of templates) {
  test(`${template.id}: valid sample, source-specific rules, clean flow, and live DOCX fields`, async () => {
    assert.deepEqual(validateThesisTemplate(template), []);
    const fixture = mcbuOutputFixture(template);
    const original = structuredClone(fixture);
    let model = compile(template, fixture);
    assert.deepEqual(thesisExportIssues(model), []);
    assert.doesNotThrow(() => assertThesisExportReady(model));
    const main = model.sections.find(s => s.type === 'mainContent');
    assert.doesNotMatch(main.editableHtml, /<p><br\s*\/?><\/p>/);
    assert.doesNotMatch(main.editorHtml, /<p[^>]*><br\s*\/?><\/p>/);
    assert.deepEqual(fixture, original, 'compilation must not alter the stored note');
    const pages = Object.fromEntries(model.indexSources.map((entry, i) => [entry.anchor, { label: String(i + 1) }]));
    model = resolveGeneratedIndexes(model, pages);
    const toc = model.sections.find(s => s.generatedIndex?.kind === 'toc');
    if (template !== medical) {
      assert.equal(toc.generatedIndex.leader, 'dots');
      assert.equal(toc.generatedIndex.pageNumberAlignment, 'right');
      assert.ok(toc.indexRows.some(row => row.text === 'İÇİNDEKİLER'));
      const symbols = model.sections.find(s => s.type === 'listOfAbbreviations');
      assert.equal(symbols.rules.body.lineHeight, 1.5);
      for (const section of model.sections.filter(s => s.id.endsWith('footer'))) assert.equal(section.rules.body.firstLineIndentMm, 0);
    } else {
      assert.equal(main.rules.body.fontFamily, 'Arial');
      assert.equal(main.rules.page.margins.topMm, 30);
      assert.equal(toc.generatedIndex.leader, 'none');
    }
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))['word/document.xml']);
    assert.match(xml, /TOC /);
    assert.match(xml, /PAGEREF /);
    assert.match(xml, /Taner Berk BAYIRLI/);
    assert.doesNotMatch(xml, />999<\/w:t>/);
    if (template !== medical) assert.match(xml, /w:val="right"[^>]*w:leader="dot"|w:leader="dot"[^>]*w:val="right"/);
  });
  test(`${template.id}: empty required metadata cannot export; deliberate advisor wording is accepted`, () => {
    const fixture = mcbuOutputFixture(template);
    fixture.content = '<p>Başlıksız gövde.</p>';
    fixture.researchData.thesis.values.ADVISOR_TITLE = 'Akademisyen';
    fixture.researchData.thesis.values.STUDENT_NAME = '';
    const model = compile(template, fixture);
    const codes = thesisExportIssues(model).map(issue => issue.code);
    assert.equal(codes.includes('pattern'), false);
    if (template !== medical) assert.equal(codes.includes('missingHeadings'), false);
    assert.ok(codes.includes('requiredMetadata'));
    assert.throws(() => assertThesisExportReady(model), /Tez dışa aktarılamadı/);
  });
}

test('legacy template retains stored section keys while following current LEE order', () => {
  const ids = legacy.sections.map(section => section.id);
  for (const id of ['cover', 'abstract', 'english-abstract', 'acknowledgements', 'table-of-contents', 'main-content', 'bibliography']) assert.ok(ids.includes(id));
  assert.ok(ids.indexOf('list-of-abbreviations') < ids.indexOf('table-of-contents'));
  assert.equal(legacy.sections.find(s => s.id === 'abstract-header').overrides.page.numbering.format, 'roman-upper');
});

test('saved legacy CBÜ notes resolve without reintroducing a duplicate in the chooser', async () => {
  assert.equal(THESIS_TEMPLATE_REGISTRY.some(entry => entry.id === legacy.id), false);
  const resolved = await resolveThesisTemplate({ templateId: legacy.id });
  assert.equal(resolved.fallback, false, resolved.reason);
  assert.equal(resolved.template.id, legacy.id);
});

test('strict export policy does not impose CBÜ rules on other templates', () => {
  assert.deepEqual(thesisExportIssues({ validation: { errors: [{ message: 'Draft' }] }, sections: [{ missingPlaceholders: ['NAME'] }] }), []);
});

for (const template of [mcbuMaster, mcbuPhd, legacy]) {
  test(`${template.id}: deliberate advisor title and single main chapter do not block formatting export`, () => {
    const fixture = mcbuOutputFixture(template);
    fixture.content = '<h1>NEDEN TXTNOTE</h1><p>Kullanıcının seçtiği metin.</p>';
    fixture.researchData.thesis.values.ADVISOR_TITLE = 'Akademisyen';
    const original = structuredClone(fixture);
    const model = compile(template, fixture);
    assert.deepEqual(thesisExportIssues(model), []);
    assert.doesNotThrow(() => assertThesisExportReady(model));
    assert.deepEqual(fixture, original);
  });
}
