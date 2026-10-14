# aku-isg-tezsiz-proje (AKÜ FBE İş Güvenliği İÖ tezsiz yüksek lisans dönem projesi)

Registry id: `aku-isg-tezsiz-proje-tr-v1` (instituteId `fbe-isg-proje`, degreeType `master`, tr). Status: PASS (self-check).
Files: `engine/src/templates/aku-isg.js`, `src/lib/thesisAkuIsg.test.js`, `orchestration/specs/aku-isg-tezsiz-proje.json`, this report, `orchestration/validation/aku-isg-tezsiz-proje/self-1/` (isg.pdf/docx/isg_word.pdf, fixture, overrides).
Source: one .doc template (2022-08-02) -> Word -> isg.docx/isg.pdf. AKÜ FBE thesis template NOT used as value source. Evidence: TEMPLATE (XML) / MEASURED (Word PDF baselines) / INFERRED / UNKNOWN. Rules in spec: 15 (TEMPLATE 11, MEASURED 2, INFERRED 1, plus mixed notes).

## Measured export vs source (real export, Chrome PDF; DOCX re-rendered by Word)
- Cover (margins 30/30/40/25), baselines 215.2/222.2/229.2/236.2/243.2/250.2/259.6 mm: PASS (delta 0.0, both PDFs).
- Inner cover (25/25/30/30; page i, number not printed) baselines 29.0 ... 261.1 mm incl. 16 pt title 106.6: PASS (0.0).
- Ethics page 40.5/59.3/107.4/126.2/135.7 and approval page 31.1/40.5/52.0/75.7/130.8(Word)/149.0 (Word) : PASS (<=0.1); needs a title long enough for the 5-line text, otherwise the lower lines move up (dynamic text, as in Word).
- Abstract/Özet: title 33.2, work title 44.2/40.5, first paragraph 57.3/52.4, keyword gaps 16.1 and 9.1 mm: PASS (<=0.1).
- Page numbers: 11 pt Times New Roman, centred, baseline 278.8 mm = source; labels (blank), (blank), ii, iii ... roman, Arabic restart 1 at GİRİŞ: PASS.
- Body: TNR 12, 1.5 lines (7.3 mm pitch), margins 30; headings H1 +9.4/+7.0 mm, H2 +11.5/+7.3, H3 +9.4/+9.4 around neighbours = source derivations: PASS. Fonts: TimesNewRomanPSMT / -BoldMT in PDF and Word render: genuine.
- DOCX sectPr: pgMar 1701/1417/1701/2268 (cover), 1417/1701 (front), 1701 (body); 1417 = 24.99 mm.
- Tests: 610 pass (frontend `npm test`).

## Conflicts (need confirmation)
1. H1 format: `1. GİRİŞ` = Balk1 (1.5 lines, before 12), `2.`, `3.`, KAYNAKÇA = T1 (single, 6/6). Implemented T1.
2. Instruction plan ("ÖRNEK (GEÇİCİ TASLAK) PLAN": BİRİNCİ BÖLÜM centred, `2.1.` caps not bold, per-chapter restart, unnumbered GİRİŞ) vs the real body pages (`1. GİRİŞ`, `2.1.` bold title case): body implemented, plan not.
3. First-line indent: 0 on the only real text paragraph vs 12.5 mm on GİRİŞ placeholder lines. Implemented 0 (abstract paragraphs have 12.5 mm).
4. Etik title `BİLİMSEL ETİK BİLDİRİM SAYFASI` (page) vs `BİLİMSEL ETİK SAYFASI` (TOC sample): page title used.
5. Abstract sample paragraphs inherit Balk1 (bold; centred by style). Implemented bold + justify (centred vs justified is not distinguishable on the full dotted lines): INFERRED.
6. Literal source typo `Keywords::` kept; `EKLER (VARSA)` / `ÖZGEÇMİŞ (ZORUNLU DEĞİL)` printed as EKLER / ÖZGEÇMİŞ (annotations dropped).

## UNKNOWN (nothing invented)
Table/figure caption position/style/numbering (Çizelge/Şekil labels are INFERRED from list titles; no caption paragraphs), footnotes, block quote, equations, appendix and CV layout, list/symbol entry formats, table borders, H4 sample (taken from the instruction plan: INFERRED).

## Engine gaps / forced fields
- Caption labels remain INFERRED from the index titles; caption position/style/numbering and footer height are UNKNOWN. The template omits position so the generic engine default supplies above/below placement without attributing it to AKÜ. The current audit supersedes the former forced-field defaults; generic header/footer geometry is unscored.
- Word collapses space after/before, editor sums: special pages use spacers with 0/0 spacing (exact); on body pages H1 (after 6) followed by H2 (before 12) gives 18 pt vs Word 12 pt.
- TOC right tab at 8210 twips (144.8 mm, 5.2 mm short of the margin) not expressible; footer's trailing empty paragraph modelled by `footer.distanceMm` 17.4 (= 12.5 + 4.87).
- Inner cover overflows to a second page if the 16 pt title wraps to two lines (same behaviour as the Word original, which has 9 trailing empty lines).
- Internet-sources numbered list under KAYNAKÇA (`1- http...`) not generated.

## Optional-rule audit (2026-10-02)
See the [current optional-rule audit report](../validation/aku-optional-audit/REPORT.md) and its real-export artifacts. Unsupported custom caption formatting/numbering and header/footer heights were removed. Caption details and footer height remain UNKNOWN; the 12.5 mm source footer distance versus the 17.4 mm effective baseline model is retained as an unresolved structure-to-output mapping, not a source value.
