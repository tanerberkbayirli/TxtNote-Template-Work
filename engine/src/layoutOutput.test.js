import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import { resolveThesisTemplate } from './registry.js';
import { compileThesisDocument, buildThesisCss, thesisWordBaselineProbes } from './engine.js';
import { wordBaselineProbe } from './wordBaseline.js';
import { resolveLineSpacing } from './typography.js';
import { indexRowStyle } from './generatedIndex.js';
import { buildThesisDocx } from './export.js';
import { presentationId } from './presentationLayout.js';
import { allocateTocOverrides } from './docx/tocOverrides.js';
import { twip } from './docx/xml.js';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const nodes = (root, name) => Array.from(root.getElementsByTagNameNS(W, name));
const text = root => nodes(root, 't').map(node => node.textContent).join('');
async function setup() {
  const { template } = await resolveThesisTemplate({ templateId: 'mcbu-lee-master-tr-v1' });
  const thesis = { layout: { elements: {} } };
  const compile = () => compileThesisDocument(template, thesis, 'T', '<h1>SOURCEHEADING</h1><p>Source body</p>');
  return { template, thesis, compile };
}
async function output(model, options) {
  const blob = await buildThesisDocx(model, options);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const xml = strFromU8(files['word/document.xml']);
  return { blob, files, xml, root: new DOMParser().parseFromString(xml, 'application/xml') };
}
test('positioned presentation heading stays one editable paragraph with its bookmark and page frame', async () => {
  const { thesis, compile } = await setup();
  const section = compile().sections.find(s => s.id === 'preface');
  const id = section.presentationElements[0].id;
  thesis.layout.elements[id] = { text: 'MOVEDTITLE', layoutMode: 'absolute', xMm: 45, yMm: 65, widthMm: 90, heightMm: 12, flowHeightMm: 6, flowMarginBottomMm: 6 };
  const result = await output(compile());
  const paragraphs = nodes(result.root, 'p').filter(p => text(p) === 'MOVEDTITLE' && nodes(p, 'framePr').length);
  assert.equal(paragraphs.length, 1);
  const paragraph = paragraphs[0], frame = nodes(paragraph, 'framePr')[0];
  assert.ok(frame);
  assert.equal(frame.getAttributeNS(W, 'x'), String(twip(45)));
  assert.equal(frame.getAttributeNS(W, 'y'), String(twip(65)));
  assert.equal(frame.getAttributeNS(W, 'w'), String(twip(90)));
  assert.equal(frame.getAttributeNS(W, 'hAnchor'), 'page');
  assert.ok(nodes(paragraph, 'bookmarkStart').length);
  assert.equal(result.blob.exportIssues.fieldAudit.unbalanced, false);
  assert.deepEqual(result.blob.exportIssues.fieldAudit.dangling, []);
});
test('positioned fixed paragraph keeps the same frame path and authored text formatting', async () => {
  const { template } = await setup();
  const custom = structuredClone(template);
  Object.assign(custom.sections.find(s => s.id === 'preface'), { mode: 'static', content: 'FIXEDPARAGRAPH' });
  const initial = compileThesisDocument(custom, {}, 'T', '<p>Body</p>');
  const section = initial.sections.find(s => s.id === 'preface');
  const id = section.presentationElements.find(n => n.text === 'FIXEDPARAGRAPH').id;
  const thesis = { layout: { elements: { [id]: { layoutMode: 'absolute', xMm: 55, yMm: 70, widthMm: 100, heightMm: 12, style: { italic: true, fontSizePt: 18 } } } } };
  const result = await output(compileThesisDocument(custom, thesis, 'T', '<p>Body</p>'));
  const paragraph = nodes(result.root, 'p').find(p => text(p) === 'FIXEDPARAGRAPH');
  assert.ok(nodes(paragraph, 'framePr').length);
  assert.equal(nodes(paragraph, 'sz')[0].getAttributeNS(W, 'val'), '36');
  assert.ok(nodes(paragraph, 'i').length);
});
test('custom TOC label has a live TC source and isolated TOC style without changing the source heading', async () => {
  const { thesis, compile } = await setup();
  const toc = compile().sections.find(s => s.generatedIndex?.kind === 'toc');
  const row = toc.indexRows.find(row => row.text.includes('SOURCEHEADING'));
  const id = presentationId(toc.id, 'generated', `row:${row.anchor}`);
  thesis.layout.elements[id] = { text: 'SAVEDALIAS', style: { fontSizePt: 16, color: '#9b1c1c' } };
  const result = await output(compile());
  assert.equal(nodes(result.root, 't').filter(t => t.textContent === 'SOURCEHEADING').length, 1);
  const instructions = nodes(result.root, 'instrText').map(n => n.textContent).join('\n');
  assert.match(instructions, /TC "SAVEDALIAS"/);
  const level = instructions.match(/TC "SAVEDALIAS" \\f A \\l (\d)/)?.[1];
  assert.ok(level);
  const styles = new DOMParser().parseFromString(strFromU8(result.files['word/styles.xml']), 'application/xml');
  const saved = nodes(styles, 'style').find(n => n.getAttributeNS(W, 'styleId') === `TOC${level}`);
  assert.equal(nodes(saved, 'sz')[0].getAttributeNS(W, 'val'), '32');
  assert.equal(nodes(saved, 'color')[0].getAttributeNS(W, 'val').toLowerCase(), '9b1c1c');
  const ordinary = nodes(styles, 'style').find(n => n.getAttributeNS(W, 'styleId') === 'TOC1');
  assert.notEqual(nodes(ordinary, 'sz')[0].getAttributeNS(W, 'val'), '32');
  assert.deepEqual(result.blob.exportIssues.fieldAudit.dangling, []);
  assert.equal(result.blob.exportIssues.fieldAudit.unbalanced, false);
});
test('Word TOC profile capacity fails explicitly rather than overwriting another saved appearance', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ anchor: `r${i}`, level: 1 }));
  const overrides = new Map(rows.map((row, i) => [row.anchor, { label: row.anchor, style: { fontSizePt: 10+i } }]));
  assert.throws(() => allocateTocOverrides(rows, overrides, [], () => true), /en fazla 9/);
});

test('saved TOC typography uses its own measured baseline relative to the list rather than the old font size', async () => {
  const { thesis, compile } = await setup();
  const toc = compile().sections.find(s => s.generatedIndex?.kind === 'toc');
  const row = toc.indexRows.find(row => row.text.includes('SOURCEHEADING'));
  const id = presentationId(toc.id, 'generated', `row:${row.anchor}`);
  for (const override of [{ fontSizePt: 10 }, { fontSizePt: 16 }, { fontSizePt: 20, italic: true }, { fontFamily: 'Arial', fontSizePt: 16 }]) {
    thesis.layout.elements[id] = { style: override };
    const model = compile(), section = model.sections.find(s => s.id === toc.id);
    const style = { ...toc.generatedIndex.style, ...indexRowStyle(toc.generatedIndex, row), ...override };
    const own = wordBaselineProbe(style, toc.rules.lineSpacing, resolveLineSpacing(style, toc.rules.lineSpacing).em);
    const base = toc.generatedIndex.style;
    const inherited = wordBaselineProbe(base, toc.rules.lineSpacing, resolveLineSpacing(base, toc.rules.lineSpacing).em);
    assert.ok(thesisWordBaselineProbes(model).some(probe => probe.id === own.id));
    const css = buildThesisCss(model).split('\n').find(line => line.includes(`[data-layout-id=${JSON.stringify(id)}]`) && line.includes('top:calc'));
    assert.ok(css.includes(`-1 * var(--thesis-wb-${own.id},`));
    assert.ok(css.includes(`+ var(--thesis-wb-${inherited.id},`));
    assert.ok(css.includes('line-height:'));
    assert.equal(section.presentationElements.find(node => node.id === id).override.style.fontSizePt, override.fontSizePt);
  }
});

test('text-only and color-only TOC overrides keep the existing template line placement', async () => {
  const { thesis, compile } = await setup();
  const toc = compile().sections.find(s => s.generatedIndex?.kind === 'toc');
  const id = presentationId(toc.id, 'generated', `row:${toc.indexRows[0].anchor}`);
  const before = thesisWordBaselineProbes(compile()).map(probe => probe.id);
  thesis.layout.elements[id] = { text: 'Alias', style: { color: '#9b1c1c' } };
  const after = compile();
  assert.deepEqual(thesisWordBaselineProbes(after).map(probe => probe.id), before);
  assert.ok(!buildThesisCss(after).split('\n').some(line => line.includes(`[data-layout-id=${JSON.stringify(id)}]`) && line.includes('top:calc')));
});
test('per-page number geometry writes conditional live PAGE fields only into its group footers', async () => {
  const { thesis, compile } = await setup();
  const id = presentationId('preface', 'chrome', '0:number');
  thesis.layout.elements[id] = { xMm: 35, yMm: 268, widthMm: 65, style: { fontSizePt: 16, align: 'left', color: '#9b1c1c' } };
  const result = await output(compile(), { presentationGeometry: { [id]: { groupId: 'preface', label: 'III', xMm: 35, yMm: 268, widthMm: 65, heightMm: 6, baselineMm: 272.5, style: { fontFamily: 'Times New Roman', fontSizePt: 16, align: 'left' } } } });
  const footers = Object.entries(result.files).filter(([name]) => /^word\/footer\d+\.xml$/.test(name)).map(([,data])=>strFromU8(data));
  assert.ok(footers.some(xml => xml.includes(' IF ') && xml.includes(' PAGE ') && xml.includes('III') && xml.includes('w:val="32"')));
  assert.ok(footers.some(xml => !xml.includes(' IF ')));
  assert.equal(result.blob.exportIssues.fieldAudit.unbalanced, false);
});
