import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { withEngineDefaults } from "../src/engineDefaults.js";
import { addTemplate, classify, loadStoredTemplates, moduleSource } from "./template-add.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../specs/${name}`, import.meta.url), "utf8"));
const extracted = read("adu-sagbil.extracted.json");
const profile = read("adu-sagbil.generation.json");
const stored = loadStoredTemplates();

test("the engine is the shared part: no stored template extends another template or a shared base", () => {
  const directory = new URL("../src/templates/data/", import.meta.url);
  const files = readdirSync(directory).filter((name) => name.endsWith(".json"));
  assert.ok(files.length >= 34);
  for (const name of files) assert.equal(JSON.parse(readFileSync(new URL(name, directory), "utf8")).extends, undefined, `${name} must be flat data`);
  assert.equal(existsSync(new URL("../src/templates/base/thesis-base.json", import.meta.url)), false, "no voted base of other universities' values");
  assert.equal(existsSync(new URL("../src/templates/compose.js", import.meta.url)), false);
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
  const source = moduleSource("some-uni-lee-master-tr-v1");
  assert.match(source, /import template_some_uni_lee_master_tr_v1Data from "\.\/data\/some-uni-lee-master-tr-v1\.json"/);
  assert.match(source, /export default template_some_uni_lee_master_tr_v1;/);
  assert.doesNotMatch(source, /compose|extends|variants/);
});
