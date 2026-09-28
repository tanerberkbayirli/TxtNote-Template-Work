# aku-sbe — Afyon Kocatepe Üniversitesi, Sosyal Bilimler Enstitüsü

Spec: `orchestration/specs/aku-sbe.json` · Derived files: `orchestration/artifacts/aku-sbe/source/` (`geometry.json` = line/image/drawing geometry of all 53 pages, `guide-text.txt`, 9 page renders of EK 1–EK 9).

## Summary

The only source is `AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf`, 53 pages. Its cover says "AFYONKARAHİSAR 2023", the file name says 2026, and the PDF CreationDate is 2026-02-06 (Word LTSC). All pages were read.

- **Guide text:** PDF p.2–35, printed pages 1–34.
- **Example pages:** EK 1–EK 12 on PDF p.36–53.
  - p.36: EK 1 Tez Tanıtım Sayfası (the page seen through the cover window). This page has no page number.
  - p.37: EK 2a İç Kapak.
  - p.38: EK 2b İç Kapak for theses with two advisors.
  - p.39: EK 3 Etik ve Bilimsel İlkeler Sorumluluk Beyanı.
  - p.40: EK 4 Enstitü Onayı form.
  - p.41: EK 5 Özet.
  - p.42: EK 6 Abstract.
  - p.43: EK 7 Ön Söz.
  - p.44–46: EK 8 İçindekiler.
  - p.47: EK 9 Tablolar Listesi.
  - p.48: EK 10 Simgeler ve Kısaltmalar Dizini.
  - p.49: EK 11 Ekler Dizini.
  - p.50–51: an appendix page.
  - p.52: EK 12 Genişletilmiş Türkçe Özet.
- **Other examples in the text:** headings on p.6 and p.13, footnotes on p.20, captions on p.31–32, bibliography on p.33–34.

Rules: 192 in total. By confidence: 161 EXPLICIT, 10 MEASURED, 14 INFERRED, 7 UNKNOWN.

### Core values (all EXPLICIT)

- **Page:** A4. Margins are top 25, bottom 25, left 30 and right 30 mm. Landscape pages use the same margins. No gutter.
- **Body text:** Times New Roman 12 pt, 1.5 lines, justified.
  - First-line indent 1.25 cm.
  - Paragraph spacing: 6 pt before and 6 pt after.
- **Single-spaced parts:** TOC and all lists, özet, abstract, kaynakça, ön söz (§2.5), all headings except the chapter heading, tables, footnotes, block quotations.
- **Headings:** a chapter heading plus four numbered levels.
  - Chapter heading: "BİRİNCİ BÖLÜM" on its own line with the title on the next line. Both uppercase, bold and centred. Spacing 12/12 pt, line spacing 1.5, always starts a new page.
  - `1.` bold uppercase.
  - `1.1.` regular uppercase.
  - `1.1.1.` bold title case.
  - `1.1.1.1.` regular title case.
  - All numbered levels are single-spaced, have no indent, use 6/6 pt spacing and are kept with the next line.
  - Numbering restarts in every chapter without the chapter number.
- **Page numbers:** bottom centre, Times New Roman 12 pt, with no marks next to the number.
  - Front matter uses lower-case Roman numerals. The inner cover counts as i but shows no number; the ethics declaration is ii.
  - Arabic numbering starts at 1 on GİRİŞ and continues through the bibliography and appendices.
- **Captions:** tables, figures and pictures (Resim) all take the caption **above**.
  - Only the label and number are bold, e.g. **Tablo 1.**, followed by the title in regular weight.
  - 11 pt, centred, single-spaced, numbered through the whole document.
  - A "Kaynak:" line goes below, 10 or 11 pt.
  - Table text is 11 pt (may go down to 9 pt).
- **Footnotes:** Times New Roman 9 pt, single-spaced, no indent, numbered continuously through the whole thesis. The separator line is about 4 cm long.
- **Bibliography:** single-spaced, 0/0 pt, hanging indent 0.5 cm (measured 4.95 mm on EK p.33), alphabetical. The title "KAYNAKÇA" is bold and centred.

## Variant decision

Both manifest variants are **confirmed**:

- `aku-sbe-master-tr-v1`
- `aku-sbe-phd-tr-v1`

Master's and PhD theses share every layout and typography rule. The differences are:

- **Degree line:** YÜKSEK LİSANS TEZİ / DOKTORA TEZİ on the inner cover and on the tanıtım sayfası.
- **Ethics declaration wording:** "Yüksek Lisans tezi / Doktora tezi olarak sunduğum". §2.2 says the forms differ, but only the wording differs in the example.
- **Approval form:** a check box for the degree.
- **Submission:** 7 copies for master's and 9 for PhD; each degree has its own jury proposal form.
- **Jury size:** EK 2a shows 3 jury members for a master's thesis. EK 2b shows 5 for a thesis with two advisors. The guide never states the PhD jury size, so it is UNKNOWN.
- **Neither degree has a CV page.**

Not in the manifest:

- "Sanatta Yeterlik" is a third degree type covered by the same guide.
- Programmes taught in a foreign language need an extra "Genişletilmiş Türkçe Özet" (at least 2000 words, after the appendices). The abstract order also changes. No EN variant is registered; the TR variants carry this as a conditional section.

## Source priority

1. **Guide text (§1–§6).** It wins for every value it states.
2. **Example pages EK 1–12.** They decide order, wording, alignment, bold/caps and blank-line structure where the text is silent. They do **not** decide absolute sizes or positions:
   - They are set in 11 pt with about 1.08-line pitch (4.83 mm = 13.69 pt) and 6 pt paragraph spacing.
   - They sit inside the guide's own page frame (left 25 mm, text width about 161 mm), which does not follow its own 30/30 mm rule.
   - The inner cover in EK 2a is centred at about 103.1 mm, not at 105.0 mm.

## Conflicts (details in spec)

1. **Examples vs explicit typography** (11 pt / ~1.08 lines vs 12 pt / 1.5 lines; inner-cover header). The explicit text wins.
2. **Page frame of the guide and examples vs 25/25/30/30 mm.** The explicit values win.
3. **Ön söz spacing:** §2.5 says single; §5.2 says "only …" and does not list ön söz. Decision: single. **Needs confirmation.**
4. **Old page names:** EK 8 and §5.3 still say "YEMİN METNİ" and "ENSTİTÜ MÜDÜRLÜĞÜ ONAY SAYFASI". Decision: use the current names ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI and ENSTİTÜ ONAYI.
5. **Programme line on the inner cover:** required by §2.1 i but missing from EK 2a/2b. Decision: include it; its exact wording is unknown. **Needs confirmation.**
6. **"Sayfa" position in the TOC:** the text puts it two line spacings below the title; the example puts it one pitch below with no blank line. **Needs confirmation.**
7. **TOC leader and number column:** the text says the dots stop 10 characters before the edge and the numbers end at the right edge. In the example the numbers end at 176.16 mm and "Sayfa" at 181.68 mm. **Needs confirmation.**
8. **Abstract indent:** the general rule is a 1.25 cm first-line indent; the abstract examples have none. Decision: no indent. **Needs confirmation.**
9. **Symbols list:** its note says 6/6 pt, but the example has no spacing. Decision: 6/6 pt.
10. **Paragraph spacing semantics:** in Word, 6 pt before plus 6 pt after adds up to 12 pt between paragraphs. The guide's own pages show 6 pt. **Needs confirmation.**
11. **Heading numbers:** the text writes "1.1" in places; all examples use a trailing dot ("1.1."). Decision: trailing dot.
12. **TOC number alignment:** the text says the numbers "end on the same line", but in the example they start at the same x. Decision: follow the example. **Needs confirmation.**
13. **Version:** the cover says 2023, the file name and metadata say 2026.

## UNKNOWNs

- Page-number distance from the bottom edge, and footer/header distances.
- Heading font sizes (12 pt is INFERRED from the general rule).
- Spacing of the level-5 headings and of the unnumbered main parts (GİRİŞ, TARTIŞMA…, KAYNAKÇA).
- Absolute vertical distances on the inner cover (only blank-line counts are known).
- Tez tanıtım sayfası: font size, and the window position and width (the example shows the block at 228–274 mm, lines at most 80 mm wide).
- Wording of the programme line.
- Spacing around captions.
- Equation numbering (never mentioned).
- Maximum words for the abstract (only "one page" is stated).
- PhD jury size.
- Whether page numbers are bold.
- The web-form file for the approval page (only the EK 4 picture exists).

## Engine gaps (against schema.d.ts / engine.js)

1. **Chapter heading format:** the engine cannot produce "BİRİNCİ BÖLÜM" (Turkish ordinal word) on its own line above the title. `formatNumber` knows only arabic, roman and alpha, and the label is inline.
2. **Fifth heading level:** H5 support in DOCX styles and the editor is unverified.
3. **Paragraph spacing:** CSS margins collapse 6+6 to 6 pt, but Word (and so the DOCX) gives 12 pt. The PDF and DOCX will disagree.
4. **Caption label style:** the engine cannot make only the label and number bold. `CaptionRule` has one style, applied through `::before`.
5. **Third caption type:** "Resim" needs its own RESİMLER LİSTESI.
6. **Conditional lists:** lists are required only when there are 3 or more tables, figures, pictures or appendices. `visibleWhen` cannot count items.
7. **TOC details:** per-level row styles are missing (centred chapter rows without page numbers; wrapped rows aligned after the number). The underlined "Sayfa" heading and the gap before it also need support.
8. **Jury list on the inner cover:** it needs a repeatable, two-column row list bound to metadata.
9. **Enstitü Onayı:** reproducing the form needs a bordered table with a merged, rotated cell, or an "inserted page" section.
10. **Footnote numbering:** it must run continuously across sections; the engine currently numbers per body.
11. **Keywords line:** the hanging indent must equal the width of the bold label.
12. **Printing:** front matter single-sided, duplex from GİRİŞ, and a blank last leaf.
13. **Font embedding:** the genuine Times New Roman must be embedded in the PDF; today it is drawn with Tinos.

## Open questions for the integrator

- **Paragraph spacing:** decide whether body paragraphs are 12 pt apart (Word 6+6) or 6 pt apart. The DOCX must match the PDF either way.
- **Tanıtım sayfası:** model it as a counted-out cover section. Its block position (baselines 228–274 mm) comes from the example only.
- **Enstitü Onayı:** reproduce the form, or leave a placeholder page for the signed PDF.
- **Programme line:** confirm its wording on the inner cover.
- **Declaration and form wording:** implement it per degree through the degree variant.

## Spec review

Independent review, 2026-09-28. I re-read all 53 source pages and re-measured with PyMuPDF. The measurement dump is `orchestration/artifacts/aku-sbe/review/word-model-measurements.json`. The spec was edited in place; see `review` and `reviewedAt` in the JSON.

### Word layout model (new `wordModel.*` rules)

- **`wordModel.firstBaselineOffsetEm` = 0.9335 em (MEASURED).** The first baseline sits (lineGap + ascent) below the top of the text area.
  - Evidence: 27 page-top lines at 11, 12 and 14 pt. All of them give a top margin of 24.96–25.00 mm. An ascent-only offset (0.891 em) would give 25.14–25.19 mm instead.
  - The guide's text is set at "multiple 1.08". The extra leading does not appear above the first line, so it goes below the text.
  - The 1.5-line case is INFERRED: it uses the same `lineRule=auto` mechanism. For the thesis this means a 12 pt line at the top of a page has its baseline at 28.95 mm.
- **`wordModel.lineHeightEm` (MEASURED):**
  - single = 1.1497 em
  - 1.5 lines = 1.7246 em
  - measured on EK 9, EK 3 and EK 5
- **`wordModel.paragraphSpacing` = UNKNOWN from the source.** Only a PDF exists, so the paragraphs' input values are unknown. The 6 pt gaps on the EK pages contradict the notes printed on those same pages.

### Missed or over-stated items that were fixed

- **Department line on the inner cover:** it can read "ANASANAT DALI" (§2.1 i says "Anabilim/Anasanat Dalı").
- **Symbols list:** added the 12.5 mm first-line indent (EK 10 entries start at the text edge + 12.70 mm).
- **Titles of GİRİŞ, KAYNAKÇA and the other unnumbered parts:** single spacing is EXPLICIT under §2.6 Not. Their spacing stays UNKNOWN.
- **Page-number weight:** "bold: false" is INFERRED, not EXPLICIT.
- **Genişletilmiş Türkçe Özet:** removed from the TR variants. A Turkish-language thesis never takes it.
- **New conflict records:**
  - block-quote rules differ by citation system;
  - tanıtım page type size: 12 pt (text) vs 11 pt (example).

### Decisions on the conflicts marked needsConfirmation

Closed:

- **Ön söz:** single spacing.
- **Abstract:** no indent. §2.4 makes EK 5 normative, and EK 3 and EK 7 are indented while EK 5 and EK 6 are not.
- **Paragraph spacing:** Word-additive, so 12 pt between paragraphs. §5.2 requires Word for Windows, and §5.5.2 equates "Üst 6nk / Alt 6nk" with "bir satır aralığı".
- **TOC columns:** the numbers and "Sayfa" end at 180.0 mm, with a dot leader.
- **TOC section numbers:** left-aligned. The "aynı hizada bitecek" sentence refers to the page-number column.

Still open:

- **Programme line:** print it only when it differs from the department; its wording is UNKNOWN.
- **Vertical gap before "Sayfa":** the text is ambiguous.

Other decisions:

- **Enstitü Onayı:** a counted placeholder page iii for the official web form with the director's e-signature.
- **Tanıtım sayfası:** the first sheet, not counted and not numbered. It uses the EK 1 order and its first baseline is at 228.34 mm. The window size needs confirmation.

### Variants

- **Master and PhD TR:** confirmed.
- **Sanatta Yeterlik and foreign-language (EN master/PhD) theses:** supported by the source but not in the manifest.
  - Sanatta Yeterlik differs only in wording. Its ethics-declaration wording is UNKNOWN.
  - For the EN variants the English page titles are UNKNOWN.
  - The orchestrator must decide whether to register them.

### Measurable checks

- `margin-top` is now defined through the first-baseline model: expected 28.95 mm, tolerance 0.25 mm.
- 17 checks were added, covering: the first-baseline model, page-number weight, titles of the unnumbered parts, the two-line chapter heading, the heading-to-text gap, the "Kaynak:" line, "Resim" captions, block quotes, the symbols list, the TOC "Sayfa" heading, list thresholds, the abstract (keywords, no indent), the preface indent, the ethics page, the approval placeholder, the tanıtım block, and the absence of the extended summary in TR.

### UNKNOWNs that block implementation

- **Page-number distance from the page edge and footer distance:** needed by the engine. The source only says "alt orta".
- **Spacing of the unnumbered part titles and of H5:** proposals are 12/12 pt and 6/6 pt.
- **Tanıtım window geometry.**
