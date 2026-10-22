// Add one new template from an official source in a single step (orchestration/motor/ALTYAPI.md, "Üretim hattı").
//
// usage: node engine/tools/template-add.mjs --extracted <target.extracted.json> (--profile <target.generation.json> | --identity <identity.json>)
//          [--replace] [--write] [--out-root <dir>]
// With --identity (university, institute, degree, language, template id) the generation profile is suggested from the source itself
// (profile-suggest.mjs); if a role cannot be found the tool stops and lists it, so a person completes only that. With --write the
// profile that was used is saved as specs/<target>.generation.json.
//
// The engine is the shared part (behaviour, and neutral defaults for keys a source never states: engineDefaults.js). A template is
// flat data of one official source: it never extends another template and never borrows a number from another university.
//
// 1. generate()    source facts -> template, Tier 1 checks, fixture, mapping (spec2template.mjs; nothing is invented).
// 2. data gate     the template must survive JSON storage unchanged and pass the schema validation, or nothing is written.
// 3. provenance    every value of the template is classed MEASURED (a source fact states it), GEOMETRY (fixed-page text measured from
//                  the verified Word render) or GENERATED (not stated by a source fact: a generator constant, a copy of a measured
//                  value, or a reviewed-profile choice). Keys the template leaves absent and the engine fills are listed as
//                  ENGINE_DEFAULT. Property groups the engine could not apply are UNKNOWN (mapping.engineGaps).
// Without --write nothing is written. Written (under --out-root, default the repository): templates/data/<id>.json, the module
// templates/<target>.js, specs/<target>.{checks,fixture,mapping,provenance}.json. The registry line is printed, not inserted.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { withEngineDefaults } from "../src/engineDefaults.js";
import { validateThesisTemplate } from "../src/validation.js";
import { generate } from "./spec2template.mjs";
import { suggestProfile } from "./profile-suggest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(here, "..");
const repoRoot = resolve(engineRoot, "..");
// Templates live in Butun-Sablonlar/<region>/<university>/<id>.json (the fallback template in Genel/); the engine reads them from there.
const templatesRoot = join(repoRoot, "Butun-Sablonlar");
const DEFAULT_REGION = "Ege";
// The university's folder decides the region (Butun-Sablonlar/<region>/<university>); a university without one goes under DEFAULT_REGION.
const regionOf = (universityName, base) => {
  if (!existsSync(base)) return DEFAULT_REGION;
  return readdirSync(base, { withFileTypes: true }).find((entry) => entry.isDirectory() && existsSync(join(base, entry.name, universityName)))?.name ?? DEFAULT_REGION;
};
export const templateJsonPath = (template, base = templatesRoot) => join(base, template.id === "generic" ? "Genel" : join(regionOf(template.universityName, base), template.universityName), `${template.id}.json`);
// Identity of a template: not a rule value.
const IDENTITY = new Set(["id", "displayName", "universityId", "universityName", "instituteId", "instituteName", "source", "templateVersion", "degreeType", "language", "status", "metadata", "schemaVersion"]);
const DEGREE_LABEL = { master: "Yüksek Lisans", phd: "Doktora", undergraduate: "Lisans Tezi", specialization: "Uzmanlık Tezi", "sanatta-yeterlik": "Sanatta Yeterlik" };
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Every stored template by id. */
export function loadStoredTemplates(directory = templatesRoot) {
  const templates = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (entry.name !== "eski-js") walk(join(dir, entry.name)); continue; }
      if (!entry.name.endsWith(".json") || entry.name === "generic.json") continue;
      const data = JSON.parse(readFileSync(join(dir, entry.name), "utf8"));
      if (data && typeof data.id === "string" && Array.isArray(data.sections)) templates.set(data.id, data);
    }
  };
  walk(directory);
  return templates;
}

function leaves(value, path = [], out = new Map()) {
  if (isObject(value) && Object.keys(value).length) for (const [k, v] of Object.entries(value)) leaves(v, [...path, k], out);
  else if (Array.isArray(value) && value.length && value.every((item) => isObject(item) || Array.isArray(item))) value.forEach((item, i) => leaves(item, [...path, String(i)], out));
  else out.set(path.join("."), value);
  return out;
}

/** Class of every leaf of the template. `facts` are the source facts (key, value). */
export function classify(template, facts, engineGaps = []) {
  // A fact states a value at a template path (a scalar or a whole object, e.g. lineSpacing); the last fact of a key is the one used.
  const own = {};
  for (const [key, value] of Object.entries(template)) if (!IDENTITY.has(key)) own[key] = value;
  const measuredPaths = new Set();
  const unresolvedFacts = [];
  for (const fact of new Map(facts.map((f) => [f.key, f])).values()) {
    const at = fact.key.split(".").reduce((node, part) => (node !== null && typeof node === "object" ? node[part] : undefined), own);
    if (at !== undefined && isDeepStrictEqual(at, fact.value)) measuredPaths.add(fact.key);
    else unresolvedFacts.push(fact.key);
  }
  const isMeasured = (path) => { for (let cut = path.length; cut > 0; cut = path.lastIndexOf(".", cut - 1)) if (measuredPaths.has(path.slice(0, cut))) return true; return false; };
  const classes = { MEASURED: [], GEOMETRY: [], GENERATED: [], ENGINE_DEFAULT: [] };
  const present = new Set();
  for (const path of leaves(own).keys()) {
    present.add(path);
    if (/^sections\.\d+\.blocks\./.test(path)) classes.GEOMETRY.push(path);
    else if (isMeasured(path)) classes.MEASURED.push(path);
    else classes.GENERATED.push(path);
  }
  // Keys the template leaves absent and the engine fills (only absent keys are ever filled).
  const filled = { ...withEngineDefaults(template) };
  for (const key of IDENTITY) delete filled[key];
  for (const path of leaves(filled).keys()) if (!present.has(path) && !/^sections\./.test(path)) classes.ENGINE_DEFAULT.push(path);
  return { classes, unresolvedFacts, unknownPropertyGroups: engineGaps.length };
}

function summarize(result) {
  const stored = ["MEASURED", "GEOMETRY", "GENERATED"];
  const total = stored.reduce((sum, name) => sum + result.classes[name].length, 0);
  const pct = (n) => `${Math.round((100 * n) / total)}%`;
  const summary = { total, ENGINE_DEFAULT: result.classes.ENGINE_DEFAULT.length, share: {} };
  for (const name of stored) { summary[name] = result.classes[name].length; summary.share[name] = pct(result.classes[name].length); }
  return summary;
}

const moduleVariable = (id) => `template_${id.replace(/[^a-zA-Z0-9]/g, "_")}`;

/** Module wrapper in the same form as the existing ones. */
export function moduleSource(id, importPath) {
  const name = moduleVariable(id);
  return [
    "// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).",
    "// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.",
    `import ${name}Data from "${importPath}" with { type: "json" };`,
    `const ${name} = ${name}Data;`,
    `export default ${name};`,
    "",
  ].join("\n");
}

function registryLine(template, target) {
  const degree = DEGREE_LABEL[template.degreeType] ?? template.degreeType;
  const displayName = `${template.universityName} · ${template.instituteName} · ${degree}`;
  const fields = { id: template.id, templateVersion: template.templateVersion, universityId: template.universityId, universityName: template.universityName, instituteId: template.instituteId, instituteName: template.instituteName,
    degreeType: template.degreeType, language: template.language, status: template.status, displayName };
  const body = Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
  return `  { ${body}, selectors: {}, load: () => import("./templates/${target}.js").then((module) => ({ default: module.default })) },`;
}

export function addTemplate({ extracted, profile, replace = false, stored = loadStoredTemplates() }) {
  const { template, checks, fixture, mapping } = generate(extracted, profile);
  if (stored.has(template.id) && !replace) throw new Error(`Şablon zaten var: ${template.id} (--replace ile yeniden üretilir)`);
  // Data gate: storage is JSON; what is stored must be exactly what was generated, and valid.
  if (!isDeepStrictEqual(JSON.parse(JSON.stringify(template)), template)) throw new Error("Üretilen şablon JSON olarak saklanınca değişiyor (undefined/işlev); yazılmadı");
  const errors = validateThesisTemplate(template);
  if (errors.length) throw new Error(`Şema doğrulaması başarısız: ${errors.join("; ")}`);
  const provenance = classify(template, mapping.facts, mapping.engineGaps);
  return { template, checks, fixture, mapping, provenance, summary: summarize(provenance) };
}

function parseArgs(argv) {
  const args = { flags: new Set(), values: {} };
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) throw new Error(`Beklenmeyen argüman: ${argv[i]}`);
    const name = argv[i].slice(2);
    if (["write", "replace"].includes(name)) args.flags.add(name);
    else args.values[name] = argv[++i];
  }
  return args;
}

if (process.argv[1] && import.meta.url === new URL(`file:///${resolve(process.argv[1]).replace(/\\/g, "/")}`).href) {
  const { flags, values } = parseArgs(process.argv.slice(2));
  if (!values.extracted || (!values.profile && !values.identity)) throw new Error("usage: template-add.mjs --extracted <file> (--profile <file> | --identity <file>) [--replace] [--write] [--out-root <dir>]");
  const extracted = JSON.parse(readFileSync(values.extracted, "utf8"));
  let profile;
  let suggested = false;
  if (values.profile) profile = JSON.parse(readFileSync(values.profile, "utf8"));
  else {
    const result = suggestProfile(extracted, { identity: JSON.parse(readFileSync(values.identity, "utf8")) });
    profile = result.profile;
    suggested = true;
    console.log(`profile        suggested from the source: ${profile.sections.length} sections, ${profile.fixedPages.length} fixed pages`);
    if (result.missing.length) {
      console.log(`NEEDS A PERSON (${result.missing.length}), nothing written:\n  ${result.missing.join("\n  ")}\ncomplete it: node engine/tools/profile-suggest.mjs --extracted ... --identity ... --out <profile.json>, edit it, then pass --profile`);
      process.exit(1);
    }
  }
  const result = addTemplate({ extracted, profile, replace: flags.has("replace") });
  const { template, summary, provenance } = result;
  console.log(`template        ${template.id}  (${profile.target}), ${JSON.stringify(template).length} B, flat (no extends)`);
  console.log(`provenance      ${summary.total} stored values: MEASURED ${summary.MEASURED} (${summary.share.MEASURED}), GEOMETRY ${summary.GEOMETRY} (${summary.share.GEOMETRY}), GENERATED ${summary.GENERATED} (${summary.share.GENERATED}); keys left to the engine: ${summary.ENGINE_DEFAULT}`);
  console.log(`                source facts not placed on a template path: ${provenance.unresolvedFacts.length}; property groups the engine did not apply (UNKNOWN): ${provenance.unknownPropertyGroups}`);
  console.log(`                Tier 1 checks: ${result.checks.length} (run: node engine/tools/check.mjs --target ${profile.target} --word)`);
  if (!flags.has("write")) { console.log("dry run (use --write)"); process.exit(0); }
  const root = values["out-root"] ? resolve(values["out-root"]) : engineRoot;
  const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); return path; };
  const jsonPath = templateJsonPath(template, values["out-root"] ? join(root, "Butun-Sablonlar") : templatesRoot);
  const written = [
    put(jsonPath, `${JSON.stringify(template, null, 1)}\n`),
    put(join(root, "src/templates", `${profile.target}.js`), moduleSource(template.id, relative(join(root, "src/templates"), jsonPath).split(sep).join("/"))),
    ...(suggested ? [put(join(root, "specs", `${profile.target}.generation.json`), `${JSON.stringify(profile, null, 2)}\n`)] : []),
    put(join(root, "specs", `${profile.target}.checks.json`), JSON.stringify(result.checks, null, 2) + "\n"),
    put(join(root, "specs", `${profile.target}.fixture.json`), JSON.stringify(result.fixture, null, 2) + "\n"),
    put(join(root, "specs", `${profile.target}.mapping.json`), JSON.stringify({ ...result.mapping, extractedSha256: createHash("sha256").update(readFileSync(values.extracted)).digest("hex"), profileSha256: createHash("sha256").update(values.profile ? readFileSync(values.profile) : JSON.stringify(profile)).digest("hex") }, null, 2) + "\n"),
    put(join(root, "specs", `${profile.target}.provenance.json`), JSON.stringify({ schemaVersion: 1, template: template.id, sourceSha256: extracted.source.sha256, summary, unresolvedFacts: provenance.unresolvedFacts, unknownPropertyGroups: provenance.unknownPropertyGroups,
      values: provenance.classes, note: "Only MEASURED/GEOMETRY values are source evidence. GENERATED values are not stated by a source fact; ENGINE_DEFAULT keys are absent from the template and filled by the engine. Confirm with check.mjs and review." }, null, 1) + "\n"),
  ];
  console.log("written:\n  " + written.join("\n  "));
  console.log("registry line (add to engine/src/registry.js):\n" + registryLine(template, profile.target));
}
