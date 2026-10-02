# aku-matematik-lisans — AKÜ Fen Edebiyat Fakültesi Matematik Bölümü, Lisans Tezi (2026-10-02)

Status: **PASS (self-check)** with documented engine deviations (see FAIL line and engine gaps). Registry id `aku-matematik-lisans-tr-v1`, instituteId `fef-matematik`, module `templates/aku-matematik.js`.

## Source and method
- Only source: `AKU_Matematik_Lisans_Tez_Sablonu_2025.docx` (core.xml 2025-10-21). No guide. User decision: implement exactly the template; XML = authority, instruction text inside = EXPLICIT, undefined = UNKNOWN.
- Evidence: sectPr/styles/paragraph+run XML (`orchestration/artifacts/aku-matematik-lisans/source/{x,dump.txt,official.lines.txt}`), Word COM render `official.pdf` (26 pages), call-out boxes, red notes, embedded Word "Paragraf" screenshot.
- Real export: `orchestration/validation/aku-matematik-lisans/self-1/` — `mat.pdf` (editor PDF, 35 sheets), `mat.docx`, `mat.word.pdf` (the exported DOCX rendered by Word COM, 34 pages), `selfcheck.py` / `selfcheck.out.txt` (68 checks, 66 PASS).

## Result (measured, editor PDF and Word-rendered DOCX both)
Margins 30/30/30/30 mm PASS; body TNR 12 pt, pitch 20.7 pt, justified, no indent PASS; H1 baseline 33.96 mm and H1→text 14.6 mm = official PASS; TEŞEKKÜR title/text baselines 33.96/48.56 = official PASS; TOC indents 30/35/40/45 mm PASS; page numbers i–vii then 1.., 10 pt, baseline 283.76 mm, centre PASS; covers unnumbered PASS; Dış Kapak title baseline and İç Kapak lines equal official within 0.1 mm PASS; captions 11 pt, table note 10 pt PASS; figure image→caption 6.1 mm PASS; KAYNAKLAR title→first entry 16.72 mm = official, hanging 42.5 mm PASS; fonts: genuine Times New Roman embedded (no substitution) PASS.
FAIL (engine): table note → next heading 14.6 mm vs official 14.09 mm (0.51 mm, tol 0.5), editor and Word alike: blockGap uses one body pitch (41.4 pt) after notes/captions.

## Conflicts / decisions
1. Lists of Şekil/Çizelge/Resim: embedded screenshot (left, hanging 1.6 cm, 0 pt before, 6 pt after, single) vs sample rows (1.5, 0 pt after). Followed the explicit instruction; hanging = label width ("II. satır üst satıra hizalanmalı"). Needs confirmation.
2. Direct Calibri runs in 3 body paragraphs and ~22/30 bibliography entries vs Normal = Times New Roman: style TNR used.
3. Dış Kapak says "ANABİLİM DALI" (İç Kapak: MATEMATİK BÖLÜMÜ): `COVER_DEPARTMENT` placeholder, default = template wording.
4. Table cell size: samples 12 pt vs 10/11 pt: 12 pt (UNKNOWN requirement).
5. Template spacing between blocks is realised with empty "(Bir boşluk)" paragraphs; modelled as space-after 20.7 pt (INFERRED structure, exact in measurement).

## UNKNOWN / not generated
No approval, ethics, ÖZET or ABSTRACT page exists in the template: none generated. H2–H4 letter case (as typed), table row height, EKLER layout, ÖZGEÇMİŞ row skeleton (title only), footnote (style chain → TNR 10 pt single), two-line title spacing (derived), seals (none).

## Engine gaps (not modified)
1. Word spacing between paragraphs is **max(after, before)** (Word COM test: after 20 + before 30 → 30; modes 14 and 15), the engine assumes additive. Template workaround: figure/Resim caption and table-note space-after set to 0 (gap carried by blockGap), after which editor and Word agree within 0.2 mm. Other templates using non-zero after + before may be 6 pt short in Word.
2. Word: "Çizelge 4.1 (Devam)" caption stranded at page bottom (mat.word.pdf p22) while the table fragment starts on p23.
3. blockGap pitch after note/caption (41.4 pt vs template 40.0 pt).
4. Table row height / cell padding; widow-control off key; symbols table text offset (32.0 vs 30.0 mm).

Tests: `npm test` 588+ pass (own file `src/lib/thesisAkuMatematik.test.js`, 7 tests).
