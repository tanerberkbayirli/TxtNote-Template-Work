# Self-check: chapter-opening page numbers (mcbu-tip-uzmanlik-tr-v1) - NOT independent validation

Requirement: EXPLICIT, guide p.2 §1.4 "Bölümlerin ilk sayfalarına numara konmaz." (spec key pagination.firstPageOfChapterVisible = false).
Capability: generic opt-in `page.numbering.omitOnChapterStart` (enabled in mcbu-tip.js only).

Real export (editor Playwright path, fixture with 5 body chapters): render/chapnum.pdf, render/chapnum.docx (30 sheets).
PDF (PyMuPDF, footer text below 267 mm): chapter-opening sheets 5, 9, 13, 20, 23, 26, 27, 28, 30 print no number;
all other body sheets print the counted number (6=2, 7=3, 8=4, 10=6 ... 25=21..: GİRİŞ first page counts as 1, hidden).
Front sheets (cover, önsöz, içindekiler) unnumbered as before.
DOCX XML: 13 sections, 9 with <w:titlePg/> and a first-page footer without PAGE field; one pgNumType start=1 (GİRİŞ), later chapters continue numbering.
Not verified in Word itself (no Word available): rendering of titlePg sections.
Fallback (non-layout) PDF writer does not implement the option.
