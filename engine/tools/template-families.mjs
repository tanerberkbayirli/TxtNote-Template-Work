// Structural inventory only: group similar official DOCX models without sharing values.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [out, ...inputs] = process.argv.slice(2);
if (!out || inputs.length < 3) throw new Error('usage: template-families.mjs output.json >=3 extracted.json files');
const child = (node, tag) => node?.children?.find(n => n.tag === `w:${tag}`);
const sources = inputs.map(path => {
  const x = JSON.parse(readFileSync(path, 'utf8'));
  const names = x.styles.map(s => child(s.properties, 'name')?.attributes['w:val']?.toLowerCase() || '');
  const structure = { headingLevels: names.filter(n => /^heading [1-9]$/.test(n)).map(n => Number(n.at(-1))).sort(), tocLevels: names.filter(n => /^toc [1-9]$/.test(n)).map(n => Number(n.at(-1))).sort(), hasStyleInheritance: x.styles.some(s => child(s.properties, 'basedOn')), hasPageFields: x.pageFields.length > 0, hasMultipleSections: x.sections.length > 1, hasTables: x.tables.length > 0 };
  return { target: x.target, source: x.source, sectionCount: x.sections.length, styleCount: x.styles.length, tableCount: x.tables.length, structure,
    structuralFingerprint: createHash('sha256').update(JSON.stringify(structure)).digest('hex').slice(0, 12) };
});
const families = Object.values(Object.groupBy(sources, s => s.structuralFingerprint)).map(group => ({ id: group[0].structuralFingerprint, targets: group.map(s => s.target), structure: group[0].structure, reusableEnginePreset: 'wordFlowPreset', numericUniversityValuesShared: false }));
writeFileSync(out, JSON.stringify({ schemaVersion: 1, scope: 'First three universities; structural candidates, not a universal rule family', sources, families, reviewedPreset: { module: 'engine/tools/source-template-presets.mjs', keys: ['mode:word', 'font-program singleLineEm', 'baseline:word', 'paragraphSpacing:additive'], policy: 'Dimensions, type sizes, spacing values and section/front-page requirements always come from each official source.' } }, null, 2) + '\n');
console.log(JSON.stringify({ sources: sources.length, families: families.length, targets: sources.map(s => s.target) }));
