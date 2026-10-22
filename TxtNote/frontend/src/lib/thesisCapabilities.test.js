import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const thesisDir = fileURLToPath(new URL("../../../../engine/src/", import.meta.url));
const catalogPath = new URL("../../../../engine/docs/CAPABILITIES.md", import.meta.url);

/** Enum values, JS members and internals that appear in validation.js but are not template keys. */
const NOT_KEYS = new Set((
  "above additive below center chapter collapse css dots editable error flex generated generic demo disabled document " +
  "imported inline js justify landscape left load manual none official omit optional ownLine pitch portrait required " +
  "right same spacing static string top bottom warning word boolean includes some every trim in count equals notEquals " +
  "gte true false continueH1"
).split(" "));

/** Template keys accepted by validation.js, extracted mechanically from its source. */
export function acceptedTemplateKeys(source) {
  const keys = new Set();
  for (const m of source.matchAll(/\$\{[\w.]+\}\.([A-Za-z_]\w*)/g)) keys.add(m[1]);
  const owners = "rule|template|style|section|block|footnotes|numbering|entry|border|index|page|caption|eq|frame|word|tables|figures|equations|bibliography|toc|heading|lineSpacing|typography|overrides|source|override";
  for (const m of source.matchAll(new RegExp(`\b(?:${owners})\??\.([A-Za-z_]\w*)`, "g"))) keys.add(m[1]);
  for (const m of source.matchAll(/\[((?:\s*"[A-Za-z]\w*",?)+)\s*\]/g)) for (const k of m[1].matchAll(/"(\w+)"/g)) keys.add(k[1]);
  return [...keys].filter((key) => !NOT_KEYS.has(key)).sort();
}

/** Every identifier segment inside a backticked span of the catalog (dot paths count by each segment). */
export function catalogedNames(markdown) {
  const names = new Set();
  for (const span of markdown.matchAll(/`([^`]+)`/g)) for (const token of span[1].matchAll(/[A-Za-z_]\w*/g)) names.add(token[0]);
  return names;
}

describe("CAPABILITIES.md", () => {
  it("mentions every template key validation.js accepts", () => {
    const keys = acceptedTemplateKeys(fs.readFileSync(`${thesisDir}validation.js`, "utf8"));
    assert.ok(keys.length > 100, `extractor found only ${keys.length} keys`);
    const names = catalogedNames(fs.readFileSync(catalogPath, "utf8"));
    const missing = keys.filter((key) => !names.has(key));
    assert.deepEqual(missing, [], `Add these validation.js keys to thesis/CAPABILITIES.md: ${missing.join(", ")}`);
  });
});
