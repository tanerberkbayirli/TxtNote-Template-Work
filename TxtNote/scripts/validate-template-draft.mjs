#!/usr/bin/env node
// Run a template draft (JSON from docx-spec-to-template.py) through the engine's own validator.
//   node scripts/validate-template-draft.mjs output/template-drafts/<id>.draft.json [...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { validateThesisTemplate } = await import(path.join(here, "..", "frontend", "src", "thesis", "validation.js"));

let failed = 0;
for (const file of process.argv.slice(2)) {
  const draft = JSON.parse(fs.readFileSync(file, "utf8"));
  const template = draft.template ?? draft;
  const errors = validateThesisTemplate(template);
  const unknown = draft.unknown?.length ?? 0;
  console.log(`${errors.length ? "FAIL" : "PASS"} ${path.basename(file)} — şema hatası ${errors.length}, bilinmeyen ${unknown}, çıkarım ${draft.inferred?.length ?? 0}`);
  for (const error of errors) console.log(`   ✗ ${error}`);
  if (errors.length) failed += 1;
}
process.exit(failed ? 1 : 0);
