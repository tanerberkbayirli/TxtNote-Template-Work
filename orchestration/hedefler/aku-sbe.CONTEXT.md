> Tarihsel hedef kaydı: aşağıdaki durumlar, komutlar ve kararlar kendi tarihlerine aittir; güncel görev veya kaynak önceliği talimatı değildir. Önce [BASLA.md](../BASLA.md), [rapor dizini](../raporlar/README.md) ve hedefin güncel kaynak kaydı değerlendirilir. Eksik tarihsel kanıt yolu güncel doğrulama sayılmaz.

# aku-sbe — context pack

## Güncel çıktı kabulü — 15.10.2026 devamı

Dört örnek-tez kararı gerçek çıktılarda doğrulandı. Üç hedef/dokuz örnek: 315 PASS, 0 FAIL/UNKNOWN/SKIPPED, 7 INFO; ilgili 39 birim testi ve derleme PASS. Güncel kanıt `orchestration/validation/template-thesis-research-20261015/acceptance-summary.json`, karar düzeltmesi `decisions-v2.json`. Tıp için PDF ölçümü 11,04 pt; Word nominali 11 pt. Aşağıdaki mola ve ilk araştırma notları kendi checkpointlerinin tarihçesidir; JSON spec içindeki NOT_RERUN kaydı ilk kaynak-kararı checkpointine aittir. Diğer kaynak belirsizlikleri ve pas geçilen şablonlar açık kalır.

## 15.10.2026 örnek tez araştırması

Güncel kararlar: `orchestration/validation/template-thesis-research-20261015/decisions.json`; kaynak ölçümleri `measurements.json`. Kullanıcı güncel örnekleri esas alma ve bulunamayanları pas geçme talimatı verdi. Yalnız kayıtlı maddeler çözüldü; aşağıdaki eski notlarda bu maddelere ilişkin kararlar tarihsel kabul edilir. Yeni üretim çıktısı kabulü çalıştırılmadı.

## Identity and status
- Registry variants: `aku-sbe-master-tr-v1`, `aku-sbe-phd-tr-v1`, `aku-sbe-sanatta-yeterlik-tr-v1`, `aku-sbe-master-en-v1`, `aku-sbe-phd-en-v1`.
- Template: `engine/src/templates/aku-sbe.js`; source spec `engine/specs/aku-sbe.json`; conformance rows `engine/specs/aku-sbe.checks.json`.
- Variants now share one rule set. English programmes order thesis-language abstract before Turkish ÖZET and require the 2,000-word Turkish extended summary after appendices (EK 12; six minima 200/300/200/300/500/500). Sanatta Yeterlik checkbox/title are explicit; ethics exact wording and copy count are UNKNOWN; editable grammar-preserving template phrase is INFERRED. English cover/front-title translations remain UNKNOWN/editable.

## Sources and rulings
- Primary: `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf` (2026 file, cover year 2023), especially pp.2, 4–5, 10–13, 36–53 / EK 12 p.52.
- Additional source forms: `.../Sosyal_Bilimler_Enstitusu_Tez/AKU_Sosyal_Bilimler_Ic_Kapak_*_2026.docx`, `.../AKU_Sosyal_Bilimler_Enstitu_Onayi_Formu_2024.docx`, and cached ethics form `.../AKU_Sosyal_Bilimler_Enstitusu_Etik_Beyan_2022.docx`.
- Explicit guide prose leads for rules it states; example pages establish order/alignment/casing where silent, not their 11 pt/page-frame geometry. Official Word forms establish template-only fields/paragraphs where guide is silent; conflicts stay recorded in spec/source notes.
- Main dimensions: A4; margins T/B/L/R 25/25/30/30 mm; Times New Roman 12 pt, body 1.5 spacing, 12.5 mm first indent, 6/6 pt paragraph spacing; tolerances ≤0.5 mm (prefer 0.25 mm).

## Validation coverage and open rows
- `aku-sbe.checks.json` has 88 rows: 20 base checks plus 17 source-backed structural/geometry clones for each new fixture (`sanatta-yeterlik-tr`, `master-en`, `phd-en`, `phd-tr`). Fixtures: `aku-sbe.fixture.json` and the four named variant fixtures. Re-run real exports with `node engine/tools/check.mjs --target aku-sbe`; add `--word` for Word pagination.
- Historical independent-1 failures F01–F06 are NOT claimed resolved by current unit tests. They require fresh output checks: F01 PDF text color, F02 KAYNAKÇA title→first-entry gap, F03 heading continuation alignment (official examples conflict), F04 per-cell table alignment, F05 generated appendix index, F06 DOCX chapter-row TOC spacing. Prior evidence: `orchestration/validation/aku-sbe/independent-1/independent-1.md`; source disputes/open capability gaps must remain visible.
- Targeted template test: `cd TxtNote/frontend && node --test src/lib/thesisAkuSbe.test.js`.

## Historical reading boundary (not a current instruction)
- Full guide PDF, bulk render/dump folders or unrelated target specs. Read only cached source locators needed for failing rows.

- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.

## Phase 5.1 checkpoint — 2026-10-07

15 cell-alignment checks and 4 English paragraph checks resolved; canonical cell classes and real English tables retain source expectations. Four English front-flow checks remain open; schema table-width defects tracked for 5.4.1. See `orchestration/validation/word-compat/phase-5.1/acceptance.json`.
