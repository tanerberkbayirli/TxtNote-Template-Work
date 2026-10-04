# Conformance checker (AGENTS.md 24A)

```
node orchestration/tools/check.mjs --target <id> [--fixture <path>] [--word] [--only <id,id>|failed]
     [--out <dir>] [--no-export <pdf> <docx>] [--build-reference [--official-docx <path>]]
```
Flow: `specs/<id>.checks.json` -> real export (`export.mjs`, one export per fixture variant) -> optional Word
render (`--word`) -> `conformance.py` (PyMuPDF + DOCX XML) -> `validation/<id>/check-<YYYYMMDD-HHMM>.json` + `.md`.
Stdout shows only counts and FAIL/SKIPPED/CONFLICT rows. Exit 0 only if there is no FAIL (SKIPPED is never PASS).
`--only failed` reruns FAIL/CONFLICT ids of the latest `check-*.json`. Exports land in `validation/<id>/run/`
(generated; do not commit). Needs the frontend dev server (found at :5173 or :5175, else `devserver.sh start`);
env `THESIS_BASE_URL`, `THESIS_BROWSER_EXECUTABLE` (default: local Chrome), `PLAYWRIGHT_MODULE` override defaults.
Unit tests: `python -m unittest orchestration/tools/test_conformance.py`.
Regression gate: `node orchestration/tools/check.mjs --all [--word]` runs every target with a `specs/<id>.checks.json`,
prints one summary line per target and exits 1 if any target has a FAIL or errors (MOTOR.md 0.4).

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

## Reference caching rule
Official Word render + official DOCX live in `artifacts/<id>/source/reference/` (`official-word.pdf`, `official.docx`,
`reference.json`). `--build-reference` renders only if `official-word.pdf` is missing (copy an existing render in
instead of re-rendering) and then (re)writes `reference.json`. Never re-render when present.

## Word COM
Own instance via `word2pdf.ps1`; the new WINWORD PID is recorded, 120 s timeout (`CHECK_WORD_TIMEOUT_MS`), `Quit` in
`finally`, only that PID is killed on timeout. On failure the Word checks are SKIPPED with the reason.
