// How much of the cover-family sections (outer/inner cover, approval, ethics declaration) is shared between different universities.
// Answers whether a pattern library can replace per-template blocks (orchestration/motor/ALTYAPI.md, "Kapak ailesi ölçümü").
//
// usage: node engine/tools/templates-reuse.mjs
// A block counts as reused when some section of the same type from ANOTHER university holds an equal block, compared
// (1) exactly, (2) ignoring literal text, (3) ignoring text and Mm/Pt measures (style and structure only).
import { THESIS_TEMPLATE_REGISTRY } from "../src/registry.js";

const FAMILY = ["outerCover", "innerCover", "approval", "ethicsDeclaration"];
const rows = [];
for (const descriptor of THESIS_TEMPLATE_REGISTRY) {
  const template = (await descriptor.load()).default;
  for (const section of template.sections ?? []) {
    if (FAMILY.includes(section.type)) rows.push({ university: descriptor.universityId, type: section.type, blocks: section.blocks ?? [] });
  }
}
const isText = (key, value) => (key === "value" || key === "text") && typeof value === "string";
const views = {
  "exact block": (block) => JSON.stringify(block),
  "ignoring text": (block) => JSON.stringify(block, (key, value) => (isText(key, value) ? "S" : value)),
  "ignoring text and measures": (block) =>
    JSON.stringify(block, (key, value) => (/(Mm|Pt)$/.test(key) && typeof value === "number" ? 0 : isText(key, value) ? "S" : value)),
};

const kinds = {};
for (const row of rows) for (const block of row.blocks) kinds[block.type] = (kinds[block.type] ?? 0) + 1;
console.log(`${rows.length} sections, ${rows.reduce((sum, row) => sum + row.blocks.length, 0)} blocks`, kinds);
for (const [name, view] of Object.entries(views)) {
  let total = 0;
  let reused = 0;
  for (const row of rows) {
    const peers = rows.filter((other) => other.type === row.type && other.university !== row.university);
    const seen = new Set(peers.flatMap((peer) => peer.blocks.map(view)));
    for (const block of row.blocks) {
      total += 1;
      if (seen.has(view(block))) reused += 1;
    }
  }
  console.log(`${name.padEnd(28)} reused in another university: ${reused}/${total} (${Math.round((100 * reused) / total)}%)`);
}
