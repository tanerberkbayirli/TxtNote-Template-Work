# aku-fbe — context pack
## Identity
- Registry id(s): `aku-fbe-master-tr-v1`, `aku-fbe-phd-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-fbe.js` (exports: akuFbeMaster, akuFbePhd)
- Spec: `orchestration/specs/aku-fbe.json`; checks: `orchestration/specs/aku-fbe.checks.json`; progress report: `orchestration/reports/aku-fbe.md`
## Sources
- `orchestration/official-sources/aku-fbe/AKU_FBE_Tez_Sablonu_online_2023.docx`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Enstitusu_Tez/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Enstitusu_Tez/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf`
- (supplementary) `orchestration/official-sources/aku-fbe/Fen_Bil_Ens_Tez_LaTeX_Sablon_2020.rar`
- Template DOCX 2023-12-20 (official FBE; XML = primary) and its 2025 resave (identical, supplementary); guide PDF 2020 (prose); LaTeX .rar 2020 supplementary.
## Rulings
- FBE outer-cover exception, recorded in `orchestration/reports/AKU_DECISIONS.md`: the required text box is x=55–155 mm, y=210–275 mm, top-anchored at 210 mm; reject the 2023 template mock-up positions because they lie outside this box. Do not replace this ruling with generic DOCX-XML precedence.
- Elsewhere use the recorded AKÜ precedence: explicit newer/more-specific source text first; official template XML for matters text leaves unstated; example geometry last. Preserve unresolved values in spec conflicts.
- Word source/template evidence governs; historical BLOCKED rationale discarded (progress lastError).
- The official 2023 DOCX/2025 identical resave is authoritative for measured structure (e.g. 1701-twip section margins); the 2020 guide supplies explicit requirements including the outer-cover box. The 2011 font guide is superseded by the 2020 guide.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 30 mm | EXPLICIT | p.5 §2.3 |
| Body font | Times New Roman 12 pt | EXPLICIT | p.5 §2.2 |
| Body line spacing | 1.5 | EXPLICIT | p.5-6 §2.4 |
| Word line model | mode word/singleLineEm 1.15 | MEASURED | p.32 single-spaced 12 pt pitch 13.80 pt; p.5 1.5-sp… |
| Para first-line indent / blank line | 0 / true | EXPLICIT | p.5 §2.4 |
| H1 size / bold | 12 pt / true | EXPLICIT | p.7 §2.8 |
| Page number position | bottom | EXPLICIT | p.6 §2.7 |
| Front format | roman-lower | EXPLICIT | p.7 §2.7 |
| Front start | section abstract-tr/value 1 | EXPLICIT | p.7 §2.7 |
| Figure caption | Şekil / below / scope chapter/format {chapter}.{n}/sequence arabic | EXPLICIT | p.13 §3.2 |
| Table caption | Çizelge / above | EXPLICIT | p.13 §3.2 |
## Open issues
- Latest checker run (2026-10-04 1710) had 10 FAIL; subsequent root audit identifies body-right 181.108 as a trailing-space glyph-box measurement artifact (shared checker now measures visible character extents; root reports max x1=180.070). Do not compensate margins.
- `CambriaMath` in a whole-body font check came from equation glyphs; FBE source states prose font Times New Roman but does not establish the math font. Checker now scopes the exact-font rule to prose lines.
- Outer-cover center delta 0.537 mm is glyph-bbox centering, not evidence to move the text; preserve center alignment and avoid geometry/font compensation absent a better line-layout comparison.
- Word-vs-editor cover pagination was a real FAIL in the 17:42 checker run: Word split its date onto page 2 while editor kept the cover on page 1. A generic fixed-height flow-textbox path now anchors the cover's existing x/y/w geometry with height ending at source y=275 mm, independent of the 267 mm section text bottom; root must verify with fresh real exports/Word.
- Approval baselines remain within/near source comparison and are not changed here. Long-title/co-advisor overflow is Tier 2 UNKNOWN unless the official source defines capacity.
- CONFLICT: 18 in spec (right margin, page-number vertical position, approval pitch/box, chapter->first-paragraph gap, OZGECMIS vs EKLER order). UNKNOWN: 16 (footnotes, max title length, approval co-advisor slot).
## Status
- The generic floating-table `cantSplit` option was tested and reverted; fresh master Word output still split the date onto page 2 although `<w:cantSplit/>` was emitted. The cover now uses a generic fixed-height page-anchored flow textbox with zero insets and natural Paragraph wrapping; existing x/y/w geometry is preserved and the frame bottom is y=275 mm.
- Structural unit tests verify page anchoring, fixed extent, zero insets, and dynamic text Paragraphs. Real export and Word pagination verification remain pending; do not claim PASS until root's run.
- Fresh real-export/Word verification remains pending; initial checker results are superseded where the shared visible-glyph measurement fix applies.
## Next step
- Root owns follow-up real Word verification after an effective source-frame design is established; inspect only page count/order and source-supported outer-cover print-box failures. Preserve unresolved source geometry conflicts.
## Checker and fixtures
- Checks: `orchestration/specs/aku-fbe.checks.json`; covers A4, four DOCX margins for every emitted section, body text/font/pitch, outer-cover print-box bounds, guide-derived approval baselines, and DOCX field validity.
- Fixtures: `aku-fbe.fixture.master.json` and `aku-fbe.fixture.phd.json`, generated from `make-fixture.mjs` with `aku-fbe.fixture-overrides.json`; doctorate fixture has a co-advisor and seven jury rows.
- Reference cache: `orchestration/artifacts/aku-fbe/source/reference/reference.json` was built from the pre-existing `source/word-render/official.pdf` and `.docx`; no Word render was run and the originals remain untouched.
- Run both layout and Word measurement: `node orchestration/tools/check.mjs --target aku-fbe --word`. Root serializes real exports and Word renders.
- The official cached Word source reports all four margins at 1701 twips (30.004 mm). Its outer-cover title baseline (208.39 mm; glyph top 204.62) violates the guide's explicit 210–275 mm print box. Its approval baselines (34.55/49.16/92.98/114.87 mm) differ from guide-derived targets (33.96/48.48/92.30/114.19 mm) by +0.59/+0.68/+0.68/+0.68 mm. These source conflicts are retained as checker notes; they are not evidence of product-export results.
- No implementation geometry changes made: template code already configures DOCX source margins as 30 mm; the source-only report cannot diagnose an exported-document defect. Revisit only on real export failures.
## Commands
- `node orchestration/tools/check.mjs --target aku-fbe` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF 2020; orchestration/validation/aku-fbe/{work,work2,renders,attempt-4-proof,attempt-5-equation-repro}; orchestration/artifacts/aku-fbe/source/word-render/; the LaTeX .rar. Other targets' specs/validation folders.
