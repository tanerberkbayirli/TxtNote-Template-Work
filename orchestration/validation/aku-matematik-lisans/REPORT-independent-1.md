# Independent validation 1 - aku-matematik-lisans (aku-matematik-lisans-tr-v1)

Verdict: **FAIL** (87 checks: 81 PASS, 4 FAIL, 2 INFO). Fresh real export (dev server 5173, Chrome) after commit cd23145; Word COM render with own instance (PID recorded, Quit in finally). Data: `independent-1.json`; renders: `orchestration/artifacts/aku-matematik-lisans/render/indep/`.

## FAILs
| id | expected | actual | delta | locator | likely component |
|---|---|---|---|---|---|
| lists.fig.entrygap (PDF) | Sekiller/Cizelgeler/Resimler dizini entry gap 6.99 mm (single + 6 pt after, red text+screenshot) or 7.30 mm (sample XML line=360) | 4.87 mm (single, no 6 pt after) | -2.12 mm | official p7 / document.xml P136-138; PDF p7-9 | editor PDF path drops spaceAfterPt 6 for generated index rows (DOCX/Word render gives 6.98) |
| pdf.pagination.capacity | full body page (p20, no footnote) ends at baseline 260.3 mm (official p11: 32 line slots) | 245.7 mm (30 slots) | -14.6 mm | official.pdf p11; PDF p20 (also p13 visible bottom gap) | engine flow column/footnote reserve in pagedLayout/footnotes.js; DOCX in Word fills to 260.3 |
| docx.order | Word shows covers first | Word PDF page 1 = "EK 1", covers/ack/TOC at pages 29-34 | reorder | mat.docx word/document.xml, 4 `<w:fldSimple w:instr="TC ...">` | export.js TC field emission (empty vanish run); removing them restores order (mat.diag-noTC.word.pdf) |
| wordrender.pagenums | none on covers, i..vii, 1..26 | no page number on 33 of 34 pages | all | footers use PAGE field, sectPr ok | same TC root cause (diag without TC: labels correct) |

## UNKNOWN / CONFLICT (non-blocking)
- Table row height/cell font size: sample tables mix 7 trHeight values and 11/12 pt -> NOT_SPECIFIED. Footnote size, appendices, CV layout, H2-H4 caps: NOT_SPECIFIED.
- List paragraph conflict (prose vs XML) is recorded; but export matches neither in PDF (FAIL above).
- Official Word render ends justified lines at 181.0 (hanging trailing space); XML margin 30 mm; own DOCX in Word shows the same, so 180.0 in PDF = PASS.
- Rule weight: PDF 0.75 pt (Chrome snaps 0.5 pt) = 0.09 mm, within tolerance (INFO-level note).

## PASS summary
Page size; page-number labels/position (283.5 vs official 283.8)/10 pt; genuine embedded Times New Roman (+Cambria Math equation); margins; body pitch 20.7 pt; paragraph gap 14.6; H1 new page + 14.6, H2-H4 gaps; bibliography (16.7/9.4/hanging 42.5); outer/inner cover and acknowledgement baselines within 0.05 mm of official; TOC indents/pitch/page labels; figure (6.2 vs 6.1 mm, centred), caption 11 pt, table rules/continuation/header repeat, note 10 pt and 14.13 mm to heading; equation; DOCX sections/pgNumType/fonts; cd23145 fix confirmed (no `<undefined>`, Word opens).
