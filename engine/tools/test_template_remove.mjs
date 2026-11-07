// template-remove.mjs on a throw-away copy of the repository layout: dry run changes nothing; a registered single-variant template
// loses its registry line, JSON and module; one variant of a shared module is cut out of it; a generated draft is removed and the
// generated index is rebuilt.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const tool = path.join(path.dirname(fileURLToPath(import.meta.url)), "template-remove.mjs");
const run = (root, ...args) => execFileSync("node", [tool, ...args, "--root", root], { encoding: "utf8" });
const write = (root, rel, text) => { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const read = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (root, rel) => fs.existsSync(path.join(root, rel));

const descriptor = (id, load) => `  { id: "${id}", templateVersion: "1.0.0", universityId: "u", universityName: "Uni", instituteId: "i", instituteName: "Inst", degreeType: "master", language: "tr", status: "official", displayName: "x", selectors: {}, load: () => import("./templates/${load[0]}").then((module) => ({ default: module.${load[1]} })) },`;

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "template-remove-"));
  const json = (id) => JSON.stringify({ id, templateVersion: "0.1.0", universityId: "u", universityName: "Uni", instituteId: "i", instituteName: "Inst", degreeType: "master", language: "tr", status: "generic" });
  write(root, "Butun-Sablonlar/R/Uni/single-v1.json", json("single-v1"));
  write(root, "Butun-Sablonlar/R/Uni/pair-master-v1.json", json("pair-master-v1"));
  write(root, "Butun-Sablonlar/R/Uni/pair-phd-v1.json", json("pair-phd-v1"));
  write(root, "Butun-Sablonlar/R/Uni/draft-v1.json", json("draft-v1"));
  write(root, "engine/src/templates/single.js", 'import singleData from "../../../Butun-Sablonlar/R/Uni/single-v1.json" with { type: "json" };\nconst single = singleData;\nexport { single };\nexport default single;\n');
  write(root, "engine/src/templates/pair.js", 'import pairMasterData from "../../../Butun-Sablonlar/R/Uni/pair-master-v1.json" with { type: "json" };\nimport pairPhdData from "../../../Butun-Sablonlar/R/Uni/pair-phd-v1.json" with { type: "json" };\nconst pairPhd = pairPhdData;\nconst pairMaster = pairMasterData;\nexport { pairMaster, pairPhd };\nexport default pairMaster;\n');
  write(root, "engine/src/registry.js", ["export const THESIS_TEMPLATE_REGISTRY = Object.freeze([", descriptor("single-v1", ["single.js", "single"]), descriptor("pair-master-v1", ["pair.js", "pairMaster"]), descriptor("pair-phd-v1", ["pair.js", "pairPhd"]), "]);", ""].join("\n"));
  write(root, "engine/src/templates/generated/draft-v1.js", 'import template_draft_v1Data from "../../../../Butun-Sablonlar/R/Uni/draft-v1.json" with { type: "json" };\nexport default template_draft_v1Data;\n');
  write(root, "engine/src/templates/generated/index.js", "stale\n");
  write(root, "engine/src/something.test.js", 'assert("single-v1");\n');
  return root;
}

test("dry run changes nothing and lists the leftovers", () => {
  const root = fixture();
  const before = read(root, "engine/src/registry.js");
  const out = run(root, "single-v1");
  assert.match(out, /sil: kayıt satırı engine\/src\/registry\.js:2/);
  assert.match(out, /sil: Butun-Sablonlar\/R\/Uni\/single-v1\.json/);
  assert.match(out, /engine\/src\/something\.test\.js/);
  assert.equal(read(root, "engine/src/registry.js"), before);
  assert.ok(exists(root, "engine/src/templates/single.js"));
});

test("a registered template used by one registry line loses line, JSON and module", () => {
  const root = fixture();
  run(root, "single-v1", "--write");
  assert.ok(!read(root, "engine/src/registry.js").includes("single-v1"));
  assert.ok(!exists(root, "engine/src/templates/single.js"));
  assert.ok(!exists(root, "Butun-Sablonlar/R/Uni/single-v1.json"));
  assert.ok(exists(root, "Butun-Sablonlar/R/Uni/pair-master-v1.json"));
});

test("one variant of a shared module is cut out; the other keeps working", () => {
  const root = fixture();
  run(root, "pair-master-v1", "--write");
  const module = read(root, "engine/src/templates/pair.js");
  assert.ok(!module.includes("pairMaster") && !module.includes("pair-master-v1"));
  assert.match(module, /export \{ pairPhd \};/);
  assert.match(module, /export default pairPhd;/);
  assert.ok(!exists(root, "Butun-Sablonlar/R/Uni/pair-master-v1.json"));
  assert.ok(exists(root, "Butun-Sablonlar/R/Uni/pair-phd-v1.json"));
  assert.ok(read(root, "engine/src/registry.js").includes("pair-phd-v1"));
});

test("a generated draft is removed and the generated index is rebuilt", () => {
  const root = fixture();
  run(root, "draft-v1", "--write");
  assert.ok(!exists(root, "engine/src/templates/generated/draft-v1.js"));
  assert.ok(!exists(root, "Butun-Sablonlar/R/Uni/draft-v1.json"));
  assert.match(read(root, "engine/src/templates/generated/index.js"), /GENERATED_THESIS_TEMPLATES = Object\.freeze\(\[\s*\]\);/);
});

test("an unknown id fails", () => {
  const root = fixture();
  assert.throws(() => run(root, "nope-v1"), /Command failed/);
});
