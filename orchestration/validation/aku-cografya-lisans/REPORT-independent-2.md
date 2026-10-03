# Independent validation 2 - aku-cografya-lisans-tr-v1 (commit 51e8a33)

Verdict: FAIL (19 PASS, 1 FAIL, 3 INFO; all 7 independent-1 FAILs fixed). Details: independent-2.json.
Method: fresh real exports (default 3-line-title fixture + long 2-line fixture); own Word PID 15216 rendered both DOCX (opened fine); PyMuPDF/DOCX XML vs Word render of official template and guide. Renders: orchestration/artifacts/aku-cografya-lisans/render/indep2/.

## FAIL
- table-line-spacing: both official table examples single-spaced (template 11 pt ~4.65 mm pitch; guide 9 pt single); guide silent (UNKNOWN). Export PDF row pitch 9.37 mm, DOCX/Word 13.85 mm (4.5 mm/row disagreement); DOCX paginates +1 page (long 34 vs 33, def 37 vs 36). Component: engine table cell spacing (DOCX writer vs PDF) / template. Fix: consistent single spacing, or at least DOCX equal to PDF.

## INFO
- 3-line-title cover: year spills to page 2 (recorded UNKNOWN).
- H1 page-top 28.95 (template shows 28.96 on p20/23/24 and 31.08 on p12/17/22).
- Table cell 12 pt vs template 11 pt; caption numbering chapter-based; landscape page not exercised.

## PASS summary
Page size, margins, TNR embedded, 12 pt/7.30 pitch, indent, 9.42 gap (ruling applied), cover <=0.26 mm, approval, ethics <=0.35 mm, Ozet gap 14.60, page numbers, TOC labels 34/34, lists, bibliography, captions, DOCX opens, DOCX body = PDF.
