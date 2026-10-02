# MCBÜ LEE independent audit task (2026-10-02) — FIND AND RECORD ONLY, FIX NOTHING

Target: `mcbu-lee` (registry `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`; module
`TxtNote/frontend/src/thesis/templates/mcbu.js`).
Only source: `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/`
(`MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` + KAYNAK.md). Read `AGENTS.md` first.

You are an auditor. You do NOT edit `TxtNote/`, `Butun-Sablonlar/`, git, progress.json or manifest.json.
A separate fixer will act on your findings, so they must be precise and self-contained.

## Method
1. Extract requirements from the guide DOCX yourself: guide text (EXPLICIT) and the DOCX's own XML
   (sectPr, styles, example cover/inner cover/approval/declaration/abstract/TOC/list paragraphs,
   footer fields) as MEASURED/TEMPLATE. Convert to PDF with
   `"/c/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf --outdir orchestration/artifacts/mcbu-lee/source <docx>`
   for page geometry (supporting evidence; XML is primary).
2. Produce REAL exports of BOTH variants: dev server already runs at http://127.0.0.1:5175 (do not start
   another). `node orchestration/tools/make-fixture.mjs <registryId> <fixture.json>` then
   `node orchestration/tools/export.mjs <fixture.json> <outPrefix>`. Use a fixture long enough to exercise
   headings 1–4, multi-page paragraphs, tables, figures, captions, footnotes, bibliography, appendices and
   every special page/numbering transition the guide defines. Outputs in
   `orchestration/validation/mcbu-lee/audit-2/`.
3. Measure the exported PDF (PyMuPDF: page size, margins, text bboxes, baselines, fonts incl. genuine
   embedded Times New Roman, sizes, line pitch, paragraph spacing, indents, heading styles, page-number
   position/format per section, captions) and inspect the DOCX XML. Render some pages (`get_pixmap`) and look.
4. Compare guide → template (`mcbu.js`) → actual export. Also check things the template omits entirely
   (sections/pages the guide requires that are missing) and texts/labels that differ from the guide.
5. Only after your own audit, read `orchestration/reports/mcbu-lee-audit-2026-10-02.md` (earlier static
   audit) and say for each of its MISMATCH/UNKNOWN rows whether it still holds.

## Output: `orchestration/validation/mcbu-lee/audit-2/FINDINGS.md`
Numbered findings, most severe first. Each finding:
- ID (F1, F2…), severity (HIGH = violates an explicit requirement / visibly wrong; MED; LOW)
- Requirement + evidence (file, paragraph/style/XML locator or guide quote)
- Expected value vs actual measured value (with unit) and the difference
- Where it happens (variant, section, page)
- Likely responsible component (template value in mcbu.js line N / engine / export) — say "unknown" if unsure
- Suggested fix in one line (do not implement)
Also list: checks that PASSED (compact table), CONFLICTs in the source, UNKNOWNs.
Final message ≤ 25 lines: counts by severity, top findings, path of FINDINGS.md.
