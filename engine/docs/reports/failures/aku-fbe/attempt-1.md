# Failures aku-fbe attempt 1

## heading-gap-before-after-caption-note-table
- expected: 14.60 mm
- actual: H2 after table note (10pt) 6.83 mm (p17); H2 after figure caption 6.91 mm (p21); H2 after table last row 9.37 mm (p27). Same in DOCX: note/caption spacing after=120 twips, heading before=0
- difference: -7.77 / -7.69 / -5.23 mm
- root cause / fix: engine: caption/note spaceAfter 6pt, heading spaceBefore 0; fix: heading spaceBefore = 20.7pt (or previous-block spacing rule) after caption/note/table.

## approval-frame
- expected: thin-outer/thick-inner, 3.0pt inner
- actual: outer 1.5pt + inner 0.75pt (thick outside, thin inside); outer left 28.10, right 178.10 (x-width 150.0); top 189.02; DOCX tblBorders thickThinSmallGap on all 4 sides
- difference: line weights 3.0 vs 1.5pt, order reversed; left +0.79 mm, right -0.81 mm vs template; -3.3 mm width vs guide
- root cause / fix: template data/engine group border: border style is symmetric 1.5+0.75pt; needs thin-outer/thick-inner 0.75+3pt (Word thickThin/thinThick) and box x 27.32-178.91.

## approval-7-jurors-bottom
- expected: <=267
- actual: phd p3: last text baseline 279.08, box bottom ~283.5 (approval section bottom margin 12 mm/10 mm in DOCX); director block starts 264.5
- difference: +12.1 mm text, +16.5 mm frame
- root cause / fix: template data: 14.29 mm pitch; either compress juror rows for 7 jurors or accept and record a deliberate second page.

## caption-first-line-offset
- expected: 30.0
- actual: wrapped captions: label x0 31.59 (Şekil 3.1 master p21), 31.19 (Çizelge adv p25), 30.47 (adv p21); continuation 44.97 vs first-line text 46.57 (1.6 mm left of first-line text)
- difference: +1.59 / +1.19 mm
- root cause / fix: engine caption layout: hanging via negative indent + justification shifts first line; use tab/hanging like Word.

## equation-spacing
- expected: 14.60 mm
- actual: before 22.45 mm (p20 master 194.54->216.99), after 13.0 mm (217.15->230.15); DOCX paragraph gives 414/414 twips (correct) -> PDF and DOCX disagree
- difference: +7.85 / -1.6 mm
- root cause / fix: engine block equation line box (KaTeX 14.5pt line-height).

## equation-font-size
- expected: Cambria Math 12pt
- actual: math glyphs 'E = m c' at 14.52pt TNR (Cambria Math not installed: fc-list empty); number '(3.1)' 12pt x1=180.0 PASS; DOCX equation is plain text 'E = mc²' in TNR 12pt, no OMML
- difference: +2.5pt size; wrong family
- root cause / fix: font Cambria Math unavailable in environment: BLOCKED-with-evidence for family; size must be 12 pt.

## equation-glyph-integrity
- expected: F = a ∙ b
- actual: adv-phd p20: LaTeX 'F = a \cdot b' rendered 'F = a   b', operator glyph missing in PDF
- difference: glyph dropped
- root cause / fix: KaTeX symbol glyph (U+22C5) not in TNR fallback.

## footnotes
- expected: 1,2
- actual: phd/master: footnote text labels '1' on every note; adv-phd p19 two notes on the same page both '1' (body marker and note); text 10pt, marker 7.5pt
- difference: duplicate labels
- root cause / fix: engine footnote label counter per marker '1'; number sequentially.

## outer-cover-long-title
- expected: <=275
- actual: 4-line title (~140 chars) + 2nd advisor: dept line >=275; my 9-line title: PDF cover spills to page 2 (5 lines) and inner cover to a 2nd page (adv-phd p1-4)
- difference: overflow
- root cause / fix: template data: no compaction; add fit rule or reduce spacers when title >2 lines.

## docx-equation
- expected: OMML Cambria Math
- actual: plain text paragraph 'E = mc²(3.1)' with center/right tabs, no math object
- difference: font requirement not carried
- root cause / fix: DOCX writer emits plain text, no OMML/Cambria Math.

## docx-approval-frame
- expected: thickThin top/left, thinThick bottom/right
- actual: tblBorders thickThinSmallGap on all four sides, sz 24
- difference: bottom/right styles differ from template
- root cause / fix: DOCX writer uses thickThinSmallGap on all sides; template uses thinThick on bottom/right.

