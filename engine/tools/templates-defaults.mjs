// Which values do templates write that the engine would supply anyway? (orchestration/motor/ALTYAPI.md, "Motor varsayılanları")
//
// usage: node engine/tools/templates-defaults.mjs [--only <template id>] [--out <report.json>]
//
// For every rule value of every registered template (page, typography, tables, figures, captionKinds, equations, bibliography, toc,
// footnotes, and every section's `overrides`) the value is removed from a copy of the template and the real compiler is run again
// on a probe document (headings 1–4, footnote, list, table with caption, figure with caption, two chapters, and a footnote in each of
// the first two editable sections, so that behaviour that depends on several sections, such as running footnote numbers, shows):
//   NO_EFFECT   the compiled document model is identical without the value: the engine already does the same when the key is absent.
//   DIFFERENT   the compiled model changes: the value is consequential (a university requirement, or behaviour the engine would not
//               choose on its own).
//   REQUIRED    the template is rejected without the value (validation).
//   UNPROBED    the probe document has no content for this rule (bibliography entries, equations, picture kinds, named paragraph styles):
//               nothing is claimed about it.
// Each value is tested alone. Two values can cover for each other (each alone is NO_EFFECT, both together change the model), so the
// NO_EFFECT values are then removed one after another, section overrides first and template-level values after them, keeping a removal
// only while the compiled result stays identical: the kept removals are `jointlyRemovable` (a set that can be dropped together).
// Nothing is changed. NO_EFFECT means "no effect on the compiled model and the CSS built from it for the probe document" (the model
// feeds the editor, print, PDF and DOCX); it is a candidate list, to be confirmed with the golden/Word gates before any value is removed from a template. A value
// that only matters for content the probe does not contain would be reported NO_EFFECT too; the probe covers every content kind the
// engine styles.
import { writeFileSync } from "node:fs";
import { buildThesisCss, compileThesisDocument } from "../src/engine.js";
import { THESIS_TEMPLATE_REGISTRY } from "../src/registry.js";

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const only = option("--only");

const PROBE = `<h1>Birinci Bölüm</h1><p>Metin <sup class="academic-footnote" data-fn-id="f1" data-fn-text="Dipnot metni">1</sup> ikinci cümle, uzun bir paragraf olarak yazılmıştır.</p><h2>Alt başlık</h2><p>Metin.</p><h3>Üçüncü</h3><p>Metin.</p><h4>Dördüncü</h4><p>Metin.</p><ul><li>madde</li></ul><div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>Tablo başlığı</caption><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table></div><figure data-kind="figure"><img src="data:image/png;base64,iVBORw0KGgo="><figcaption>Şekil başlığı</figcaption></figure><h1>İkinci Bölüm</h1><p>Metin.</p>`;
const UNPROBED = (path) => ["bibliography", "equations", "captionKinds"].includes(path[0]) || (path[0] === "typography" && path[1] === "paragraphStyles");
const RULE_KEYS = new Set(["page", "typography", "tables", "figures", "captionKinds", "equations", "bibliography", "toc", "footnotes"]);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function* leafPaths(value, path = []) {
  if (isObject(value) && Object.keys(value).length) for (const [k, v] of Object.entries(value)) yield* leafPaths(v, [...path, k]);
  else yield path;
}

/** Rule-value paths of a template: top-level rule groups and the `overrides` of every section. */
function candidatePaths(template) {
  const paths = [];
  for (const key of Object.keys(template)) if (RULE_KEYS.has(key)) for (const p of leafPaths(template[key], [key])) paths.push(p);
  (template.sections ?? []).forEach((section, index) => {
    if (isObject(section.overrides)) for (const p of leafPaths(section.overrides, ["sections", index, "overrides"])) paths.push(p);
  });
  return paths;
}

const without = (template, path) => {
  const copy = structuredClone(template);
  let node = copy;
  for (const part of path.slice(0, -1)) node = node?.[part];
  if (node && typeof node === "object") delete node[path.at(-1)];
  return copy;
};
const getAt = (template, path) => path.reduce((node, part) => node?.[part], template);
const label = (template, path) => (path[0] === "sections" ? `sections.*.overrides.${path.slice(3).join(".")}` : path.join("."));
// Key order carries no meaning here: a value the engine fills in afterwards lands at the end of its object.
const canonical = (value) => JSON.stringify(value, (key, v) => (isObject(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v));
const sectionNote = (id) => `<p>Metin<sup class="academic-footnote" data-fn-id="${id}" data-fn-text="Not">1</sup>.</p>`;
// A footnote in each of the first two editable sections other than the main body.
const thesisFor = (template) => ({
  sectionContent: Object.fromEntries((template.sections ?? []).filter((s) => (s.mode ?? "editable") === "editable" && s.type !== "mainContent" && !s.blocks).slice(0, 2).map((s, i) => [s.id, sectionNote(`p${i}`)])),
});
const compile = (template) => {
  const model = compileThesisDocument(template, thesisFor(template), "Başlık", PROBE);
  return canonical(model) + buildThesisCss(model);
};

const rows = new Map();
const perTemplate = [];
const started = performance.now();
for (const descriptor of THESIS_TEMPLATE_REGISTRY) {
  if (only && descriptor.id !== only) continue;
  const template = (await descriptor.load()).default;
  const baseline = compile(template);
  const counts = { NO_EFFECT: 0, DIFFERENT: 0, REQUIRED: 0, UNPROBED: 0 };
  const noEffect = [];
  for (const path of candidatePaths(template)) {
    let outcome;
    if (UNPROBED(path)) outcome = "UNPROBED";
    else try { outcome = compile(without(template, path)) === baseline ? "NO_EFFECT" : "DIFFERENT"; } catch { outcome = "REQUIRED"; }
    counts[outcome]++;
    if (outcome === "NO_EFFECT") noEffect.push(path);
    const key = label(template, path);
    const row = rows.get(key) ?? { path: key, carriers: 0, NO_EFFECT: 0, DIFFERENT: 0, REQUIRED: 0, UNPROBED: 0, values: new Map() };
    row.carriers++;
    row[outcome]++;
    const value = JSON.stringify(getAt(template, path));
    row.values.set(value, (row.values.get(value) ?? 0) + 1);
    rows.set(key, row);
  }
  // Cumulative removal: section overrides first (the more specific restatements), then template-level values.
  const ordered = [...noEffect.filter((p) => p[0] === "sections"), ...noEffect.filter((p) => p[0] !== "sections")];
  let current = structuredClone(template);
  const removable = [];
  for (const path of ordered) {
    const trial = without(current, path);
    try { if (compile(trial) === baseline) { current = trial; removable.push(path); } } catch { /* needed after earlier removals */ }
  }
  counts.jointlyRemovable = removable.length;
  counts.removableTemplateLevel = removable.filter((p) => p[0] !== "sections").length;
  perTemplate.push({ id: descriptor.id, ...counts });
  process.stderr.write(`${descriptor.id.padEnd(40)} ${JSON.stringify(counts)}\n`);
}

const jointly = perTemplate.reduce((a, t) => a + t.jointlyRemovable, 0);
const jointlyTemplate = perTemplate.reduce((a, t) => a + t.removableTemplateLevel, 0);
const total = perTemplate.reduce((a, t) => ({ NO_EFFECT: a.NO_EFFECT + t.NO_EFFECT, DIFFERENT: a.DIFFERENT + t.DIFFERENT, REQUIRED: a.REQUIRED + t.REQUIRED, UNPROBED: a.UNPROBED + t.UNPROBED }), { NO_EFFECT: 0, DIFFERENT: 0, REQUIRED: 0, UNPROBED: 0 });
const all = total.NO_EFFECT + total.DIFFERENT + total.REQUIRED + total.UNPROBED;
const table = [...rows.values()].map((row) => ({
  path: row.path, carriers: row.carriers, NO_EFFECT: row.NO_EFFECT, DIFFERENT: row.DIFFERENT, REQUIRED: row.REQUIRED, UNPROBED: row.UNPROBED,
  distinctValues: row.values.size, topValue: [...row.values].sort((a, b) => b[1] - a[1])[0][0].slice(0, 60), topValueShare: Math.round((100 * [...row.values].sort((a, b) => b[1] - a[1])[0][1]) / row.carriers),
}));
const pct = (n) => `${Math.round((100 * n) / all)}%`;
console.log(`templates ${perTemplate.length}, rule values ${all}: NO_EFFECT ${total.NO_EFFECT} (${pct(total.NO_EFFECT)}), DIFFERENT ${total.DIFFERENT} (${pct(total.DIFFERENT)}), REQUIRED ${total.REQUIRED} (${pct(total.REQUIRED)}), UNPROBED ${total.UNPROBED} (${pct(total.UNPROBED)}); ${rows.size} distinct paths; ${Math.round((performance.now() - started) / 1000)} s`);
console.log(`removable together (cumulative, result identical): ${jointly} values (${pct(jointly)}), of which template-level ${jointlyTemplate}`);
if (option("--out")) writeFileSync(option("--out"), JSON.stringify({ total, jointlyRemovable: jointly, jointlyRemovableTemplateLevel: jointlyTemplate, perTemplate, paths: table }, null, 1));
