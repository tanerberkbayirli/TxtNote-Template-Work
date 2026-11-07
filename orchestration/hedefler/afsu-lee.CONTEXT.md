> Tarihsel hedef kaydı: aşağıdaki durumlar, komutlar ve kararlar kendi tarihlerine aittir; güncel görev veya kaynak önceliği talimatı değildir. Önce [BASLA.md](../BASLA.md), [rapor dizini](../raporlar/README.md) ve hedefin güncel kaynak kaydı değerlendirilir. Eksik tarihsel kanıt yolu güncel doğrulama sayılmaz.

# afsu-lee — context pack

## 15.10.2026 kalan kaynakların yeniden incelemesi

Üç eski kaynak belirsizliği kapandı: altbilgi punto/mesafesi, içindekiler 1–3 seviye girinti/noktalı sekmeleri, jüri tablosu asgari satır yükseklikleri. Kaynak XML ve hash: `validation/resizeobserver-source-review-20261015/source-audit.json`; kararlar `source-disposition.json`. Etik liste Symbol işareti kaynakta biliniyor; font yedeği ayrı uygulama sınırı. Beş genel kaynak belirsizliği korunuyor; dördüncü içindekiler seviyesi ve keyfî uzun tablo devamı bu örneklerle kesinleşmedi. Tarihsel çıktı kabulleri yeniden çalıştırılmış sayılmadı.


## 15.10.2026 örnek tez araştırması

Güncel kararlar: `orchestration/validation/template-thesis-research-20261015/decisions.json`; kaynak ölçümleri `measurements.json`. Kullanıcı güncel örnekleri esas alma ve bulunamayanları pas geçme talimatı verdi. Yalnız kayıtlı maddeler çözüldü; aşağıdaki eski notlarda bu maddelere ilişkin kararlar tarihsel kabul edilir. Yeni üretim çıktısı kabulü çalıştırılmadı.
## Identity
- Registry id(s): `afsu-lee-master-tr-v1`, `afsu-lee-phd-tr-v1`
- Template module: `engine/src/templates/afsu-lee.js` (exports: afsuLeeMaster, afsuLeePhd)
- Spec: `engine/specs/afsu-lee.json`; checks: `engine/specs/afsu-lee.checks.json` ; progress report: `orchestration/reports/afsu-lee-source-rules.md`
## Sources
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx`
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_Yuksek_Lisans_Tez_Sablonu_2026.docx`
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_Doktora_Tez_Sablonu_2026.docx`
- (supplementary) `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_Tez_Kapak_Formatlari_2024.doc`
- (supplementary) `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_YL_Kabul_Onay_Sayfasi_2026.docx`
- (+5 more supplementary files listed in manifest.json)
- Guide DOCX 2025-12 (primary; LEE Board 20/10/2025 no. 04/04); YL and Doktora template DOCX 2026 (XML = primary); cover formats DOC 2024, onay-sayfasi DOCX (YL/Doktora) and 4 control-list DOCX (supplementary; form date 13/07/2023).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- PAGE fonts: PhD cover Calibri 11 (MEASURED source evidence:104); Roman/body Times New Roman 11 (:105-106). Cover exception to guide general TNR rule is RULED by source precedence; both values stay in spec.
- TOC typography: official template example wins over guide prose (T1/T2/T3 styles; regular weight, 1.15 line + 5 pt after, 11 pt/level) - RESOLVED by user rule.
- YL checklist generic 'YL or doctorate' wording kept as checklist text only, not evidence for thesis wording.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/L/R (mm) | 25 mm / 40 mm / 25 mm | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[2]/w:tc[1]/… |
| Body font | Times New Roman 12 pt | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[3]/w:tc[1]/… |
| Body line spacing | 1.5 lines | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[3]/w:tc[1]/… |
| Para indent / before / after | 0 / 6 / 6 | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[3]/w:tc[1]/… |
| H1 format | uppercase, bold, 14 pt, centered | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[4]/w:tc[1]/… |
| H2 format | bold, 14 pt, left aligned; initial letter of each word uppercase except conjunctions such as v… | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[4]/w:tc[1]/… |
| H3 format | bold, 12 pt, left aligned; only first word begins uppercase | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[4]/w:tc[1]/… |
| Page number position | bottom-right | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[2]/w:tc[1]/… |
| Front numbering | lowercase Roman numerals; inside cover unnumbered; numbering begins at abstract | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[6]/w:tc[1]/… |
| Main numbering | Arabic numerals beginning with 1 at GİRİŞ | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[6]/w:tc[1]/… |
| Caption size | 12 pt | EXPLICIT | word/document.xml /w:body/w:tbl[2]/w:tr[6]/w:tc[1]/… |
## Open issues
- Historical FAIL (independent-master-1, 2026-10-02; current checker revalidation supersedes this attempt): heading case in export; approval/jury table broken cell widths/borders (p4); YL outer-cover T.C. baseline 177.675 vs 176.1 pt (+0.556 mm); footer Roman 'i' x 521.344 vs 524.74 pt (-1.198 mm) and baseline 804.094 vs 797.04 pt. Report: orchestration/validation/afsu-lee/independent-master-1.md (later self-4/5/6 and v5 pairs saved, not independently rechecked).
- UNKNOWN: 9 (page-number font size, TOC leaders/indents, footnote spacing, ethics bullet glyph, approval row heights). CONFLICT: 2 (both ruled).
## Status
- 2026-10-04: `--word` INFO=1 PASS=90 (default + PhD). PhD page parity fixed by engine `typography.justify: "word"` (Word compresses justified spaces; measured in engine-word-justify). Phase 2 engine parity complete for this target. Still open (not engine): CONFLICT phd-body-font, approval margins ruling.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- Run current checker against master + PhD exports; review only remaining FAIL rows and retain recorded UNKNOWN/source conflicts.
## Commands
- `node engine/tools/check.mjs --target afsu-lee` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node engine/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Historical reading boundary (not a current instruction)
- orchestration/validation/afsu-lee/* (docx/pdf/png dumps, layout.json, source/, source-filled/, self-N/); guide + template DOCX full text; orchestration/artifacts/afsu-lee/. Other targets' specs/validation folders.

- Footnote numbering (2026-10-04): engine default `footnotes.numbering: "document"` (one running sequence, = Word). MEASURED: official DOCX settings `w:footnotePr` has no `w:numRestart` → Word default continuous numbering.
