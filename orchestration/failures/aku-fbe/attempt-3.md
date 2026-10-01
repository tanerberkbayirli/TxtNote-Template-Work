# Failures aku-fbe attempt 3 (both variants)

Details, measurements and renders: `orchestration/validation/aku-fbe/attempt-3.md` / `.json`, `renders/attempt-3-09-F1-equation-extra-gap.png`, `attempt-3-07-*.png`.

## B2-eq-gap-after: block equation followed by an extra blank line (PDF, position dependent)
- expected: guide §2.10 (p.9) one blank 1.5 line after the equation: eq baseline -> next paragraph baseline 41.4 pt (14.61 mm), the same in every context.
- actual: default fixture (both variants) chapter "YÖNTEM", PDF p.20: previous paragraph last baseline 194.57 -> eq 208.99 mm (40.9 pt) -> next paragraph 231.36 mm: eq->next 63.4 pt (master) / 61.9 pt (phd). Sweep `eqpos` (k paragraphs before the equation, 28 positions): 26 positions 41.4 / 41.4, positions with eq baseline 238.38 mm: 62.1 pt (twice). Reproduces deterministically; single-case documents from the same paragraphs give 41.4.
- difference: +20.5..+22.0 pt (7.2-7.8 mm); limit 0.2 pt (0.5 mm).
- root cause (engine, editor equation placement): in the editor DOM the failing `.math-formula--block` elements have no `data-thesis-eq-pad-after` attribute (measured gap to the next block 63.91 px), while every good one carries `data-thesis-eq-pad-after="27.588"` (gap 29.43 px). The "pad after" measurement/attribute is not always written (depends on where the block lands in the paged layout). DOCX is unaffected (w:after 414 / next w:before 0).
- fix: make the after-pad deterministic (always set/clear it from the block-gap table, never depend on a layout pass that may skip an element; re-run when the equation moves between columns); add a test that sweeps the equation over line offsets on a page (as eqpos) and asserts 41.4 pt.
- reproduce: `node orchestration/tools/make-fixture.mjs aku-fbe-master-tr-v1 f.json && node orchestration/tools/export.mjs f.json out`, page 20; or a document with k = 0..14 paragraphs of one/two lines before a numbered `.math-formula--block` and one paragraph after (cases k=10, two-line paragraphs).

## B6-approval-fit-realistic-title (repeat of attempt-2 category)
- expected: with a realistic title (89-152 chars; the approval sentence then needs 6 lines) the approval page including the frame stays above the 267 mm bottom margin (attempt-2 fix request: compact the block when the sentence needs more than 5 lines).
- actual: title 89 chars: master frame bottom 269.99 mm (text bottom 266.03), PhD with 7 jurors 269.26 (text 265.30); 118/152-char titles identical (title only adds lines to the sentence up to 6). Default 71-char title fixture: 262.7 / 262.0. Attempt 2 measured 270.12 / 269.39 for the same situation.
- difference: +2.99 mm (master), +2.26 mm (phd) beyond 267; the frame crosses the page margin.
- root cause (engine/template): no compaction/pitch reduction for the fixed-height frame block when the sentence grows beyond 5 lines (the 7-juror compaction exists only for the jury rows). The DOCX has a 12 mm bottom margin for this section, so Word keeps the frame on the page; only the PDF/editor layout exceeds 267.
- fix: budget the approval block against 297-30 mm: when needed reduce juror pitch (and/or the blank lines in the frame) so frame bottom <= 267; add a fixture with a 90-150 char title to the tests.
