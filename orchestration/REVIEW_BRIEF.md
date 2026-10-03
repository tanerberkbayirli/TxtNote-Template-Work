# Spec reviewer brief (independent cross-validation before implementation)


You did NOT write the spec. Re-derive requirements from the official sources yourself and try to
find what the analyzer got wrong. Sources are read-only; never modify `TxtNote/` or `Butun-Sablonlar/`.
You may edit only `orchestration/specs/<id>.json`, `orchestration/reports/<id>.md` (append a
"## Spec review" section) and `orchestration/artifacts/<id>/review/`.

Check explicitly:
1. Missed requirements (compare the spec's rule keys and sections with the source's table of contents/headings; open only the pages where a gap is suspected; reuse cached renders under `artifacts/<id>/source/`).
2. Guessed numbers (any value without evidence or with confidence higher than its evidence supports).
3. Word defaults mistaken for university requirements (e.g. styles.xml docDefaults, Normal style values the template never uses, Word's built-in heading styles).
4. General guidelines wrongly applied to a specialized template, or vice versa.
5. Turkish/English and Master's/PhD/undergraduate differences missed or invented.
6. Cover/approval/declaration pages treated as ordinary body pages; positioned elements, tables, frames, text boxes flattened incorrectly; section properties (w:sectPr per section, titlePg, pgNumType start/fmt) ignored.
7. For every conflict marked needsConfirmation: propose a DECISION with evidence using the policy order — explicit newer/more-specific text > official template XML for what the text leaves unstated > example-page geometry; never average two official values; if genuinely undecidable, keep UNKNOWN and say what is missing.
8. Word layout model facts the implementation depends on — verify from Word-produced source PDFs where possible and record as rules `wordModel.*` with evidence:
   a) `wordModel.firstBaselineOffsetEm`: distance from the top of a line box (e.g. top margin) to the first baseline for single and for 1.5 spacing (Times New Roman: hhea ascent 0.891 em, lineGap 0.0425 em; hypothesis: Word baseline = top + (lineGap + ascent), extra leading of "1.5 lines" goes BELOW the text).
   b) `wordModel.paragraphSpacing`: is inter-paragraph space `after(prev)+before(next)` (additive) or collapsed; does `w:contextualSpacing` apply; is space-before suppressed at the top of a page. Only record what the sources demonstrate.
9. `measurableChecks`: complete (page size, 4 margins, body font/size/pitch/indent/spacing, H1–H4, page numbers per part incl. baseline distance from the page edge, each special page element, captions, TOC, bibliography, footnotes) and each expected value traceable to a rule.

Fix the spec in place (keep valid JSON; bump `"reviewedAt"`, add `"review": { "reviewer": "independent", "changes": [...], "decisionsProposed": [...], "openItems": [...] }`).
Return ≤ 15 lines: changes made, decisions proposed, remaining UNKNOWNs that block implementation.
