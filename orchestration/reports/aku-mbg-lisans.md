# aku-mbg-lisans — Source analysis

**Target:** Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Moleküler Biyoloji ve Genetik Bölümü. Lisans (Bitirme) Tezi.
**Spec:** `orchestration/specs/aku-mbg-lisans.json` (schemaVersion 2, analysed 2026-09-28)
**Derived files:** `orchestration/artifacts/aku-mbg-lisans/source/`
- `AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.pdf`: LibreOffice 24.2 render of the template (27 pages).
- `template_render_geometry.json` and `guide_geometry.json`: per-line text, font, size, x0/x1 and baseline in mm, plus images and drawings. Lines inside red instruction callouts are flagged `calloutInstruction`.
- `template_paragraph_dump.txt`: every paragraph with its pPr and run formatting.
- `docx_xml/`: document.xml, styles.xml, settings.xml, numbering.xml, footers and the two logo images.
- `renders/`: 12 low-resolution PNG page renders.

Environment note: the container's LibreOffice had no Writer component, so no DOCX could be converted. I installed `libreoffice-writer-nogui` with apt so the template could be rendered. No repository files outside the permitted paths were touched.

## 1. Summary

| Item | Value | Basis |
|---|---|---|
| Paper | A4 portrait, one side only, 70–100 g/m² | EXPLICIT |
| Margins | 30 mm on all four sides (1701 tw). Exception: the inner cover has a 10.02 mm top margin | EXPLICIT + TEMPLATE |
| Body text | Times New Roman 12 pt, justified, "1,5 satır" (pitch 20.70 pt / 7.30 mm), no first-line indent | EXPLICIT + TEMPLATE + MEASURED |
| Paragraph gap | One empty 12 pt line at 1.5 spacing (20.70 pt) between paragraphs and around headings | EXPLICIT + TEMPLATE |
| Headings | 4 levels, all TNR 12 pt bold, left aligned, 1.5 spacing. Numbering: `1. GİRİŞ`, `2.1`, `2.2.1`, `2.3.1.1` (typed). H1 is uppercase with lowercase ve/veya/ile and starts a new page. H2 is Title Case | EXPLICIT (H1/H2), TEMPLATE (H3/H4 case) |
| Page numbers | Footer, centred, TNR 10 pt, no decoration. Covers and ethics page unnumbered. ÖZET = i (lower Roman). 1. GİRİŞ = 1 (Arabic), which continues through KAYNAKLAR and EKLER. Footer distance 12.51 mm, so the baseline is about 283.7 mm | EXPLICIT + TEMPLATE |
| Captions | Şekil / Çizelge / **Resim** with chapter numbering (`Şekil 2.1`). Label bold, then a space, then the text. 11 pt, single spacing, justified, hanging indent equal to the label width, 6 pt after. Tables have the caption above; figures and pictures below | EXPLICIT + TEMPLATE |
| Tables | Centred. Three horizontal 0.5 pt rules, no vertical rules. 12 pt single spacing (8 pt minimum allowed). Notes below the table: 10 pt, single, 6 pt before and after | EXPLICIT + TEMPLATE |
| TOC | Title "İÇİNDEKİLER DİZİNİ" (bold, centred per the guide). "Sayfa" bold and right-aligned under the title. Entries 12 pt regular, 1.5 spacing, dot leader to 179.85 mm. Indents 0 / 5.01 / 10.0 / 15.01 mm. Lists front-matter titles in Roman plus ÖZGEÇMİŞ and EKLER | EXPLICIT + TEMPLATE |
| Bibliography | "6. KAYNAKLAR" (numbered like a chapter). 1.5 spacing, 6 pt before, 0 after, justified, 12.5 mm hanging, alphabetical, no blank lines. A separate "İnternet Kaynakları" block numbered `1-` | EXPLICIT (text + dialog screenshot) + TEMPLATE |
| Citations | Author–year, e.g. (Soyad Yıl), (A ve B Yıl), (A vd. Yıl), (İnt. Kyn. 1) | EXPLICIT |

Rule counts: 189 rules in total. 123 EXPLICIT, 59 TEMPLATE, 1 MEASURED, 4 INFERRED, 2 UNKNOWN (footnote size and abstract word limit). More UNKNOWN keys are listed in `unknowns[]`. The spec also has 15 sections, 13 conflicts, 16 engine-gap entries and 51 measurable checks.

## 2. Variant decision

`aku-mbg-lisans-undergrad-tr-v1` is **confirmed**. Neither source offers an English-language thesis or any degree sub-variant. The Turkish thesis contains a Turkish ÖZET and an English ABSTRACT; the ABSTRACT must use the words "Graduation Thesis" (guide §4.2). No other variants exist.

## 3. Source priority

1. **Guide PDF (2025-05-13).** Its explicit sentences win, and it is newer than the template.
2. **Template DOCX (2025-02-27).** It supplies the exact XML values and special-page structure where the guide is silent or agrees. The red callout boxes are instructions, never printed text. The red "(Bir boşluk)" lines mean "one empty line".
3. **The guide's own page geometry is not normative.** The guide claims it follows its own measurements, but it was typeset with about 25 mm left margins, right edges at 183.5–186.2 mm, a 10 mm bibliography hanging indent and non-hanging captions. It is used only to confirm Word's 1.5-line pitch (7.29–7.32 mm) and the caption fonts (bold 11 pt label, regular 11 pt text).

## 4. Conflicts (decision; ⚠ = needs confirmation)

1. ⚠ **Titles of the index pages (dizin).** The guide says İÇİNDEKİLER, ŞEKİLLER, ÇİZELGELER and RESİMLER DİZİNİ titles are centred (§4.4, §4.6–4.8). The template leaves them left-aligned (Balk1 with no alignment set). **Decision: centred** (guide is explicit and newer).
2. ⚠ **SİMGELER ve KISALTMALAR DİZİNİ title.** The guide is silent and the template has it left-aligned. **Decision: left**, but this is inconsistent with the other index pages.
3. ⚠ **Order on ÖZET/ABSTRACT.** The guide says text, then keywords, then year + page count. The template has text, then year + page count, then keywords. **Decision: follow the guide.**
4. ⚠ **Inner cover top margin.** The template's section 1 has top = 568 tw (10.02 mm, logos at the top of the page). The guide's rule is "3 cm on all edges". **Decision: 10.02 mm for the inner cover only.**
5. **Caption hanging indent.** The guide text says "asılı" (hanging) and the template uses hanging indents close to the label width. The guide's own printed examples do not hang. **Decision: hanging.**
6. **Bibliography hanging indent.** The guide text, its screenshot of Word's paragraph dialog (1,25 cm; 6 nk before; 0 nk after; 1,5 satır) and the template (709 tw) all agree. The guide's own examples use 10 mm. **Decision: 12.5 mm.**
7. **Widow control.** The guide forbids a lone line at the top or bottom of a page. The template's Normal style has `widowControl=0`. **Decision: widow/orphan control on.**
8. **Name size on the ethics page.** The template run has no size set, so it renders at 10 pt. The guide says 12 pt everywhere except İç Kapak. **Decision: 12 pt.**
9. ⚠ **ÖZGEÇMİŞ.** It is in the guide's §4.4 list of what the TOC contains and in the template TOC, but missing from the §4.1 section order and has no page in the template. **Decision: optional section before EKLER.**
10. ⚠ **Dış Kapak versus İç Kapak.** The guide lists both. The template has one cover page, and its callout says "Sadece bu sayfada 14 punto", which together with guide §2.2 makes it the İç Kapak. **Decision: the Dış Kapak layout is UNKNOWN.**
11. **TOC title text.** The template and guide §4.1 use "İçindekiler Dizini"; the guide's own TOC page says "İÇİNDEKİLER". **Decision: "İÇİNDEKİLER DİZİNİ".**
12. ⚠ **Line spacing of the thesis title.** On the cover, the title paragraph is 1.5 and the "(Devam)" paragraph is single. On ÖZET/ABSTRACT the title is single. Wrapping inside one paragraph is not demonstrated.

## 5. UNKNOWNs

- **Dış Kapak layout.**
- **Where Word places the extra half-line of "1,5 satır".** It could go above or below the glyphs; the LibreOffice render puts it below. This does not change the pitch, but it can move absolute baselines by up to 2.43 mm (12 pt) or 2.84 mm (14 pt). The top-margin check in the spec is therefore written as a range.
- **Height of the cover logo line.** The logos are inline pictures in a 1.5-spaced paragraph. Word may scale that line by 1.5, while LibreOffice adds only 8 pt. As a result, **the absolute vertical positions of the cover lines are renderer-dependent**: under a full-scaling Word model the lines could sit about 14.7 mm lower than in the LibreOffice render. The cover checks in the spec are therefore relative (pitch, number of empty lines, centring, fonts, logo boxes). Confirm against a real Microsoft Word render before enforcing absolute y values.
- Footnote typography. The only value available is TNR 10 pt inherited through the Normal style.
- Abstract word or page limit.
- Appendix heading style (only "EK 1., EK 2." is given).
- ÖZGEÇMİŞ layout.
- Letter case of H3/H4 (only template samples, which are Title Case).

## 6. Engine gaps (against `schema.d.ts`)

1. **A third caption kind, "Resim".** It needs its own chapter numbering and its own generated "RESİMLER DİZİNİ". The engine only has `tables`/`figures` and `GeneratedIndexRule.kind` of toc, figures or tables.
2. **Caption hanging indent equal to the label width.** The same is needed for list-of-figures/tables entries, which also need a bold label.
3. **"(Devam)" continuation caption** for tables that split across pages.
4. **Table note paragraph** (10 pt, single, 6 pt before and after).
5. **Three-rule table borders.** The schema has no border model.
6. **Derived counts for ÖZET/ABSTRACT.** The line needs the front-matter page count in Roman (for example "ix") and the body page count from GİRİŞ including appendices. Only `derived: "totalPages"` exists.
7. **Equations.** Centred, Cambria Math, with `(chapter.n)` numbers right-aligned.
8. **Bibliography heading numbered as the next chapter** ("6. KAYNAKLAR"), plus the separate numbered "İnternet Kaynakları" group.
9. **Label-width hanging indent** for the "Anahtar Kelimeler:" and "Keywords:" lines.
10. **Inner cover logo row.** It needs two images with exact x positions (32.49 mm, and right edge at 180.0 mm) and a per-section 10 mm top margin. The margin is already possible through `overrides.page`.
11. **Placement of the extra leading in Word "n lines" spacing** (see the UNKNOWN above).
12. **No automatic uppercase on H1.** The textTransform must stay "none" because the lowercase conjunctions are required.

## 7. Open questions for the integrator / orchestrator

- **Cover design.** Accept the 10 mm top margin? Should the Dış Kapak be omitted (PDF or spiral-bound submission) or duplicate the İç Kapak?
- **Vertical reference for the cover.** Relative checks only, or obtain a Microsoft Word render of the template?
- **ÖZGEÇMİŞ.** Offer it as an optional page or leave it out?
- **SİMGELER title alignment.** Centre it to match the other index pages, or keep it left as in the template?
- **Resim captions.** Implement the generic caption-kind extension (preferred), or map Resim onto figures? Mapping loses the separate numbering and the separate RESİMLER DİZİNİ, so it cannot pass.

## Spec review

Independent review, 2026-09-28. I re-derived the rules from both official sources and changed the spec in place (`review` block, `reviewedAt`). Review artifacts are in `orchestration/artifacts/aku-mbg-lisans/review/`:
- `guide_all_lines_incl_blank.txt`: every span of the guide, including blank lines, images and rules.
- `cover_word_model.py` and `cover_word_model_output.txt`: the inner-cover geometry recomputed from `document.xml`.
- `apply_review.py`: the exact edits made to the spec.

### Word layout model (was UNKNOWN; now measured on the Word-2010 guide PDF)
- **Where the extra half line goes.** The extra half line of "1,5 satır" goes **below** the text.
  - On pp.6/15/16/19/20 the first line of a 1.5-spaced paragraph sits 10.9 pt below the top margin (24.99 mm). If the extra went above, it would sit at 17.8 pt.
  - On p.4 a 1.5-spaced paragraph that follows single-spaced blank lines starts 13.32 pt below the previous baseline. The model predicts 13.45 pt if the extra goes below and 20.35 pt if it goes above.
- **First baseline.** The first baseline is **0.911 em** below the top of the line box, for both single and 1.5 spacing.
  - Measured range: 0.906–0.912 em. The hypothesis ascent+lineGap would give 0.934 em, which is 0.1 mm lower at 12 pt.
  - The first row of the p.7 table (single spacing) confirms the value.
- **Below the baseline.** The line box extends 0.239 em below the baseline for single spacing and 0.914 em for 1.5 spacing.
- **Page fit.** A line fits the page when its glyph part is above the bottom margin; the extra half line may hang into the margin. This is INFERRED from the guide's pp.19–21 and from the template cover.
- **Inline pictures in 1.5-spaced paragraphs.** Word does **not** scale the whole picture line by 1.5. The template's own Word pagination record rules it out: `docProps/app.xml` Pages = 27, which matches LibreOffice page for page, and the `w:lastRenderedPageBreak` positions agree. Full scaling would have pushed the Şekil 2.2 page and the cover onto extra pages.
- **effectExtent.** Word counts `effectExtent` in the size of an inline picture (ECMA-376 §20.4.2.6).
- **Paragraph spacing.** Only `contextualSpacing` = off is demonstrated, for bibliography entries (dialog screenshot, p.18). Two points stay UNKNOWN because no source page shows them:
  - whether space-after and space-before add up;
  - whether space-before is suppressed at the top of a page.

### Absolute geometry
- **İç Kapak, recomputed from the XML with the model above.** Baselines in mm:

  | Line | Baseline (mm) |
  |---|---|
  | AFYON | 45.00 |
  | FEN | 53.51 |
  | BÖLÜMÜ | 62.03 |
  | BİTİRME TEZİ | 104.63 |
  | Title | 138.70 (second line 147.22) |
  | Student | 169.94 |
  | Danışman | 195.50 |
  | Advisor | 204.01 |
  | Ay, Yıl | 263.65 |

  - Logos: x0 32.01 mm and x1 179.79 mm, tops at 10.02 mm.
  - LibreOffice places every line a constant 1.26 mm higher, because it ignores `effectExtent` and uses a 0.936 em first-baseline offset.
  - The cover checks are now absolute (`cover-baselines`, `cover-logos`).
  - Remaining risk: Word may add no text-based extra (8.05 pt) to the logo row. In that case every line below the logos sits 2.84 mm higher. Only a real Word render of the template can settle this.
- **Other special pages.** Baselines are the LibreOffice values − 0.10 mm (title baseline 33.86 mm). The TOC "Sayfa" line is at 41.16 mm; the LibreOffice value was a mis-render. The ethics-page name is 12 pt at 178.70 mm.
- **Margin checks.** `margin-top` is now absolute: first baseline 33.86 mm ± 0.25. `margin-bottom`: last baseline ≤ 265.99 mm.

### Decisions on the conflicts
- **Index-page titles:** centred. The guide is explicit and newer; the template titles are plain Balk1 with no alignment set.
- **SİMGELER title:** left. The guide is silent, so the template decides; analogy with the other index titles cannot override it.
- **ÖZET/ABSTRACT order:** the guide's order.
- **İç Kapak top margin:** 10.02 mm. The guide's 3 cm is generic, and with 3 cm the official cover no longer fits one page: Ay, Yıl would be at 283.6 mm, past the 267 mm limit.
- **Widow control:** on.
- **Section breaks.** The template's `oddPage`/`evenPage` section breaks insert **no** blank pages, because every later section restarts numbering at 1. They should be implemented as plain new-page section starts.
- **ÖZGEÇMİŞ:** optional and off by default. If enabled, it goes between KAYNAKLAR and EKLER (the template's TOC order: 14 / 17 / 18). I moved the section there.
- **Dış Kapak:** do not generate it (see Still open).
- **Multi-line title:** a wrapped title keeps its own paragraph's spacing — 1.5 on the cover, single on ÖZET/ABSTRACT. The template's "(Devam)" sample lines are inconsistent, so they cannot set the rule.
- **Guide (May 2025) vs template (Feb 2025):** the guide's text wins wherever it is explicit. The template's XML supplies every value the guide leaves open.

### New rules and checks
- **New rules:**
  - `captions.table.keepWithNext`: the Balk6 style has keepNext.
  - `printing.fromWordFile`: §4.15 says to print from the Word file, not from a PDF.
  - `submission.similarityMaxPercent` (30 %).
  - `wordModel.footerBaselineMm` = 283.65. The analyzer's 283.73 is kept for the check; the difference is 0.08 mm.
- **18 new checks:** absolute cover baselines, special-page first baseline, no blank pages, widow/orphan, heading and table-caption keep-with-next, "Sayfa" on the list pages, list entry format, keyword hanging indent, Graduation Thesis, acknowledgement signature, ethics name size, table notes, table rules, equation number, İnternet Kaynakları, appendix new page, and DOCX as the print master.

### Still open
- **Dış Kapak layout: UNKNOWN.** It blocks only that page; a sample from the department is needed.
- **Logo-row extra:** 0 or 8.05 pt; see Absolute geometry.
- **ÖZGEÇMİŞ layout:** no sample in either source.
- **Paragraph spacing:** whether spacing is additive and whether space-before applies at the top of a page.
- **Footnotes and abstract length:** the sources are silent.

## Implementation and self-check (2026-10-02)

**Status: PASS (self-check, real export) with the limits below.** Source check: KAYNAK.md sha256 of guide (`b631d3c7...`) and template (`33432d85...`) match the repo files; `document.xml` of the DOCX is byte-identical to the analysed copy. Spec corrections: source paths now include the `MBG_Lisans_Bitirme_Tezi/` subfolder; ethics page `İmza` baseline 171.40 -> 172.60 mm and name 178.70 -> 179.90 mm (XML has an empty 12 pt/1.5 paragraph between date and İmza; the LibreOffice value treated it as 10 pt).

- Registry id: `aku-mbg-lisans-tr-v1` (instituteId `fef-mbg`, degreeType `undergraduate`, official).
- Files: `TxtNote/frontend/src/thesis/templates/aku-mbg.js`, `.../templates/assets/akuMbgLogos.js` (the two seals of the official DOCX), `src/lib/thesisAkuMbg.test.js` (7 tests; full suite 549 pass), registry line, `orchestration/validation/aku-mbg-lisans/self-1/` (fixture, `mbg.pdf`, `mbg.docx`, `dump.py`).
- Engine: no changes; used existing capabilities (word line model, additive spacing, captionKinds, threeRule tables, continuation captions, equations, `titleNumbering: continueH1`, `textTransformExceptions`, derived page counts, tableNote style, image blocks in a row group).

Measured on the real export (34 sheets, genuine TimesNewRomanPS-* and Cambria Math embedded; tolerance 0.25 mm):
| Check | Source | Export | Result |
|---|---|---|---|
| Margins 30 mm (DOCX pgMar 1701 tw; PDF text x0/x1) | 30.00 / 180.00 | 30.00 / 179.97-180.00 | PASS |
| Body 12 pt TNR, 1.5 pitch, no indent, one blank line between paragraphs | 7.30 mm / 14.60 mm | 7.30 / 14.60 | PASS |
| First baseline on text pages | 33.86 | 33.95 | PASS (+0.09) |
| Page number TNR 10 pt, centred, baseline | 283.65-283.73 | 283.52, x-centre 105.0 | PASS (-0.13..-0.21) |
| Numbering: cover/ethics none, ÖZET = i, GİRİŞ = 1 | | none / none / i / 1 | PASS |
| Inner cover seals (top 10.02; x 32.01-58.2, right edge 180) | 32.01 / 153.54-179.79 | 31.99 / 153.75-180.00 | PASS (right seal +0.21) |
| Inner cover baselines AFYON/FEN/BÖLÜMÜ/BİTİRME/title | 45.00/53.51/62.03/104.63/138.70 | 45.17/53.69/62.21/104.80/138.88 | PASS (+0.18) |
| Cover block gaps student-Danışman, advisor-date | 25.56 / 59.64 | 25.56 / 59.63 | PASS |
| Ethics page baselines (title, intro, bullets, beyan, date) | 33.86/55.76/70.37/143.39/158.00 | 33.95/55.85/70.45/143.46/158.06 | PASS |
| Bullet column / İmza x | 37.50 / 167.37 | 37.50 / 167.37 | PASS |
| TOC: Sayfa line, indents 0/5/10/15, right edge | 41.16; 30/35.01/40/45.01; 179.85 | 41.25; 30/35/39.99/45; 180.00 | PASS |
| List entries hang under caption text | ~46.3 | 46.35 | PASS |
| Figure image bottom to caption baseline | 6.2 (guide, non-normative) | 6.21 | PASS |
| Caption 11 pt, hanging = label width, continuation "(Devam)" | | 14.98 mm, present | PASS |
| Bibliography hanging 12.5, 6 pt before | 12.5 | 12.49, pitch 9.42 | PASS |
| Table rules | 3 x 0.5 pt | 3 rules, drawn 0.75 pt (Chromium border snapping; DOCX 0.5 pt) | PASS within 0.1 mm |
| Equation Cambria Math 12 pt centred, number right (3.1) | | centre 104.97, right 179.95 | PASS |

Limits and open items: (1) Dış Kapak not generated (UNKNOWN). (2) A cover title that wraps to two or more lines at 1.5 spacing pushes "Ay, Yıl" off the page (the template sample has a single-spaced "(Devam)" second line); a two-line title overflows by about 0.9 mm and a three-line one by a page: spec conflict 12, unresolved, the author has to remove empty lines. (3) Abstract title with two lines sits 2.4 mm higher than the template sample for the same reason. (4) H3/H4 case left as typed (UNKNOWN); footnotes TNR 10 pt (UNKNOWN, engine field); ÖZGEÇMİŞ and EKLER heading are minimal unnumbered H1s (layout UNKNOWN); "İnternet Kaynakları" is author-typed. (5) Heading numbers (H2-H4) start 0.23 mm left of the margin in the PDF text bbox (shared engine label placement, inside tolerance). (6) Absolute cover positions depend on the Word model for the 1.5-spaced logo line (UNKNOWN, see above); verified relative to the XML model.
