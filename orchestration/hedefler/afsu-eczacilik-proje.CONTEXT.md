> Tarihsel hedef kaydı: aşağıdaki durumlar, komutlar ve kararlar kendi tarihlerine aittir; güncel görev veya kaynak önceliği talimatı değildir. Önce [BASLA.md](../BASLA.md), [rapor dizini](../raporlar/README.md) ve hedefin güncel kaynak kaydı değerlendirilir. Eksik tarihsel kanıt yolu güncel doğrulama sayılmaz.

# afsu-eczacilik-proje — context pack
## Identity
- Registry id(s): `afsu-eczacilik-proje-lisans-tr-v1`
- Template module: `engine/src/templates/afsu-eczacilik-proje.js` (exports: afsuEczacilikProje)
- Spec: `engine/specs/afsu-eczacilik-proje.json`; checks: `engine/specs/afsu-eczacilik-proje.checks.json` (not yet); progress report: `orchestration/reports/afsu-eczacilik-proje-source.md`
## Sources
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Eczacilik_Arastirma_Projesi/AFSU_Eczacilik_Arastirma_Projesi_Dersleri_Yonergesi_2024.pdf`
- Yonerge PDF 2024 (13 pp, sha256 ec76ed61..; EK-1 report-writing requirements and examples EK-1.1-1.4). Course research-project report, not a thesis; spec says registry variant 'not assigned' but registry has afsu-eczacilik-proje-lisans-tr-v1.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Outline s2 p.7 omits Onay but s2.2 p.10 and EK-1.3 establish it -> Onay included (CONFLICT, handled).
- 'Giris ve Amac' (p.4 example) vs 'GIRIS' (outline/s2.3): GIRIS used. Spec schema differs (requirements[], conflictsAndUnknowns[]).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/L/B/R | 3.5 / 4 / 2 / 2 cm | EXPLICIT | PDF p.3 EK-1 s1.1-1.2 |
| Body font / size | Times New Roman 12 pt | EXPLICIT | PDF p.3 EK-1 s1.3 |
| Main heading | TNR 14 pt bold, centred, UPPERCASE, new page | EXPLICIT | PDF p.3 EK-1 s1.3 |
| Subheadings | 12 pt bold, left, Title Case (max 4 numbered levels) | EXPLICIT | PDF p.4 EK-1 s1.5, s1.7-1.8 |
| Body spacing | 1.5 lines; no first-line indent; 12 pt total between paragraphs (before/after split UNKNOWN) | EXPLICIT | PDF p.4, p.11 EK-1 s1.5, s2.4.1 |
| Single-spaced parts | captions, citations, footnotes (10 pt), references (6 pt after) | EXPLICIT | PDF p.4 EK-1 s1.9 |
| Page numbers | bottom centre; Roman before Giris, Arabic from Giris | EXPLICIT | PDF p.4 EK-1 s1.7 |
| Captions | table above, figure below, 10 pt single, chapter-based numbering (Tablo 1.1) | EXPLICIT | PDF p.4 s1.7, p.6 s1.12 |
## Open issues
- FAIL (independent-1, 2026-10-03): B1 OZET/ABSTRACT 12 pt after heading exp 34.3 pt act 22.3 (-4.23 mm, also in Word); B2 department line prefix/suffix ('...... ANABILIM DALI'; approval wording); B3 editor-PDF footnote pitch 4.98 vs 4.06 mm (engine); B4 DOCX TOC rows Word pitch 11.51 vs 7.30 mm, Word 44 vs 41 pp (engine); B5 DOCX table rows +4.5 mm/row, caption stranded (engine). Report: orchestration/validation/afsu-eczacilik-proje/independent-1/REPORT.md
- self-2 (v6, 2026-10-02): page-number centre 104.993-105.038 vs 105.00 mm on 66 pages - supersedes v5 +9.99 mm fail. UNKNOWN: footer distance, cover font sizes, signatory typesetting.
## Status
- IN_PROGRESS; validation PENDING (independent-1 FAIL B1-B5; v6 self fixes some); commit 4ff8e65; engine-fix-4 shared gaps open.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- Fix B1/B2 template items; engine-fix-4 for B3-B5; then checker run.
## Commands
- `node engine/tools/check.mjs --target afsu-eczacilik-proje` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node engine/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Historical reading boundary (not a current instruction)
- Yonerge PDF; orchestration/validation/afsu-eczacilik-proje/{self-2,fix-1,fixture.json,independent-1 renders}; orchestration/artifacts/afsu-eczacilik-proje/ source-page PNGs. Other targets' specs/validation folders.

- Footnote numbering (2026-10-04): engine default `footnotes.numbering: "document"` (one running sequence, = Word). UNKNOWN: sources do not state a footnote numbering/restart rule.
