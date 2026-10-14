import { THESIS_TEMPLATE_REGISTRY } from "../../engine/src/registry.js";
const want = process.argv[2].split(",");
for (const d of THESIS_TEMPLATE_REGISTRY) {
  if (!want.some(w=>d.id.startsWith(w.split(":")[0]))) continue;
  const t = (await d.load()).default;
  for (const s of t.sections || []) {
    if (!Array.isArray(s.blocks) || !want.includes(`${d.id.split("-v1")[0]}:${s.id}`) ) continue;
    console.log("==", d.id, s.id, JSON.stringify(s.overrides?.page?.margins));
    s.blocks.forEach((b,i)=>console.log(i, b.type, b.layoutMode||"", b.xMm??"", b.yMm??"", b.widthMm??"", b.heightMm??"", b.positionOrigin||"", JSON.stringify(b.value||b.field||"").slice(0,50)));
  }
}
