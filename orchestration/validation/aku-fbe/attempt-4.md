# AKÜ-FBE — independent validation attempt 4

**Verdict: FAIL for both `aku-fbe-master-tr-v1` and `aku-fbe-phd-tr-v1`.**
Validated the real TxtNote editor/export path at starting HEAD `7ae82ec` (the last product change is `d6eea04`; the working tree was clean). No product/template fix was made. Machine-readable measurements, including every equation-sweep pair, are in `attempt-4.json`; the read-only collector is `attempt-4-check.py`.

## Source and precedence

- Official guide: `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf`, p.5 §2.3 (3 cm from page edges), p.9 §2.10 (one empty 1.5-spaced line around numbered equations), p.32 (outer-cover print box x=55–155, y=210–275 mm), p.34 (approval example, frame bottom 265.22 mm).
- Official template: `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx`, `word/document.xml` `sectPr#1..#4`: **every section has `w:bottom="1701"` = 30.004 mm**. The approval table (#76) has fixed content/row structure; it does not define a compact long-title variant.
- Approved `orchestration/specs/aku-fbe.json`: `page.margins.bottomMm = 30`, `appliesTo: ["*"]`, EXPLICIT, citing both sources. Its approval example is inferred for a short title. Attempt 3: `orchestration/validation/aku-fbe/attempt-3.{md,json}`.
- `ce86b6d` gives equation pad stamping a line-height fallback; `38ddcf0` documents long-title overflow; `d6eea04` reorders PDF label operations. `orchestration/failures/aku-fbe/approval-fit.md` correctly says no source compaction rule exists, **but its 12 mm margin comes from the generated `aku-fbe.js` override, not the official DOCX**. Its claim that 285 mm is the applicable source limit is disproved by the official DOCX and approved spec. The source limit remains 297 − 30.004 = **266.996 mm** (about 267 mm).

## Real exports and commands

Windows validation host: Node 24, Vite 8.2.1, Chrome 154.0.8037.58, PyMuPDF 1.28.2. Dependencies were installed from the repository lockfiles (`npm ci` in `TxtNote/` and `TxtNote/frontend/`). The existing export harness was only made Windows-path/browser configurable; it still seeds `tests/thesis.html` and clicks the editor's own PDF and Word buttons. `PLAYWRIGHT_MODULE` pointed to the bundled Playwright package, `THESIS_BROWSER_EXECUTABLE` to installed Chrome; `PYTHONPATH` pointed to a temporary PyMuPDF/fontTools installation. The commands below use `%TEMP%/aku-fbe-attempt4` as `OUT`:

```text
cd TxtNote/frontend && npm run dev -- --port 5175 --strictPort --host 127.0.0.1
node orchestration/tools/make-fixture.mjs aku-fbe-master-tr-v1 OUT/master.fixture.json
node orchestration/tools/make-fixture.mjs aku-fbe-phd-tr-v1 OUT/phd.fixture.json
node orchestration/tools/export.mjs OUT/master.fixture.json OUT/master
node orchestration/tools/export.mjs OUT/phd.fixture.json OUT/phd
node orchestration/tools/eq-sweep.mjs aku-fbe-master-tr-v1 OUT/eq-master
node orchestration/tools/eq-sweep.mjs aku-fbe-phd-tr-v1 OUT/eq-phd
node orchestration/tools/export.mjs OUT/master.long89.fixture.json OUT/master.long89
node orchestration/tools/export.mjs OUT/phd.long89.fixture.json OUT/phd.long89
node orchestration/tools/export.mjs OUT/phd.fixture.json OUT/phd-repeat
python orchestration/validation/aku-fbe/attempt-4-check.py OUT orchestration/validation/aku-fbe/attempt-4.json
cd TxtNote/frontend && npm test && npm run build
```

`master.long89.fixture.json` and `phd.long89.fixture.json` copy the respective default fixtures with only the title changed to the exact 89-character string recorded in `attempt-4-proof/`. The normal exports are preserved at `orchestration/artifacts/aku-fbe/export/aku-fbe-{master,phd}-tr-v1.{pdf,docx,layout.json}`. The long-title PDFs/DOCXs and the repeat doctoral PDF/DOCX are preserved in `attempt-4-proof/`. The sweeps (65-page PDFs) and MCBÜ/demo export files remain reproducible in `OUT`; their measured data and PDF SHA-256 hashes are in `attempt-4.json`. All five normal/regression editor exports reported `pagedLayout=true`, no template fallback and no export errors.

## Equation spacing — source-backed requirement

Expected: **41.4 pt** before and after a numbered one-line equation; position sweep tolerance **±0.2 pt** (orchestration policy for line spacing). The 26-chapter sweep creates 78 equations across 65 physical pages; 76 equation-to-neighbour pairs per variant are independently measurable on the same page. Both PDFs: **min 41.389, max 41.403 pt; 76/76 PASS**, including the previously failing equation baseline near **238.38 mm**. This establishes a PASS for the tested sweep positions, not for all possible documents.

The full thesis fixture disproves stable compliance:

| Artifact / PDF p.20 | Before, pt | After, pt | After Δ from 41.4 | Result |
|---|---:|---:|---:|---|
| `aku-fbe-master-tr-v1.pdf` | 41.403 | 41.389 | −0.011 | PASS |
| `aku-fbe-phd-tr-v1.pdf`, first real export | **40.887** | **42.704** | **+1.304 pt = +0.460 mm** | **FAIL** (±0.2 pt) |
| `attempt-4-proof/phd-repeat.pdf`, same fixture and pipeline | 41.403 | 41.389 | −0.011 | PASS |

The first doctoral PDF and repeat have different SHA-256 hashes, saved in `attempt-4.json`; the fixture hash is identical. The later editor DOM for both variants shows `data-thesis-eq-pad-before=27.581`, `-after=27.6`, and parent line height 27.6 px (`attempt-4-dom.mjs`, with snapshots in `attempt-4-proof/{master,phd}.dom.json`). The export harness's settle snapshot watches page labels, generated-index rows and footnote areas, but **not** equation pad/layout state. The observed same-input variability points to an export/layout stabilization race; the exact event ordering was not captured at the failing PDF click. No implementation change was attempted.

## 89-character title — approval and cover

Both long-title files remain 39 pages. The extra approval sentence line is content-driven, and neither source defines a compaction rule: **LIMITATION**. This does not waive the separately explicit 30 mm page margin. The generated DOCX approval section uses **11.994 mm** bottom margin, while the official DOCX has **30.004 mm** in all four sections: **Δ −18.010 mm, FAIL**, tolerance 0.5 mm. The same generated first four section bottoms are 10.001 / 10.001 / 11.994 / 10.001 mm; the older DOCX checker skipped these sections.

| Long-title PDF p.3 | Expected frame bottom | Actual frame bottom | Δ | Result |
|---|---:|---:|---:|---|
| `attempt-4-proof/master.long89.pdf` | ≤266.996 mm | **269.987 mm** | **+2.991 mm** | **FAIL** (0.5 mm) |
| `attempt-4-proof/phd.long89.pdf` | ≤266.996 mm | **269.259 mm** | **+2.263 mm** | **FAIL** (0.5 mm) |

The normal-title frames end at 262.686 / 261.958 mm and fit. The source guide's p.34 example ends near 265.22 mm. On the 89-character outer covers, the last ink is **277.797 mm**, exceeding the source's **275 mm printed-area limit by 2.797 mm** in both variants (0.25 mm tolerance): **FAIL**. The visible page was also rendered and inspected; measurement, not appearance, determines these results. In `approval-fit.md`, the 12 mm boundary is therefore an implementation choice requiring correction or source justification, not an official special-page limit.

## Current baseline checks and PDF reading order

On each new 39-page normal export: A4 exactly 210 × 297 mm; genuine embedded Times New Roman font programs; body x0=30.00 mm and full-line x1=179.97–180.00 mm; first baseline 33.95 mm; 1.5-line pitch 20.69–20.70 pt; paragraph gap 41.39 pt; body bottom 267.00 mm; page numbers absent on sheets 1–4, then i–ix and 1–26, centred at x=104.99–105.03 mm, baseline 283.53 mm, 10 pt. These pass the source/spec tolerances. H1–H4, TOC geometry, list spacing, captions, three-rule and continued tables, bibliography, special-page default geometry and pagination were rechecked. The TOC helper resolved 34/37 rows; the other three are ŞEKİLLER/ÇİZELGELER/RESİMLER title rows and were directly verified at vii/viii/ix, yielding **37/37**. Four generated-list caption labels match their actual pages.

New DOCXs: A4, body sections 30 mm, 12.5 mm footer, roman/decimal section restarts, PAGE fields at 10 pt, TNR body, Cambria Math equation runs, H1–H4, 360/414 line/after spacing, captions, approval borders, footnotes and bibliography all passed their structural checks. **The first four special-page section margins fail the global source rule as above.** PDF equation glyphs still use TNR; Cambria Math embedding and unsupported glyphs remain the previously documented **LIMITATION**, never a font PASS.

`d6eea04` PDF text-layer order passes in each normal PDF: **28** numbered heading lines read number→text, **6** caption lines read label→text, and **2** ordered-list lines read marker→text; no standalone generated heading number was found. The sweep PDF independently reads 28 chapter labels before their titles.

Two legacy checker FAIL flags were adjudicated against their evidence and are not additional implementation failures: `body-indent` accidentally includes bibliography hanging lines at x=42.49 mm (body paragraphs begin x=30.00 and DOCX first-line indent is 0); `approval-title` demands x-centre 105 mm from the guide example while the source-priority decision follows the official template's 150 mm table, whose centred title is at x≈103.14 mm. Both raw flags remain visible in `attempt-4.json`.

## Regression and test gates

- Real editor exports: MCBÜ master **34/34** pages, MCBÜ PhD **35/35**, demo A master **24/24**, matching Attempt 3 counts. Embedded font families are Times New Roman / Times New Roman / Tinos, and all three layout logs have zero errors. This is a current-output smoke regression against recorded Attempt 3 facts; a page-by-page comparison to `0bef9db` was not repeated.
- Frontend: `npm test` **478 passed, 0 failed**; `npm run build` exited 0 (Vite 8.2.1, 2950 modules; non-fatal module/chunk warnings).
- `orchestration/validation/aku-fbe/work/` and `work2/` were left untouched.

## Decision and smallest roots

**Neither variant is PASS.** The source/spec margin is 30 mm on every page while the AKÜ-FBE template overrides the approval section to 12 mm (`TxtNote/frontend/src/thesis/templates/aku-fbe.js`, approval page configuration); this makes the 89-character approval frame exceed the source limit, and the same title exceeds the explicit outer-cover print box. Separately, the first doctoral export has an out-of-tolerance equation gap even though the same fixture's repeat and both sweeps pass; export stabilization currently omits equation-pad state. Preserve the two original outputs and diagnose those narrow causes before any implementation retry. `progress.json` remains `validation=FAIL`, `attempts=4`, `status=IMPLEMENTED`.
