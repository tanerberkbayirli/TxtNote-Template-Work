import { presentationId } from '../presentationLayout.js';
/** Word regenerates TOC paragraphs from numbered TOC styles. Give distinct
 * saved appearances distinct output levels; TC sources retain custom labels. */
export function tocOverrides(section) {
  const nodes = new Map((section?.presentationElements || []).map(node => [node.id, node]));
  const result = new Map();
  for (const row of section?.indexRows || []) {
    const override = nodes.get(presentationId(section.id, 'generated', `row:${row.anchor}`))?.override;
    if (!override || !Object.keys(override.style || {}).length && typeof override.text !== 'string' && typeof override.content !== 'string') continue;
    const label = override.content ?? override.text ?? row.text;
    if (!String(label).trim()) throw new Error('Boş içindekiler satırı Word alanı olarak yenilenemez; satır metnini tamamlayın.');
    result.set(row.anchor, { style: override.style || {}, label });
  }
  return result;
}

export function allocateTocOverrides(rows, overrides, usedLevels, includePage) {
  const output = new Map(), profiles = new Map(), used = new Set(usedLevels);
  for (const row of [...rows].filter(row => overrides.has(row.anchor)).sort((a,b) => Number(includePage(a))-Number(includePage(b)))) {
    const override = overrides.get(row.anchor);
    const key = JSON.stringify([row.level, includePage(row), Object.entries(override.style).sort(([a],[b])=>a.localeCompare(b))]);
    let level = profiles.get(key);
    if (!level) {
      const available = Array.from({ length: 9 }, (_, i) => i+1).filter(i => !used.has(i));
      level = includePage(row) ? available[0] : available.at(-1);
      if (!level) throw new Error('Word içindekiler alanı en fazla 9 farklı satır görünümünü koruyabilir. Satır biçimlerini ortaklaştırın.');
      profiles.set(key, level); used.add(level);
    }
    output.set(row.anchor, { customToc: true, tocTextOverride: override.label, tocStyleOverride: override.style, wordTocLevel: level });
  }
  return output;
}
