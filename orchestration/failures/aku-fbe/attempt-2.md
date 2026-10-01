# Failures aku-fbe attempt 2 (both variants)

Details, evidence and file references: `orchestration/validation/aku-fbe/attempt-2.md` / `.json`, renders `renders/attempt-2-equation-contexts.png`, `attempt-2-table-note-and-list-rows.png`.

## table-note-gap (PDF and DOCX)
- expected 5.46 mm rule→note baseline (guide p14: rule 228.59, note 234.05; template note before/after 6 pt); actual PDF 12.78, DOCX(LO) 15.63 (+7.3 / +10.2 mm)
- cause: engine `lineSpacing.blockGap: "paragraphPitch"` adds a blank 1.5 line after every table; the note's own 6 pt come on top (DOCX w:before=694). Fix: no block gap between a table and its `tableNote` (note gets before = 6 pt only); keep the gap after the note.

## equation spacing contexts
- expected 14.60 mm blank line before/after (guide p9, example 14.80 between consecutive equations)
- actual: after caption 5.87, table 10.44, note 8.02, list 10.49; consecutive equations 7.29; first on page +8.3 mm (42.3 vs 33.95); eq→figure −1.09, eq→list −1.08, eq→table caption +3.15; fraction +0.97/+1.27, integral +2.9/+2.2, sum +3.3/+3.8; DOCX has the same short gaps after caption/table/note/list (Word additive: 6 pt / 0 pt before the equation)
- cause: `layoutAdjust` (+3.74/+1.78 pt) and pad cancelling are calibrated for paragraph→eq→paragraph only; equation margins do not collapse/add against caption, table, note, list, other equations; not zeroed at page top; box height follows KaTeX content. Fix: give the equation block the same block-gap model as headings (previous-block spacing rule), drop before-space at a page top, fix consecutive block equations, and lay tall formulas out on the 1.5 line grid; DOCX: eq w:before = 20.7 pt − previous after.

## equation-wide / glyphs
- 18-term equation spans x 30–198.8 (22-term to 209.4) and overprints the number; \epsilon (U+03F5) and \phi (U+03D5) are dropped from the PDF (DOCX keeps them). Fix: scale/wrap wide formulas; add aliases ϵ→ε, ϕ→φ to `PDF_GLYPH_ALIASES` (or embed a math font).

## approval-fit-realistic-title
- 97–151-char title: PhD 7-juror frame bottom 269.39, master 270.12 (limit 267; text ends ≤ 265.1). Fix: compact the approval block (or reduce juror pitch) when the sentence needs > 5 lines.

## long-title-right-margin
- ÖZET title line 1 (151-char title) x 30.11–181.58 (+1.58 over 180); PDF draws whole unkerned lines (TNR width 151.56 mm) at browser positions computed with kerning; centred bold lines drift up to +0.63 mm. Fix: draw centred/left lines per word (as justified lines) or measure with kerning off.

## drift-long-document (engine, pre-existing)
- first baseline 33.30 at page 141/148 (−0.65 mm); −0.0047 mm/page, exceeds 0.5 mm after ~105 pages; identical in commit 0bef9db. Fix: sheet/column height rounding in the paged layout.

## DOCX
- docx-lists-rows: list rows w:after=0 (13.8 pt) vs 19.8 pt in PDF/spec. Fix: writer must emit the 6 pt after.
- docx-index-page-labels: TOC/lists are static text (no PAGEREF/TOC fields); LibreOffice render: 16/42 rows wrong.
- docx-devam-caption: static split into two tables with a '(Devam)' paragraph at the browser page break; appears mid-page when Word breaks elsewhere. Fix: omit static Devam captions in DOCX or emit them as repeated header rows only.
