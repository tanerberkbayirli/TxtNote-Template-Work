# ADÜ Ziraat Lisans — context

- Registry: `adu-ziraat-lisans-tr-v1`; module: `engine/src/templates/adu-ziraat-lisans.js`.
- Authority: cached `orchestration/artifacts/adu-ziraat-lisans/source/official.pdf`, its extracted `paragraphs.jsonl`, and official embedded example; source metadata verified 2026-10-04.
- Run: `node orchestration/tools/check.mjs --target adu-ziraat-lisans --word` with root's serialized server/Word workflow. Fixture: `orchestration/specs/adu-ziraat-lisans.fixture.json`.

## Source values and rulings

| Requirement | Value | Class / locator |
|---|---|---|
| Page/margins | A4; T/L/R 30 mm, B 20 mm | EXPLICIT ¶142 |
| Body | Times New Roman 12 pt, black, justified; first-line 10 mm; before 0, after 6 pt; 1.5 lines | EXPLICIT ¶126, ¶133-134 |
| Headings | H1 14 pt bold centered uppercase; H2-4 12 pt bold left; decimal numbering | EXPLICIT ¶153-156; H1 two lines after and H2/H3 one line before/after ¶138 |
| Front/body labels | lower Roman front, Arabic main starts 1; covers unnumbered | EXPLICIT ¶150 |
| Ethics | required, odd-numbered printed page; follows thanks in front matter | EXPLICIT ¶434 and TOC ¶525-526; physical recto is INFERRED |
| Cover example | baseline mm from page top: T.C. 33.577; university 40.605; faculty 47.547; department 54.575; code 61.602; title lines 98.231/104.708/111.185; student 140.014; degree 149.461; advisor label 177.867; advisor 187.265; city/year 251.199 | MEASURED official.pdf p.30; source strings ¶463-466, ¶472, ¶476-483, ¶493 |
| Cover conflict | ¶330 prose says top lines single-spaced; embedded sample measures ~6.94 mm pitch for 12 pt. Follow specific official sample geometry; preserve both source values. ¶344 prose double-spacing also differs from sample pitch/positions. | EXPLICIT vs MEASURED; project source-priority ruling uses official example where it is more specific |
| Figures/images/tables | photo caption label “Resim”; separate figure, photo and table indexes, each separate page | EXPLICIT ¶285, ¶360 |
| Abstract/thanks | abstract ≥250 words and ≤2 pages; single-spaced, no first indent; thanks ≤1 page | EXPLICIT ¶351, ¶366, ¶371-372 |

Publication-derived ethics declaration wording is a source-supported conditional alternative; the fixture uses the official non-publication sample text ¶501-509. Do not claim that variant or source-defined image/table overflow behavior is independently validated unless checks cover it. Sample cover contains an exact three-line title. No implementation/export/Word PASS is claimed by this context pack; see checker output.

- Phase 3 (2026-10-07): source-derived body-margin landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.

## Phase 5.1 checkpoint — 2026-10-07

Cover baseline FAIL unchanged; measured source/PDF/Word pitch evidence in phase51 triage. No spacer compensation; typography investigation belongs to 5.2. See `orchestration/validation/word-compat/phase-5.1/acceptance.json`.
