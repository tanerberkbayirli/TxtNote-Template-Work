# AFSÜ Tıp / Diş Hekimliği uzmanlık tezi (afsu-tip) — self-check report, 2026-10-03

Status: **PASS (self-check, PDF measured + DOCX XML + one Word render)** with the open conflicts/unknowns below. Not an independent validation.

## Variant decision (evidence)
One joint guide ("TIP VE DİŞ HEKİMLİĞİ FAKÜLTELERİ UZMANLIK TEZ YAZIM KILAVUZU", Temmuz 2021). Tıp PDF (33 pp.) and DHF PDF (32 pp.) share the title page and the body prose (pp. 4-15); the DHF copy only re-exports the example pages with the joint wording "TIP/DİŞ HEKİMLİĞİ FAKÜLTESİ" / "TIPTA/DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ". => one rule set, one module (`templates/afsu-tip.js`), two registry entries (`afsu-tip-uzmanlik-tr-v1`, `afsu-dis-hekimligi-uzmanlik-tr-v1`) differing only in faculty/degree strings. DHF strings are INFERRED (the "/" alternative); DHF English faculty wording is UNKNOWN (placeholder without default).

## Real-export measurements (editor PDF; Word render of tip-bap.docx 36 pp. agrees on all special/heading values)
| Check | Source | Measured | Result |
|---|---|---|---|
| Margins (PDF text extent L/R, DOCX pgMar) | 40/25 mm, top/bottom 25 | x 40.0-185.0 mm; pgMar 2268/1417 tw; H1 baseline at top margin | PASS |
| Body TNR 12, 1.5 lines, indent 12.5 mm | §2.2/2.5 | TimesNewRomanPSMT 12 pt, pitch 20.7 pt, indent 12.5 mm; fonts only genuine TNR | PASS |
| Heading gaps (EK 1) | text->H 32.9, H->H/text 25.8 pt | 32.7 / 25.8 / 25.8 | PASS |
| Figure/caption/text gaps | 12 / 6 / 12 nk | 12.0 / 6.0 / 12.0 (25.8 baseline step) | PASS |
| Table caption->table | 6 nk | 7.0 pt (+0.35 mm; engine table border offset) | PASS at 0.5 mm, not at 0.25 mm |
| Table note 10 pt single, 12 nk to next | §2.11 | 10 pt, gap 12.0 | PASS |
| Page numbers | bottom centre; i.. / 1.. | centred at 105.0 mm of the sheet; i from iç kapak; 1 at first chapter; none on cover/blank | PASS |
| Inner cover EK 7/8, approval EK 9 baselines | measured on real-size examples | all within 0.1 pt (editor); +0.6 pt in Word | PASS |
| Özet / Abstract header blocks (EK 11/12) | baseline steps | 136.0 pt first line; steps 32.6/25.8/32.6 exact | PASS |
| TOC row pitch / indents (EK 13) | 24.7 pt; 5.0 / 12.5 mm | 24.6-24.7 pt; 5.0 / 12.5 mm (Word 24.7) | PASS |

## Conflicts (all in `orchestration/specs/afsu-tip.json`)
H2 case (prose title case vs EK 1/EK 13 capitals: example applied); front-matter title size (prose 14 pt vs EK 10/11/13 12 pt: example applied); **ethics page / Roman sequence** (TOC and EK 13 list "Bilimsel Etiğe Uygunluk Sayfası", no text or example exists; prose sequence i..vi used, page not generated); caption form (EK 3 "Tablo 1.1:" vs EK 4/5 "Tablo 1."); inner-cover year/city order (EK 7 vs EK 8); abstract indent (EK 11 10.5 mm vs 12.5 mm); keyword line spacing.

## UNKNOWN (omitted, not invented)
Page-number font/size and header/footer distance (DOCX shows the engine default 709 tw), table borders/cell padding, footnote size (general 12 pt applied, INFERRED), dış kapak vertical positions (EK 6 is a schematic frame: positions INFERRED by frame fraction onto the text area), ethics page content, DHF English faculty name.

## Engine observations (no shared code changed)
1. Fifth-level run-in heading (§2.6) and spine text (§5.2) have no engine support.
2. Word pagination drifts from the editor on the multi-page fixture table (36 vs 34 sheets; the 45-row table's caption stays alone on a page in Word, editor row pitch 26.5 pt); identical up to chapter 3. Shared table model, not source-defined.
3. EKLER heading sits alone on its page and each "EK-n:" (H2 override) starts its own page; the source does not say whether EKLER shares the first ek page.
