# MCBU LEE audit: mcbu.js vs MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx (2026-10-02)

Guide: DOCX uploaded 22.10.2025 (core.xml created=modified 2025-10-22T11:30Z). mcbu.js cites ShareFileGallery-GTSM221020251445.pdf, which KAYNAK.md lists as the same-day PDF counterpart of this DOCX (HTTP Last-Modified 22 Oct 2025 11:45). Same edition per KAYNAK.md; the PDF is NOT in the repo, so byte equality is UNVERIFIED (mcbu.js revisionDate "2024-02-22" is PDF creation metadata and differs from the 2025-10-22 upload date). Every textual rule found in the DOCX is also in mcbu.js comments; no rule text appears newer than what mcbu.js encodes.

| Rule | Guide value + location | mcbu.js | Status |
|---|---|---|---|
| Page size | A4 11906x16838 tw, sectPr (MEASURED) | A4 | MATCH |
| Margins | top/bottom/right 2.5 cm, left 4 cm, text p.343 (EXPLICIT); sectPr 1418/2268 tw (MEASURED) | 25/25/40/25 | MATCH |
| Header/footer distance | 709 tw = 12.5 mm (MEASURED) | 12 mm | MISMATCH (0.5 mm) |
| Font | Times New Roman 12, p.344 | TNR 12 | MATCH |
| Body line spacing / indent / para spacing | 1.5, 1.25 cm, 6 nk, p.344,346 | 1.5, 12.5 mm, 6 pt | MATCH |
| Alignment | justified, p.343 | justify | MATCH |
| Heading 1 | bold, ALL CAPS, justified, 12 pt, new page, 1 empty line after, p.345,352 | bold 12, upper, justify, pageBreak, 1 line after | MATCH (see conflict C1) |
| Heading 1 label "BİRİNCİ BÖLÜM" + title lines | example paras 313-314, 324-325 (MEASURED: jc=center, bold) | numbering "{1}." single line | MISMATCH/UNKNOWN |
| Heading 2-4 | bold; "1.1.", "1.1.1.", "1.1.1.1." with indents; jc=both, line 360, no spacing after (MEASURED, 315-317) | bold 12, justify, 1.5, numbered 1.1./1.1.1./1.1.1.1. (levels 2-4), spaceAfter 6 | MATCH; after=6 pt is NOT in guide (examples 0) |
| Chapter number format | no "1." on chapter headings in example | "{1}." | UNKNOWN |
| Table caption | above, p.354; one line centered else justified | above, auto | MATCH |
| Figure caption | below, p.354 | below, auto | MATCH |
| Table body | 1 line spacing, all centered, size author's choice, p.353-354 | lineHeight 1, centered | MATCH |
| Space before/after tables, figures | one empty line, p.353 | table before 1 line, after 6 pt; figure before 6 pt, after 1 line | MATCH partially (the other side 6 pt is not in guide) |
| Caption numbering | 1.. or per chapter, one method, p.357 | both choices | MATCH |
| Footnotes | bottom, TNR 10, p.359 | 10 pt bottom | MATCH |
| Page numbering | none on iç kapak; Roman to GİRİŞ; then arabic, p.355; footer1.xml PAGE field, jc=center (MEASURED); titlePg | bottom center; inner cover off; roman from ÖZET=I; arabic from GİRİŞ=1 | MATCH (mcbu.js says "kaynakta belirsiz" for position; DOCX footer measures bottom-center) |
| Taahhütname page | counted, no visible number: the guide only shows TOC Roman starting ÖZET=I | same | MATCH (inferred) |
| İç kapak | 14 pt bold T.C./MCBU/LEE; degree etc. 12 bold; title 14 bold; gaps 2/9/5/5/1 lines (red notes) | 14/12/14 bold, gaps 1,~98pt,5,5, ~96.6pt | font MATCH; gaps UNKNOWN (mcbu.js measured from PDF; DOCX notes include the logo/textbox space, not resolved) |
| Taahhütname text | p.50 exact text, İmza + Ad SOYAD right? | identical text | MATCH (right alignment not checked) |
| ÖZET / ABSTRACT headers | p.84-125 | present for master/PhD | MATCH |
| ÖZET body | 1.25 cm, 1.5 spacing (p.107) vs "tek satır, paragraf arası bir satır" (p.99) | 1.5 | CONFLICT C2 |
| Önsöz/Teşekkür | single spacing, 1.25 cm indent, 1 empty line between paras; funding+project no.; sign after 2 lines | implemented | MATCH |
| Simgeler/Kısaltmalar | 1.5, 12 pt, p.160 | 1.5 | MATCH |
| Şekiller/Tablolar dizini | 1 line, 12 pt, "Sayfa" heading, bold entries, tab 7513 no leader | lineHeight 1, no leader | MATCH |
| İçindekiler | bold entries, no leader | bold, none | MATCH |
| Ekler | single spacing, 1 empty line after title and each description, p.358 | implemented | MATCH |
| Özgeçmiş | PhD only, no number, not in TOC, centered 14 bold, p.361 | PhD only, matches | MATCH |
| Tez sırtı | example only (name, title, year) | recorded as note | MISSING (not page; consistent) |
| Kaynakça | "Referans bölümü hariç" 1.5; no spacing stated | lineHeight 1, after 6 | UNKNOWN (flagged in code) |
| Duplex | advisor approval | note | MATCH |

## Mismatches by severity
1. Heading 1 form (medium): guide example shows chapter heading as two centered bold lines ("BİRİNCİ BÖLÜM" / title), jc=center (paras 313-314, 324-325), no "1." number; mcbu.js uses single justified numbered uppercase line per text p.345. Engine "Bölüm" label line not implemented.
2. Header/footer distance 12 mm vs 709 tw = 12.5 mm (low; 0.5 mm, at tolerance limit, FAIL under 0.25 mm preference).
3. Heading 2-4 spaceAfter 6 pt and table/figure far-side 6 pt spacing: not established by guide (examples spacing after=0).
4. İç kapak vertical gaps: not reconcilable with DOCX notes (low, UNKNOWN).

## Conflicts
- C1: Heading 1 text (p.345 justified, uppercase) vs example (centered "BİRİNCİ BÖLÜM"). Unresolved.
- C2: ÖZET p.99 single-spaced vs p.107 note 1.5 with 1.25 cm. mcbu.js chose 1.5; documented.

## Not implemented
No English-language thesis, sanatta yeterlik or other variant is defined in this guide. Only master and PhD variants exist; both implemented. Guide-suggested chapter structures (social/experimental/sport) are optional; none imposed.
