# MOTOR.md — TxtEngine improvement plan

Self-contained work plan for a fresh session. Read this file, `AGENTS.md` §24A (token-efficient workflow) and §28A (two-tier Done). Do **not** read the whole of `AGENTS.md`, the orchestration history or the engine sources up front; open files only for the step you are on.

Repository: `C:\Users\CASPER\Desktop\TxtNote-Template-Work` (Windows; Git Bash + PowerShell; Node; Python with PyMuPDF and python-docx; Microsoft Word COM available). Branch `integrate/aku-mcbu`. Frontend: `TxtNote/frontend` (`npm test`, `npm run build`). Dev server: `http://localhost:5173` (the page `/tests/thesis.html` mounts the thesis editor without login).

---

## 0. Why this plan exists

One session spent ~2.7M subagent tokens and produced no PASS target. Measured:

- LLM "independent validation" cost 160–260k tokens and 7–27 min per run; fixes 80–165k; a one-line UI fix by a cheap model 55–85k (cold-start reading).
- 10 of the 14 fixes needed were **engine** gaps or bugs, each found only by an expensive validate → fail → read engine code → fix → revalidate loop. Examples: Word-style paragraph spacing collapse, chapter-start page numbers, note exit gap, footnote reserve, DOCX table row height, header-rule table borders, `numbering.startAt: 0`, two DOCX field bugs that made Word refuse files or scramble page order.
- Agents read large engine files to discover what the engine can do: `thesis/export.js` 74 KB, `thesis/engine.js` 57 KB, `features/editor/ThesisEditor.jsx` 45 KB, `lib/richText.js` 42 KB, `features/editor/RichTextBody.jsx` 39 KB, `thesis/generatedIndex.js` 35 KB, `features/editor/ThesisRibbon.jsx` 35 KB (very long single-line JSX).

The deterministic checker (`orchestration/tools/check.mjs`, see `orchestration/tools/CHECKER.md`) now does measurement in 19–48 s with almost no tokens. This plan makes the **engine** match Word semantics, documents its capabilities, and lets the engine report its own layout, so new templates become mostly data.

Goal: per-target cost from ~1M tokens to ≤250k; a new university's first draft at ~10% of today's cost.

---

## 1. Working rules for this plan (binding)

1. **Orchestrator + workers.** The main session orchestrates. Max **2 concurrent subagents**. Sonnet for engine design, Word-semantics reasoning and source conflicts; Haiku for mechanical edits, catalog extraction and running commands. The orchestrator makes one-line fixes itself.
2. **Batch.** Give one worker a coherent group of related changes, not one worker per bug.
3. **Context in, not discovery.** Every worker prompt names the exact files and line ranges/functions to open and lists what **not** to read. Workers use `grep` and line-range reads; never whole large files.
4. **Reports ≤15 lines**: what changed, files, tests, measured values. No narrative.
5. **Verification = checker.** After a change: `npm test` once, `npm run build` once, then `node orchestration/tools/check.mjs --target <id>` for affected targets (`--only failed` after a fix). Do not re-measure untouched PASS items by hand. Do not write ad-hoc measurement scripts; extend `orchestration/tools/conformance.py`.
6. **Word COM** only for Word-dependent checks (`--word`): own instance, record PID, 120 s timeout, Quit in `finally`; on timeout the checker marks SKIPPED.
7. **Engine rules (AGENTS.md §7–8):** generic, opt-in where behaviour changes, backward compatible, deterministic, unit-tested, documented in `TxtNote/frontend/src/thesis/schema.d.ts`, `TxtNote/frontend/src/thesis/README.md` and the capability catalog (Phase 1). No university-specific branches. University values come only from that university's sources.
8. **Regression.** Any shared-engine change: run the checker on **every** target that has a `orchestration/specs/<id>.checks.json`, plus `npm test`. A previous PASS that breaks is reopened.
9. **Checkpoint** after each step: commit (message ends with the attribution line required by the session), update the target's `orchestration/specs/<id>.CONTEXT.md` status line, and append one line to §7 of this file. Never commit generated exports (`orchestration/validation/*/run/`, renders).
10. **Session hygiene.** One phase (or one engine theme) per session. At the end write the next step into §7 and stop; the next session starts from this file.

---

## 2. Phase 0 — close open items and make the checker the regression gate

Do these first; they are small and unblock everything else.

### 0.1 Regression: AKÜ Matematik symbols table
- Checker (`node orchestration/tools/check.mjs --target aku-matematik-lisans`) reports FAIL: `symbols.table.x0` exp 31.97 mm act 30.00; `symbols.table.rules` exp 3 act 0; `symbols.table.group-gap` exp 9.9 act 4.87; `symbols.def` exp 70.7 act null.
- The integrator had measured these as fixed after commit 7981c44 (`tables.borders: "headerRules"` preset, cell margin 1.9 mm; report `orchestration/validation/aku-matematik-lisans/selfcheck-fix-3.md`).
- Determine whether (a) a later commit regressed it (suspects: a8fa87b UI/format changes touching `thesis/engine.js`, `lib/richText.js` sanitizing; bisect with `git bisect run` using the checker `--only symbols.table.x0`), or (b) the checker fixture `orchestration/specs/aku-matematik-lisans.fixture.json` doesn't contain the symbols table markup the template expects. Fix the right side.
- Read: `orchestration/specs/aku-matematik-lisans.CONTEXT.md`, the fixture, `templates/aku-matematik.js` symbols section. Do not read: the template DOCX, render folders.

### 0.2 Engine: template-defined table cell padding (user decision)
- Today the editor applies a default 6 pt top/bottom cell padding; DOCX writes it as `tcMar`. AKÜ Coğrafya's official tables have no padding (row pitch ≈ 4.65 mm at 11 pt single); we produce ≈ 8.7–9.0 mm (checker FAILs `table-row-pitch-pdf`, `table-row-pitch-word`, and the dependent page-count/label checks).
- Add opt-in `tables.cellPadding: { topMm, bottomMm, leftMm, rightMm }` (and per-section override via `overrides.tables`). Default = current behaviour (no change to other templates). Implement in editor CSS (`thesis/engine.js` table CSS), layout PDF (reads DOM, should follow), DOCX (`thesis/export.js` `tableDocx`: `w:tblCellMar` / `w:tcMar`, and `trHeight` = line box only — keep the fix from 7981c44).
- Set AKÜ Coğrafya to the value measured from its official template XML (`tblCellMar`/`tcMar` in the official DOCX — verify; do not assume 0).
- Accept: Coğrafya `table-row-pitch-pdf` and `-word` within 0.5 mm of 4.65–4.7 mm; Word vs PDF page count equal.

### 0.3 Spec check: AKÜ Sosyoloji margins
- `orchestration/specs/aku-sosyoloji-lisans.json` records 45 mm top/bottom/left (quote "üst: 4.5 cm"). Verify against the official guide/template DOCX `w:pgMar` (read only `sectPr`). Record evidence; correct the spec and template if wrong. Do not change other values.

### 0.4 Checker as the regression gate
- Write `checks.json` + `fixture.json` for the remaining targets that already have templates, starting with those that have validation reports: `aku-felsefe-lisans`, `aku-felsefe-seminer`, `mcbu-tip-uzmanlik`, `afsu-tip`, `afsu-eczacilik-proje`, `afsu-lee`, `aku-sbe`, `aku-isg-tezsiz-proje`. Port expected values and locators from each target's newest report/spec only (Haiku, batched 3–4 targets per worker; Sonnet reviews the ported values against the spec once).
- Build each target's cached reference once (`--build-reference`); never re-render later.
- Add `node orchestration/tools/check.mjs --all` (runs every target with a checks.json; prints a one-line summary per target; exit 1 on any Tier 1 FAIL).

### 0.5 Close AKÜ Coğrafya and AKÜ Matematik
- After 0.1–0.2: run the checker with `--word`. Done per AGENTS.md §28A when all Tier 1 checks PASS and Tier 2 items are documented. Update `orchestration/progress.json` (`status`, `validation`, `lastError`) and the context packs.

**Phase 0 exit:** both targets PASS (Tier 1), `--all` runs clean or with only known, listed FAILs, all committed.

---

## 3. Phase 1 — engine capability catalog and smaller files

Purpose: workers learn what the engine can do from a short catalog, not from source code.

### 1.1 `TxtNote/frontend/src/thesis/CAPABILITIES.md`
- One table per area: page/sections, numbering, typography and paragraph spacing, headings, special pages (blocks), generated indexes, captions/tables/figures/equations, footnotes, bibliography, DOCX-specific behaviour, PDF/font embedding.
- Each row: **need** (as a source would phrase it, e.g. "no page number on chapter first pages") → **template key** (e.g. `page.numbering.omitOnChapterStart`) → values/units → default → editor/PDF/DOCX support (✓/✗/limit) → test file. Max ~250 lines.
- Source of truth: `schema.d.ts`, `thesis/README.md`, `orchestration/reports/ENGINE_EXTENSIONS.md`, `validation.js` (keys accepted). Generate the key list mechanically (script over `schema.d.ts` / `validation.js`), then fill the "need" column. Haiku for extraction, Sonnet for the "need" wording and gaps.
- Add a "Known gaps" section (things a source might require that the engine cannot do yet), each with the phase that will add it.
- Add to `AGENTS.md` §21: workers consult `CAPABILITIES.md` before opening engine code.
- Add a unit test that fails when `validation.js` accepts a key that `CAPABILITIES.md` doesn't mention (keeps the catalog current).

### 1.2 Split the largest files (behaviour-preserving)
- `features/editor/ThesisRibbon.jsx`: one component per ribbon tab/group (`ribbon/HomeTab.jsx`, `ribbon/InsertTab.jsx`, …, `ribbon/FontSizeBox.jsx`, `ribbon/ColorSplitButton.jsx`), formatted with normal line lengths.
- `thesis/export.js`: split by concern (`docx/sections.js`, `docx/paragraphs.js`, `docx/tables.js`, `docx/fields.js` (TOC/TC/PAGEREF), `docx/specialPages.js`, `pdfFallback.js`).
- `thesis/engine.js`: separate CSS generation (`engineCss.js`) from model compilation.
- Pure moves only: no logic change in the same commit; `npm test`, `npm run build`, `check.mjs --all` must be identical before/after.

**Phase 1 exit:** catalog committed and enforced by a test; split files committed with an identical checker run.

---

## 4. Phase 2 — Word-semantics parity (editor = PDF = DOCX)

Most expensive bugs were "editor/PDF says X, Word renders Y". Make the engine's layout model use Word's definitions, so a value extracted from an official DOCX means the same thing in all three outputs.

For each item: implement generically (opt-in when it changes existing output), unit-test the model, add/extend checker kinds, run `--all`.

| # | Word concept | Engine work | Acceptance |
|---|---|---|---|
| 2.1 | Line spacing rules `auto` (n lines), `exact`, `atLeast` with font-specific single-line height | One `lineSpacing` model `{rule, value}` used by editor CSS, layout PDF, DOCX `w:spacing@line/lineRule`. The existing `lineSpacing.mode:"word"` + `singleLineEm` becomes a case of it. | Line pitch equal (±0.2 pt) in PDF and Word for TNR, Arial, Calibri at 10/11/12 pt, single/1.15/1.5/2/exact |
| 2.2 | Paragraph spacing before/after, collapse between paragraphs (larger of after/before), `contextualSpacing` (no space between same-style paragraphs), spacing suppressed at page top | Spacing model with Word's rules; existing `paragraphSpacing:"collapse"/"additive"` and `noteExitGap` expressed through it | Paragraph gap equal ±0.25 mm editor/PDF/Word on fixtures with mixed styles |
| 2.3 | Indents: first-line, hanging, left/right, mirror | Single indent model; DOCX `w:ind` | Text x positions ±0.25 mm |
| 2.4 | Tab stops with leaders (left/center/right/decimal) | Paragraph tab stops in editor (CSS grid/inline-block emulation) and DOCX `w:tabs`; use for TOC rows, symbols lists, signature lines | TOC page-number x and leader positions ±0.5 mm vs Word |
| 2.5 | Tables: cell margins (Phase 0.2), row height rules (auto/atLeast/exact), borders per edge, header row repeat, cantSplit, vertical alignment | Table model mapped 1:1 to `tblPr/trPr/tcPr` | Row pitch PDF vs Word ±0.25 mm; same page breaks |
| 2.6 | Keep with next / keep lines / widow-orphan / page break before | Same flags drive editor fragmentation and DOCX `keepNext/keepLines/widowControl/pageBreakBefore` | Page breaks identical on the long fixtures (page count PDF = Word) |
| 2.7 | Sections: different first page (`titlePg`), odd/even headers, page-number restart/format, vertical alignment of page (`vAlign` for covers) | Section model with Word's options; `omitOnChapterStart` stays as a convenience on top | Page labels identical PDF vs Word for every page |
| 2.8 | Header/footer distance and page-number baseline | Footer distance from page edge as Word defines it (`w:footer` in `pgMar`) | Page-number baseline ±0.25 mm vs official render |
| 2.9 | Fields: PAGE, NUMPAGES, TOC (live, cached), PAGEREF, SEQ for captions | All emitted as complex fields; a DOCX validity test over every registered template (exists for `<undefined`; extend to field balance and no `fldSimple` around paragraphs) | Word opens every template's export; page order correct |

Order: 2.1 → 2.2 → 2.5 → 2.6 → 2.7/2.8 → 2.3/2.4 → 2.9. Each row is one worker batch (Sonnet), followed by an `--all` regression run.

Fonts stay strict (AGENTS.md §10): embed the exact face; report substitutes as limitations, never PASS.

**Phase 2 exit:** on all checker-covered targets, PDF vs Word page count, page labels and line pitch agree within tolerance.

---

## 5. Phase 3 — engine layout report (self-measurement)

Make the checker read positions from the engine instead of reverse-engineering PDFs.

- 3.1 During layout-PDF export, write `<export>.layout.json`: per physical page → page label, section id, and for each landmark (special-page block, heading, caption, table row top/bottom, footnote area, page number, first/last body baseline) its id, text excerpt, x/y/width/height in mm, font face/size, line pitch. Landmark ids derive from template block/section ids and heading/caption counters, so they are stable across runs. (`export.mjs` already writes a `.layout.json`; extend it.)
- 3.2 Checker: new kinds that compare layout.json landmarks directly with expected values / the official reference (`landmark_y`, `landmark_x`, `landmark_gap`, `page_of`). Keep PDF-text checks as an independent cross-check for fonts (embedded font program) and for Word renders.
- 3.3 Independence (AGENTS.md §15): expected values still come from source-derived references; the layout report only replaces how *our* output is measured, and a sample of landmarks is cross-checked against the PDF text positions on every run (fail if they disagree > 0.25 mm).

**Phase 3 exit:** checks for covered targets use landmarks; runtime per target ≤ 30 s without Word.

---

## 6. Phase 4 — template generation from official DOCX

The scaling step toward ~200 universities.

- 4.1 `orchestration/tools/docx2spec.py`: read an official template/example DOCX (convert DOC once with LibreOffice into the target's `source/` cache) and emit MEASURED values with XML locators: page size/margins per section, `pgNumType`, `titlePg`, header/footer distances and PAGE field alignment, `styles.xml` (Normal, Heading 1–4, Caption, TOC 1–4, footnote text, table styles: fonts, sizes, spacing, indents, keep flags, numbering), tables (`tblCellMar`, borders, row heights), and fixed pages (cover/approval/declaration) as positioned text lines measured from the cached Word render. Output: `orchestration/specs/<id>.extracted.json`.
- 4.2 `orchestration/tools/spec2template.mjs`: map extracted values to template keys using `CAPABILITIES.md`; emit `templates/<id>.js` draft, `<id>.checks.json` (expected = extracted values with locators, Tier 1 categories marked), `<id>.fixture.json`, and a skeleton `<id>.CONTEXT.md`. Any value with no engine key goes into the context pack's "engine gaps" list (→ Phase 2 backlog), never silently dropped.
- 4.3 Human/LLM step limited to: reading the guide prose only where it may conflict with the template, recording conflicts with rulings (template XML > prose, CLOSEOUT 2026-10-03), and Tier 2 UNKNOWNs. Sonnet, one university per session.
- 4.4 Pilot on one not-yet-started university with an official DOCX (e.g. first ADÜ target in `orchestration/progress.json`), measure tokens and wall time end-to-end, and record them in §7. Target: draft + checker run ≤ 100k tokens.
- 4.5 Template families: after 3–5 universities, group by structural similarity (same style set / YÖK-like layout) and record shared engine presets (not shared values — AGENTS.md §6) in `CAPABILITIES.md`.

**Phase 4 exit:** pilot university reaches Tier 1 PASS with measured cost recorded.

---

## 7. Progress log (append one line per checkpoint)

| Date | Step | Commit | Result / measured cost | Next |
|---|---|---|---|---|
| 2026-10-03 | Plan written; checker (1ea4734), context packs (18e1bdd), docs (bcb3af6) | — | Checker: Coğrafya 41 PASS / 4 FAIL (table pitch), Matematik 42 / 4 (symbols table regression) | Phase 0.1 |
| 2026-10-03 | Phase 0.1–0.3, 0.5, 0.4 part 1 (`--all`, checks for felsefe-lisans/-seminer, isg, sbe) | 429a285 | 0.1 = fixture lacked symbols table (no regression); new `tables.cellPadding` + `<col data-col-width>`; Sosyoloji margins confirmed. Coğrafya 45/0 and Matematik 46/0 with --word → DONE. `--all` 6 targets 1:40 min, only FAIL isg (2 REAL: inner-cover spill, footer distance). Limitation: column-width CSS uses typed attr() (Chrome 133+) → Phase 2.5. Cost ≈ 360k subagent tokens (Haiku port 110k needed a Sonnet rewrite 133k: use Sonnet for check authoring) | 0.4 part 2 (mcbu-tip, afsu-tip, afsu-eczacilik, afsu-lee) |
| 2026-10-03 | Phase 0 complete: 0.4 part 2 (checks+fixtures mcbu-tip-uzmanlik 45, afsu-tip 45, afsu-eczacilik-proje 20, afsu-lee 75 incl. phd variant); references cached for isg + afsu-lee (existing Word renders copied, not re-rendered) | (this commit) | `--all` 10 targets: 8 clean. Known FAILs: isg `page-labels` (inner-cover title spills to 3rd sheet), isg `docx-footer-distance` 12.5 vs 17.39 mm; afsu-tip `footnote-single-pitch` 9.74 vs 10.84 mm (engine A4). CONFLICT afsu-lee `phd-body-font` (Calibri cover page number in official PhD template vs guide TNR). Open ruling: afsu-lee approval section margins 35.5/24.4 vs 40/25 not asserted. Guide-only targets (sbe, mcbu-tip, afsu-tip, afsu-eczacilik, felsefe ×2) have no Word reference by nature. Tool gap: `page_num` searches bottom 25 mm only. Cost part 2 ≈ 350k (2 Sonnet) | Phase 1.1 |

---

## 8. Pointers

- Checker usage: `orchestration/tools/CHECKER.md`
- Per-target context: `orchestration/specs/<id>.CONTEXT.md`
- Status ledger: `orchestration/progress.json` (+ `orchestration/RESUME_2026-10-03b.md`)
- Engine docs: `TxtNote/frontend/src/thesis/README.md`, `schema.d.ts`, `orchestration/reports/ENGINE_EXTENSIONS.md`
- Source precedence ruling: `orchestration/CLOSEOUT_2026-10-03.md` ("User-directed source precedence": official template XML/example structure outranks guide prose; record both values)
- Definition of Done: `AGENTS.md` §28 and §28A (two-tier)
