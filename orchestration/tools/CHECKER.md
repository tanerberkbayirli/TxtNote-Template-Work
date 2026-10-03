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

## Check kinds
PDF: `page_size`, `page_count`, `text_extent` (x0min|x1max|firstBaseline|lastBaseline, agg, min_size, ignore),
`fonts` (embedded names exact + font-program family; only fonts actually drawn), `font_size` (dominant),
`line_pitch` (modal baseline delta), `delta_present` (a given baseline gap occurs), `line_baselines`
(regex-located lines on a page; attr baseline|x0|x1|size|cx), `line_attr`, `line_gap`, `span_attr`,
`pitch_series` (row/list pitch), `page_labels` (run-length string), `page_number_attr` (baseline|cx|size|x0),
`toc_labels` (every TOC/list entry label = real page label), `rules_count` (table rules).
DOCX XML: `docx_section` (pgSz/pgMar mm, pgNumType), `docx_attr` (any `w:<tag>` attrs; mode allowed|has, numeric_tol in
twips), `docx_no_undefined` (`<undefined`, unbalanced fldChar). Word (only `--word`): `word_opens`, `page_count_match`,
and any PDF kind with `params.source:"word"`. `note` records INFO/UNKNOWN items.

## Reference caching rule
Official Word render + official DOCX live in `artifacts/<id>/source/reference/` (`official-word.pdf`, `official.docx`,
`reference.json`). `--build-reference` renders only if `official-word.pdf` is missing (copy an existing render in
instead of re-rendering) and then (re)writes `reference.json`. Never re-render when present.

## Word COM
Own instance via `word2pdf.ps1`; the new WINWORD PID is recorded, 120 s timeout (`CHECK_WORD_TIMEOUT_MS`), `Quit` in
`finally`, only that PID is killed on timeout. On failure the Word checks are SKIPPED with the reason.
