# aku-fbe validation attempt 1 — verdict FAIL (both variants)

Validator re-exported adversarial content (work/adv-*.json) besides the integrator fixtures. Findings below apply to master and phd alike unless noted.

## Failures
| check | expected | actual | difference |
|---|---|---|---|
| heading-gap-before-after-caption-note-table | 14.60 mm | H2 after table note (10pt) 6.83 mm (p17); H2 after figure caption 6.91 mm (p21); H2 after table last row 9.37 mm (p27). Same in DOCX: note/caption spacing after=120 twips, heading before=0 | -7.77 / -7.69 / -5.23 mm |
| approval-frame | thin-outer/thick-inner, 3.0pt inner | outer 1.5pt + inner 0.75pt (thick outside, thin inside); outer left 28.10, right 178.10 (x-width 150.0); top 189.02; DOCX tblBorders thickThinSmallGap on all 4 sides | line weights 3.0 vs 1.5pt, order reversed; left +0.79 mm, right -0.81 mm vs template; -3.3 mm width vs guide |
| approval-7-jurors-bottom | <=267 | phd p3: last text baseline 279.08, box bottom ~283.5 (approval section bottom margin 12 mm/10 mm in DOCX); director block starts 264.5 | +12.1 mm text, +16.5 mm frame |
| caption-first-line-offset | 30.0 | wrapped captions: label x0 31.59 (Şekil 3.1 master p21), 31.19 (Çizelge adv p25), 30.47 (adv p21); continuation 44.97 vs first-line text 46.57 (1.6 mm left of first-line text) | +1.59 / +1.19 mm |
| equation-spacing | 14.60 mm | before 22.45 mm (p20 master 194.54->216.99), after 13.0 mm (217.15->230.15); DOCX paragraph gives 414/414 twips (correct) -> PDF and DOCX disagree | +7.85 / -1.6 mm |
| equation-font-size | Cambria Math 12pt | math glyphs 'E = m c' at 14.52pt TNR (Cambria Math not installed: fc-list empty); number '(3.1)' 12pt x1=180.0 PASS; DOCX equation is plain text 'E = mc²' in TNR 12pt, no OMML | +2.5pt size; wrong family |
| equation-glyph-integrity | F = a ∙ b | adv-phd p20: LaTeX 'F = a \cdot b' rendered 'F = a   b', operator glyph missing in PDF | glyph dropped |
| footnotes | 1,2 | phd/master: footnote text labels '1' on every note; adv-phd p19 two notes on the same page both '1' (body marker and note); text 10pt, marker 7.5pt | duplicate labels |
| outer-cover-long-title | <=275 | 4-line title (~140 chars) + 2nd advisor: dept line >=275; my 9-line title: PDF cover spills to page 2 (5 lines) and inner cover to a 2nd page (adv-phd p1-4) | overflow |
| docx-equation | OMML Cambria Math | plain text paragraph 'E = mc²(3.1)' with center/right tabs, no math object | font requirement not carried |
| docx-approval-frame | thickThin top/left, thinThick bottom/right | tblBorders thickThinSmallGap on all four sides, sz 24 | bottom/right styles differ from template |

## INFO / decisions recorded
- outer-cover-vs-example-p32: export uniformly 0.46-0.72 mm lower
- approval-jury-pitch-vs-guide: 14.29 / 4.87 (follows template LibreOffice geometry 14.29/4.87)
- abstract-tail-order: keywords then year line (+41.4pt steps); roman number 'ix' = last front page, 26 arabic
- ack-signature: 62.1pt
- optional-lines-collapse: adv phd p3: without project line the cover shifts up 7.25 mm (AKÜ at 43.13); without 2nd advisor rows vanish
- word-gaps: 124 gaps 0.58-0.9 mm (kern pair with space, e.g. 'DOKTORA TEZİ' 0.73, 'Yerleştirme Merkezi' 0.58); text extraction sees 'YerleştirmeMerkezi'
- docx-sections: 22 sections; all pgMar top/left/right 1701 twips except cover 3118/11995 and approval 1593/1809; bottom 567 twips (10 mm) on sections 1-4 (frame 3 cm rule not carried); footer distance 709 twips = 12.5 mm; PAGE field 10pt TNR centred
- docx-libreoffice-render: master 38 pages (editor 39: 2-line stub page merged), phd 39; first baselines 33.95, page number baseline 283.58, cover/approval/ethics/abstract positions equal within 0.5 mm; adversarial docx 38/37 pages

## Passes
page-size, fonts-embedded, margins-lr, margin-top-first-baseline, margin-bottom, body-pitch-para-gap, body-indent-align, headings-numbering-gaps, pagenum-format-pos, outer-cover-box, inner-cover-baselines, approval-text-baselines, ethics-baselines, abstract-header-block, toc-rows, toc-page-labels, list-page-labels, lists-rows, symbols-list, captions-format, table-rules, bibliography, cv-page, page-drift, docx-fonts-sizes, docx-body-spacing, docx-bib-lists

## Rendered observations
- phd p3 (renders/01): approval frame line weights/order differ from guide p34; 7 jurors push frame to 283 mm; names after colon regular, guide shows small-caps SOYADI placeholders only (FAIL)
- master p21 (renders/02): wrapped caption first line displaced 1.6 mm right of margin, continuation left of first-line text (FAIL)
- adv-phd p19-21 (renders/03): two footnotes both numbered 1; \cdot dropped in equation (2.1); heading directly under caption/note too close (FAIL)
- master p1-5 editor vs LibreOffice DOCX (renders/04): cover, inner cover, approval, ethics, ÖZET positions equal; frame heavier in DOCX (INFO)
- adv-phd p1-6 (renders/05): 9-line title spills outer cover and inner cover to a second page; 7 jurors + 3-line affiliations spill approval to page 6 (FAIL)
- master p20,26,27 (renders/06): equation block spacing large; split table header repeated with '(Devam)' (FAIL(eq)/PASS(table))

## Spec findings
- SPEC: approval-box check fixes top 189.0 only for 5 jurors; with 7 jurors (mandatory by guide callout) the box moves and the 3 cm frame rule cannot hold at template pitch; spec has no rule for 6-7 juror layout or overflow.
- SPEC: no rule for heading spacing after a caption/note/table/equation although the guide sentence (§2.6) is explicit; heading-gap checks only cover text before headings.
- SPEC: caption-hanging check says continuation x0 = label width but does not check the first-line left edge; template picture (Word) has label at the margin.
- SPEC/SOURCE: ÖZET keyword/year order (§4.2.5 text vs Örnek 5-6) contradictory; ÖZGEÇMİŞ 'en son sayfa' vs EKLER order; both needsConfirmation.
- SPEC: approval frame 'symmetric double border' is not what the template/guide show (thin outer, thick 3pt inner) — spec never states weights.
- SPEC: footnote rules UNKNOWN but Word default (continuous 1,2,3) is evident; duplicate labels need a rule.

Known deviations examined: (1) equation spacing FAIL; (2) approval frame FAIL; (3) 7 jurors FAIL; (4) optional slots INFO (spec UNKNOWN); (5) Devam tables only: PASS (guide only defines tables); (6) Cambria Math FAIL/environment blocker; (7) DOCX rendered: informational, see docx checks.
