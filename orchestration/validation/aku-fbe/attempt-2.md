# aku-fbe validation attempt 2 — verdict FAIL (both variants)

Independent re-export (fresh dev server, `make-fixture` + `export.mjs`), measured with PyMuPDF on the PDF, XML checks and a LibreOffice render on the DOCX (LibreOffice here has a working Writer; it is supporting evidence only). Data: `attempt-2.json` (103 checks/variant), fixtures and scripts in `work2/`, renders in `renders/attempt-2-*.png`. Adversarial fixtures: PhD 7 jurors + second advisor + long title, master without optional lines, equation/caption/table-note context matrix (zoom 50/75/100/125/150/fit give identical PDFs), 148-page drift document, 97/119/151-char titles.

## Failing checks (identical for aku-fbe-master-tr-v1 and aku-fbe-phd-tr-v1; engine-level)
| id | expected | actual | diff |
|---|---|---|---|
| table-note-gap | 5.46 mm rule→note baseline (guide p14, 6 pt before) | PDF 12.78; DOCX(LO) 15.63 | +7.32 / +10.2 mm |
| equation-gap-after-caption-table-note-list | 14.60 mm | caption 5.87, table 10.44, note 8.02, list 10.49 (DOCX 6.8/4.9/6.7/7.2) | −8.7…−4.1 mm |
| equation-gap-consecutive | 14.60 (guide p9: 14.80) | PDF 7.29 (DOCX 14.39) | −7.31 |
| equation-at-page-top | 33.95 | 42.27 forced / 42.32 natural break | +8.3 |
| equation-gap-before-figure-list-tablecaption | 10.65 / 14.60 / 14.27 | 9.56 / 13.52 / 17.42 | −1.09 / −1.08 / +3.15 |
| equation-gap-tall | 14.60 both sides | fraction +0.97/+1.27, integral +2.9/+2.2, sum +3.3/+3.8 | >0.5 |
| equation-wide | inside 30–180 | 18-term sum to x 198.8, 22-term 209.4, overprints number | +18.8/+29.4 |
| equation-glyphs-greek-variants | ε φ present | \epsilon, \phi dropped silently in PDF (DOCX ok) | 2 glyphs |
| approval-fit-realistic-title | frame ≤ 267 | 97–151-char title: PhD frame bottom 269.39, master 270.12 (text ≤ 265.1) | +2.4 / +3.1 |
| long-title-right-margin | x1 ≤ 180.5 | ÖZET title line x1 181.58 (unkerned text drawn at kerned position) | +1.58 |
| drift-long-document | 33.95 | 33.30 at p141 of 148 (−0.0047 mm/page, >0.5 mm from ~105 pages); 39 pages: −0.11 PASS; pre-existing, identical at commit 0bef9db | −0.65 |
| docx-lists-rows | 19.8 pt | w:after=0 → 13.8 pt | −6.0 pt |
| docx-index-page-labels | real pages | static text, no PAGEREF/TOC field; LO render 16/42 rows wrong | — |
| docx-devam-caption | at real break | static table cut at browser break; LO shows it mid-page beside a repeated header | — |

## Previous failure categories re-tested
PASS: heading gap after caption/note/table/equation 14.60/14.60/14.61/14.59 (PDF); approval frame thin 0.75 outside / thick 3 pt inside, x 27.32/178.91, top 189.16 (guide line centre 189.17), DOCX top/left thickThin + bottom/right thinThick sz 24; default PhD 7-juror page fits (text 257.08, frame 262.09; NOT_SPECIFIED); caption first line 30.00 + hanging under text (wrapped fig/table/photo/Devam); equation 12 pt, DOCX runs+number Cambria Math 12 pt; symbols \cdot × ± ≤ ≥ ≠ ∑ ∫ √ α β μ σ present; footnotes 1..13 in order (PDF body, PDF notes, DOCX). FAIL: equation spacing outside paragraph/heading context (above), long covers/approval page with realistic titles (see LIMITATION).

## Limitations (reported, not PASS)
Cambria Math not embeddable in PDF (TNR drawn; equation-font.md); ∈ ⇒ ∀ ∃ ∇ ⊂ ∪ ∮ ∝ undrawable; DOCX equations are plain text (no OMML); outer cover with second advisor leaves the 210–275 box for titles ≥ 97 chars (last line 276.9/281.7, 160 chars spills); inner cover spills at ~150 chars; DOCX heading gaps assume Word adds after+before (LibreOffice renders 12.5 mm; source silent).

## Regression (D)
Old = commit 0bef9db exported side by side with the same fixtures. mcbu-lee-phd-tr-v1 and demo-university-a-master-tr-v1: same pages, fonts, margins and baselines (≤0.05 mm) except (1) justified lines of mcbu p2 now reach the right margin (old ended up to 27 mm short: improvement), (2) footnote labels now derived 1,2,3… instead of stored "1" (improvement). Word-space loss in 4–5 places and the −0.6 mm long-document drift exist in the old engine too. 162/162 node unit tests pass.

## PASS summary
Both variants: A4 39 sheets; genuine embedded Times New Roman (all four faces, name table); margins 30 (x0 30.00, x1 179.97–180.00); first baseline 33.95 (33.84 min); pitch 20.7; paragraph gap 41.4; H1–H4 numbering/size/bold/x0; page numbers i–ix / 1–26, none on pages 1–4, baseline 283.53 (−0.17), centre 105.0, 10 pt; inner cover baselines ≤0.05; approval/ethics/ÖZET/ABSTRACT/TEŞEKKÜR/TOC/lists/symbols/CV geometry within 0.13 mm; TOC labels = real pages (PDF, all rows); captions 11 pt, image gap 5.95; 3 table rules with repeated header and (Devam); bibliography 12.5 mm hanging, 26.7 pt entry pitch; DOCX sections, pgNumType, footers, fonts, headings, footnotes, frame borders.

## Spec findings
Approval box width (guide 154 vs template 150) centres approval lines 1.8 mm left of the guide example; spec lacks checks for table-note gap, equation contexts, DOCX list rows; Word's after+before rule unknown.
