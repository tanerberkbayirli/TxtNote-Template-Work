# afsu-tip — context pack

## Güncel çıktı kabulü — 15.10.2026 devamı

Dört örnek-tez kararı gerçek çıktılarda doğrulandı. Üç hedef/dokuz örnek: 315 PASS, 0 FAIL/UNKNOWN/SKIPPED, 7 INFO; ilgili 39 birim testi ve derleme PASS. Güncel kanıt `orchestration/validation/template-thesis-research-20261015/acceptance-summary.json`, karar düzeltmesi `decisions-v2.json`. Tıp için PDF ölçümü 11,04 pt; Word nominali 11 pt. Aşağıdaki mola ve ilk araştırma notları kendi checkpointlerinin tarihçesidir; JSON spec içindeki NOT_RERUN kaydı ilk kaynak-kararı checkpointine aittir. Diğer kaynak belirsizlikleri ve pas geçilen şablonlar açık kalır.

## 15.10.2026 örnek tez araştırması

Güncel kararlar: `orchestration/validation/template-thesis-research-20261015/decisions.json`; kaynak ölçümleri `measurements.json`. Kullanıcı güncel örnekleri esas alma ve bulunamayanları pas geçme talimatı verdi. Yalnız kayıtlı maddeler çözüldü; aşağıdaki eski notlarda bu maddelere ilişkin kararlar tarihsel kabul edilir. Yeni üretim çıktısı kabulü çalıştırılmadı.
## Identity
- Registry id(s): `afsu-tip-uzmanlik-tr-v1`
- Template module: `engine/src/templates/afsu-tip.js` (exports: afsuTipUzmanlik)
- Spec: `orchestration/specs/afsu-tip.json`; checks: `orchestration/specs/afsu-tip.checks.json` (not yet); progress report: `orchestration/reports/afsu-tip.md`
## Sources
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf`
- Tip guide PDF Temmuz 2021 (33 pp) and Dis Hekimligi guide PDF 2021-09-21 (32 pp): two exports of ONE guide, body text identical (differences: TOC page numbers, appendix example geometry). No template DOCX.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- User rule: official example wins over prose where they differ (e.g. H2 case: example applied; keyword line: example applied).
- Example geometry differs between Tip/DHF copies -> GEO.tip / GEO.dhf in afsu-tip.js; EK 6 outer cover is a schematic frame (INFERRED fractional mapping).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L/R (mm) | top 25/bottom 25/left 40/right 25 | EXPLICIT | p.4 §2.2 + EK 1 (p.16) callouts |
| Body font | Times New Roman 12 pt | EXPLICIT | p.5 §2.5 |
| Body line height | 1.5 lines | EXPLICIT | p.4 §2.2, p.6 §2.7, EK 1 |
| First-line indent / align | 12.5 mm / justify | EXPLICIT | p.4 §2.2 / p.6 §2.7; EK 1 measured 64.3-51.8=12.5 m… |
| H1 | 14 pt bold, uppercase, centred, new page, 12 nk after, numbered '1.' | EXPLICIT | pp.5-6 §2.5-2.7, EK 1 '1. GİRİŞ (14 punto)', EK 13 … |
| H2-H4 | 12 pt bold, at first-line indent position, 12 nk before and after | MEASURED | EK 1 p.16: H2/H3 x=64.3 mm; baseline steps H2->H3 2… |
| Page numbering | bottom centre; Roman i from iç kapak; Arabic from giriş; dış kapak and boş sayfa unnumbered | EXPLICIT | p.4 §2.3, p.8 §3.1.2-3.1.3 |
| Caption spacing (pt) | object-caption 6/object-text 12 | EXPLICIT | p.6 §2.7, p.7 §2.11 |
| Bibliography | Vancouver, order of first citation; single spacing; 6 nk between entries | EXPLICIT | p.13 §3.3.1, p.6 §2.7 |
| TOC row | 24.7 pt pitch; H2 indent 5.0 mm, H3 12.5 mm; dot leader; 'Sayfa' column heading underlined rig… | MEASURED | EK 13 p.29 |
## Open issues
- FAIL (independent-1, 2026-10-03): A1 Onay (EK 9) Uye->ONAY exp 26.92 act 4.86 mm (-22.06; spaceAfterPt 62.5 ignored); A2 centred special-page lines centre 105.5 exp vs 112.5 mm (+7.0); A3 Icindekiler 'Sayfa'->first row exp 9.41 act 4.87 (-4.54); A4 editor-PDF footnote pitch 5.97 vs 4.87 mm (engine); A5 DOCX table rows +4.51 mm/row, caption stranded, Word 36 vs 34 pp (engine). A1-A3 template fixes at 4ff8e65; A4/A5 shared engine still open. Report: orchestration/validation/afsu-tip/independent-1/REPORT.md
- CONFLICT: 10 (ethics page not generated, EKLER row has no page number in example, DHF English wording). UNKNOWN: 6 (page-number font, footer distance, ethics content, table borders, footnote size).
## Status
- IN_PROGRESS; validation FAIL; commit 4ff8e65; engine-fix-4 remaining items open.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- Engine-fix-4 (footnote pitch, DOCX table row/TOC spacing), then checker --only failed.
## Commands
- `node orchestration/tools/check.mjs --target afsu-tip` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Both guide PDFs; orchestration/validation/afsu-tip/{fix-1,self-1,independent-1 renders}; orchestration/artifacts/afsu-tip/. Other targets' specs/validation folders.

- Footnote numbering (2026-10-04): engine default `footnotes.numbering: "document"` (one running sequence, = Word). UNKNOWN: sources do not state a footnote numbering/restart rule.
