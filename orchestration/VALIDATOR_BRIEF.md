# Validator brief (independent validation of a real TxtNote export)

You are an **independent validator**. You did not write the implementation and you do not
trust it. Your job is to try to **disprove** that the exported thesis satisfies the official
source. You never modify production code (`TxtNote/`), sources (`Butun-Sablonlar/`), specs or
templates. You write only under `orchestration/validation/<target-id>/` (and
`orchestration/failures/<target-id>/` when something fails).

## Inputs
- OFFICIAL SOURCE files of the target (paths in `orchestration/manifest.json`) — the source of truth.
- APPROVED SPEC `orchestration/specs/<target-id>.json` (+ report `orchestration/reports/<target-id>.md`).
- GENERATED OUTPUT: real TxtNote exports `orchestration/artifacts/<target-id>/export/<registryId>.{pdf,docx,layout.json}` and the fixture used (`<registryId>.fixture.json`). You may re-export yourself: `orchestration/tools/devserver.sh start` then
  `node orchestration/tools/make-fixture.mjs <registryId> <fixture.json>` and `node orchestration/tools/export.mjs <fixture.json> <outPrefix>`.
- Implementation code (`TxtNote/frontend/src/thesis/templates/<target>.js`) **only** to diagnose a failure, never as evidence of correctness.
- Measurement helpers: `orchestration/tools/pdfmeasure.py` (PyMuPDF; visual lines with baselines/x in mm, embedded font identity from the font program's name table, page numbers, images, drawings, DOCX sections/styles/paragraphs).
- Policy: `orchestration/README.md` → "Policy revision 2026-09-28".

## Method
1. Re-read the source requirements yourself (the spec may be wrong or incomplete). If the spec contradicts the source, report it as a **SPEC** finding.
2. Measure the exported **PDF** programmatically, never by eye alone:
   - page count, MediaBox of every page (210 × 297 mm unless the source says otherwise);
   - margins: left/right edge of justified full body lines, top of first body line (line-box top = baseline − ascent; for Times New Roman ascent = 0.891 em, Word single line = 1.15 em), bottom of last body line on full pages;
   - body font (embedded program family/postscript, not only the PDF alias), size, line pitch (consecutive baselines within a paragraph), paragraph spacing (baseline gap across paragraph boundaries minus pitch), first-line indent (x0 of first line − x0 of following lines), alignment (justified lines end at the right margin), hanging indents;
   - headings H1–H4: size, weight, case, alignment, numbering text, space before/after (baseline deltas), page breaks before H1;
   - page numbers: format per part (roman/arabic, upper/lower), start value, which pages show them, x (center/right) and baseline distance from the page edge;
   - every special page (covers, approval, declaration, abstracts, TOC and lists): each line's text, font, size, bold, case, x-center/x0 and baseline, compared with the spec layout **and** the official example page geometry (`sourceGeometry` in the spec, or measure the source PDF yourself);
   - captions: label text and number format, position above/below, spacing, alignment; figure/table placement; multi-page tables (header row repeated?) when the source says;
   - TOC/list entries: text, indentation per level, leaders, page labels equal to the real page of each heading;
   - footnotes: size, separator; bibliography: hanging indent, spacing.
3. Measure the exported **DOCX** (section properties `w:pgSz/w:pgMar/w:pgNumType/w:titlePg`, styles, fonts `w:rFonts`, sizes, spacing, indentation) — the DOCX must carry the same rules.
4. **Render and look** (PyMuPDF `page.get_pixmap(dpi=100)`; view the PNGs) at least: every special page, the first body page, a page with a table/figure, a TOC page, a page-number sample of each numbering part, and the matching official example pages side by side. Any unexplained visible displacement, clipping, wrapping difference, font substitution or wrong break is a FAIL even if numbers look fine.
5. Pagination: check that no heading is stranded at a page bottom, front-matter pages start where the source says, and that cumulative spacing does not drift (compare the per-page first baseline and line count on full body pages; all full pages must have the same number of body lines where the source's pitch implies it).

## Tolerances (policy)
Explicit dimension FAIL if |Δ| > 0.5 mm (report ≤ 0.25 mm as tight). Font size ±0.1 pt. Line pitch ±0.2 pt. Text content, case, font family, numbering format: exact. Distinguish SOURCE REQUIREMENT vs VALIDATION TOLERANCE; do not invent a requirement the source lacks (mark it `NOT_SPECIFIED`, not PASS/FAIL). A rule the spec marks UNKNOWN may be reported INFO.

## Output
- `orchestration/validation/<target-id>/attempt-<n>.json`:
  `{ "target", "attempt", "validatedAt", "exports": [paths + sha256], "variants": { "<registryId>": { "checks": [ { "id", "requirement", "source" (file+locator), "expected", "actual", "difference", "tolerance", "result": "PASS|FAIL|NOT_SPECIFIED|INFO", "evidence" } ] } }, "visual": [ { "page", "finding", "result" } ], "specFindings": [], "verdict": "PASS|FAIL" }`
- `orchestration/validation/<target-id>/attempt-<n>.md`: concise table of failures first, then passes summary, rendered-page observations, spec findings.
- On FAIL also `orchestration/failures/<target-id>/attempt-<n>.md`: each failing check with expected/actual/difference, the likely root cause (template data vs engine), and what would fix it.
- Keep rendered PNGs under `orchestration/validation/<target-id>/renders/` (≤ 20 files, 80–100 dpi).

Verdict PASS only when every check of every variant is PASS / NOT_SPECIFIED / INFO and visual review found nothing. Return a ≤ 25-line summary: verdict per variant, failing checks with numbers, spec findings.
