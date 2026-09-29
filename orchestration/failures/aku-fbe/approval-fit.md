# AKÜ-FBE long-title approval and cover geometry

**Current editor-export result: FAIL for the 89-character title on both variants.** The source does not specify a compact layout or a maximum title length. Microsoft Word's rendering of this exact long-title fixture remains UNKNOWN; the checked PDFs were exported by the real editor through Chromium, not Word.

## Official source bounds

- **Approval page bottom: 266.996 mm.** The 2020 guide says to leave 3 cm from page edges (PDF p.5, §2.3). The 2025 official DOCX has A4 height 16838 twips and `w:bottom="1701"` in all four `sectPr` nodes (`word/document.xml`). 1701 twips = 30.00375 mm; using 297 mm page height gives 266.996 mm. The approved spec records the margin as 30 mm, EXPLICIT. Attempt 4's 11.994 mm generated margin was an implementation override, not an AKÜ exception.
- **Outer-cover text bottom: 275 mm.** The guide's cover example (PDF p.32 / printed p.29) bounds the print area to x=55–155 mm and y=210–275 mm and says to center Times New Roman 12 pt. Attempt 4's 10 mm generated bottom margin is not evidence for a lower source limit.
- The guide's approval example (PDF p.34 / printed p.31) uses the title “Tez Onay Sayfası” (16 characters). Its approval sentence occupies five extracted lines. Section 4.2.3 says the example assumes five jurors and instructs authors to adjust for the actual juror count; it gives no title-length or long-title rule.

## What the official DOCX encodes

- The approval paragraph is justified and uses 12 pt runs with `w:line="360"` and `w:lineRule="auto"` (1.5-line spacing). It is preceded and followed by an empty paragraph with the same 360/auto line setting. Jury affiliation paragraphs also use 360/auto, with 120 twips (6 pt) after.
- The approval table's first row has `w:trHeight w:val="9014"` but no `w:hRule`; its second row has no row height. Neither the row nor the sentence paragraph carries a `w:cantSplit` / `w:keepLines` property. Under Word's row-height rule, an omitted `hRule` means `atLeast`, so 9014 twips is a minimum, not a fixed height. This permits the row to grow when its contents wrap; it does not prescribe a compact long-title layout. [Microsoft's Open XML note](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/5919e0bd-e6ce-477e-8d66-0e5282f5c506) documents Word's default.
- The source cover has 35 empty paragraphs before the title placeholder, then centered title paragraphs “TEZ BAŞLIĞI” (11 characters) and “TEZ BAŞLIĞI (Devam)” (19 characters), each with zero before/after spacing. The degree, student, advisor, optional second-advisor, department and date paragraphs follow; the marked paragraphs have 120 twips (6 pt) before. This demonstrates a continuation line in a normal-flow cover, but sets no title-length limit or fit adjustment. The guide's cover example likewise labels a title continuation.
- Word's Normal style names Times New Roman; the guide explicitly requires Times New Roman 12 pt on the outer cover. The example does not establish how many lines an arbitrary title may use while retaining the 100 × 65 mm cover box.

## Attempt 4 measurements

The exact title is “Dijital Okuryazarlık Düzeylerinin Çevrimiçi Öğrenme Ortamlarına Etkisinin İncelenmesi ile” (89 characters). The fixture changes only the title from the default and retains its other metadata, including the optional second advisor.

| Output | Official limit | Actual | Difference | Status |
|---|---:|---:|---:|---|
| Master's approval frame bottom | ≤266.996 mm | 269.987 mm | +2.991 mm | FAIL |
| Doctoral approval frame bottom | ≤266.996 mm | 269.259 mm | +2.263 mm | FAIL |
| Both outer-cover last-ink bottom | ≤275 mm | 277.797 mm | +2.797 mm | FAIL |

The long approval sentence wraps to six lines in the editor PDF; the default fixture uses five. One additional 12 pt, 1.5-spaced line is 20.7 pt (7.302 mm) under the repository's measured Word line model, consistent with the downstream frame moving down. The approved DOCX's third section in the generated long-title export has `w:bottom="680"` (11.994 mm), 18.010 mm less than the official template. The source boundary remains 266.996 mm regardless of this generated value.

For the cover, the measured last-ink position exceeds the guide's 275 mm print-box edge. The current 10 mm bottom inset lets the generated layout continue to 287 mm; it does not enforce the official 275 mm limit. The attempt-4 measurement does not isolate how much of the overflow comes from the title wrapping versus the optional second-advisor lines.

## Bound-corrected real-editor export (2026-09-29)

After changing the outer-cover bottom inset to 22 mm and inner cover, approval, and ethics to 30 mm, fresh master and doctoral exports were produced through `orchestration/tools/export.mjs` against a dedicated Vite server and Chromium 154.0.8037.58. At this intermediate stage, all four DOCXs encoded first-four section bottoms `[1247, 1701, 1701, 1701]` twips. Attempt 5 subsequently identified the remaining DOCX section-margin conflict; checkpoint `0d5d301` corrects every exported Word section to 1701 twips on all sides while positioning cover/approval content separately (see `docx-section-margins.md`).

### Normal-title control (71 characters)

Both corrected normal-title PDFs have **40 pages** versus 39 in attempt 4. The outer cover fits on page 1: its last ink is 272.931 mm, with “Ocak 2026” still on that page (2.069 mm inside the 275 mm bound). The inner-cover date moves to a separate page in both variants; its preceding content ends at 247.439 mm. The normal approval sentence is five lines and stays on one page. The measured outer frame bottom is **262.627 mm** for the master and **261.949 mm** for the PhD, both inside 266.996 mm; approval text bottoms are 258.726 and 257.998 mm respectively. The corrected ethics page stays on one page.

Both PDFs are 42 pages, three more than the 39-page attempt-4 outputs. The outer-cover title wraps to three lines and page 1's last ink is at 270.814 mm, within the 275 mm print box, but “Ocak 2026” moves to a separate page. The inner-cover date also moves to a separate page. The approval sentence uses six lines for both degrees; the frame top shifts to 196.420 mm (master) / 195.658 mm (PhD), and “Enstitü Müdürü” moves to a separate page. The frame's bottom edge is not present as an intact border in the approval page. Thus these corrected real-editor outputs still **FAIL** as one-page cover/approval layouts. A numerical approval-frame bottom cannot be measured from the split frame; do not infer a value from the prior 12 mm exports.

### Normal inner-cover date spill: source-to-export comparison

The normal fixture is 71 title characters and includes the official example's optional project-support line and second advisor. In `word/document.xml` paragraphs 46–74 (zero-based `w:body/w:p` order), the visible-flow sequence is: project line p46; university p48; institute p49; three empty paragraphs p50–52; degree p53; three empty paragraphs p54–56; title p57 and continuation p58; two empty paragraphs p59–60; student p61; two empty paragraphs p62–63; advisor label/name p64–65; one empty paragraph p66; second-advisor label/name p67–68; two empty paragraphs p69–70; department p71; one empty paragraph p72; date p73; section boundary on empty p74. The prompt text at p47 and the 12 pt prompt embedded beside the title/date are floating callout drawings, not additional centered text lines. The 2020 guide's example 2 (PDF p.33, printed p.30) shows the same visible line sequence, including both advisors and a two-line title.

| Visible block | Guide p.33 baseline (mm) | Corrected master and PhD export, p.2 baseline (mm) | Result |
|---|---:|---:|---|
| Project support | 33.87 | 33.949 | fits |
| University | 50.38 | 50.428 | fits |
| Institute | 58.94 | 58.948 | fits |
| Degree | 93.02 | 93.026 | fits |
| Title, line 1 / line 2 | 127.10 / 135.61 | 127.103 / 135.624 | fits |
| Student | 161.15 | 161.181 | fits |
| Advisor label / name | 186.72 / 195.22 | 186.738 / 195.258 | fits |
| Second-advisor label / name | 212.28 / 220.80 | 212.295 / 220.816 | fits |
| Department | 246.37 | 246.373 | fits |
| Date | 263.39 | moved to p.3 at 34.611 | **FAIL: date split** |

The source's visible blank counts match the template blocks; the corrected exports reproduce every expected baseline before the date to within 0.08 mm. This rules out an extra blank block or the optional advisor's conditional group as the cause. The source inner-cover text paragraphs use 14 pt and `w:line="360" lineRule="auto"` (the project line is 12 pt); the title-continuation paragraph p58 has no explicit `w:spacing`, while the guide image supplies its measured baseline.

**Measured model / inferred pagination cause in the untrimmed export:** the current TNR line model uses a 1.15-em single line and 1.5-line spacing, so a 14 pt CSS line box is 24.15 pt. The measured baseline offset is 0.9336 em; the box therefore extends 11.0796 pt (3.908 mm) below its baseline. At the source date baseline 263.39 mm, its full line box would end at 267.298 mm, 0.302 mm below the official 266.996 mm content boundary. Chromium's column pagination moves the whole date paragraph to p.3 even though its source baseline is within the page. The untrimmed split export does not emit the date glyphs on p.2, so that export alone does not establish their ink bound. No title shortening, spacer deletion, or line-height reduction is source-backed.

## Opt-in terminal text-box trim and current real exports (2026-09-29)

The inner-cover date's untrimmed line box crosses the content boundary by 0.302 mm, while the source guide's visible date glyphs end at 264.414 mm and the original attempt-4 generated date glyphs end at 263.440 mm, both inside 266.996 mm (600 dpi raster measurement; black-pixel threshold <50). The matching baseline sequence and glyph placement show unused trailing leading as the measured spill, rather than a missing blank-line correction. The inner-cover layout now opts into a generic, terminal-text-only `text-box-trim: trim-end` rule guarded by `@supports`; no university selector or changed line-height/baseline is in the engine. This rule applies only to the final text block of special pages that explicitly set the boolean `page.trimTerminalTextLeading`. Other special pages and ordinary pages are unaffected. The user-facing source note asks authors to inspect the PDF if the date lands separately; in a browser without `text-box-trim`, the guarded rule is ignored and the separate-page behavior remains visible.

In Chromium 154.0.8037.58, `CSS.supports("text-box-trim", "trim-end")` is true. On both normal and 89-character inner covers, the terminal date element keeps computed `line-height: 32.2px` while its box height trims from 32.2 px to 26 px; the measured date baseline remains **263.409 mm**. Master and PhD normal exports now have **39 pages** each and the inner-cover date is on page 2 instead of spilling to page 3. At 600 dpi, the exported date's black-pixel bounds are **260.096–263.440 mm**, so its ink ends **3.556 mm above** the official boundary. All visible baselines preceding the date remain as measured in the comparison above.

The long exports remain **FAIL**: master and PhD each have **41 pages**; the outer-cover date is orphaned on page 2, the inner-cover date is on page 3 at baseline 263.409 mm, and the approval content continues onto page 5 (`Enstitü Müdürü`). The trim fixes only the normal inner-cover date spill; it does not compact title, juror, or advisor content. Normal approval still fits on page 3. The terminal trim does not change the preserved 89-character failure.

## Cause, resolution, and unknowns

An official-source web check on 2026-09-30 found no further current long-title rule. The [2020 FBE guide](https://fenbil.aku.edu.tr/wp-content/uploads/sites/115/2019/12/FBE-Tez-Yaz%C4%B1m-Kilavuzu-2020_WEB_i%C3%A7in-2-1.pdf) illustrates a title-continuation line on each cover but does not cap the number of lines. The [current institute thesis resources](https://fenbil.aku.edu.tr/hizmet-standardi-tablolari/) list the guide, Word and LaTeX templates without a separate long-title instruction. The [thesis completion instructions](https://fenbil.aku.edu.tr/tez-bitirme-asamasinda-yapilmasi-gereken-islemler/) specifically require inspection of approval-page formatting but give no compact layout. Searches of official AKÜ pages for long titles, cover fit, line wrapping, and reduced type size yielded no applicable rule. This is an absence in the reviewed sources, not proof that no university guidance exists elsewhere.

With the installed Times New Roman at 12 pt, the exact 89-character title needs at least three word-wrapped lines inside 100 mm: the best possible two-line split requires 114.02 mm (FreeType measurement; Microsoft Word not measured). A [2016 AKÜ FBE thesis in the university repository](https://acikerisim.aku.edu.tr/xmlui/bitstream/handle/11630/5948/10128486.pdf?isAllowed=y&sequence=1) shows a three-line inner-cover title and natural wrapping in the approval sentence. This is historical MEASURED precedent, not a current exception for fitting the tested title plus optional second advisor.

1. The page-bound conflict has been corrected in the model and Word section properties: every DOCX section now declares 30 mm on all sides, while the PDF/editor outer-cover print box ends at y=275 mm. The opt-in terminal trim fixes the measured normal inner-cover date spill while retaining its baseline; long-title cover and approval content still splits across sheets. No source rule authorizes compressing titles or spacing to force a fit.
2. The outer cover remains TNR 12 pt and centered; the 22 mm inset enforces the guide's y=275 mm print-box edge but does not guarantee every combination of title and optional fields fits on one page.
3. The source supports variable text structurally: it includes a title continuation on the cover, and Word's approval row is allowed to grow. It does **not** state a maximum title length, a shrink rule, a reduced line pitch, or an alternate long-title page. Thus the 89-character editor exports fail the measured source bounds, but the sources do not prove that 89 characters exceed an intrinsic Word capacity. Whether Word itself wraps this exact title into a compliant layout is UNKNOWN.

**Source-backed disposition:** official page bounds are implemented and typography/spacing are retained. The real Chromium exports PASS the normal inner-cover date ink bound but FAIL the 89-character optional-field cover/approval fit. Microsoft Word's rendering remains UNKNOWN. The sources do not establish that an 89-character title exceeds Word's intrinsic capacity, so any further adaptation needs an official long-title rule. Do not mark the long case PASS by visual similarity or by restoring the generated 10/12 mm margins.
