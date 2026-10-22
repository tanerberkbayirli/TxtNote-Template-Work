import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from './spec2template.mjs';
const extracted = JSON.parse(readFileSync(new URL('../specs/adu-sagbil.extracted.json', import.meta.url), 'utf8'));
const profile = JSON.parse(readFileSync(new URL('../specs/adu-sagbil.generation.json', import.meta.url), 'utf8'));

test('official source inheritance and direct formatting remain distinct', () => {
  const { template, checks, mapping } = generate(extracted, profile);
  assert.equal(template.typography.body.fontFamily, 'Times New Roman');
  assert.equal(template.typography.body.fontSizePt, 12);
  assert.equal(template.typography.headings[1].fontSizePt, 14);
  assert.equal(template.typography.headings[2].fontSizePt, 12);
  assert.equal(template.typography.headings[4].numbering.format, '{1}.{2}.{3}.{4}.');
  assert.equal(template.page.numbering.align, 'right');
  assert.ok(checks.every(c => c.source.locator && c.evidence === 'MEASURED' && c.tier === 1));
  assert.ok(mapping.engineGaps.some(g => g.key.includes('tblStyle')));
  assert.ok(mapping.engineGaps.some(g => g.key.includes('trHeight')));
});
test('fixed-page source geometry becomes editable text, never raster snapshots', () => {
  const { template, checks } = generate(extracted, profile);
  const cover = template.sections.find(s => s.id === 'cover');
  assert.ok(cover.blocks.every(b => b.type === 'text' && b.layoutMode === 'absolute'));
  assert.equal(cover.blocks[0].value, 'T.C.');
  assert.equal(cover.blocks[0].xMm, extracted.wordRender.pages[0].lines[0].words[0].x0);
  const sourceY = extracted.wordRender.pages[0].lines[0].baseline;
  assert.equal(checks.find(c => c.id === 'cover-line-1-word-baseline').expected, sourceY);
  assert.deepEqual(generate(extracted, profile), generate(extracted, profile));
});
test('provenance mismatch and unreviewed missing source roles fail closed', () => {
  const bad = structuredClone(extracted); bad.source.sha256 = 'wrong';
  assert.throws(() => generate(bad, profile), /hashes differ/);
  assert.throws(() => generate(extracted, { ...profile, bodyParagraph: 999999 }), /Missing source paragraph/);
  assert.throws(() => generate(extracted, { ...profile, bodyStyle: 'missing' }), /Missing style/);
});

test('page number alignment and the table-of-contents levels come from the source, not from constants', () => {
  const centered = structuredClone(extracted);
  for (const field of centered.pageFields) {
    const jc = field.paragraphProperties.pPr.children.find(c => c.tag === 'w:jc');
    jc.attributes['w:val'] = 'center';
  }
  const { template, mapping } = generate(centered, profile);
  assert.equal(template.page.numbering.align, 'center');
  assert.ok(mapping.facts.some(f => f.key === 'page.numbering.align' && f.value === 'center'));
  const three = generate(extracted, { ...profile, headingParagraphs: profile.headingParagraphs.slice(0, 3) }).template;
  assert.deepEqual(three.toc.levels, [1, 2, 3]);
  assert.ok(three.sections.filter(s => s.generatedIndex).every(s => s.generatedIndex.levels.length === 3));
  const noFooter = structuredClone(extracted);
  noFooter.pageFields = noFooter.pageFields.map(f => ({ ...f, locator: f.locator.replace('footer', 'header') }));
  assert.throws(() => generate(noFooter, profile), /footer PAGE field/);
});

test('an inner cover is a fixed page of the cover group: no page number, not in the contents', () => {
  const inner = { id: 'inner-cover', type: 'innerCover', title: 'İÇ KAPAK', group: 'cover', sourcePage: 2 };
  const withInner = { ...profile, fixedPages: [...profile.fixedPages, inner], sections: [profile.sections[0], { id: 'inner-cover' }, ...profile.sections.slice(1)] };
  const section = generate(extracted, withInner).template.sections.find(s => s.id === 'inner-cover');
  assert.equal(section.tocEntry, 'none');
  assert.deepEqual(section.overrides.page.numbering, { enabled: false });
});
