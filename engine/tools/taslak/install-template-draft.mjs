#!/usr/bin/env node
// Install template drafts (docx-spec-to-template.py / guide-only-drafts.py output) into the engine as flat data.
//   node engine/tools/taslak/install-template-draft.mjs <draft.json> [...] [--status official|generic]
//   node engine/tools/taslak/install-template-draft.mjs --remove <id> [...]
//   node engine/tools/taslak/install-template-draft.mjs --reindex
// A draft is { template, unknown, inferred, conflicts, guideMerge } or a bare template (its source.review is kept).
// Written, in the same form as engine/tools/template-add.mjs:
//   Butun-Sablonlar/<region>/<universityName>/<id>.json   the template (the university folder must already exist)
//   engine/src/templates/generated/<id>.js                 module that only re-exports the JSON
//   engine/src/templates/generated/index.js                descriptors; registry.js appends them
// Nothing is written for a draft that changes under JSON storage or fails the engine's schema validation.
// The review keeps a gate result only when it was measured on an export of this engine (engine/tools/export.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const templatesRoot = path.join(repoRoot, "Butun-Sablonlar");
const defaultGeneratedDir = path.join(repoRoot, "engine", "src", "templates", "generated");
const generatedDir = defaultGeneratedDir;
const gateRoot = path.join(repoRoot, "engine", "output", "pass-gate");
const EXPORT_TOOL = "engine/tools/export.mjs";
const { validateThesisTemplate } = await import(pathToFileURL(path.join(repoRoot, "engine", "src", "validation.js")).href);

/** Preserve the previous valid file if a Windows reader briefly holds the destination. */
function writeChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, content);
    for (let attempt = 0; ; attempt += 1) {
      try { fs.renameSync(temporary, file); return; }
      catch (error) {
        if (attempt >= 5 || !["UNKNOWN", "EPERM", "EACCES", "EBUSY"].includes(error.code)) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
      }
    }
  } finally { if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true }); }
}

const DEGREE_LABEL = { master: "Yüksek Lisans", phd: "Doktora", undergraduate: "Lisans", specialization: "Uzmanlık", "sanatta-yeterlik": "Sanatta Yeterlik" };

/** Special pages with blocks are static in this engine; the user edits them through layout overrides, not as seeded HTML. */
export function toEngineTemplate(template) {
  const out = structuredClone(template);
  // Drafts measure Word documents (lineSpacing mode "word"); the old engine drew Word's baseline (extra leading below the text)
  // without a key for it. This engine needs it stated, as the official templates do; without it the leading is centred (CSS)
  // and every line sits half a leading lower than in Word.
  const spacing = out.typography?.lineSpacing;
  if (spacing?.mode === "word" && spacing.baseline === undefined) spacing.baseline = "word";
  for (const section of out.sections || []) {
    if (!Array.isArray(section.blocks)) continue;
    delete section.layoutMode;
    delete section.editable;
    section.mode = "static";
  }
  return out;
}

/**
 * Heading levels whose numbering no source states are written unnumbered, in the form the official templates use
 * ({ enabled: false, format, sequence }): the engine would otherwise number such a level by its own counter alone
 * ("1" under chapter 2), repeating numbers. Returned as inferred values so the review shows them.
 */
export function unnumberedLevels(template) {
  const inferred = [];
  const headings = template.typography?.headings || {};
  // Only a template that numbers some level repeats numbers; one that numbers none is left to the engine as the official ones are.
  if (!Object.values(headings).some((style) => style.numbering && style.numbering.enabled !== false)) return inferred;
  for (const [level, style] of Object.entries(headings)) {
    if (style.numbering) continue;
    style.numbering = { enabled: false, format: Array.from({ length: Number(level) }, (_, i) => `{${i + 1}}`).join("."), sequence: "arabic" };
    inferred.push({ field: `typography.headings.${level}.numbering`, value: "numarasız", reasoning: "Kaynak bu başlık düzeyi için numara biçimi belirtmiyor (Word'de numaralandırması olmayan başlık stili numarasızdır); motor yedeği yalnız düzeyin kendi sayacını yazıp numaraları tekrar ettireceği için numarasız kaydedildi." });
  }
  return inferred;
}

/** Gate result of this engine's real export, or null (a report from another export path is not evidence for this engine). */
function gateResult(id) {
  const dir = path.join(gateRoot, id);
  const meta = path.join(dir, "export-meta.json");
  const report = path.join(dir, "gate-report.json");
  if (!fs.existsSync(meta) || !fs.existsSync(report)) return null;
  if (JSON.parse(fs.readFileSync(meta, "utf8")).exportTool !== EXPORT_TOOL) return null;
  const gate = JSON.parse(fs.readFileSync(report, "utf8"));
  return { overall: gate.overall, results: gate.results, ...(gate.reason ? { reason: gate.reason } : {}), checkedAt: gate.checkedAt || fs.statSync(report).mtime.toISOString().slice(0, 10), exportTool: EXPORT_TOOL };
}

function review(draft, template) {
  const kept = template.source?.review || {};
  const has = (key) => Array.isArray(draft[key]);
  return {
    unknown: has("unknown") ? draft.unknown.map((u) => ({ field: u.field, reason: u.reason })) : kept.unknown || [],
    inferred: has("inferred") ? draft.inferred.map((i) => ({ field: i.field, value: typeof i.value === "object" ? JSON.stringify(i.value) : String(i.value), reasoning: i.reasoning })) : kept.inferred || [],
    conflicts: has("conflicts") ? draft.conflicts.map((c) => ({ field: c.field, measured: String(c.measured), guide: String(c.guide), guideSource: c.guideSource })) : kept.conflicts || [],
    guide: draft.guideMerge?.guide ?? kept.guide ?? null,
    gate: gateResult(template.id),
  };
}

function universityFolder(name) {
  const hits = fs.readdirSync(templatesRoot, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(templatesRoot, d.name, name)));
  if (hits.length !== 1) throw new Error(`${name}: Butun-Sablonlar altında ${hits.length ? "birden çok" : "hiç"} üniversite klasörü var`);
  return path.join(templatesRoot, hits[0].name, name);
}

const variable = (id) => `template_${id.replace(/[^a-zA-Z0-9]/g, "_")}`;
const moduleFile = (id, dir = generatedDir) => path.join(dir, `${id}.js`);

export function install(draft, { status } = {}) {
  const template = toEngineTemplate(draft.template ?? draft);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(template.id || "")) throw new Error(`geçersiz template.id: ${template.id}`);
  if (status) template.status = status;
  const reviewed = review(draft, template);
  const inferredFields = new Set(reviewed.inferred.map((item) => item.field));
  reviewed.inferred.push(...unnumberedLevels(template).filter((item) => !inferredFields.has(item.field)));
  template.source = { ...template.source, review: reviewed };
  if (!isDeepStrictEqual(JSON.parse(JSON.stringify(template)), template)) throw new Error(`${template.id}: JSON olarak saklanınca değişiyor; yazılmadı`);
  const errors = validateThesisTemplate(template);
  if (errors.length) throw new Error(`${template.id}: şema doğrulaması başarısız: ${errors.join("; ")}`);
  const jsonPath = path.join(universityFolder(template.universityName), `${template.id}.json`);
  writeChanged(jsonPath, `${JSON.stringify(template, null, 1)}\n`);
  fs.mkdirSync(generatedDir, { recursive: true });
  const importPath = path.relative(generatedDir, jsonPath).split(path.sep).join("/");
  writeChanged(moduleFile(template.id), [
    "// Generated by engine/tools/taslak/install-template-draft.mjs: a draft measured from an official source (status generic until reviewed).",
    "// Edit the JSON, not this file. Absent keys are filled by the engine (engineDefaults.js), never by another template.",
    `import ${variable(template.id)}Data from "${importPath}" with { type: "json" };`,
    `export default ${variable(template.id)}Data;`,
    "",
  ].join("\n"));
  return { template, jsonPath };
}

export function remove(id, dir = generatedDir) {
  const file = moduleFile(id, dir);
  if (!fs.existsSync(file)) return false;
  const importPath = fs.readFileSync(file, "utf8").match(/from "([^"]+\.json)"/)?.[1];
  if (importPath) fs.rmSync(path.resolve(dir, importPath), { force: true });
  fs.rmSync(file);
  return true;
}

/** Rebuild index.js from every generated module (descriptors carry the identity the registry checks against the data). */
export function reindex(generatedDir = defaultGeneratedDir) {
  fs.mkdirSync(generatedDir, { recursive: true });
  const entries = [];
  for (const name of fs.readdirSync(generatedDir).filter((n) => n.endsWith(".js") && n !== "index.js").sort()) {
    const importPath = fs.readFileSync(path.join(generatedDir, name), "utf8").match(/from "([^"]+\.json)"/)?.[1];
    const t = JSON.parse(fs.readFileSync(path.resolve(generatedDir, importPath), "utf8"));
    const isRegionalRebuild = t.source?.archivePath?.startsWith("Butun-Sablonlar/Ege/");
    const languageLabel = isRegionalRebuild ? t.language === "en" ? "English" : t.language === "tr" ? "Türkçe" : t.language : null;
    const kindLabel = t.source?.rebuildKind === "guide-rules" ? "Yazım kuralları" : null;
    const displayName = `${[t.universityName, t.instituteName, DEGREE_LABEL[t.degreeType] ?? t.degreeType, languageLabel, kindLabel].filter(Boolean).join(" · ")}${t.status === "official" ? "" : " (taslak)"}`;
    const descriptor = { id: t.id, templateVersion: t.templateVersion, universityId: t.universityId, universityName: t.universityName, instituteId: t.instituteId, instituteName: t.instituteName, degreeType: t.degreeType, language: t.language, status: t.status, displayName, selectors: {} };
    entries.push(`  { ${Object.entries(descriptor).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ")}, load: () => import("./${name}").then((module) => ({ default: module.default })) },`);
  }
  writeChanged(path.join(generatedDir, "index.js"), [
    "// Generated by engine/tools/taslak/install-template-draft.mjs; do not edit by hand.",
    "/** Descriptors of templates generated from measured official sources; registry.js appends them to the hand-written registry. */",
    "export const GENERATED_THESIS_TEMPLATES = Object.freeze([",
    ...entries,
    "]);",
    "",
  ].join("\n"));
  return entries.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const statusIndex = args.indexOf("--status");
  const status = statusIndex >= 0 ? args[statusIndex + 1] : undefined;
  const files = args.filter((arg, index) => !arg.startsWith("--") && (statusIndex < 0 || index !== statusIndex + 1));
  if (args.includes("--remove")) {
    for (const id of files) console.log(`${id}: ${remove(id) ? "kaldırıldı" : "kurulu değil"}`);
  } else if (!args.includes("--reindex")) {
    if (!files.length) { console.error("kullanım: install-template-draft.mjs <draft.json> [...] [--status official|generic] | --remove <id> [...] | --reindex"); process.exit(2); }
    let failed = 0;
    for (const file of files) {
      try {
        const { template, jsonPath } = install(JSON.parse(fs.readFileSync(file, "utf8")), { status });
        console.log(`${template.id} → ${path.relative(repoRoot, jsonPath)}${template.source.review.gate ? ` (kapı: ${template.source.review.gate.overall})` : ""}`);
      } catch (error) { failed += 1; console.error(`✗ ${path.basename(file)}: ${error.message}`); }
    }
    if (failed) process.exitCode = 1;
  }
  console.log(`${reindex()} üretilmiş şablon → engine/src/templates/generated/index.js`);
}
