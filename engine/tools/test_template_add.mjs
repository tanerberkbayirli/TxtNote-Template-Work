import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { withEngineDefaults } from "../src/engineDefaults.js";
import { addTemplate, classify, loadStoredTemplates, moduleSource, templateJsonPath } from "./template-add.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../specs/${name}`, import.meta.url), "utf8"));
const extracted = read("adu-sagbil.extracted.json");
const profile = read("adu-sagbil.generation.json");
const stored = loadStoredTemplates();

test("the engine is the shared part: no stored template extends another template or a shared base", () => {
  assert.ok(stored.size >= 34);
  for (const [id, template] of stored) assert.equal(template.extends, undefined, `${id} must be flat data`);
  assert.equal(existsSync(new URL("../src/templates/base/thesis-base.json", import.meta.url)), false, "no voted base of other universities' values");
  assert.equal(existsSync(new URL("../src/templates/compose.js", import.meta.url)), false);
});

test("all templates live in Butun-Sablonlar and nowhere else", () => {
  for (const [id, template] of stored) assert.ok(existsSync(templateJsonPath(template)), `${id} is at ${templateJsonPath(template)}`);
  assert.ok(existsSync(new URL("../../Butun-Sablonlar/Genel/generic.json", import.meta.url)), "the fallback template");
  const engineJson = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? engineJson(new URL(`${entry.name}/`, directory)) : entry.name.endsWith(".json") ? [entry.name] : []));
  assert.deepEqual(engineJson(new URL("../src/templates/", import.meta.url)), [], "no template data under engine/src/templates");
  assert.equal(existsSync(new URL("../src/templates/data", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/templates/legacy-js", import.meta.url)), false);
});

test("regenerating a stored template from its source gives the stored template", () => {
  const result = addTemplate({ extracted, profile, replace: true, stored });
  assert.ok(isDeepStrictEqual(result.template, stored.get(profile.identity.id)));
});

test("an existing template id is not overwritten without --replace", () => {
  assert.throws(() => addTemplate({ extracted, profile, stored }), /zaten var/);
});

test("every stored value gets exactly one provenance class and nothing is borrowed", () => {
  const { provenance, template, mapping, summary } = addTemplate({ extracted, profile, replace: true, stored });
  assert.deepEqual(Object.keys(provenance.classes).sort(), ["ENGINE_DEFAULT", "GENERATED", "GEOMETRY", "MEASURED"]);
  const all = ["MEASURED", "GEOMETRY", "GENERATED"].flatMap((name) => provenance.classes[name]);
  assert.equal(new Set(all).size, all.length, "no value in two classes");
  assert.equal(summary.total, all.length);
  assert.ok(summary.MEASURED > 0 && summary.GEOMETRY > 0);
  assert.equal(provenance.unknownPropertyGroups, mapping.engineGaps.length);
  assert.ok(provenance.classes.MEASURED.includes("page.margins.topMm"));
  assert.ok(provenance.classes.MEASURED.includes("typography.body.lineSpacing.rule"), "an object-valued fact covers its leaves");
  assert.ok(provenance.classes.MEASURED.includes("page.numbering.align"), "source-backed values are registered as facts");
  assert.ok(provenance.classes.GEOMETRY.every((path) => /blocks\./.test(path)));
  assert.ok(template.id);
});

test("keys the template leaves absent are reported as engine defaults and are really filled by the engine", () => {
  const template = structuredClone(stored.get(profile.identity.id));
  delete template.bibliography;
  delete template.tables;
  const result = classify(template, []);
  assert.ok(result.classes.ENGINE_DEFAULT.includes("bibliography.heading"));
  assert.ok(result.classes.ENGINE_DEFAULT.includes("tables.label"));
  const filled = withEngineDefaults(template);
  assert.equal(filled.bibliography.heading, "Kaynakça");
  assert.equal(filled.tables.label, "Tablo");
  assert.ok(!result.classes.MEASURED.includes("bibliography.heading"), "an engine default is never counted as source evidence");
});

test("a fact with another value never claims a template value", () => {
  const result = classify({ page: { size: "A4" } }, [{ key: "page.size", value: "A5" }]);
  assert.deepEqual(result.classes.GENERATED, ["page.size"]);
  assert.deepEqual(result.classes.MEASURED, []);
  assert.deepEqual(result.unresolvedFacts, ["page.size"]);
});

test("module wrapper re-exports the one data file", () => {
  const source = moduleSource("some-uni-lee-master-tr-v1", "../../../Butun-Sablonlar/Ege/Some Üniversitesi/some-uni-lee-master-tr-v1.json");
  assert.match(source, /import template_some_uni_lee_master_tr_v1Data from "\.\.\/\.\.\/\.\.\/Butun-Sablonlar\/Ege\/Some Üniversitesi\/some-uni-lee-master-tr-v1\.json"/);
  assert.match(source, /export default template_some_uni_lee_master_tr_v1;/);
  assert.doesNotMatch(source, /compose|extends|variants/);
});
