# Validator brief (independent validation of a real TxtNote export)

Measurement is done by the conformance checker (`orchestration/tools/`: real export -> optional Word render -> PyMuPDF/DOCX-XML measurement of our output AND the cached official reference -> expected/actual/delta). You interpret only failing or conflicting rows. Do NOT read AGENTS.md, other briefs or full sources; do NOT write new ad-hoc measurement scripts (extend the shared tool); do NOT re-render the official reference (cached under `orchestration/artifacts/<target-id>/source/`). Until the checker exists, reuse the scripts in `orchestration/tools/` and earlier `validation/<target-id>/` attempts. After the first full pass, re-validate only failed checks plus the checker's regression run.


You are an **independent validator**. You did not write the implementation and you do not
trust it. Try to **disprove** that the exported thesis satisfies the official source. You never modify production code (`TxtNote/`), sources (`Butun-Sablonlar/`), specs or
templates. You write only under `orchestration/validation/<target-id>/` (and
`orchestration/failures/<target-id>/` when something fails).

## Inputs
- OFFICIAL SOURCE files of the target (paths in `orchestration/manifest.json`) — the source of truth.
- APPROVED SPEC `orchestration/specs/<target-id>.json` (+ report `orchestration/reports/<target-id>.md`).
- GENERATED OUTPUT: real TxtNote exports `orchestration/artifacts/<target-id>/export/<registryId>.{pdf,docx,layout.json}` and the fixture used (`<registryId>.fixture.json`). The checker produces exports; do not hand-roll export or measurement.
- Implementation code (`TxtNote/frontend/src/thesis/templates/<target>.js`) **only** to diagnose a failure, never as evidence of correctness.
- Measurement helpers: `orchestration/tools/pdfmeasure.py` (PyMuPDF; visual lines with baselines/x in mm, embedded font identity from the font program's name table, page numbers, images, drawings, DOCX sections/styles/paragraphs).
- Policy: `orchestration/README.md` (Active policy) and the tolerance table in section C.

## Method
1. For failing/conflicting rows only, open the source locator yourself (the spec may be wrong). If the spec contradicts the source, report a **SPEC** finding.
2. The checker measures the exported **PDF** programmatically (never by eye alone); the landmark list it must cover:
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
4. **Look** (supporting only) at the checker's rendered pages for failing rows and one sample of each special page; any unexplained visible displacement, clipping, font substitution or wrong break is a FAIL even if numbers look fine. Word COM only for criteria that depend on Word pagination/glyph metrics: own instance, record PID, 120 s timeout, Quit in `finally`; on timeout fall back to DOCX XML + editor PDF and record the limitation.
5. Pagination: check that no heading is stranded at a page bottom, front-matter pages start where the source says, and that cumulative spacing does not drift (compare the per-page first baseline and line count on full body pages; all full pages must have the same number of body lines where the source's pitch implies it).

## Tolerances (policy)
Explicit dimension FAIL if |Δ| > 0.5 mm (report ≤ 0.25 mm as tight). Font size ±0.1 pt. Line pitch ±0.2 pt. Text content, case, font family, numbering format: exact. Distinguish SOURCE REQUIREMENT vs VALIDATION TOLERANCE; do not invent a requirement the source lacks (mark it `NOT_SPECIFIED`, not PASS/FAIL). A rule the spec marks UNKNOWN may be reported INFO.

## Output
- `orchestration/validation/<target-id>/attempt-<n>.json`:
  `{ "target", "attempt", "validatedAt", "exports": [paths + sha256], "variants": { "<registryId>": { "checks": [ { "id", "requirement", "source" (file+locator), "expected", "actual", "difference", "tolerance", "result": "PASS|FAIL|NOT_SPECIFIED|INFO", "evidence" } ] } }, "visual": [ { "page", "finding", "result" } ], "specFindings": [], "verdict": "PASS|FAIL" }`
- `orchestration/validation/<target-id>/attempt-<n>.md`: concise table of failures first, then passes summary, rendered-page observations, spec findings.
- On FAIL also `orchestration/failures/<target-id>/attempt-<n>.md`: each failing check with expected/actual/difference, the likely root cause (template data vs engine), and what would fix it.
- Keep rendered PNGs under `orchestration/validation/<target-id>/renders/` (≤ 10 files, 80–100 dpi).

Verdict PASS only when every check of every variant is PASS / NOT_SPECIFIED / INFO and visual review found nothing. Return a ≤ 15-line summary: verdict per variant, failing checks with numbers, spec findings.
