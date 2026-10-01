# attempt-3 partial notes (validator, running log)

Scratch dir (not committed): /tmp/claude-0/-home-user-TxtNote-Template-Work/1de75a0c-3317-5a78-a2ff-0c107945a450/scratchpad/w3
Fresh exports: a3-master.{pdf,docx}, a3-phd.{pdf,docx} (39 pages each; fixtures regenerated with make-fixture.mjs).

## Early observations
- Fonts: only TimesNewRomanPSMT / -BoldMT / -ItalicMT (name table family "Times New Roman") drawn; no FFFD; equation drawn with TNR (documented limitation).
- Approval page: text right edge 176.2 mm and frame 27.32-178.91 mm = template XML (table 8505 twips); the Word-made guide example p.34 shows 179.75 / 181.39. Documented conflict; template wins per decisions. INFO.
- Symbols page: "Simgeler" baseline 48.55 (template blank 1.5 line) vs guide example 46.07 (single blank). Spec picks template. INFO / source conflict.
- Heading number text layer: "5." and "TARTIŞMA" are separate spans without a space char (visual gap = one space, 34.19 mm); text search for "5. TARTIŞMA" would not match. INFO (visual correct).
- Page-number baseline 283.53-283.7 mm (template footer 12.5 mm); guide example pages vary 276.18/279.65 -> guide is inconsistent, template wins.

## FINDING F1 (FAIL, equations): block equation followed by an extra blank line in some positions
- Default fixture (a3-master/phd), chapter "3. YÖNTEM", PDF page 20: last line of the paragraph before the equation 194.57 mm, equation baseline 208.99 (40.9 pt, expected 41.4), next paragraph 231.36 -> eq->next = 63.4 pt (expected 41.4; +22 pt = one extra 1.5 line, 7.8 mm).
- Reproduced deterministically in eq-ch2 export (61.9 pt), and in the eqpos sweep (equation after k paragraphs): pages with eq baseline 238.38 mm -> eq->next 62.1 pt (cases Q102, Q141); the other 26 of 28 positions give 41.4/41.4.
- Editor DOM (inspect): `.math-formula--block` margin-top -27.581px, `data-thesis-eq-pad-before=27.581`, next `P` margin-top 27.6px, measured gap 63.9 px. Looks like a rounding/measurement boundary in the equation placement (blockGap eq nominal vs measured), position dependent.

## Progress (attempt 3)
- Scripts in scratchpad w3: acheck.py/acheck2.py/acheck3.py/acheck4.py (PDF whole-spec), runA.py; pairs (169 ordered pairs of 13 block kinds) exports pairs1-3; bottom sweep bot1-3 (90 cases); eqadv (37 eq contexts).
- B1 PASS: all 169 pairs: PDF line-box gap == DOCX w:after(prev)+w:before(next) within 0.04 pt (table pairs +0.75 pt = one rule width, modelled). Note first line at page top starts 35.41 (own before kept; INFO).
- B2: F1 root cause: failing equations have no `data-thesis-eq-pad-after` attribute (DOM inspect eqpos.json idx 21, 28 -> gap 63.9 px vs 29.4 px; passing ones have 27.588). Tall (fraction/sum/integral), wide (wrapped in 3 lines, number does not overprint), Greek/operators OK; documented glyph limitation confirmed (∇ ∈ ⇒ ∀ ∃ ⊂ ∪ ∝ ∮ absent); \vec accent arrow not drawn (INFO).
- Bottom sweep (90 cases: heading/fig/photo/table(+note)/list/eq/footnote/long-paragraph across the page bottom): no stranded heading/caption, no line below 267.3 mm, continuation pages start at 33.95/33.62.
