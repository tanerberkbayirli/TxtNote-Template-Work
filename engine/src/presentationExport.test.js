import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import { compileThesisDocument } from './engine.js';
import { resolveThesisTemplate } from './registry.js';
import { buildThesisDocx } from './export.js';
import { parseAcademicHtml } from '../../TxtNote/frontend/src/lib/academicDocument.js';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const nodes = (root, tag) => Array.from(root.getElementsByTagNameNS(W, tag));
const text = root => nodes(root, 't').map(node => node.textContent).join('');
async function exported(model) {
  const blob = await buildThesisDocx(model);
  const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml']);
  return { root: new DOMParser().parseFromString(xml, 'application/xml'), xml, blob };
}
for (const id of ['mcbu-lee-master-tr-v1', 'afsu-lee-master-tr-v1', 'aku-sbe-master-tr-v1']) {
  test(`${id}: static title export preserves the saved visible typography`, async () => {
    const { template, fallback } = await resolveThesisTemplate({ templateId: id });
    assert.equal(fallback, false);
    const initial = compileThesisDocument(template, {}, 'Test', '<h1>Chapter</h1><p>Content</p>');
    const section = initial.sections.find(s => !s.specialPage && !s.generatedIndex && s.presentationElements?.length);
    const node = section.presentationElements[0];
    const thesis = { layout: { elements: { [node.id]: { text: 'VISIBLETITLE', style: { fontSizePt: 20, align: 'right', color: '#9b1c1c' } } } } };
    const model = compileThesisDocument(template, thesis, 'Test', '<h1>Chapter</h1><p>Content</p>');
    const output = await exported(model);
    const paragraph = nodes(output.root, 'p').find(p => text(p) === 'VISIBLETITLE');
    assert.ok(paragraph);
    const value = tag => nodes(paragraph, tag)[0]?.getAttributeNS(W, 'val');
    assert.equal(value('sz'), '40');
    assert.equal(value('jc'), 'right');
    assert.equal(value('color'), '9B1C1C');
  });
}
test('generated TOC title and row styles export without removing live TOC/PAGEREF fields', async () => {
  const { template } = await resolveThesisTemplate({ templateId: 'mcbu-lee-master-tr-v1' });
  const base = compileThesisDocument(template, {}, 'Test', '<h1>Chapter</h1><p>Content</p>');
  const toc = base.sections.find(s => s.generatedIndex?.kind === 'toc');
  const title = toc.presentationElements.find(n => n.id.endsWith('h1%3A0'));
  const row = toc.presentationElements.find(n => n.id.includes('row%3A'));
  assert.ok(title && row);
  const thesis = { layout: { elements: {
    [title.id]: { text: 'VISIBLECONTENTS', style: { fontSizePt: 18, align: 'left' } },
    [row.id]: { style: { fontSizePt: 16, color: '#9b1c1c' } },
  } } };
  const model = compileThesisDocument(template, thesis, 'Test', '<h1>Chapter</h1><p>Content</p>');
  const output = await exported(model);
  const paragraph = nodes(output.root, 'p').find(p => text(p) === 'VISIBLECONTENTS');
  assert.ok(paragraph);
  assert.equal(nodes(paragraph, 'sz')[0].getAttributeNS(W, 'val'), '36');
  assert.equal(nodes(paragraph, 'jc')[0].getAttributeNS(W, 'val'), 'left');
  assert.match(output.xml, /PAGEREF /);
  assert.match(output.xml, /TOC /);
  assert.ok(nodes(output.root, 'p').some(p => nodes(p, 'sz').some(s => s.getAttributeNS(W, 'val') === '32') && nodes(p, 'color').some(c => c.getAttributeNS(W, 'val') === '9B1C1C')));
});
test('paragraph and heading identities survive the non-browser parser without leaking to ordinary text', () => {
  const blocks = parseAcademicHtml('<h1 data-layout-id="s:presentation:prefix:h1%3A0">Title</h1><p data-layout-id="s:presentation:prefix:p%3A1">Fixed</p><p>Ordinary</p>', { lines: true });
  assert.equal(blocks[0].layoutId, 's:presentation:prefix:h1%3A0');
  assert.equal(blocks[1].layoutId, 's:presentation:prefix:p%3A1');
  assert.equal(blocks[2].layoutId, undefined);
});
test('an empty prefixed editable section retains one blank body line before its following signature', async () => {
  const { template } = await resolveThesisTemplate({ templateId: 'mcbu-lee-master-tr-v1' });
  const output = await exported(compileThesisDocument(template, {}, 'Test', '<p>Body</p>'));
  const paragraphs = nodes(output.root, 'body')[0].childNodes;
  const list = Array.from(paragraphs).filter(node => node.localName === 'p');
  const title = list.findIndex(p => text(p).includes('ÖNSÖZ VE TEŞEKKÜR'));
  assert.ok(title >= 0);
  assert.equal(text(list[title + 1]), '');
  assert.equal(nodes(list[title + 1], 'sz')[0].getAttributeNS(W, 'val'), '24');
  assert.doesNotMatch(output.xml, /Yazmaya başla/);
});
test('an empty editable line keeps the additive title-to-body gap', async () => {
  const { template } = await resolveThesisTemplate({ templateId: 'aku-sbe-master-tr-v1' });
  const model = compileThesisDocument(template, {}, 'Test', '<p>Body</p>');
  const section = model.sections.find(s => s.editable && !s.fixedContent && s.prefixHtml && !s.editableHtml?.trim() && !s.layout);
  const output = await exported(model);
  const titleText = section.presentationElements[0].text;
  const list = Array.from(nodes(output.root, 'body')[0].childNodes).filter(node => node.localName === 'p');
  const title = list.findIndex(p => text(p) === titleText);
  assert.ok(title >= 0);
  const blank = list[title + 1];
  assert.equal(text(blank), '');
  const heading = section.rules.headings[1];
  const expected = Math.round(((section.rules.body.spaceBeforePt || 0) + (heading.spaceAfterPt || 0)) * 20);
  assert.equal(nodes(blank, 'spacing')[0].getAttributeNS(W, 'before'), String(expected));
});
