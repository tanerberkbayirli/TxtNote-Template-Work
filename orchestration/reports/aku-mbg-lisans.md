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
