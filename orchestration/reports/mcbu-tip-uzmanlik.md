# mcbu-tip-uzmanlik - Manisa Celal Bayar Üniversitesi, Tıp Fakültesi, tıpta uzmanlık tezi

Status: **PASS (self-check)** for every source-backed, engine-expressible check (52/52 measured on the real export); one **engine gap** (no page number on chapter first pages) and several **needsConfirmation** readings, listed below.

## Result
- Registry id: `mcbu-tip-uzmanlik-tr-v1` (universityId `mcbu`, instituteId `tip`, degreeType `specialization` - allowed by `schema.d.ts`/`validation.js`), inserted after `mcbu-lee-phd-tr-v1` in `registry.js`.
- Files: `TxtNote/frontend/src/thesis/templates/mcbu-tip.js`, `TxtNote/frontend/src/lib/thesisMcbuTip.test.js` (7 tests), `orchestration/specs/mcbu-tip-uzmanlik.json` (58 rules: EXPLICIT 33, MEASURED 4, INFERRED 14, UNKNOWN 7; 10 conflicts, 12 unknowns, 2 engine gaps), `orchestration/validation/mcbu-tip-uzmanlik/self-1/` (fixture, `tip.pdf`, `tip.docx`, `selfcheck.py`, `selfcheck.out.txt`), `orchestration/artifacts/mcbu-tip-uzmanlik/source/` (text-line dump, 3 page renders).
- Source: only `MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf` (6 pages, PDF metadata 2014-08-27, undated text, former name "Celal Bayar Üniversitesi"; still the guide linked on the faculty page). No Word template. Nothing taken from `templates/mcbu.js` (LEE) or any AKÜ template (structure only).
- Tests: `npm test` 563 tests, 562 pass, **1 fail outside this unit**: `src/lib/thesisMcbu.test.js` "A: both variants are valid official templates..." filters the registry by `universityId === "mcbu"` and expects exactly the two LEE entries. The new entry (universityId `mcbu`, as requested) makes it 3. Not edited (other unit's test); one-line fix for its owner: filter `entry.universityId === "mcbu" && entry.instituteId === "lee"`. (The engine test "distinct H1/H2/H3 numbers" also constrains sub-heading labels; see H2 numbering below.)

## Document structure implemented (guide order, Ek-2)
Dış kapak, İç kapak (same layout, "birbirinin benzeri"), ÖNSÖZ, İÇİNDEKİLER, then the author's Roman-numbered chapters in one editable section (I. GİRİŞ, II. GENEL BİLGİLER, III. GEREÇ VE YÖNTEM, IV. BULGULAR, V. TARTIŞMA, VI. SONUÇ VE ÖNERİLER), then ÖZET, İNGİLİZCE ÖZET, EKLER (optional), KAYNAKLAR as the next Roman-numbered headings (Ek-2 numbers I..X through KAYNAKLAR). No approval/jury page, declaration, acknowledgements, symbols or table/figure lists: the guide defines none.

## Measured export vs source (real editor export, `tip.pdf` / `tip.docx`; tolerance 0.25 mm)
| Check | Expected (evidence) | Actual | |
|---|---|---|---|
| Page | A4 (EXPLICIT §1.1) | 210 x 297 | PASS |
| Left / right text edge | 40 / 185 mm (EXPLICIT §1.2: 4 cm, 2.5 cm) | 39.998 / 184.935 | PASS |
| Top / bottom margin | 30 mm (INFERRED from "en fazla 3 cm yaklaşılabilir") | first baseline 33.97 (=30 + 0.9377 em), text bottom well inside 267 | PASS |
| Body | Arial 12, left, 1.5 lines (EXPLICIT §1.3) | embedded genuine Arial only, 12 pt, pitch 7.30 mm (20.7 pt) | PASS |
| Paragraph | 5 harf indent -> 5.88 mm, no extra spacing (INFERRED) | x0 45.876, paragraph pitch 7.301 | PASS |
| First-page titles (önsöz, içindekiler, chapters) | top 50 mm, centred, 30 mm gap (EXPLICIT §1.2) | top 49.99-49.993, centre 112.49, gap 29.999 | PASS |
| Page labels | covers/önsöz/içindekiler none; Arabic from GİRİŞ = 1 (EXPLICIT §1.4) | blank x4, then 1..26 | PASS |
| Page number | bottom centre (EXPLICIT; centre of text area 112.5) | centre 112.496, 12 pt, baseline 283.55 | PASS (distance from edge UNKNOWN) |
| Cover gaps (Ek-1, MEASURED) | 10.24 / 47.25 / 43.56 / 5.51 / 38.35 / 8.72 / 41.49 mm | 10.236 / 47.249 / 43.552 / 5.511 / 38.344 / 8.715 / 41.486 (both covers) | PASS |
| Cover sizes | univ 12, anabilim 12, title 14, UZMANLIK 14 | same | PASS |
| Contents | left edge 40, main rows 1.5 / sub rows single, no leader, bold "Sayfa" | 39.998, 7.296 / 4.866 mm, none, bold | PASS |
| Captions | "Tablo 1" above, "Şekil 1" below, document-wide Arabic | as expected | PASS |
| Bibliography | hanging 6.35 mm (MEASURED), entry gap 17.7 pt | 46.348, step 11.108 (exp. 11.1125) | PASS |
| DOCX | pgMar 30/25/30/40, Arial only, H1 spacing 1134/1701 twips | 1701/1417/1701/2268, Arial, 1134/1701 | PASS |
| Chapter first pages carry no number | EXPLICIT §1.4 | the number "1" is printed on GİRİŞ's first page | **ENGINE GAP (known FAIL)** |

## Conflicts (all recorded in the spec; needsConfirmation = C)
1. Page number position: rule says bottom centre, the same paragraph's example says "üst sağa yazılan 2" -> bottom centre implemented (C).
2. Cover title size: prose 14 pt vs Ek-1 example 12 pt -> 14 pt for title and UZMANLIK TEZİ, example gaps kept (C).
3. Cover "satır" counts (6 / 6 / 4 lines) vs example gaps (6.5 / 6.0 / 5.3 lines of 7.3 mm): example's measured gaps used. "Sayfanın en altına Manisa, yıl": example's 41.5 mm gap used (about 49 mm above the sheet edge).
4. İÇİNDEKİLER title: prose centred at 50 mm vs Ek-2 sample left-aligned -> prose (C).
5. University name on the cover is the former "CELAL BAYAR ÜNİVERSİTESİ TIP FAKÜLTESİ" (guide example); kept as the default of an editable cover field (C).
6. The guide's own pages (Arial Narrow 11 pt, justified, single, ~18-20 mm margins) contradict its rules; prose used, own pages not used as geometry. Bibliography examples are justified; left alignment applied (C).
7. "SONUÇ VE ÖNERİLER" (§XI) vs "SONUÇLAR VE ÖNERİLER" (Ek-2): author types the heading.

## INFERRED readings that need confirmation
- Top/bottom 30 mm ("Üst ve alt kenarlara en fazla 3 santimetre yaklaşılabilir").
- Paragraph indent "5 harf boşluk" = five Arial-12 space glyphs = 5.88 mm (five average letters would be ~10-12 mm).
- "Paragraflar normal satır aralıklarıyla ayrılırlar" = no extra paragraph spacing.
- Heading weight/size (bold, 12 pt, capitals for chapters: from the guide's own headings and Ek-2). Sub-heading numbers "1.1." (the guide prints "1. 1."; the unspaced form is also what the shared engine test requires). H3/H4 continue the same pattern.

## UNKNOWN (not invented; engine/Word neutral value or general 12 pt rule used and named in `source.notes`)
Header/footer distance (12.5 mm Word default as a technical placeholder), page-number typography, sub-heading spacing (0, like the guide's own pages), caption separator/size/weight, table typography and borders, footnote size, equations, abstract page layout (heading block, keywords, word limit), absolute cover top distance, relation to the LEE guide, whether a newer guide exists (document is from 2014).

## Engine gaps (not worked around, engine untouched)
1. **No page number on the first page of each chapter** (guide §1.4, EXPLICIT: "Bölümlerin ilk sayfalarına numara konmaz"; GİRİŞ's first page counts as 1). `NumberingRule` is per page group; `footer.firstPage: "omit"` hides only header/footer text; all chapters are H1s inside one editable section. Suggested generic capability: a numbering option that suppresses the number on the page that starts with a `pageBreakBefore` heading (counted, not printed) in editor, layout PDF and DOCX.
2. Section length limits (Önsöz/Özet at most one page, Genel Bilgiler at most 1/3 of the thesis): advisory page-count validation per section does not exist.

## Notes for the integrator
- Required `[universityId: "mcbu"]` registry grouping now has a third entry; fix `thesisMcbu.test.js` (see above) before committing. No other shared file was touched. `registry.js` stayed CRLF.
- Page 4 (contents) of the export has no leader and a right-aligned page column; the Ek-2 sample's numeral column is right-aligned at 25.7 mm in the guide's own layout, which the engine cannot reproduce (numbers are inline labels).
- Running `selfcheck.py` needs the export first: `node orchestration/tools/make-fixture.mjs mcbu-tip-uzmanlik-tr-v1 <dir>/fixture.json <dir>/overrides.json && node orchestration/tools/export.mjs <dir>/fixture.json <dir>/tip` (env vars as in `AKU_DEPT_WORKER_BRIEF.md`).
