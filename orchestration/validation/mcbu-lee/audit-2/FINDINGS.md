# MCBÜ LEE independent audit 2 — FINDINGS (2026-10-02)

Auditor: Sonnet worker (find-only). Saved verbatim-in-substance by the orchestrator (the auditor's Write was refused).
Source: only `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx`.
G[n] = n-th child of `<w:body>` (0-based, tables counted); list: `orchestration/artifacts/mcbu-lee/source/guide_paras.txt`; dumper: `source/dump_ppr.py <lo> <hi>`; unzipped guide `source/docx/`.
Real exports (editor PDF/Word buttons): `orchestration/validation/mcbu-lee/audit-2/` — `master.{pdf,docx}` (34 p), `phd.{pdf,docx}` (35 p), `short.{pdf,docx}` (one-line keywords), `lines-master.txt`, `lines-phd.txt` (every PDF line: x0–x1 mm, baseline mm, pitch pt, size, B/I, text), `render/*.png`.
LibreOffice render of the guide NOT obtained (soffice hung); Word positions computed from XML (TNR single 13.8 pt @12, 16.1 pt @14). Tolerance 0.5 mm.
Counts: HIGH 2, MED 6, LOW 9; CONFLICT 7; UNKNOWN 14.

## Findings (most severe first)

**F1 HIGH — wrapped "Anahtar Kelimeler"/"Keywords" line swallows the blank line before "2026, N sayfa" (PDF only).**
Req: G[100]–G[102], G[126]–G[128] (red note "Bir satır boşluk"): one empty line before `2023, xxx sayfa`; template encodes it (mcbu.js:115, :143).
Expected last-keyword → year pitch 27.59 pt; measured 13.79 pt (−13.8 pt / 4.87 mm). ÖZET p.3: `yeterlik, uzaktan eğitim` b=208.14 → `2026, 34 sayfa` b=213.01 mm; ABSTRACT p.4: 183.81 → 188.67 mm (master and phd).
One-line keywords (`short.pdf`): gap present (27.58 pt). DOCX correct (spacer `line=276 exact`). → PDF writer lets wrapped static text overflow into the following spacer.
Responsible: engine PDF layout of a static text block followed by a spacer in a static section after an editable one (layoutPdf.js / specialPages.js; line unknown). Template data correct.
Fix: PDF static-block flow must use the wrapped text height (or flow text+spacer as one stack).

**F2 HIGH — İÇİNDEKİLER entries 1.5-spaced; guide example single.**
Req: G[290]–G[297] `after=0 line=240`, bold, tab 7513 tw, no leader (G[288], G[289] also line=240).
Expected pitch 13.8 pt; measured 20.70 pt (p.9), DOCX `w:line="360"`; +6.9 pt/line, TOC spills to 2nd page.
Responsible: mcbu.js:169 toc `generatedIndex.style` lacks `lineHeight: 1` (cf. :162, :165). Fix: add it.

**F3 MED — front-matter titles drawn as 1.5-spaced H1; guide single.**
Req: G[135] ÖNSÖZ VE TEŞEKKÜR, G[145] SİMGELER, G[192] ŞEKİLLER, G[242] TABLOLAR, G[288] İÇİNDEKİLER: `line=240`, style Title (center, bold 12, after=0), one single empty line after.
Expected first baseline 28.70 mm (as static ÖZET/TAAHHÜTNAME pages) and title→next 27.59 pt. Measured p.5–9: baseline 30.03 mm (+1.33 mm FAIL); title→next 30.74 pt (ÖNSÖZ; ŞEKİLLER/TABLOLAR→"Sayfa") or 34.49 pt (SİMGELER, İÇİNDEKİLER). DOCX Heading1 `line=360`.
EKLER (G[345] "bir satır aralığı ile yazılır") likewise: p.33 b=30.03 mm, →`EK 1.` 30.74 vs 27.59 pt (LOW part).
Responsible: mcbu.js:190 `heading()` sets lineHeight 1.5 for every H1; overrides on preface :148, symbols :159, index-figures/tables :161/:164, toc :168, appendices :178 only set align/spaceAfter.
Fix: `headings: { "1": { lineHeight: 1, ... } }` on those six sections; spaceAfter 13.8 pt.

**F4 MED — Simgeler ve Kısaltmalar entries have no paragraph spacing; guide 6 pt after.**
Req: G[147]–G[148] (ListeParagraf) `jc=both after=120 line=360 left=0`, key bold; blank under title G[146] line=360.
Expected entry pitch 26.70 pt; measured 20.70 pt (p.6), −6.0 pt/entry. Responsible: mcbu.js:159–160 `paragraph.spaceAfterPt: 0` (comment contradicted by XML). Fix: 6.

**F5 MED — PDF draws figure images left-aligned; template and DOCX centred.**
Template `figures.align: "center"` (mcbu.js:261); DOCX figure paragraph `jc=center`. Measured PDF p.13/p.18: image x 40.0–151.1 mm (centre 95.5) vs caption centre 112.5 → expected 57.5–168.6 mm; offset 17.0 mm (`render/master-p13.png`).
Responsible: engine PDF/CSS figure path (engine.js ~369); export.js honours align, PDF path does not.

**F6 MED — chapter heading / TOC entry form differs from the guide example (CONFLICT C1).**
G[299]–G[318] (on the İÇİNDEKİLER page): after `GİRİŞ 1`, two centred bold lines `BİRİNCİ BÖLÜM` / `BİRİNCİ BÖLÜM BAŞLIĞI`, no "1.", no page number; `1.1.` flush, `1.1.1.` 7 spaces, `1.1.1.1.` 17 spaces, `1.2.1` tab; empty line between chapters.
Template: one line `1. KURAMSAL ÇERÇEVE` (mcbu.js:225 numbering "{1}."); TOC `1. KURAMSAL ÇERÇEVE 2`, sub-levels x0 49.99/59.99/70.0 mm; no "N. BÖLÜM" label line. Prose G[332] (justified, bold, caps 12 pt) is followed without CONFLICT note.
Fix: record + escalate; if example wins → generic chapter-label-line capability + TOC indents. NEEDS HUMAN DECISION.

**F7 MED — cover vertical gaps follow DOCX paragraph count, not the stated "N satır boşluk" (CONFLICT C3).**
G[10] says "9 satır" between PROGRAMI and TEZ BAŞLIĞI, but G[10]–G[16] hold 7 lines incl. red note; template spacer 98 pt (:62) ≈ 7.1 lines. Measured PROGRAMI b=108.26 → title b=148.49 mm = 114.0 pt; DOCX model 112.2 pt (+1.8 pt / 0.63 mm: 98 vs 96.6 pt). "9 lines" would give ≈124 pt.
G[32] says "1 satır boşluk" after advisor, but G[32]–G[39] hold 8 lines; template spacer 96.6 pt (:69). Measured Doç. Dr. b=227.21 → city b=266.15 mm = 110.4 pt; Word layout (red note kept) 124.2 pt (−13.8 pt / −4.87 mm). Template counts red-note lines at G[4], G[10], G[19], G[25] but not G[32].
Other gaps match (logo; 5×14 pt title→student 94.34 vs 94.78; 5×12 pt 82.79 vs 82.8). Responsible: mcbu.js:58–69 (constants from the 2024 PDF). NEEDS HUMAN DECISION (text vs XML).

**F8 MED — provenance: template cites a PDF not in the repo; no spec file.**
mcbu.js:3–8, :204–206 cite `ShareFileGallery-GTSM221020251445.pdf` (12 p, created 2024-02-22, verifiedAt 2026-09-27; "Every value below is taken from that PDF"). KAYNAK.md lists that PDF as MANUEL_INDIRME_GEREKLI. Only repo source: the DOCX (2025-10-22, sha256 e607f8f7…). manifest.json:717 says mcbu.js came "from a different PDF". No `orchestration/specs/mcbu-lee*.json`.
Fix: re-point `source` metadata to the DOCX; write the spec.

**F9 LOW — Şekil/Tablo list labels not bold; long entry lacks hanging/right indent.**
G[195]–G[197], G[245]–G[247]: `Şekil 1.`/`Tablo 1.` label bold, rest regular; export all regular. G[247] long entry `left=1176 right=707 hanging=1176` (continuation 20.7 mm in, stops 12.5 mm before margin); export p.7 continuation at 40.0 mm full width. Page-number column: guide left tab 7513 tw; export right-aligned at 185.0 mm (acceptable, INFERRED).

**F10 LOW — İmza block alignment.** G[49]–G[51]: `İmza` centred with `ind left=6372 firstLine=708` (centre ≈175 mm); `Ad SOYAD` bold right-aligned. Export p.2: `İmza` right-aligned x 176.5–185.0 (centre 180.8 mm), Δ5.8 mm. Spacing matches. Responsible mcbu.js:80–84 (one right-aligned group).

**F11 LOW — cover centre line and leading blank line (CONFLICT C4).** G[1]–G[32] `ind left=567` → centre 117.5 mm; G[33]–G[40] (city) no indent. Export centres all at 112.5 mm (Δ5.0 mm for G[1]–G[32]). Template starts with `blank(1)` (:52) → T.C. at b=34.36 mm, which reproduces the red label G[0] `EK: 2 (İç Kapak Örneği)` (a note, not cover text); with the label kept the cover fills page 1 exactly (Word bottom 770.5/771 pt). Logo PASS (30.33×37.31 vs 30.4×37.4 mm; pixel-identical mask).

**F12 LOW — page-number line vs guide footer.** footer1.xml: PAGE field paragraph (AltBilgi, centred, Calibri 11) + one empty paragraph → in Word the number sits ≈4.7 mm higher (baseline ≈278.7 mm, computed). Export: one TNR 12 line, baseline 283.55 mm, footer bottom 12.4 mm from edge (matches 709 tw), centre 112.5 mm. mcbu.js comment "position not stated" incomplete (bottom-centre MEASURED). Font UNKNOWN (U8).

**F13 LOW — long figure caption first-line indent PDF vs DOCX.** PDF p.18 first line x0 42.21 mm, continuation 40.00; DOCX `firstLine=0 jc=both`. Engine PDF path.

**F14 LOW — footnote pitch PDF vs DOCX.** PDF 13.79 pt for 10 pt type (p.12); DOCX FootnoteText `line=240 sz=20` (single). Guide: 10 pt TNR at page bottom only (pitch UNKNOWN), but PDF and DOCX should agree. Footnote counter restarts at chapter 1 (GİRİŞ is own section); guide silent.

**F15 LOW — equation drawn at 14.52 pt (1.21×12) and no equation number** although fixture marks it numbered (p.17). Guide silent (U9). Engine math renderer.

**F16 LOW — Tez Sırtı (spine) omitted.** G[42] 3-row table 1305 tw (23.0 mm) wide, rows 30.9/174.5/17.9 mm, `AD SOYAD` / rotated `TEZ ADI` / `202…`. mcbu.js:208–209 records it as print output — decision, not defect.

**F17 LOW — DOCX artefacts (engine observation).** TOC/lists static text without TOC/PAGEREF fields; "Tablo 1." caption carries `pageBreakBefore` copied from PDF pagination (Word may paginate differently).

## Source CONFLICTs
- C1 chapter heading: prose G[332] (justified bold caps) vs example G[299]–G[300] (two centred lines). Template follows prose.
- C2 ÖZET/ABSTRACT text: prose G[96] single + empty line between paragraphs; notes G[104], G[130] 1.25 cm indent 1.5 spacing; example XML G[96]–G[97] line=360 firstLine 6.35 mm left 60 tw after 10 pt; abstract example G[122] single firstLine 12.5 mm. Template 1.5 / 12.5 mm / 6 pt.
- C3 cover "9 satır"/"1 satır" vs 7/8 actual empty paragraphs (F7).
- C4 cover `ind left=567` on G[1]–G[32] only (F11).
- C5 Önsöz: G[331] lists önsöz/teşekkür among 1.5-spaced parts; G[139] "Teşekkür bölümü tek satır aralıklı" (example line=240). Template chose single, conflict unnoted.
- C6 sub-heading indentation: 7/17 spaces (G[302]–G[305]) vs tab (G[307], G[308], G[316]); no rule text.
- C7 source identity: PDF 2024-02-22 vs DOCX 2025-10-22 (F8).

## UNKNOWNs
U1 TOC entry form/indents (template 10/20/30 mm) · U2 footnote spacing/numbering scope · U3 table borders/padding/header bold/repeat/"(devam)" (export: grid, 26.54 pt rows, bold header, no repeat p.24) · U4 bibliography spacing/hanging (template single, 6 pt after, 0 hanging) · U5 list formatting · U6 figure alignment (only caption specified) · U7 Simgeler key bold/font (theme font in XML) · U8 page-number font/size/position beyond footer1.xml · U9 equations · U10 H2–H4 spacing (examples after=0; template 6 pt) · U11 meaning of "xxx sayfa" (template: total physical pages) · U12 whole "Anahtar Kelimeler:" line bold? · U13 Taahhütname counted/numbered · U14 blank after chapter heading 1.5 (template 20.7 pt) vs single.

## PASSED checks
Page size A4 (PDF 595.28×841.89 pt, DOCX 11906×16838) · margins L40/R185/T25/B25 mm (x0 40.00, x1 184.98–185.11, body bottom ≤271.33 mm; DOCX 1417/2268 tw) · header/footer 709 tw · fonts: genuine TNR only (TimesNewRomanPSMT/-BoldMT/-ItalicMT/-BoldItalicMT) · body 20.70 pt pitch, 12.49 mm indent, 26.70 pt between paragraphs, justified · H1 bold caps 12 pt new page, 41.39 pt to body · H2–H4 numbering · footnotes 10 pt bottom · page numbers: cover/Taahhütname none, ÖZET I…İÇİNDEKİLER VII/VIII, GİRİŞ 1…24 (PhD 25), centre 112.5 mm, DOCX sections correct · TOC/list page numbers agree with real sheets · cover typography + logo · Taahhütname text verbatim, single, 2 empty lines before İmza · ÖZET/ABSTRACT rhythm 27.59/41.39/13.79 pt · Önsöz rhythm · Şekil/Tablo list rhythm 13.79 pt, "Sayfa" bold right · captions (table above, figure below; one line centred else justified; cells centred) · one empty line around tables/figures · Ekler rhythm · Özgeçmiş PhD-only 14 pt bold centred, unnumbered, not in TOC · variants differ only in degree labels · no pagination drift (20.70 pt constant; 26.54 pt rows p.23–24).

## Earlier static audit (`orchestration/reports/mcbu-lee-audit-2026-10-02.md`) — status
Header/footer 12 vs 12.5 mm: fixed (mcbu.js:215–216 = 12.5 mm). "BİRİNCİ BÖLÜM" label & "{1}." chapter number: still hold (F6; the example is a TOC example). H2–H4 spaceAfter 6 pt: still holds (U10). Table/figure far-side 6 pt: not in guide; empty-line side correct. İç kapak gaps: still hold, quantified (F7/C3). Taahhütname alignment: F10. Tez sırtı: F16. Kaynakça: U4. ÖZET C2: holds. Earlier "MATCH" rows that are wrong: Şekil/Tablo bold labels (F9), İçindekiler spacing (F2), Simgeler 6 pt (F4). Not caught earlier: F1, F3, F5, F8, C5, F11, F12.
