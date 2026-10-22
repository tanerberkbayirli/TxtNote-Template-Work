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
