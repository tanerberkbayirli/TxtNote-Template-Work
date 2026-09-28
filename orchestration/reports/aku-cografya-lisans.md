# aku-cografya-lisans: analysis report

**Target:** Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Coğrafya Bölümü, undergraduate graduation thesis (Bitirme Tezi)
**Source (only):** `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf`. 23 pages. Produced with Microsoft Word 2019 on 2024-03-11. The cover reads "AFYONKARAHİSAR 2024".
**Spec:** `orchestration/specs/aku-cografya-lisans.json`. It has 189 rules: 130 EXPLICIT, 14 MEASURED, 18 INFERRED and 27 UNKNOWN.
**Artifacts:** `orchestration/artifacts/aku-cografya-lisans/source/` contains:
- `geometry-all-pages.json`: line, image and drawing geometry for every page. The large table grids are summarized.
- `page-01.png`, `page-08.png`, `page-13.png`: page renders.
- `page-13-embedded-word-paragraph-dialog.png`: the extracted screenshot.

## 1. Summary

This source is a text-only rules guide. It contains **no example special pages**. There is no thesis outer or inner cover, approval page, ethics page, abstract, or TOC or list sample.
- The inner cover is defined in a "Bitirme Tezi Şablonu" that was not supplied (p.10 §4.2.2).
- The outer cover is only "ciltletilmelidir" (must be bound).
- The approval and ethics forms are not supplied.

As a result, every special-page layout is **UNKNOWN**. Only these are established:
- the inner cover uses 14 pt bold;
- the abstract content items are listed.

The general text rules, by contrast, are explicit and specific:
- **Page:** A4 portrait. Margins are 25 mm top and bottom and 30 mm left and right. Printing is single-sided on 70–100 g white paper.
- **Body text:** Times New Roman 12 pt, 1.5 line spacing (Word, 20.7 pt pitch), justified, 6 pt before and after each paragraph.
- **Headings:** up to 4 levels, all 12 pt bold, left-aligned with no indent. H1 is in capitals with "ve/veya/ile" kept lowercase. H2 is in Title Case. H1 starts a new page. One empty 1.5-spaced line goes before and after each heading.
- **Page numbers:** bottom center, TNR 10 pt, with no parentheses or dashes.
  - The outer cover, inner cover, approval and ethics pages are unnumbered.
  - Front matter from Özet onward uses i, ii, … Main text from "1. GİRİŞ" uses 1, 2, …
- **Captions:**
  - "Şekil"/"Tablo" + chapter.n, with only a space after the number. The label is bold (measured).
  - 11 pt, single spacing, justified.
  - Figure captions go below the figure and table captions above the table.
  - A table that continues onto the next page repeats its caption as "Tablo n.n (Devamı) …".
- **Bibliography:** justified, 1.25 cm hanging indent, 6 pt before and 0 pt after each entry, no blank lines between entries. Line spacing is single, which conflicts with the screenshot in the guide. Order is alphabetical, with a separate numbered "İnternet Kaynakları" list.
- **TOC and tables list:** the title is centered, bold and uppercase, with a "Sayfa" heading below it, bold and right-aligned. They must be generated automatically.

The guide's own body pages are a precise Word render. Their left edge is 29.99 mm, their right glyph edge is 180.0 mm and their first baseline is 28.96 mm. This confirms the margins and the 20.7 pt pitch. However, the guide indents its own paragraphs by 12.45 mm and its own headings by 6.35 mm, which its own text forbids. See the conflicts below.

## 2. Variant decision

| registryId | decision | evidence |
|---|---|---|
| `aku-cografya-lisans-undergrad-tr-v1` | **confirmed** | p.1 "BİTİRME TEZİ YAZIM KILAVUZU", p.2 §1 |

p.3 §2.5 allows writing in a foreign language, but it describes no layout differences. English appears only as the Abstract page, whose thesis type is "Graduation Thesis". **No EN variant is proposed.**

## 3. Source priority

There is only one source. Evidence ranks in this order:
1. Explicit text.
2. The guide's example fragments: the p.5 citation table, the p.7 caption examples, the p.8 Örnek 1/2 caption/table examples and the p.13 Word dialog screenshot.
3. The guide's own self-formatting, used only for corroboration.

Pages 14–22 are reference-format tables inserted from the AKÜ SBE guide (the page box differs: 594.96×842.04 pt). They are normative only for entry syntax.

## 4. Example pages / measured geometry (list)

| page | content | used for |
|---|---|---|
| 1 | Cover of the guide itself: logo 50.54 mm square at y=25.01 mm, centered; 14 pt / 20 pt bold lines centered at 104.92–104.98 mm | Reference only. It is **not** a thesis cover example. |
| 2–13, 23 | Guide body | Margins, pitch, paragraph and heading indents, spacing (self-formatting) |
| 5 | Citation example table (incl. caption examples "Şekil 2.1 … (TSE ,1997)") | Caption source citation, label separator |
| 7 | "Tablo 3.1 …", "Tablo 3.1 (Devamı) …" examples (label bold) | Continuation caption, label bold |
| 8 | Örnek 1: figure placeholder (x0 43.89, w 122.06, centered) and 2-line 11 pt caption (pitch 12.72 pt, both lines x0 29.99, label bold, justified). Örnek 2: table caption 11 pt above a full-width grid table (29.99–180.08 mm), cells 9 pt | Caption rules |
| 13 | Screenshot of Word "Paragraf" dialog: Yaslanmış; Asılı 1,25 cm; Önce 6 nk; Sonra 0 nk; **1,5 satır** | Bibliography paragraph settings (conflict on line spacing) |

The guide PDF contains **no page numbers**, so page-number placement cannot be measured.

## 5. Conflicts

1. **Paragraph first-line indent** (needs confirmation)
   - Source: the text (§2.4) says paragraph starts begin at the left frame edge with no gap. The guide's own paragraphs are indented 12.45 mm (≈1.25 cm).
   - Decision: the explicit text wins, so the indent is **0 mm**.
2. **Heading indent**
   - Source: §2.8 says numbered headings begin at the left frame edge. The guide's own headings sit at 6.35 mm.
   - Decision: **0 mm**.
3. **Spacing around headings** (needs confirmation)
   - Source: the text calls for one empty 1.5-spaced line (≈20.7 pt) before and after headings. The guide itself uses only the 6 pt paragraph spacing.
   - Decision: the explicit text wins. It is open whether the 6 pt also adds on top.
4. **Paragraph spacing accumulation** (needs confirmation)
   - Source: the text says "öncesi-sonrası 6 nk". Word sums this to a 12 pt gap. The guide's own measured gap is 6 pt, and heading-to-heading is 0.
   - Decision: the integrator must choose between the Word-additive and collapsed models. Editor CSS collapses margins while DOCX adds them, so this also creates a risk of mismatch between the PDF and the DOCX.
5. **Blank line between ordinary paragraphs** (needs confirmation)
   - Source: §2.4 is ambiguous ("Alt bölüm başlıkları ile paragraflardan önce ve sonra 1 satır boşluk").
   - Decision: read as applying only between headings and paragraphs.
6. **Bibliography line spacing** (needs confirmation)
   - Source: the text says "1 satır" (single), but the dialog screenshot on the same page shows 1,5 satır.
   - Decision: the text wins, so **single**.
7. **Bibliography title** (needs confirmation)
   - Source: "KAYNAKLAR" appears in §2.9, in the chapter list "6. KAYNAKLAR" and in §4.1. "KAYNAKÇA" appears in §4.3.6. The chapter list also numbers it "6."
   - Decision: use KAYNAKLAR. Whether it is numbered is left to the integrator.
8. **List-of-tables title** (needs confirmation)
   - Source: §4.2.10 prints "ÇİZELGELER DİZİNİ". Every other mention says "Tablolar Dizini", and the caption label is "Tablo".
   - Decision: likely a copy-paste slip. **TABLOLAR DİZİNİ** is recommended.
9. **"Sayfa" heading on the list of figures** (needs confirmation)
   - Source: it is required for the TOC and the tables list but not mentioned for the figures list.
   - Decision: apply it for consistency.
10. **Caption continuation lines**
    - Source: the text says "asılı" (hanging), but the p.8 example aligns the second line with the first line at 29.99 mm.
    - Decision: follow the example, so **hanging indent 0**.
11. **In-text citation comma**
    - Source: the rule says no comma, but the p.5 examples "(TÜİK, 2009)" and "(Anonim, 1992)" have one.
    - Decision: the rule wins. This is a content matter.
12. **Global 12 pt rule vs specific sizes**
    - Source: 12 pt is required throughout, but page numbers are 10 pt, captions and table notes 11 pt, and tables may go down to 8 pt.
    - Decision: the specific rules win.

## 6. UNKNOWNs (not established by the source)

- **Special pages:**
  - Layouts of the outer cover, inner cover, approval and ethics pages.
  - Abstract title lines and layout, the exact "year, page count" string, the TR thesis-type label, and the word limit.
  - Printed titles of ÖZET, ABSTRACT, TEŞEKKÜR and the symbols list.
- **Headings:** case for H3 and H4. The guide's own H3s are in Title Case.
- **Page numbers:** footer distance from the page edge; whether unnumbered front pages are counted; appendix numbering.
- **TOC:** leader, per-level indent, line spacing, and whether front-matter rows are included. Also whether the title is "İÇİNDEKİLER" or "İÇİNDEKİLER DİZİNİ" (recorded as INFERRED "İÇİNDEKİLER").
- **Lists and tables:** tab stop position in the symbols list; line spacing and borders for tables.
- **Captions:** spacing before a figure caption.
- **Not covered at all:** footnotes, equations, binding type.

## 7. Engine gaps (against `schema.d.ts`)

1. **Capitals with lowercase conjunctions.** H1 is uppercase and H2 is Title Case, but "ve/veya/ile" stay lowercase. `TextStyle.textTransform` has no exception list. Suggested: `textTransformExceptions`, or use no transform plus advisory validation.
2. **Page-number font.** Page numbers need TNR **10 pt**, but `NumberingRule` has no style or font size. Suggested: `NumberingRule.style`.
3. **Caption label style.** The caption label must be bold and the caption text regular. `CaptionRule.style` is a single style. Suggested: `CaptionRule.labelStyle`.
4. **Continued-table caption.** A split table needs the caption "Tablo n.n (Devamı) …" repeated. The engine splits tables by row but has no continuation caption. Suggested: `CaptionRule.continuation`.
5. **Paragraph spacing model.** Word adds space before and after, but the editor CSS collapses margins. The engine has no declared model for combining them, and there is no "empty line" spacing unit. Suggested: `typography.paragraphSpacingModel`.
6. **Tab stops.** The symbols list needs definitions aligned on a tab stop. The schema has no tab-stop support.
7. **Single landscape pages.** A single rotated page for a wide table or figure, with portrait page-number chrome, cannot be expressed inside the main editable section.
8. **Web-source bibliography list.** The separate numbered "İnternet Kaynakları" list with (İnt.Kyn.n) in-text markers has no bibliography grouping in the schema.
9. **Table notes.** An 11 pt single-spaced paragraph style for notes under tables has no construct.

These are **not gaps** and only need verification: `generatedIndex.pageHeading` for "Sayfa", and Roman numbering that restarts at Özet.

## 8. Open questions for integrator / department

1. **Missing template.** Obtain the "Bitirme Tezi Şablonu", which holds the inner cover, approval page, ethics statement and abstract format. Without it these pages cannot be implemented from the source. The options are:
   - implement them as UNKNOWN placeholders or leave them out (policy: UNKNOWN over invention);
   - mark the target BLOCKED for special pages.
2. **Outer cover.** Is the outer cover a printed page of the document or only the bound cover?
3. **Paragraph and heading spacing.**
   - Should paragraph spacing be 6 pt effective or 12 pt additive?
   - Does the heading's empty line add on top of the 6 pt?
4. **Paragraph indent.** Is it 0 mm (text) or 12.5 mm (guide self-formatting)?
5. **List and bibliography titles.** Should the list of tables be titled "TABLOLAR DİZİNİ" or "ÇİZELGELER DİZİNİ"? Should the bibliography heading be "KAYNAKLAR", and should it be numbered?
6. **Bibliography line spacing.** Single (text) or 1.5 (screenshot)?
