# MCBÜ LEE fix-2 (2026-10-02) — rule: official example XML wins over prose
Exports: master.{pdf,docx} (34 sheets), phd (35); lines-*.txt; regression/ (MBG, Coğrafya, SBE line dumps identical to previous).
C1 G[288]-G[328] is one page = the TOC example; applied to TOC (centred "BİRİNCİ BÖLÜM"+title rows, no page no., 1.5; sub-levels 0/7.41/17.99 mm; front rows single). Heading gets ownLine label (INFERRED), alignment stays prose (justified).
C2 ÖZET: left 1.06, first-line 6.35 mm, 1.5, after 10 pt (x 41.06/47.41 mm measured). ABSTRACT: first-line 12.5 mm, single, after 0 (x 52.50, pitch 13.79).
C3 gaps 7/5/5/8 empty lines: measured 112.27 pt (exp 112.7), 94.73 (94.3), 82.79 (82.8), 124.18 (124.2).
C4 centres 117.5 mm (text, logo; DOCX ind 567); city 112.5; no leading blank (T.C. b=29.61 mm).
C5 unchanged (already single). F16 spine: not implemented (print item). F17: engine observation (DOCX fields, pageBreakBefore), no template decision; unchanged.
Engine: generatedIndex.levelStyles lineHeight (+Word baseline compensation); unnumbered includePageNumber:true restores flex row; image blocks honour an enclosing group's left/right indent (CSS, DOCX, legacy PDF).
Tests: npm test 581 pass (new thesisMcbuFix2.test.js; thesisMcbu/EngineExtensions expectations updated to the new heading labels/cover).
