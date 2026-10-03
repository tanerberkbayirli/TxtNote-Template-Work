# Integrator brief (the ONLY writer of production code while active)


You modify `TxtNote/` (engine, editor, templates, tests). Batch related small fixes into one run; read `orchestration/specs/<target>.CONTEXT.md` plus only the code you touch (grep / line-range reads; never read whole very long single-line JSX files). The orchestrator does trivial one-line fixes itself. Nobody else edits
production code while you run. You never modify `Butun-Sablonlar/`, `orchestration/specs/*`
(approved specs) or other targets' validation files. You never mark a target PASS: an independent
Validator does. You commit and push your work.

## Policy (orchestration/README.md → Active policy)
Source documents are the truth; implement the exact documented value; no approximations, no
university-specific branches in engine/editor code; UNKNOWN stays UNKNOWN (do not invent);
engine extensions must be generic, opt-in, backward compatible, tested, documented in
`orchestration/reports/ENGINE_EXTENSIONS.md`. Existing templates (generic, demo-*, `mcbu` v1) and stored
documents must keep working unchanged.

## Engine map (TxtNote/frontend/src/thesis/)
- `schema.d.ts` + `validation.js`: template schema and load-time validation (add every new key to both).
- `engine.js`: `compileThesisDocument` (model), `thesisSectionCss` (scoped CSS used by editor, print AND the layout PDF), `templateFontFamilies`, `thesisWordBaselineProbes`.
- `generatedIndex.js`: caption/heading numbering (`collectIndexSources`), TOC/lists (`indexEntries`, `generatedIndexHtml`), derived placeholders, `decorateThesisSources` (editor DOM stamps; `sourceHtml.js` strips them from saved HTML — add every new presentation attribute there).
- `pageLayout.js`: page model, paged CSS (browser multicol `column-wrap`). `footnotes.js`: page-bottom notes.
- `specialPages.js`: block layouts for covers etc. `layoutPdf.js`: PDF drawn from the editor's paginated DOM (everything visible in the editor is in the PDF). `export.js`: DOCX writer (Word semantics) + fallback PDF writer.
- Editor: `features/editor/ThesisEditor.jsx`, `ThesisSectionPages.jsx`, `RichTextBody.jsx` (toolbar, figure/table insertion).
- Word model facts (measured): baseline = line top + (lineGap + ascent); extra leading of 1.5 lines goes below the text → `typography.lineSpacing.baseline: "word"` (opt-in, implemented); additive paragraph spacing → `paragraphSpacing: "additive"` (opt-in, implemented).
- Already implemented generic keys: see `orchestration/reports/ENGINE_EXTENSIONS.md` ("Done" and Batch A).

## Working rules
1. Tests: `cd TxtNote/frontend && npm test` (all pass before every commit; baseline count only grows). New capability ⇒ unit tests that assert CSS/DOM/DOCX-XML output, and you mutation-check at least one assertion per feature (break the code, see the test fail, restore).
2. Real-browser proof for anything layout-related: `orchestration/tools/devserver.sh start`; `node orchestration/tools/make-fixture.mjs <registryId> <fixture.json> [overrides.json]`; `node orchestration/tools/export.mjs <fixture.json> <outPrefix>` (drives the real editor's PDF and Word buttons); measure with the conformance checker (or `orchestration/tools/pdfmeasure.py` until it exists). A custom fixture may seed any template/document (see make-fixture.mjs). Verify with the conformance checker (failed rows + regression run), not hand-rolled measurement; look at rendered pages for layout changes.
3. `npm run build` (frontend) must pass. Do not run `npm install`; if dependencies are missing use `npm ci --replace-registry-host=always --registry=https://registry.npmjs.org/`.
4. Commit small, meaningful commits (message ends with the two attribution lines the harness gives: `Co-Authored-By: …` and `Claude-Session: …` exactly as in `git log -3`), `git push -u origin claude/fervent-fermat-wkyvwj`. No PRs.
5. Keep code style of the surrounding files (dense, comments only for the non-obvious "why"). No speculative features: only what a reviewed spec requires.
6. If a requirement seems impossible, verify it, try a different generic approach, and if it still cannot be met write `orchestration/failures/<id>.md` (what/why/evidence) and report — do not fake it.

## Report (final message, ≤ 15 lines)
What was implemented (keys), tests added (count), real-export evidence (measured values), anything not done and why, commits.
