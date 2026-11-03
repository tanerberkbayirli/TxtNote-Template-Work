#!/usr/bin/env node
// Run a template draft (JSON from docx-spec-to-template.py) through the engine's own validator, in the form
// install-template-draft.mjs would install it.
//   node engine/tools/taslak/validate-template-draft.mjs engine/output/template-drafts/<id>.draft.json [...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { validateThesisTemplate } = await import(pathToFileURL(path.join(here, "..", "..", "src", "validation.js")).href);
const { toEngineTemplate, unnumberedLevels } = await import(pathToFileURL(path.join(here, "install-template-draft.mjs")).href);

let failed = 0;
for (const file of process.argv.slice(2)) {
  const draft = JSON.parse(fs.readFileSync(file, "utf8"));
  const template = toEngineTemplate(draft.template ?? draft);
  unnumberedLevels(template);
  const errors = validateThesisTemplate(template);
  const unknown = draft.unknown?.length ?? 0;
  console.log(`${errors.length ? "FAIL" : "PASS"} ${path.basename(file)} — şema hatası ${errors.length}, bilinmeyen ${unknown}, çıkarım ${draft.inferred?.length ?? 0}`);
  for (const error of errors) console.log(`   ✗ ${error}`);
  if (errors.length) failed += 1;
}
process.exit(failed ? 1 : 0);
