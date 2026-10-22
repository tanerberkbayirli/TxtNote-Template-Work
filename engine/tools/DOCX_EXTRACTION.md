# Official-source generation pipeline (Phase 4)

Run from the repository root, with the frontend preview running for the checker:

```sh
node orchestration/tools/cache-official-source.mjs official.docx orchestration/artifacts/target/source/reference
python orchestration/tools/docx2spec.py --docx official.docx --target target --word-manifest orchestration/artifacts/target/source/reference/render-manifest.json --out orchestration/specs/target.extracted.json
node orchestration/tools/spec2template.mjs orchestration/specs/target.extracted.json orchestration/specs/target.generation.json draft
node orchestration/tools/check.mjs --target target --word --out validation-directory
```

Use an official template/example, never an app export as a source. Legacy `.doc`
fails explicitly. Convert once with LibreOffice into the source cache; where it is
unavailable on Windows, `convert-official-doc.mjs original.doc cached.docx` uses
an owned Microsoft Word process. Original SHA256 is checked before/after; cached
conversion has its own hash and manifest. Word helpers hide their windows, identify
only their own process and use a 120-second watchdog. Run Word operations sequentially.

The extractor preserves source/part SHA256, one-based XML locators, paragraphs,
section geometry, pgNumType/titlePg/header/footer references, styles/docDefaults,
numbering/settings, table grids/rows/cells, and PAGE field parts. Its optional
verified Word manifest adds pages, baselines and per-word glyph bounds in mm,
with sizes in pt. A missing/mismatched hash fails closed. XML-only extraction
remains supported; it is not fixed-page geometry evidence.

The generation profile selects reviewed source roles (paragraph/style/table/page
indices) and identity/section structure; numeric requirements come from the source.
Effective styles merge docDefaults, basedOn and direct formatting. Fixed pages
become editable positioned text with opt-in Word baseline paint correction.
Output: template JS, Tier 1 checks, fixture, mapping inventory and draft context.
Generation alone never means PASS: register the reviewed template, review guide
conflicts, then run real PDF/DOCX/Word checks.

Unrecognized property groups retain XML locators in the mapping inventory.
Unused styles are not automatically university requirements; theme semantics,
conditional table styles and additional variants require review. Long replacement
titles/jury names on fixed pages are Tier 2 UNKNOWN until separately checked.
Inspect selected source roles rather than loading the entire tree into a prompt.

ADU Sagbil is the first measured pilot. `template-families.mjs output.json a.json
b.json c.json` inventories at least three official sources. Structural fingerprints
are candidates; `source-template-presets.mjs` shares existing engine font metrics
and Word flow semantics only. Never share university numeric requirements.

Validation: Python test_docx2spec.py/test_conformance.py; Node test_spec2template.mjs;
frontend tests/build; full actual Word regression after shared-engine changes.
See the Phase 4 closure report for selected evidence and measured cost.
