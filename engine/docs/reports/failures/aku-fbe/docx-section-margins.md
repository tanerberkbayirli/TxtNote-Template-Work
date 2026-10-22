# AKÜ-FBE DOCX section margins — targeted repair after Attempt 5

Attempt 5 independently found that the generated Word sections for the outer cover and approval page used their PDF/editor content-box margins as Word page margins. The official 2025 DOCX has `w:pgMar` = 1701 twips (30.004 mm) on all four sides of every section. The approved specification applies the 30 mm page margin to all sections. This was a structural **FAIL** for ordinary master and doctoral DOCX exports.

## Generic repair

The page model now permits `docxMargins` for Word section properties and `docxContentFrame` for page-anchored special-page content. AKÜ-FBE sets the Word page margins to 30 mm on the outer cover and approval page while retaining the guide's cover print box (x=55–155 mm, y=210–275 mm) and the measured approval frame origin (x=27.32 mm). This separates page geometry from content placement; other templates continue using their existing page margins.

## Targeted real-export check

Fresh real TxtNote editor exports were made for master, doctoral, and the 89-character master fixture after the repair. Both ordinary PDFs remained 39 pages; the long-title PDF remained 41 pages. Each exported DOCX has 22 sections, all with `w:top/right/bottom/left="1701"`. The cover content wrapper has `w:tblpPr` anchored to the page at x=3118, y=11995 twips; approval uses x=1549, y=1701 twips. These values match the configured 55 mm / 211.58 mm cover origin and 27.32 mm / 30 mm approval origin to twip precision. Focused tests, the full 490-test frontend suite, and the frontend build pass.

**Status:** the specific OOXML margin violation is repaired in these outputs. Microsoft Word could not be started for independent visual repagination on this host (`0x80070520`, no usable desktop session), so the positioned tables' final Word rendering remains **UNKNOWN**. The 89-character PDF still splits its cover and approval across extra pages and remains **FAIL**. AKÜ-FBE is therefore **not PASS**; independent full revalidation is still required after any further change.
