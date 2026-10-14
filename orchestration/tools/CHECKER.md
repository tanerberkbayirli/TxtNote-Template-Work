# Conformance checker (AGENTS.md 24A)

```
node orchestration/tools/check.mjs --target <id> [--fixture <path>] [--word] [--only <id,id>|failed]
     [--out <dir>] [--verify-layout-ids] [--no-export <pdf> <docx>] [--build-reference [--official-docx <path>]]
node orchestration/tools/check.mjs --all [--targets <id,id>] [--word] [--out <parent-dir>] [--manifest <file>]
```
Flow: `specs/<id>.checks.json` -> real export (`export.mjs`, one export per fixture variant) -> optional Word
render (`--word`) -> `conformance.py` (PyMuPDF + DOCX XML) -> `validation/<id>/check-<YYYYMMDD-HHMM>.json` + `.md`.
Stdout shows only counts and FAIL/SKIPPED/CONFLICT rows. Exit 0 only if there is no FAIL (SKIPPED is never PASS).
`--only failed` reruns FAIL/CONFLICT ids of the latest `check-*.json`. Exports land in `validation/<id>/run/`
(generated; do not commit). Needs the frontend dev server (found at :5173 or :5175, else `devserver.sh start`);
env `THESIS_BASE_URL`, `THESIS_BROWSER_EXECUTABLE` (default: local Chrome), `PLAYWRIGHT_MODULE` override defaults.
Unit tests: `python -m unittest orchestration/tools/test_conformance.py`.
Regression gate: `node orchestration/tools/check.mjs --all [--word]` runs every target with a `specs/<id>.checks.json`,
prints one summary line per target and exits 1 if any target has a FAIL or errors (orchestration/plans/MOTOR.md 0.4).
With `--all`, `--out` creates a separate child directory per target; `--manifest`
records exact child-command wall times, report paths, counts and export errors.
`--targets` selects a subset for fresh targeted reruns. Layout-report export timings
separate browser/editor preparation, PDF and DOCX settle/export stages.
This is the Phase 3 runtime evidence, including fresh exports and checker overhead.
Report `measurementSeconds` measures conformance alone; it cannot establish the
30-second whole-target gate. `--no-export` is explicitly labelled existing-artifacts.
Non-Word runs use up to five independent browser profiles for fixture variants,
bounded by available CPU threads minus one (`CHECK_EXPORT_JOBS=1..5` overrides this).
Word-mode exports and all Word COM renders are serialized
by default. No outputs, browser storage or output prefixes are shared across variants.

## Adding a target
1. `specs/<id>.fixture.json` (default fixture; extra variants `specs/<id>.fixture.<variant>.json`, selected per
   check with `"params":{"fixture":"<variant>"}`). Build with `make-fixture.mjs` or copy a validated fixture.
2. `specs/<id>.checks.json`: a list of `{id, kind, params, expected, tolerance, source:{file,locator}, evidence, ruling?}`.
   `evidence` = EXPLICIT|MEASURED|INFERRED|UNKNOWN. Tolerance is mm (pt-equivalent kinds: size) and defaults to 0.5.
   Optional: `cmp:"le"|"ge"` (bound instead of equality), `status_on_fail:"CONFLICT"`,
   `expected:{"ref":"pageCount"}` (value from the cached `reference.json`). `params.source:"word"` = measure the Word render.
3. Run it; interpret only the failing rows. Do not write ad-hoc measurement scripts; add a kind to `conformance.py`.
Regexes are case-sensitive; page selectors: `"all"`, `[a,b]`, `{"page":n}` (negative = from end), `{"label":"arabic|roman|none"}`,
`{"find":"<regex>","nth":0,"within":<selector>}` (first page with a matching line).

Text extents use the bounds of non-whitespace characters. Word PDF exports can carry a trailing blank beyond a justified line or a centred label; that blank is not visible text geometry. Internal spaces and all visible characters retain their measured positions; tolerances are unchanged.
`fonts` accepts `params.regex` and `params.ignore` to scope **text lines**, retaining every font identity drawn in selected lines. For example, prose and mathematical glyphs can be checked separately when their source requirements differ. No selected font means FAIL, and font scopes must be documented in the target evidence; this does not authorize substituting a required face.

Read-only inspection reuses the same measurement implementation:
```
python orchestration/tools/conformance.py inspect --pdf output.pdf --extrema x1
python orchestration/tools/conformance.py inspect-docx --docx source.docx --regex "cover|approval"
python orchestration/tools/conformance.py inspect-docx --docx source.docx --styles
```
`inspect --extrema` reports the minimum/maximum matching visible line geometry over all pages (or `--page`). DOCX inspection reports one-based paragraph locators, text and direct XML properties; inherited style properties are available separately with `--styles`.
`inspect --images --page N` reports drawn image bounds using the shared PDF measurement code.
`page_labels` with `params.each:true` requires each selected page to have the expected label; an empty selection fails.
`docx_paragraph_sequence` checks the exact ordered paragraphs in XML parts selected by `params.part_regex`. `params.require_field` selects parts containing the required live field. Expected rows may constrain `field_regex`, `text_regex`, `style`, and `empty`; zero selected parts fails. This can verify a live PAGE paragraph followed by one terminal empty paragraph without requiring source-specific style IDs.
`toc_labels` accepts `params.leader:"none"` for source-required rows without dotted leaders; the default remains dotted rows.

## Check kinds
PDF: `page_size`, `page_count`, `text_extent` (x0min|x1max|firstBaseline|lastBaseline, agg, min_size, ignore),
`fonts` (embedded names exact + font-program family; only fonts actually drawn), `font_size` (dominant),
`line_pitch` (modal baseline delta), `delta_present` (a given baseline gap occurs), `line_baselines`
(regex-located lines on a page; attr baseline|x0|x1|size|cx), `line_attr`, `line_gap`, `span_attr`,
`pitch_series` (row/list pitch), `page_labels` (run-length string), `page_number_attr` (baseline|cx|size|x0),
`toc_labels` (every TOC/list entry label = real page label), `rules_count` (table rules).
DOCX XML: `docx_section` (pgSz/pgMar mm, pgNumType), `docx_attr` (any `w:<tag>` attrs; mode allowed|has, numeric_tol in
twips), `docx_no_undefined` (`<undefined`, unbalanced fldChar). Word (only `--word`): `word_opens`, `page_count_match`,
and any PDF kind with `params.source:"word"`. Word-comparison kinds (layout/PDF vs Word): `line_attr_match`, `line_words_match` (glyph extents of matched lines; tab leader run = >=4 identical . - _ glyphs, compared by extent and glyph count), `page_size_match` (per-page size), `page_number_attr_match` (baseline|cx|x0|x1|size per page, pages selector). Field kinds (`--word` renders a second, field-refreshed PDF and a JSON field dump when a target's checks use them): `fields_refresh_match` (Word render of the cached DOCX = render after updating all fields), `fields_cached_match` (per-kind cached results = Word-updated results; NUMPAGES cached value read from DOCX XML). Page selector `{"until":"<regex>"}` = every page before the first match. `params.source:"word-refreshed"` measures the refreshed render. `note` records INFO/UNKNOWN items.

## Engine layout checks (Phase 3)

`landmark_x`, `landmark_y`, `landmark_gap`, and `page_of` read the exported version-1
`.layout.json` report (also supported under `engineLayout`). Select landmarks with
`params.id`, `kind`, `sectionId`, or `regex`, and restrict physical pages with `params.pages`.
Page selectors for these kinds read the report itself, with no PDF text dependency.
Attributes include `baseline`, `top`, `bottom`, `x0`, `x1`, `cx`, `size`, and `pitch`.
`agg:all` checks the worst deviation and fails if any selected landmark lacks that
measurement. `landmark_gap` uses the nearest preceding last baseline and the next
first baseline on the same page; box-only endpoints cannot yield an invented gap.
Expected values must still come from the official source, independently of our report.

`layout_report_valid` is an automatic version-1 contract gate (origin/units, identity,
finite bounds, explicit nullable text metrics, and valid text-to-container references).
`--verify-layout-ids` performs a second real export of each selected fixture and adds
`layout_ids_match`: ordered page labels/section IDs/landmark IDs and kinds must match.
Repeated exports are diagnostic work, timed separately from ordinary runtime gating.
IDs are stable for identical input; arbitrary edits can renumber unanchored paragraphs.

`layout_pdf_consistency` cross-checks reported text origins against actual PDF glyph
origins, with a default tolerance of 0.25 mm. Every physical page must occur exactly
once in PDF order (1..N). Each page containing visible PDF text must provide an
eligible sample; another page's successful measurements cannot cover missing data.
Blank PDF pages may have no samples, but a wholly unsampled document cannot pass.
Eligible samples are nonblank, unclipped text runs of at least 7 pt with a landmark
ID, taking one run per landmark and up to `params.samples_per_page` (default 16).
A text page with only smaller or clipped runs fails this gate and needs an explicit
sampling extension; it must not silently pass. This is a sample cross-check, not
proof that every landmark or text run matches.

## Reference caching rule
Official Word render + official DOCX live in `artifacts/<id>/source/reference/` (`official-word.pdf`, `official.docx`,
`reference.json`). `--build-reference` preserves existing renders. Reference-derived expected values require
artifact hashes and matching font/locale environment provenance. Missing/stale provenance is SKIPPED and
blocks required acceptance; rebuilding metadata never assigns today's environment to an old render.
Retain stale evidence and make a new cache directory/render when the source or renderer environment changes.

Each fresh run stores `run/environment.json` (installed font file SHA256, OS, culture, decimal separator),
the Chromium version, Word build/mode/printer/print options, source hashes, and a per-variant acceptance
fingerprint binding source + current code + checks + fixture + renderer + font/locale environment.
PID and render timestamp are excluded from the identity. This does not enable export-cache reuse;
acceptance still uses fresh exports. Missing font environment aborts certification.

`line_attr`, `line_pitch`, and `line_text` accept `params.anchor` with layout landmark `id`, `kind`,
`sectionId` and/or `regex`. Exactly one identity must match. PDF/Word locate the full anchored text in
their own page flow; they never borrow physical page numbers from layout. For repeated prose,
`anchor.afterHeading` + explicit zero-based `headingOccurrence` selects the first paragraph following
that semantic heading. Missing/ambiguous/incomplete content fails. Pitch uses only adjacent lines of
the chosen paragraph on the same page, excluding bibliography/table/paragraph boundary gaps.

Automatic `engine-docx-package-<variant>` verifies XML parsing, relationship IDs and internal targets.
It is separate from Word opening and from Open XML SDK schema validation. `validate-openxml.ps1`
uses Office's existing Open XML SDK 2.9.1 assembly (Office2016 schema profile) read-only;
the absence of a standalone `dotnet` command does not imply the SDK is unavailable.
Schema FAIL/UNAVAILABLE is reported independently, with input SHA256, version and XPath errors.
Compare against preserved baseline DOCX using the same profile; Word opening never overrides schema FAIL.

Phase 5.1 local regression sequence (Word runs must be serial):
`node orchestration/tools/check.mjs --all --word --out orchestration/validation/word-compat/phase-5.1/regression --manifest orchestration/validation/word-compat/phase-5.1/regression-manifest.json`,
then `powershell -NoProfile -ExecutionPolicy Bypass -File orchestration/tools/validate-schema-regression.ps1`,
then `python orchestration/tools/phase51_record.py --manifest orchestration/validation/word-compat/phase-5.1/regression-manifest.json`.
The recorder rejects missing checks, lost PASS and changed retained FAIL measurements. Its regression gate
does not override separate schema FAIL or source UNKNOWN, and rerunning it replaces the diagnostic acceptance
record; phase closure requires reviewing the resulting evidence and updating the status ledger.
`required:true` UNKNOWN notes stay UNKNOWN and required SKIPPED/UNKNOWN checks return nonzero.

Set `EXPORT_EDIT_LATENCY=1` for a dedicated baseline export: 20 real insert/delete input events with
input-to-second-frame timings and exact HTML preservation. This samples one editable field, not full
pagination convergence or IME correctness. Probe time is separately labelled in export timings.

## Word COM
Own instance via `word2pdf.ps1`; the new WINWORD PID is recorded, 120 s timeout (`CHECK_WORD_TIMEOUT_MS`), `Quit` in
`finally`, only that PID is killed on timeout. On failure the Word checks are SKIPPED with the reason.

`font_size` accepts optional `params.regex`/`ignore` to scope dominant size to selected lines; missing matches fail. `line_attr` accepts explicit zero-based nonnegative integer `params.nth` to select repeated matching lines in document order; out-of-range occurrences fail. Omitting it retains existing aggregation.
