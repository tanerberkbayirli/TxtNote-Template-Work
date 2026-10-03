# aku-isg-tezsiz-proje — context pack
## Identity
- Registry id(s): `aku-isg-tezsiz-proje-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-isg.js` (exports: akuIsgTezsizProje)
- Spec: `orchestration/specs/aku-isg-tezsiz-proje.json`; checks: `orchestration/specs/aku-isg-tezsiz-proje.checks.json` (not yet); progress report: `orchestration/reports/aku-isg-tezsiz-proje.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Is_Guvenligi_Tezsiz_Proje/AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc`
- Template DOC 2022-08-02 (Donem Projesi sablonu, XML-level = primary; no guide). Locators: sectPr#N, styles T1/T2.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Real template XML only; instruction plan not implemented, body pages implemented from real XML (spec conflict).
- H1: T1 format used (3 of 4 headings; GIRIS differs); body first-line indent 0 (only real text sample).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins cover T/B/L/R (mm) | top 30/bottom 30/left 40/right 25 | TEMPLATE | sectPr#1 pgMar 1701/1418/1701/2268 |
| Margins front | top 25/bottom 25/left 30/right 30 | TEMPLATE | sectPr#2 pgMar 1418/1701 |
| Margins body | top 30/bottom 30/left 30/right 30 | TEMPLATE | sectPr#3 pgMar 1701 |
| Body font | Times New Roman 12 pt | TEMPLATE | styles.xml Normal rFonts TNR sz24 |
| Body paragraph | align both/lineSpacing 1.5/before 0/after 0/firstLineIndent 0 | MEASURED | document.xml paragraph 'Baykal vd. (2015)...' (only… |
| Page number style | font Times New Roman/sizePt 11/align center/position bottom | TEMPLATE | footer1/2.xml PAGE field sz=22, jc center |
| Front numbering | lowerRoman start 1; cover not counted; inner cover i not printed (titlePg, no first footer) | TEMPLATE | sectPr#2 pgNumType lowerRoman start=1 + titlePg |
| Body numbering | decimal restart at 1 at GİRİŞ, printed on first page | TEMPLATE | sectPr#3 pgNumType start=1, no titlePg |
| TOC rows | toc 1: bold single; right dot tab 8210 twips (144.8 mm); toc 2 bold 1.5 lines 6/6 | TEMPLATE | styles T1/T2 |
## Open issues
- FAIL (independent-2, 2026-10-02, partial): inner-cover 2-line title spills city/year to a separate sheet in editor PDF (Word fits), shifting Roman front-matter labels; footer: source 12.506 mm (709 tw) PAGE paragraph + trailing empty paragraph (TNR 11 pt) vs output 17.4 mm single PAGE paragraph. Report: orchestration/validation/aku-isg-independent-2/REPORT.md
- CONFLICT: 4. UNKNOWN: 9 (captions, footnotes, block quote, equations, appendix, CV, list-entry formats, table borders).
## Status
- FAIL; commit d4a3a7e. Untouched in session 2.
## Next step
- Fix footer to 12.5 mm + trailing blank paragraph and inner-cover wrap, then checker run.
## Commands
- `node orchestration/tools/check.mjs --target aku-isg-tezsiz-proje` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Template .doc; orchestration/validation/aku-isg-independent-2/* renders; orchestration/artifacts/aku-isg-tezsiz-proje/. Other targets' specs/validation folders.
