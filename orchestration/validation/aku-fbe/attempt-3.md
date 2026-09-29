# aku-fbe validation attempt 3 (independent) — verdict FAIL (both variants)

Exports regenerated from scratch (fresh fixtures, `devserver.sh restart`, `make-fixture.mjs`, `export.mjs`); measured with `pdfmeasure.py` plus own scripts. 95/96 checks per variant (PDF + DOCX) + adversarial suites. Renders: `renders/attempt-3-*.png` (11 files). Machine-readable: `attempt-3.json`.

## Failures (2, identical in aku-fbe-master-tr-v1 and aku-fbe-phd-tr-v1)
| id | expected | actual | difference |
|---|---|---|---|
| B2-eq-gap-after (numbered block equation, PDF) | one blank 1.5 line: eq baseline -> next paragraph baseline 41.4 pt (guide §2.10) | default fixture p.20: prev->eq 40.9, **eq->next 63.4 pt (master) / 61.9 (phd)**; eqpos sweep: 2 of 28 positions 62.1 pt (eq baseline 238.38 mm), others 41.4 | +20.5..+22.0 pt = 7.2-7.8 mm (limit 0.2 pt / 0.5 mm) |
| B6-approval-fit-realistic-title (PDF) | approval page content incl. frame above 267 mm (attempt-2 category) | 89-char title (6 sentence lines): master frame bottom 269.99 (text 266.03), phd 7 jurors 269.26 (text 265.30); default 71-char title 262.7/262.0 | +2.99 mm / +2.26 mm; same as attempt 2 (270.12/269.39): not fixed |

Root causes (diagnosis only). (1) DOM of the editor: equations with the extra blank lack `data-thesis-eq-pad-after` (gap 63.91 px) whereas the other equations carry 27.588 (gap 29.43 px); the after-pad measurement is skipped in some layouts (position dependent, deterministic per document). (2) no compaction of the approval block when the sentence needs more than 5 lines (or any frame-height budget against the 267 mm bottom margin).

## Passed (summary)
- PDF: 39 pages A4; only genuine Times New Roman (family/postscript from the embedded programs) drawn; margins 30.0 / right <= 180.08 / bottom 267.0; first baselines 33.95 (11 pt caption 33.62, image top 30.0); pitch 20.7 pt (321 pairs), para/heading gaps 41.4 pt; H1-H4 style, numbering, case; page numbers none on 1-4, i..ix, 1..26, centre 105.0, baseline 283.53 (spec 283.7), TNR 10; outer cover inside x 55-155 / y 210-275; inner cover baselines within 0.05 mm of guide p.33; approval title/text/advisor/jury (pitch 14.29)/frame top 189.0; ethics, ÖZET/ABSTRACT (heads, tail +41.4 pt, "ix + 26 sayfa"), TEŞEKKÜR (+62.1 pt), TOC (indent 30/35/40/45, pitch 20.7, leaders, Sayfa, **37/37 row labels = real pages**), lists (19.8 pt, hanging 46.35/51.0, labels correct), captions (11 pt, bold label, hanging = label width, image gap 5.96, table rule gap 3.46, "(Devam)" + repeated header), tables (3 rules), footnotes 1..6 in body and area, bibliography (hanging 42.49, 20.7 / 26.7 pt), ÖZGEÇMİŞ, EKLER.
- DOCX: A4, body sections 1701 twips all sides, footer 709; 22 sections, roman/decimal restarts, footers centred 10 pt with PAGE; fonts TNR (+ Cambria Math equations); Heading1-4; paragraph line 360/after 414/justified; approval frame double border; table borders/tblHeader; caption hanging 849/971/1068; footnotes 1..n; LibreOffice render of the special pages agrees with the editor PDF within 0.02 mm.
- B1: 169 ordered pairs of 13 block kinds (+ H1 pairs, + 90-case page-bottom sweep): PDF line-box gap == DOCX after(prev)+before(next) within 0.04 pt (table 0.75 pt); no stranded heading/caption, no line below 267.3 mm.
- B2 (other than the FAIL): tall/wide equations, 15 contexts, Greek/operators, aliases (\epsilon \phi ...).
- B3: 169-page document, first baseline spread 0.000 mm, page-number baseline constant, footnote areas bottom 267.0, 187 TOC rows + lists correct.
- B4: max right edge 180.08 (180.16 for a two-digit equation number: tight); no word overlaps; 152-char title ÖZET line x1 179.83.
- B5: 42/42 PAGEREF rows per variant (bookmark exists, cached label = editor label).
- C: regression vs 0bef9db: no regression (details below).

## LIMITATION (not PASS)
Cambria Math not embeddable (PDF equations in TNR); ∇ ∈ ⇒ ∀ ∃ ⊂ ∪ ∮ ∝ undrawable (confirmed), `\vec` arrow accent also missing (INFO); DOCX equations plain runs in Cambria Math; outer cover with a title over 2 lines (> ~75 chars) leaves the 210-275 printed area (277.9 mm at 89 chars; second page at 152 chars); very long covers / 7-juror pages overflow like Word; static "(Devam)" and TOC label snapshots (Word paginates itself; PAGEREF fields refresh; LibreOffice shows arabic front labels and body labels one page early).

## Regression (C)
Worktree of 0bef9db (removed afterwards), same fixtures: mcbu-lee-phd/master (35/34 pages) and demo-university-a (24 pages): page counts, fonts, page labels identical; body baselines <= 0.099 mm, x0 identical. Only pages 1-2 of MCBU differ: centred lines now exactly on the text-area centre (112.46-112.49; old drift up to +0.86 mm, lines up to 1.8 mm narrower with kerning fit) and the declaration paragraph now justified to the margin (old lines ended 2.5-27 mm short). List text layer gains spaces. DOCX: mcbu +2 empty 1-twip paragraphs, sections identical; demo-A DOCX identical.

## Spec / source findings (INFO)
See `attempt-3.json` specFindings: approval width/pitch/director order (template vs guide example), SİMGELER title gap 2.5 mm, TEŞEKKÜR 62.1 vs 41.4 pt, keyword order, page-number baseline (guide inconsistent 276/280 mm vs template 283.7), text-layer order of heading numbers, rule stroke 0.75 vs 0.5 pt.

## Rendered pages viewed
`attempt-3-01..11` (covers, approval/ethics, ÖZET/ABSTRACT, TEŞEKKÜR/TOC, symbols/list of figures, list of tables/CV, 7-juror + long-title pages, body/table/figure/footnote pages, the F1 equation page and eqpos page 38, multipage table/bibliography/appendix, regression MCBU old vs new).
