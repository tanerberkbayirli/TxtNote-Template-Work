# Phase 5.2.4 style precedence fixture

The synthetic `engine-word-style-precedence` target isolates body fallback, global paragraph values, section overrides, named paragraph styles, and inline direct run formatting. Conflicts cover font family, size, canonical line pitch, and first-line indent; each fixture variant contains only its anchored text paragraph(s). These are explicit synthetic acceptance values, not university-source claims.

Expected canonical auto pitches are calculated from the declared font metrics: TNR/Arial `2355/2048 em`, Calibri `2500/2048 em`; pitch = single-line em × font size × multiplier × 25.4/72 mm. DOCX line values are the corresponding `240 × multiplier` twips. Inline direct formatting changes the named paragraph’s 14 pt run to 18 pt while retaining its paragraph indent.

Validation: `node orchestration/tools/check.mjs --target engine-word-style-precedence --word --out orchestration/validation/word-compat/phase-5.2/style-precedence` — **64 PASS, 0 FAIL, 0 SKIPPED** (`check-20261008-0951.json`; Word 16.0 build 20430). PDF and Word anchors agree within 0.5 mm for first-line x; measured pitches match the declared calculations within 0.02 mm. DOCX XML size, font, line, and indent gates pass.

Existing SBE English checks remain PASS for body font/size, line pitch, and indent in both English variants (`phase-5.1/regression/aku-sbe/check-20261007-1847.json`). Its four retained failures concern front/unnumbered page labels and remain Phase 5.3 scope.
