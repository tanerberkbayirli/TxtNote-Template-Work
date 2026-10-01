# AKÜ Sağlık Bilimleri — 2022 source reconciliation (partial, 2026-09-30)

The institute-hosted 2022 guide is the current primary source for reconciliation. The former 195-rule set was extracted from a historical PDF. Every rule now has a current disposition: reconciled, conflict, unknown, or historical-only. Unsupported former values are cleared from the current `value` field and retained only as `historicalValue`.

## Reconciled current rules

| Finding | Current rule | Evidence | Class |
|---|---|---|---|
| Page size | A4, 210 × 297 mm | PDF p.4 (printed p.2), §2.1 | EXPLICIT |
| Margins | 30 mm on every side | PDF p.4 (printed p.2), §2.3 | EXPLICIT |
| Paper | 70–100 g/m², first-quality white | PDF p.4, §2.1 | EXPLICIT |
| Printing | Single-sided | PDF p.4, §2.2 | EXPLICIT |
| Main text | Times New Roman, 12 pt; justified; 1.5 spacing except specified exceptions | PDF p.4, §§2.2–2.4 | EXPLICIT |
| Paragraph beginnings | Flush at left frame edge, no indent | PDF p.4, §2.4 | EXPLICIT |
| Heading layout | Up to three levels; bold, left aligned; H1 uppercase, H2/H3 title case with conjunctions lowercase; deeper levels discouraged | PDF p.5, §2.7 | EXPLICIT |
| Heading sizes | UNKNOWN | PDF p.5, §2.7 contains no sizes | UNKNOWN |
| Pagination | Bottom center; no adjacent symbol; TNR 11 pt; front matter lower-case Roman, main text Arabic from Giriş=1 | PDF pp.4–5, §§2.3, 2.6 | EXPLICIT |
| Front-page numbering | Text excludes four preliminary sheets, while Example 8 assigns approval II, ethics III, abstract IV | PDF p.5 §2.6; p.33 Example 8 | CONFLICT |
| Structure | Covers, approval, ethics declaration, ÖZET, SUMMARY, preface, contents, lists, main text, sources, appendices, CV | PDF pp.13–14, §3.1 | EXPLICIT |
| Core chapters | GİRİŞ; MATERYAL ve METOT; BULGULAR; TARTIŞMA; SONUÇ ve ÖNERİLER; KAYNAKLAR; EKLER | PDF p.13, §3 | EXPLICIT |
| Abstract | At most 2 pages; 3–6 alphabetized keywords; label “Anahtar Kelimeler:” | PDF p.15, §3.2.5 | EXPLICIT |
| Abstract spacing | UNKNOWN pending example measurement; general text rule is 1.5 except special cases | PDF pp.4, 15, 30; §§2.4, 3.2.5, Example 5 | UNKNOWN |
| Tables/figures | Çizelge caption above, Şekil below; label and number bold, colon separator; independent chapter numbering; continued table retains number + “Devam.” | PDF pp.11–12, §2.14 and example | EXPLICIT |
| Caption size | Text says main-text size; example specifies 11 pt. Conflict with 12 pt main text. | PDF p.11 §2.14; p.12 example | CONFLICT |
| Footnotes | Very short; continuous rule after two full spaces; smaller type and narrower spacing than body | PDF p.6, §2.9 | EXPLICIT |
| Bibliography | 11 pt; single spaced; 1.25 cm hanging indent; 6 nk after each entry; alphabetical rules | PDF p.18, §3.3.6 | EXPLICIT |
| Appendices | EK 1, EK 2, …; each starts on a new page; page numbers continue | PDF p.23, §3.3.7 | EXPLICIT |
| Inner cover size | §3.2.2 specifies 14 pt except the 12 pt support statement; Example 2 note specifies 12 pt. | PDF p.14 §3.2.2; p.27 Example 2 | CONFLICT |
| Supplied outer cover | University cover is obtained from the book sales unit; old cover geometry is unsupported by the 2022 source | PDF p.14, §3.2.1 | EXPLICIT for supplied cover; old dimensions UNKNOWN |

## Structural disposition (2022)

The section order now follows §3.1 and covers the university-supplied cover, cover-under page, inner cover, approval, scientific ethics declaration, ÖZET, SUMMARY, ÖNSÖZ, contents, symbols, optional figure/Çizelge/image indexes, main chapters, KAYNAKLAR, optional appendices, and CV. Missing declaration and image-index records were added. Legacy geometric layouts were moved to `historicalLayout`; current `layout` arrays are empty pending the separate geometry review.

- Sections: 13 RECONCILED, 6 CONFLICT, 1 UNKNOWN, 0 HISTORICAL_ONLY. Conflicts cover the cover-under count/visibility interpretation, inner-cover font, exact index titles, and appendix title/numbering; additional-language abstract placement is UNKNOWN.
- Placeholders: 22 RECONCILED, 5 HISTORICAL_ONLY, 0 UNKNOWN/CONFLICT. Current cover, approval, declaration, abstract, and preface fields have source citations. Fixed program-name/rapporteur roles and fixed jury-member slots were retired in favor of a repeatable jury-members collection.
- Pending and untouched: 47 validation checks, source geometry, and engine gaps remain STALE pending later passes.

## Status and next gate

All 195 rules now have a current disposition: 156 RECONCILED, 10 CONFLICT, 22 UNKNOWN, 7 HISTORICAL_ONLY, 0 STALE. The unresolved conflicts are formal effective date, preliminary-page numbering, inner-cover typography, caption size, figure/table index titles, and appendix heading/numbering. UNKNOWN values include unsupported spacing and geometry where the 2022 source provides no numeric rule. Geometry, validation checks, and engine gaps remain explicitly stale and pending. The source-rule disposition audit is complete; implementation remains pending the FBE-first gate.

---

# aku-sagbil — Afyon Kocatepe Üniversitesi, Sağlık Bilimleri Enstitüsü

## 2022 official guide source audit (2026-09-30)

The official institute-hosted [10.02.2022 PDF](https://sagbilens.aku.edu.tr/wp-content/uploads/sites/9/2022/02/Tez-Yazim-Klavuzu-SON-10.02.2022.pdf) is now the primary source for this target. The 34-page file named `AKU_Saglik_Bilimleri_Enstitusu_Tez_Kilavuzu_2015.pdf` is preserved unchanged and marked historical/superseded in the manifest and spec. Its PDF metadata says created/modified 2009-11-13. The newer PDF has 39 pages and metadata created/modified 2022-02-10 11:40:52 +03:00. **Formal effective date remains UNKNOWN/CONFLICT:** the cover prints 2020 and the Senate approval date is blank (PDF p.3, printed p.1).

The original 195-rule set retains historical citations. The current 2022 disposition above replaces unsupported rule values with source-backed values, explicit UNKNOWNs, conflicts, or historical-only records. The old analysis below is historical context only and does not override current dispositions.

### Evidence-backed deltas

| Finding | 2022 value and evidence | Historical-source value | Status |
|---|---|---|---|
| Margins | 30 mm on every edge; PDF p.4 (printed p.2), §2.3 | left 40, top/bottom 30, right 25 mm; old PDF p.5 (printed p.1), §1.4 | EXPLICIT; changed |
| Paper weight | 70–100 g/m²; PDF p.4 (printed p.2), §2.1 | 80–100 g/m²; old PDF p.5 (printed p.1), §1.1 | EXPLICIT; changed |
| Main font | Times New Roman 12 pt, thesis-wide except inner cover; diagrams/tables/formulas may go to 8 pt; PDF p.4, §2.2 | open choice of listed book fonts and 10–14 pt; old PDF p.5, §1.3 | EXPLICIT; changed |
| Paragraph starts | flush left, without a leading gap; PDF p.4, §2.4 | 5–10 mm indentation allowed; old PDF p.5–6, §1.5 and examples | EXPLICIT; changed |
| Heading alignment | all levels start at the left frame edge; PDF p.5, §2.7 | H1 centered in legacy spec | EXPLICIT; changed |
| Page number | centered in bottom footer; Times New Roman 11 pt; PDF pp.4–5, §§2.3 and 2.6 | top, centered or right; size unknown; old PDF p.7, §1.8 | EXPLICIT; changed |
| Front matter | approval, ethics statement, Turkish abstract, Summary, preface, TOC, lists, then main text; PDF pp.13–14, §3.1 | abstracts after main text; preface and TOC order differed | EXPLICIT; changed |
| Main chapter names/order | `GİRİŞ`, `MATERYAL ve METOT`, `BULGULAR`, `TARTIŞMA`, `SONUÇ ve ÖNERİLER`; PDF p.13, §3 | legacy allowed/used `GEREÇ VE YÖNTEM` | EXPLICIT; changed |
| Abstract keywords | 3–6, alphabetically; PDF p.15, §3.2.5 | legacy spec recorded exactly 5 | EXPLICIT; changed |
| Outer-cover window/logo band | not specified by the 2022 text/examples; university supplies the outer cover and Example 1 is the cover-under page, §3.2.1, PDF p.14 and Example 1, p.26 | old spec had a measured blue band/window | UNKNOWN for current guide; legacy geometry is unsupported |
| Roman front-page start/counting | text says cover, inner cover, approval, ethics pages are “not numbered”; Example 8 lists approval II, ethics III, abstract IV (PDF p.33) | prior spec used inner cover i and approval ii | CONFLICT within 2022 guide; start index/counting unresolved |

The current guide retains explicit 1.5 line spacing and justified text (§2.4), and single-sided printing (§2.2). These are corroborated, not deltas. The inner-cover font note also conflicts: §3.2.2 says 14 pt bold except the 12 pt support line, while Example 2 says inner-cover text is 12 pt TNR (PDF p.27); retain both as CONFLICT. The five-juror approval example says member count should be adjusted to the jury (PDF p.14, §3.2.3 and Example 3, p.28); five is not a universal requirement.

**Implementation gate:** source/spec reconciliation is now pending for `aku-sagbil`; do not implement from the legacy 195-rule list. This audit did not modify production templates or generate exports.


## Historical 2009/2015-source analysis — superseded for current implementation

The following analysis was written before the institute's 2022 PDF was found. Its measurements and decisions describe the historical file only; the current implementation specification is still being reconciled.

Analysed 2026-09-28. Spec: `orchestration/specs/aku-sagbil.json`. Derived files: `orchestration/artifacts/aku-sagbil/source/`.

## Summary

- **Only source:** `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Saglik_Bilimleri_Enstitusu_Tez_Kilavuzu_2015.pdf`. It is 34 A4 pages, produced by Word 2007. I read every page.
- **Text pages** (pdf p.1–5, 7, 10–11, 13–14, 19, 23–24, 27–28, 30, 32–34) contain real text, so PyMuPDF could extract them. The full text is in `fulltext.txt` and the line geometry is in `guide_body_lines.txt`.
- **Example pages (Şekil 1–18) are all embedded raster JPEGs.** They are Word screenshots at 595×842 to 1256×1854 px, placed at 145 mm wide on pages 6, 8, 9, 12, 13, 15–18, 20–22, 25, 26, 28, 29 and 31. None of them contains vector text.
  - Şekil 1 and Şekil 2 are 72-dpi full-page captures, so 1 px = 1 pt. I checked this on Şekil 2: its 1.5-line body pitch is ≈ 20.7 px, and its text block starts at a 40 mm left edge.
  - Other examples are zoomed screenshots. **Şekil 8 (İç Kapak) says in its own caption that it is not to scale** ("sayfa normal boyutlara göre küçük, harfler önerilen büyüklüklerdedir").
  - **Consequence:** example geometry is only good to about ±1–3 mm and not good enough for 0.5 mm validation. The spec therefore takes its numbers from the explicit text and from the figures' own annotations. Measurements are kept as corroboration with their scale assumptions: `sourceGeometry` and `example_rows.json`.
- **The guide's own booklet layout is not evidence.** Its pages use TNR 11–12 pt on a 40 / ≈24 mm column, with page numbers at the bottom right in Calibri. The guide says on pdf p.4 that its booklet does not follow the thesis rules.
- **Rule counts:** 185 rules in total.

| Confidence | Rules |
|---|---|
| EXPLICIT | 132 |
| MEASURED | 31 |
| INFERRED | 9 |
| UNKNOWN | 13 |

- **Other spec contents:** 18 sections, 19 conflicts, 22 unknowns, 13 engine gaps and 38 measurable checks.

## Outdated source (flag `outdated-source`)

The file name says 2015, but the evidence points to 2009:
- The PDF metadata shows creation and modification on 2009-11-13.
- The approval date on the title page is blank ("………………… tarihli toplantısında kabul edilmiştir").
- Every reference in its bibliography was accessed in August–September 2009.
- The "2015" version cannot be verified from the file. It is most likely the 2009 guide redistributed.

Several details look dated: Harvard vs APA wording, Vancouver replaced, a cellophane-window cover, and fixed staff names on the approval example. **The integrator should mark `source.revisionDate` as unverified. Confirming that this is the current guide is an open question for the institute.**

## Variant decision

| registryId | Decision | Evidence | Differences |
|---|---|---|---|
| aku-sagbil-master-tr-v1 | **confirmed** | pdf p.14 §1.19 "tezin doktora/yüksek lisans tezi olduğu"; p.4 "lisansüstü eğitimde tez hazırlayacak adaylar" | Degree line reads YÜKSEK LİSANS TEZİ. Approval page says "Yüksek Lisans Tezi". Jury size is **UNKNOWN**. |
| aku-sagbil-phd-tr-v1 | **confirmed** | same, plus every example (Şekil 6–9) is a Doktora thesis | Degree line reads DOKTORA TEZİ. The approval page has 5 jury members (Başkan, Raportör, 3 Üye). |

- There is no other degree difference: ÖZGEÇMİŞ, SUMMARY and every layout rule apply to both degrees.
- Language is TR only. SUMMARY is a required English abstract inside the TR thesis. RÉSUMÉ or ZUSAMMENFASSUNG is optional.

## Historical key rules from the superseded guide (not current requirements)

**Page**
- A4, portrait.
- Margins: left 40, top 30, bottom 30, right 25 mm (EXPLICIT §1.4).
- Single-sided printing, so no mirroring and no gutter. Paper is 80–100 g.

**Text**
- Font: one book font, from TNR, Bookman, Palatino, Garamond or Arial, at 10–14 pt. Every annotated example uses TNR 12.
- Body text: 1.5 line spacing (Word 1.5 lines, confirmed by the ≈ 20.7 pt pitch in Şekil 2) and justified.
- Indent: the first paragraph after a heading starts flush left; the others are indented 5–10 mm (10 mm in the example).
- Paragraph gap: at least 24 pt.
- Spacing unit: the guide defines **"n aralık" as 12·n pt** for vertical gaps. The figures label them "3 aralık (36 p)", "2 aralık (24 p)" and "1,5 aralık (18 p)".

**Headings**
- H1: 14 pt bold, all caps, centred, starts a new page, 36 pt after, numbered "1. GİRİŞ".
- H2 and H3: 12 pt bold, title case, flush left, 36 pt before, 24 pt after, numbered "1.1." and "1.1.1.".
- H4 should be avoided.

**Page numbers**
- Placed at the top, centred or flush right, with no decorations.
- Front matter uses lower-case roman numerals. The İç Kapak counts as i but shows no number.
- Arabic numbering starts at 1 on GİRİŞ and continues through ÖZET, SUMMARY, KAYNAKLAR and EKLER.

**Captions**
- Tables are captioned above, figures below.
- Numbering is per chapter: "Şekil 3.1." or "Tablo 3.1.", with the label and number in bold.
- Captions are single-spaced, smaller than the body text and justified.
- Gaps: 12 pt between an object and its caption; 18 pt before and after the figure or table unit.
- A table split across pages continues with the caption "Tablo 4. Devam.".

**Footnotes**
- Smaller type, single spacing.
- Separated from the text by a rule from the left margin to the page centre (65 mm long), 24 pt below the text.

**Structure (§2), in order**
1. Dış kapak (card)
2. Dış kapak altı sayfası (the page behind the window)
3. İç kapak (i)
4. KABUL ve ONAY (ii)
5. İÇİNDEKİLER
6. ÖNSÖZ
7. SİMGELER ve KISALTMALAR
8. ŞEKİLLER (optional)
9. TABLOLAR (optional)
10. Chapters: 1. GİRİŞ, 2. GEREÇ VE YÖNTEM, 3. BULGULAR, 4. TARTIŞMA, 5. SONUÇ VE ÖNERİLER
11. **ÖZET, then SUMMARY — after the main text**
12. KAYNAKLAR
13. EKLER (optional)
14. ÖZGEÇMİŞ

**Special pages**
- **ÖZET:** 24 pt from the top of the text block; title; 24 pt; bold thesis title in word-initial capitals; 18 pt; single-spaced text of at most 2 pages; 18 pt; bold "Anahtar Sözcükler:" followed by 5 keywords in alphabetical order.
- **KAYNAKLAR:** bold, centred title; 18 pt; entries single-spaced at body size minus 1–2 pt; 10 mm hanging indent; alphabetical; author names in capitals or small caps.
- **Other front titles** (ÖNSÖZ, İÇİNDEKİLER, SİMGELER, ŞEKİLLER, TABLOLAR): 24 pt from the top of the text block, centred and bold. ÖNSÖZ text is single-spaced.

## Source priority

1. The guide's explicit text.
2. Values annotated inside the example figures (treated as explicit).
3. What the example figures show, for structure and wherever the text is silent.
4. The guide's own booklet layout: never used.

## Conflicts (details in the spec)

1. **Version or date:** the file name says 2015, the PDF dates from 2009 and the approval date is blank. *Needs confirmation.*
2. **Citation style:** Sunuş says Harvard (p.4) and §2.4 says APA (p.28). Both are author-date. *Needs confirmation.*
3. **Front-matter order:** the text puts İçindekiler before Önsöz (twice); the example TOC puts Önsöz first. The text wins. *Needs confirmation.*
4. **Inner cover first line:** "T.C." in the text vs "TÜRKİYE CUMHURİYETİ" in Şekil 8. The text wins. *Needs confirmation.*
5. **Outer-cover window height:** 6.5 cm in the text vs a "6 cm" label. The drawing itself measures ≈ 65.7 mm, so the text wins.
6. **Outer-cover title start:** "yaklaşık 8 cm" in the text vs ≈ 6.5 cm in the drawing. The text wins.
7. **Abstract line spacing:** single in the text vs 1.5 in Şekil 14 and 15. The text wins. *Needs confirmation.*
8. **Keyword label:** "Anahtar Sözcükler:" in the text vs "Anahtar kelimeler :" in the example. The text wins.
9. **Space after titles:**
   - §1.7 gives 3 aralık after ÖNSÖZ, İÇİNDEKİLER, SİMGELER, ÖZET and KAYNAKLAR.
   - §2.3 gives 2 aralık for ÖZET and §2.4 gives 1.5 aralık for KAYNAKLAR.
   - The more specific section wins. *Needs confirmation.*
10. **Space after H2:** 24 pt in the text vs one "18 p" label in Şekil 2. 24 pt wins.
11. **What "aralık" means:** in gaps it is 12 pt; as line spacing it means Word line multiples. This is resolved.
12. **Paragraph gap:** 24 pt stated vs ≈ 30 pt measured on the raster. 24 pt wins.
13. **Bibliography font size:** 8–9 pt (§1.3) vs body minus 1–2 pt (§2.4). §2.4 wins. *Needs confirmation.*
14. **Bibliography entry spacing:** "paragraf aralığı 1,5", read as 18 pt, vs ≈ 7 pt measured in Şekil 17. *Needs confirmation.*
15. **Printed list titles:** section names ("… Dizini") vs example titles ŞEKİLLER / TABLOLAR / SİMGELER ve KISALTMALAR. The example titles win. *Needs confirmation.*
16. **Table label:** "Tablo" and "Çizelge" are both allowed; every example uses Tablo. *Needs confirmation.*
17. **TOC entry wording:** the text says entries match headings exactly; the example shows title-case front-matter entries. The text wins.
18. **İç Kapak in the TOC:** "Ön kapak dışındaki tüm özel sayfalar" vs the example, which does not list it. The example wins. *Needs confirmation.*
19. **Page-number position:** the rule says top; the guide's own pages number at the bottom. The rule wins.

## UNKNOWNs

- **Pagination:** header distance and page-number distance from the edge, page-number font, whether the number shows on a chapter's first page, and whether the approval page shows its number.
- **Headings:** space before H1, H1 line spacing, and H4 style.
- **Exact sizes:** captions, footnotes, TOC and list rows, and the front-matter titles. Also footnote marker style, table cell spacing and equation-number placement.
- **Pages with incomplete specifications:**
  - Inner cover: all gaps except "5 aralık", and every absolute position.
  - Page behind the window: font sizes.
  - Approval page: font sizes and gaps; master's jury size.
- **Unspecified content:** Önsöz signature, appendix numbering, ÖZGEÇMİŞ content, format and TOC inclusion, and an abstract word limit.
- **Logo:** there is no usable logo file; the only copy is a ≈ 200 px raster inside Şekil 6.

## Engine gaps (against `schema.d.ts`)

1. **Outer cover:** needs a blue 100×60 mm band, a logo, and a 100×65 mm window 15 mm above the bottom edge. The engine has no filled boxes or absolute positions, and no logo asset exists. Treat it as a binding item or add a generic box block.
2. **Page behind the window:** its content must sit inside x 55–155 mm, y 217–282 mm, anchored to the bottom. Margin overrides work, but there is no vertical or bottom alignment.
3. **First paragraph after a heading:** it must not be indented, but the engine applies `firstLineIndentMm` to every paragraph.
4. **Author choices:** font (5 fonts, 10–14 pt), page-number alignment (centre or right), and table label (Tablo or Çizelge). The engine only has `captionNumberingChoices`.
5. **Gaps between adjacent headings:** the example uses one 36 pt gap between H1 and H2. CSS collapses margins, Word adds them, so PDF and DOCX will differ unless the collapse policy is made explicit.
6. **Caption label style:** bold label with plain caption text, and a hanging indent under the caption text. `CaptionRule` has a single `style`.
7. **Caption-to-object gap:** 12 pt, separate from the 18 pt outer spacing. `CaptionRule` has no field for it.
8. **Continued-table caption:** "Tablo N. Devam." on split tables.
9. **TOC per-level styling:** bold chapter rows, a blank line before each chapter, indented back-matter rows. `GeneratedIndexRule` has one style for all rows.
10. **Inline bold runs on special pages:** e.g. "Tıbbi Genetik **Programı**" on the approval page.
11. **Hanging indent** on the keyword line (and on captions and list rows).
12. **Validation:** exactly 5 keywords, alphabetical order, and a 2-page limit. The engine only has `minItems`.
13. **Footnote separator:** not a gap. It can be expressed as `widthPercent` 44.83 %.

## Integrator decisions / open questions

- **Current guide:** confirm with the institute that this 2009 ("2015") guide is still in force.
- **Defaults to choose:**
  - Page-number alignment: centre or right.
  - Table label: Tablo, suggested.
  - Caption, footnote and bibliography sizes: 10 or 11 pt.
  - Bibliography entry gap: 18 pt vs the example's ≈ 7 pt.
  - Space before H1: suggest 24 pt, INFERRED.
- **Outer cover:** decide whether TxtNote produces it at all (it needs a logo asset), or whether it starts at the page behind the window.
- **Master's approval page:** decide the jury layout. The source only shows the 5-member PhD version. Optional members could use `visibleWhen anyFilled`.
- **ÖZGEÇMİŞ:** decide whether it is listed in the TOC.
- **Fonts:** genuine Times New Roman must be embedded (policy 5).

## Spec review

Independent review on 2026-09-28. I re-read all 34 pages and every example raster. The spec was edited in place and now has `review` and `reviewedAt`. The script that applied the edits is `artifacts/aku-sagbil/review/apply_review.py`.

**Changed as a result:** 195 rules, 21 conflicts (only 2 still flagged), 47 measurable checks and 25 unknowns.

### Findings that change the spec

- **Font is an author choice, not TNR 12.**
  - §1.3 allows any book font, and its list ends with "vb.". The size is 10–14 pt "yazı tipine göre".
  - Şekil 2 is captioned "Times New Roman 12 punto kullanılan bir sayfa **örneği**", so TNR 12 is only an example.
  - The spec now records `authorChoice` with a default of TNR 12 (INFERRED). The heading sizes 14 and 12 apply only to that default configuration.
  - The covers, however, are explicitly TNR (§1.19). This is recorded in the new rule `cover.fontFamily`.
- **The "Space after H2" conflict was a misreading.** The "1,5 aralık (18 p)" bracket in Şekil 2 sits between body lines 2 and 3. It labels the body line spacing, not the gap after the heading. The gap after H2 is 24 pt.
- **H1 followed directly by H2 is one 36 pt gap** (Şekil 2, raster ≈ 67 pt baseline-to-baseline). This must be implemented explicitly for both PDF and DOCX, as the new rule `headings.h1ToH2.gapPt`.
- **Paragraph indent is optional, 5–10 mm** ("başlatılabilir"). The 24 pt paragraph gap is a minimum and applies only when paragraphs are indented.
- **Word model, measured on the guide's own vector Word 2007 text** (booklet left margin 40.01 mm; top margin taken as 30 mm):
  - First baseline under single spacing = top + 0.9335 em. This fits to ±0.01 mm at both 12 pt and 15.96 pt.
  - Single line pitch = 1.15 em.
  - The 1.5-spacing baseline and the paragraph-spacing model are UNKNOWN from this source.
- **Missed EXPLICIT rule:** appendices submitted separately are listed at the end of the TOC.
- **Missed MEASURED fact:** the TOC lists itself (İçindekiler iv).
- **Example-only observations:**
  - Captions start at the paragraph-indent position (MEASURED, low confidence; integrator decides).
  - The example's footnote rule is ≈ 52 mm, Word's default length. The text's 65 mm wins.

### Decisions proposed

| Topic | Decision | Evidence |
|---|---|---|
| Harvard vs APA | Implement the author-date rules the guide spells out in §1.12 and §2.4. The label makes no difference. | — |
| İçindekiler vs Önsöz order | İçindekiler before Önsöz. **Still flagged.** | For: §2.1 ordered list, §1.20, the booklet. Against, and missed by the analyzer: §1.7/§1.8 lists and the Şekil 10 page labels. |
| Inner cover first line | T.C. | Quoted string in the text; Şekil 6 prints "T. C.". |
| Abstract line spacing | Single. | — |
| Space after front-matter titles | ÖNSÖZ, İÇİNDEKİLER, SİMGELER 36 pt. ŞEKİLLER and TABLOLAR 36 pt (INFERRED). | §1.7 |
| ÖZET / SUMMARY spacing | 24 pt, then 18 pt, then 18 pt. | §2.3 and Şekil 14 agree. |
| Space after KAYNAKLAR title | 18 pt. | §2.4; Şekil 17 geometry ≈ 18 pt. |
| Bibliography size | Body −1 pt (default 11) or −2 pt. | §2.4 overrides §1.3. |
| Bibliography entry gap | 18 pt. | The guide's own unit. Şekil 17's ≈ 6–7 pt is recorded as an example deviation and not averaged. |
| Table label | Author choice between Tablo (default) and Çizelge. The list title follows the choice. | — |
| List titles | ŞEKİLLER / TABLOLAR / SİMGELER ve KISALTMALAR. | — |
| İç Kapak in the TOC | Not listed. | §1.20 ii requires the TOC to follow Şekil 10. |
| Page numbers | At the top. Author choice between centre and right; default right, flush at x1 = 185 mm. | "ortaya" is ambiguous (105 mm or 112.5 mm). |
| Master's approval page | Reuse the Şekil 9 grid with optional member rows. The jury count and the Raportör label stay UNKNOWN. | — |

### Remaining UNKNOWNs and open items

None of these blocks a default implementation.

- **Guide version:** 2009 vs 2015.
- **Page numbers:** distance from the top edge and font. Validation can only require the number to sit inside the top margin.
- **Spacing and sizes:** space before H1, front-title size, exact caption and footnote sizes.
- **Master's jury** count.
- **Heading sizes** when the body size is not the default.
- **1.5-spacing baseline** in the Word model.
- **Engine:** a generic `templateChoices` mechanism for font, size, indent, table label and page-number alignment.
