import { THESIS_TEMPLATE_REGISTRY } from "../../engine/src/registry.js";
const seen = new Set();
for (const d of THESIS_TEMPLATE_REGISTRY) {
  let t; try { const m = await d.load(); t = m.default; } catch (e) { console.log("ERR", d.id, e.message); continue; }
  for (const s of t.sections || []) {
    if (!Array.isArray(s.blocks)) continue;
    const abs = s.blocks.filter((b) => ["absolute", "anchored"].includes(b.layoutMode));
    if (!abs.length) continue;
    const key = `${t.id}:${s.id}`; if (seen.has(key)) continue; seen.add(key);
    const order = s.blocks.map((b) => (["absolute", "anchored"].includes(b.layoutMode) ? (b.type[0]==='i'?'I':'A') : b.type === "spacer" ? "s" : "F")).join("");
    console.log(key, s.verticalAlign || "-", s.mode, s.editable?'ed':'', order);
  }
}
