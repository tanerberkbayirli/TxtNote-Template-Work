> Tarihsel hedef kaydı: aşağıdaki durumlar, komutlar ve kararlar kendi tarihlerine aittir; güncel görev veya kaynak önceliği talimatı değildir. Önce [BASLA.md](../BASLA.md), [rapor dizini](../raporlar/README.md) ve hedefin güncel kaynak kaydı değerlendirilir. Eksik tarihsel kanıt yolu güncel doğrulama sayılmaz.

# aku-sosyoloji-lisans — context pack
## Identity
- Registry id(s): `aku-sosyoloji-lisans-tr-v1`
- Template module: `engine/src/templates/aku-sosyoloji.js` (exports: akuSosyolojiLisans)
- Spec: `engine/specs/aku-sosyoloji-lisans.json`; checker files now present: `engine/specs/aku-sosyoloji-lisans.checks.json` and `.fixture.json`; progress report: `orchestration/reports/aku-sosyoloji-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx`
- Guide DOCX 2022-04-05 only (guide document itself; its XML/styles used for measurements). Locator style: word/document.xml paragraph indices.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Dedicated official list pages use 'DIZINI' while prose/TOC say 'LISTESI'; both recorded (CONFLICT), implementation cleanup at d4a3a7e.
- Example pages are internally inconsistent; list rows 11.5 pt vs prose 12 pt recorded, not averaged.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins top/bottom/left (mm, per spec) | 45 mm / 45 mm / 45 mm | EXPLICIT | 'Tezin genel biçimi' (word/document.xml paragraphs … |
| Body font | Times New Roman 12 pt | EXPLICIT | 'Tezin genel biçimi' (word/document.xml paragraphs … |
| Body line spacing | 1.5 | EXPLICIT | 'Tezin genel biçimi' (word/document.xml paragraphs … |
| Para indent / before / after | 12.5 / 6 / 6 | EXPLICIT | 'Tezin genel biçimi' (word/document.xml paragraphs … |
| Page number position | bottom | EXPLICIT | para 55 |
| Front / main format | roman-lower / arabic | EXPLICIT | para 55 |
| List rows spacing | single, 0 pt | MEASURED | style 'Stil 12 nk...' after=0 line=240; Word render… |
| TOC title | İÇİNDEKİLER | MEASURED | Ek-3 |
| Tables list title | TABLOLAR DİZİNİ | MEASURED | Ek-3 and para 45; Ek-4 says TABLOLAR DİZİNİ |
## Open issues
- No independent validation; no report. Needs source/example XML comparison for DIZINI vs LISTESI titles (progress).
- Margins VERIFIED 2026-10-03 (MOTOR 0.3): guide prose 'Sayfa kenar boşluğu: üst: 4.5 cm, alt: 4.5 cm, sol: 4.5 cm, sağ: 3 cm' (EXPLICIT) = spec = template (45/45/45/30). Guide DOCX sectPr pgMar 1417 tw (25 mm) all sides is the guide document's own layout, not a thesis rule (no thesis template DOCX exists). No change.
- CONFLICT: 7 (12 pt vs 11.5 pt, titles, Sayfa alignment, cover font name). UNKNOWN: 12 (guide silent on footer distance, header, captions, borders, footnotes, bibliography).
## Status
- IN_PROGRESS; validation PENDING; commit d4a3a7e. Untouched in session 2.
## Checker handoff (2026-10-04)
- Added coverage for source-defined margins, exact TNR font, body size/spacing, example heading hierarchy, front/main page labels, and DOCX/Word validity. Page size and several layout details remain explicit UNKNOWNs and are recorded as notes. Fixture contains example heading levels.
- There is no official thesis DOCX/PDF reference; `source/g.docx` and `source/guide.pdf` are the guide itself with cover examples embedded as Word canvases. The checker cannot independently compare full thesis page geometry to a standalone official thesis document.
- Root should run `node engine/tools/check.mjs --target aku-sosyoloji-lisans --word`; use the cached guide and compare only the source-backed example canvases for fixed-page geometry.
## Commands
- `node engine/tools/check.mjs --target aku-sosyoloji-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node engine/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Historical reading boundary (not a current instruction)
- Guide DOCX; orchestration/artifacts/aku-sosyoloji-lisans/source/{pg*.png,v6/v7.png,g.docx,guide.pdf,text.txt,pict.txt}. Other targets' specs/validation folders.

- Phase 3 (2026-10-07): source-derived body-margin landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
