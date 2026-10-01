# aku-fbe — Afyon Kocatepe Üniversitesi, Fen Bilimleri Enstitüsü

Analyzed 2026-09-28. Spec: `orchestration/specs/aku-fbe.json` (schemaVersion 2).
Derived files: `orchestration/artifacts/aku-fbe/source/` (guide text, `guide_geometry.json` with every line/image/drawing of all 43 pages in mm, `template_paragraphs.json` with every DOCX paragraph, extracted `docx_xml/`, and `scripts/`).

## Sources

| Source | Role | Version | Notes |
|---|---|---|---|
| `AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf` | guide, primary | 2020. "Ocak 2020’den itibaren geçerlidir" (p.4). The PDF was made in Word 2010 and last modified 2020-12-14 | 43 pages. The example pages are PDF pp.32–43 (printed 29–40). The caption examples are pp.14–15 |
| `AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx` | template, primary | The file dates from 2025 (created/modified 2025-01-23, revision 2, 1 minute of editing). Its content belongs to the 2019/2020 generation | Contains "Afyonkarahisar 2020" (#198), "2019, ix + 16 sayfa" (#136), lastPrinted 2019-12-09. Callout #6 says it was "LİSANSÜSTÜ TEZ YAZIM KILAVUZUNA GÖRE HAZIRLANMIŞTIR" (prepared from the thesis-writing guide) |

**Flag `guide-template-version-gap`:** the 2025 template is a re-save of the template that goes with this 2020 guide. There is no newer rule set. The hard-coded years (2019/2020) and the director name ("Prof. Dr. Bekir YALÇIN") are placeholders.

**Source priority:**
1. The guide's explicit sentences win.
2. The template XML decides everything the guide does not state: footer distance, TOC tab and indents, caption spacing, table rules and special-page structure.
3. The template also wins over the guide's example-page geometry where the two differ. These cases are flagged `needsConfirmation`.
4. The guide's example geometry wins over isolated template formatting accidents (for example inner-cover paragraph #58).

**Environment limitation:** LibreOffice here has no Writer component (`soffice` reports "source file could not be loaded" even for a trivial DOCX), so I could not render the template. I computed template-based positions from the XML using the Word line model: single line = 1.15 em, and the extra space of a 1.5 line goes below the baseline. I checked this model against the guide PDF: 13.80 pt / 20.7 pt / 24.15 pt pitches, and a first baseline at 30 mm + ascent.

## Variant decision

- **aku-fbe-master-tr-v1: confirmed.**
- **aku-fbe-phd-tr-v1: confirmed.**

The guide covers "Yüksek Lisans ve Doktora Tezleri" (master's and doctoral theses). The template shows "YÜKSEK LİSANS TEZİ / DOKTORA TEZİ" and its callout mentions "YL-DR TEZLERİ".

The two variants differ only in:
- **Degree strings:** YÜKSEK LİSANS TEZİ / DOKTORA TEZİ (covers, approval page), Yüksek Lisans Tezi / Doktora Tezi (ÖZET), M.Sc. Thesis / Ph.D. Thesis (ABSTRACT).
- **Jury size:** the PhD approval page has 7 jurors when there is a second advisor (callout). The master's jury size is not stated; the example is drawn with 5.

Both degrees require the ÖZGEÇMİŞ (CV) section. There are no English-language variants.

## Key rules (all in the spec with evidence)

- **Page:**
  - A4 portrait.
  - All four margins are 30 mm (guide "3 cm", template `pgMar 1701`).
  - Printed on one side only. No header.
  - Footer distance is 12.5 mm.
- **Page numbers:**
  - Bottom centre, Times New Roman 10 pt, with no parentheses or dashes.
  - The outer cover, inner cover, approval page and ethics page are neither numbered nor counted.
  - ÖZET = i (lower-case roman).
  - "1. GİRİŞ" = 1 (arabic), continuing through KAYNAKLAR, ÖZGEÇMİŞ and EKLER.
  - Predicted number baseline: 283.7 mm (INFERRED).
- **Body text:**
  - Times New Roman 12 pt, 1.5 lines (20.7 pt pitch), justified, no first-line indent.
  - One empty 1.5 line between paragraphs and before and after headings. The spec expresses this as spaceAfter 20.7 pt, with heading spaceBefore 0.
  - No widow or orphan lines.
- **Headings:**
  - Four levels, all 12 pt bold, left-aligned at the margin, 1.5 spacing.
  - Numbering: `1.` (chapters), then `2.1`, `2.2.1`, `2.3.1.1` (no trailing period below level 1).
  - Level 1 is in capitals but keeps the conjunctions ve/veya/ile in lower case, so a blanket uppercase transform must not be used. Level 2 is Title Case.
  - Each chapter starts on a new page.
  - Front-matter titles are centred, bold and unnumbered.
- **Captions:** Şekil, Çizelge and Resim (three separate kinds).
  - Numbering is `{chapter}.{n}` with a single space before the text.
  - Label and number are bold, the text is regular.
  - 11 pt, single spacing, justified, with a hanging indent so that wrapped lines align after the label.
  - Table captions go above the table (6 pt after). Figure and Resim captions go below (6 pt after; image bottom → caption baseline 5.96 mm measured).
  - A continued table or figure repeats its caption with "(Devam)".
- **Tables:** centred, 12 pt (8 pt minimum allowed for large tables), single spacing, three horizontal rules only. Table notes go below the table in 10 pt single spacing.
- **Equations:** Cambria Math 12 pt, centred. Numbered `(chapter.n)` flush right, with a 1.5 blank line before and after.
- **Bibliography:**
  - The title is the next numbered chapter (e.g. `6. KAYNAKLAR`).
  - Entries are justified with a 12.5 mm hanging indent, 1.5 spacing, 6 pt before and 0 pt after.
  - Sorted alphabetically. Internet sources come last under the bold subheading "İnternet Kaynakları", numbered "1-". Citations are author-year.
- **TOC (İÇİNDEKİLER DİZİNİ):**
  - A bold, right-aligned "Sayfa" line sits under the title.
  - Rows are 1.5-spaced with 0 pt after and dot leaders, with page numbers at 179.84 mm.
  - Indents are 0 / 5 / 10 / 15 mm per level.
  - It lists the front sections (including itself), the chapters, KAYNAKLAR, ÖZGEÇMİŞ and EKLER.
- **Lists (ŞEKİLLER / ÇİZELGELER / RESİMLER DİZİNİ):** a "Sayfa" heading and a bold label, with hanging continuation lines. Row spacing is the subject of a conflict (see below).
- **Symbols and abbreviations list:** single spacing, with the definitions aligned on a tab stop. Abbreviations are alphabetical.
- **Abstracts (ÖZET / ABSTRACT):** a fixed centred header block, then the text, then the "YIL, <roman> + <arabic> sayfa" line, then "Anahtar Kelimeler" / "Keywords" (4–6 keywords, continuation lines aligned after the label).
- **Special pages:** layouts in the spec come from the measured guide example pages, reconciled with the template XML:
  - Outer cover: text area 55–155 mm × 210–275 mm, 12 pt.
  - Inner cover: 14 pt bold, measured baselines.
  - Approval page: tab-aligned jury rows and a double-bordered box whose top edge is at 189.0 mm.
  - Ethics page.
  - TEŞEKKÜR (acknowledgements).
  - ÖZGEÇMİŞ (CV).

## Conflicts (decisions)

1. **Right margin:** the guide's own pages end their lines at x = 181.09 mm (28.9 mm margin). The explicit "3 cm" rule and the template XML both give **30 mm**, so 30 mm is used.
2. **Page-number position:**
   - The template footers actually used are one paragraph at 12.5 mm, which gives a baseline of about 283.7 mm.
   - The guide's pages show 279.65 mm (pp.33–43) and 276.18 mm (pp.2–32). The 279.65 mm value is fully explained by the same 12.5 mm footer with an extra empty paragraph, as in template `footer5.xml`.
   - Decision: the template wins.
3. **Order of the keywords and the year/pages line in ÖZET:**
   - The guide text puts the keywords before the year/pages line.
   - The guide's own example page and the template put the year/pages line first.
   - Decision: year/pages first (**needsConfirmation**).
4. **Inner cover, second title line:** template paragraph #58 is single-spaced; the guide example is 1.5. Decision: 1.5, because #58 is the only paragraph on the page without it (**needsConfirmation**). Rendering the template literally would move everything below it up by 2.84 mm.
5. **TEŞEKKÜR signature gap:** the template has 2 blank lines, the guide example has 1. Decision: 2, following the template (**needsConfirmation**).
6. **Approval page, director block:**
   - Template order: dots, name, "Enstitü Müdürü". Guide order: dots, "Enstitü Müdürü", name.
   - Decision: template order (**needsConfirmation**).
   - Names after the colons: the guide shows them bold, the template regular. Decision: regular, following the template.
7. **Approval page, juror row pitch and box width:**
   - Template: 14.29 mm pitch, box 150 mm wide.
   - Guide: 12.91 mm pitch, box 154 mm wide.
   - Decision: the template, with the predicted baselines marked INFERRED (**needsConfirmation**). The box top (189.0 mm) is the same in both.
8. **List of figures/tables spacing:**
   - The template's instruction screenshot (`image2.jpg`, "aşağıdaki ayarlar uygulanmalı" = apply the following settings) says single spacing, 6 pt after, left-aligned, 1.6 cm hanging indent.
   - The template's own sample entries and the guide example (p.41–42) are 1.5-spaced with 0 pt after.
   - Decision: the screenshot (**needsConfirmation**).
9. **Symbols page gap:** the template has a 1.5 blank line after the title; the guide shows a single one. Decision: the template.
10. **Chapter heading → first paragraph:** the guide's p.4 shows a single blank. The explicit text and the template both give a 1.5 blank, which is used.
11. **ÖZGEÇMİŞ vs EKLER order:** the guide says the CV is "en son sayfa" (the very last page), but its order list, its TOC example and the template all place ÖZGEÇMİŞ before EKLER. Decision: ÖZGEÇMİŞ then EKLER (**needsConfirmation**).
12. **Widow control:** the template's Normal style disables it; the guide requires it. Decision: the guide.
13. **Section breaks:** the template uses odd-page section breaks. With single-sided printing, no blank filler pages should be added (**needsConfirmation**).

## UNKNOWN

- Footnote rules (only a 10 pt Word default style exists).
- Abstract word limit.
- Hyphenation.
- Whether the outer-cover border is printed, and the exact inset of the first baseline inside the cover box.
- Whether the empty slot is kept when the optional lines are absent (project-support line on the inner cover, İkinci Danışman row).
- Master's jury size.
- Whether the grey "İmza" signature placeholders are printed.
- Whether each appendix gets its own TOC entry.
- Whether the CV's "NOT: …" line is printed.
- Any example page for RESİMLER DİZİNİ.
- Template rendering geometry (no Writer available).

## Engine gaps (see `engineGaps` in the spec; checked against `schema.d.ts`)

1. The page-number font size (10 pt) cannot be set: `NumberingRule` has no style.
2. Level-1 headings need capitals with lower-case conjunctions, which a blanket `textTransform` cannot do.
3. There is no third caption kind "Resim" with its own counter and its own generated list.
4. No caption or list-row hanging indent equal to the label width.
5. No separate bold style for the label inside a caption or list row.
6. No "(Devam)" caption repeated on a split table.
7. No three-rule table border preset.
8. No table-note style.
9. No equation numbering.
10. The bibliography title cannot carry a chapter number ("6. KAYNAKLAR").
11. No inline bold runs inside special-page text blocks (approval sentence, "Danışman:", "Anahtar Kelimeler:").
12. It is unverified whether special blocks and DOCX support a hanging indent (keywords, dash list).
13. No double-bordered group box with a fixed top position or minimum height.
14. No text colour (grey signature hints).
15. The abstract's page-count line needs derived values for the last roman page label and the arabic page count; only `totalPages` exists.
16. No per-object landscape pages that keep a portrait bottom-centre page number.

The outer-cover text area and the variable-length jury list can already be expressed with margins and `visibleWhen`.

## Open questions for the integrator / institute

- **Confirm the five `needsConfirmation` layout decisions:** ÖZET element order, list-of-figures spacing, TEŞEKKÜR gap, approval-page juror pitch and director order, and ÖZGEÇMİŞ/EKLER order.
- **Outer cover:** should the TxtNote export include it as page 1 (printed onto the purchased cover), or should it only be offered as a separate print sheet?
- **Director name:** is "Prof. Dr. Bekir YALÇIN" the current institute director? Treat it as an editable placeholder.
- **Render check:** ideally render the template in real Word once to confirm the INFERRED approval-page positions (±0.5 mm).

## Spec review

Independent review, 2026-09-28. I re-read all 43 guide pages and the template XML. I also rendered the template with LibreOffice: `artifacts/aku-fbe/review/aku_template.pdf` (33 pages). The render is supporting evidence only. It misplaces some page breaks and draws tables about 0.6 mm lower than Word, but its line pitches match Word's. My measuring helper and the script that applies the spec changes are in `artifacts/aku-fbe/review/` (`lines.py` and `apply_review.py`).

**Word line model: confirmed, with one correction to a check**
- **First baseline:** Word puts the first baseline at the top of the line box plus (lineGap + ascent) = 0.9336 em. The extra 1.5-line spacing goes below the text.
- **Evidence:**
  - Guide p.1: 14 pt line at 34.59 mm; the model gives 34.61.
  - Guide p.4: 12 pt line at 33.92 mm; the model gives 33.95.
  - Guide p.33: the 12 pt 1.5-spaced line followed by 14 pt lines lands at 50.38 mm; the model gives 50.35.
  - Line pitches: 13.80, 12.60, 20.70 and 24.15 pt.
  - The LibreOffice render puts first baselines at 33.95 mm.
- **Correction:** the `margin-top` check used ascent only (3.77 mm). I changed it to 3.95 mm.
- **New rules:** `wordModel.firstBaselineOffsetEm`, `wordModel.singleLineEm` and `wordModel.paragraphSpacing`.
- **Paragraph spacing:** space before or after is added to the line pitch. Bibliography entries are 26.7 pt apart (20.7 + 6). Two cases are UNKNOWN because no source page shows them:
  - whether space after and space before collapse when both are set;
  - whether space before is dropped at the top of a page.
- **Page-number baseline:** 283.7 mm is confirmed; the LibreOffice render gives 283.72 mm.

**Other corrections**
- **List hanging indent:** `lists.hangingIndentMm` was a flat 16 mm. That is only right for Şekil entries. Çizelge entries use 21.0 mm in both the template (hanging 1191 twips) and the guide (p.42). The rule is now "hanging = width of the label", based on template callout #311.
- **Missed explicit rules, now added:**
  - punctuation spacing (p.5);
  - number formatting (p.11);
  - figure placement (p.12);
  - italic variables in inline equations (p.10);
  - the list of sections that start on a new page.
- **Foreign-language theses:** the guide allows a thesis in a foreign language (p.6 §2.5) but gives no separate layout. I recorded this as UNKNOWN.

**Decisions on the needsConfirmation conflicts (policy order)**
1. **ÖZET/ABSTRACT order: reversed.** Keywords now come first, then the year/pages line.
   - The guide text on p.18 states this order explicitly, and explicit text outranks the template and the example page.
   - The analyzer chose the opposite order, which breaks the policy.
   - Still needsConfirmation, because the guide's own example and the template show the other order.
2. **Inner-cover title: resolved, 1.5 on every line.** The title is one field, formatted like template paragraph #57. A wrapped one-paragraph title is 1.5-spaced on every line, which matches the guide's p.33 example.
3. **TEŞEKKÜR: resolved, 2 blank lines.** The template marks them explicitly and the guide text is silent.
4. **Approval page, director block: resolved.** Order is dots, name, "Enstitü Müdürü".
   - The name is an editable placeholder. The guide shows "(Ünvanı Adı ve SOYADI)", and "Prof. Dr. Bekir YALÇIN" is 2019 sample content.
   - The name must never be hard-coded or validated.
5. **Approval page, juror pitch and box: resolved, following the template.**
   - Juror pitch is 14.29 mm and the box is 150 mm wide, with its top at 189.0 mm.
   - The LibreOffice render reproduces the 40.5 pt pitch and every relative position in the director block.
6. **List spacing: resolved.** Single spacing, 6 pt after, left-aligned. This follows the explicit instruction screenshot in the template ("aşağıdaki ayarlar uygulanmalı" = apply the following settings).
7. **ÖZGEÇMİŞ before EKLER: kept, still needsConfirmation.** The analyzer missed p.29: "Ekler … kaynaklar bölümünün bitişini izleyen sayfa numarası ile devam etmelidir" (appendix numbering continues after KAYNAKLAR). This adds to p.16 and p.28, which both put the CV last.
8. **Section breaks: resolved.** Plain page breaks with no blank filler pages, because printing is single-sided.

**Outer cover**
- It is exported as physical page 1, with no page number and not counted. The evidence is §4.1 item 1, the §2.7 list of unnumbered pages and page 1 of the template.
- All text must stay inside the explicit printed area: x 55–155 mm, y 210–275 mm.
- The template's mock-up puts the title at 208.4 mm, above the printed area, so I rejected its positions.
- I downgraded the first baseline (215.53 mm) from MEASURED to INFERRED, because it comes from a scaled illustration. The containment check is the binding one.
- Open question: when optional lines are absent, is the text block anchored at the top or centred?

**Remaining UNKNOWNs**
None of these blocks the core implementation:
- keyword/year order and ÖZGEÇMİŞ/EKLER order (institute confirmation);
- outer-cover vertical anchoring;
- master's jury size;
- whether optional lines keep their empty slot;
- footnotes, word limit and hyphenation.
