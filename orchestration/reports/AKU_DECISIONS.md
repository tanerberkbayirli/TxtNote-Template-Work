# Afyon Kocatepe Üniversitesi — orchestrator decisions (2026-09-28)

Applies to: aku-sbe, aku-fbe, aku-sagbil, aku-cografya-lisans, aku-mbg-lisans. Basis: the five
reviewed specs (`orchestration/specs/aku-*.json`, `review` blocks) and the policy order
*explicit newer/more-specific text > official template XML (for what the text leaves unstated) >
example-page geometry*. Values no source establishes are **non-source implementation choices**:
the template uses them because the engine needs a value, the validator reports them
`NOT_SPECIFIED` (never PASS/FAIL), and they are listed in the template's `source.notes`.

## Word layout model (all AKU targets, measured on the Word-made guides, ±0.01 mm)
- First baseline of a line = line-box top + 0.9336 em (lineGap + ascent); the extra leading of "1,5 satır" goes below the text → `typography.lineSpacing = { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive" }` in every AKU template.
- Paragraph spacing is Word-additive (after(prev) + before(next)); the DOCX writer already emits Word paragraph properties, the editor/PDF now match it. Space-before at the top of a page is dropped only at unforced breaks (Word's behavior); this is not demonstrated by any source page → not validated.

## Non-source values (source silent)
| item | value | why |
|---|---|---|
| page-number distance from the page edge (sbe, cografya, sagbil) | 12.5 mm (Word's default header/footer distance) | the guides tell authors to work in Word; the number is inside the margin; NOT_SPECIFIED |
| fbe/mbg page-number distance | 12.5 mm | TEMPLATE (docx sectPr footer distance) — this one is specified |
| H5 (sbe) space before/after | 6/6 pt | INFERRED from H2–H4 |
| sbe GİRİŞ/KAYNAKÇA-type titles space | single spacing (EXPLICIT §2.6) with 12/12 pt | INFERRED spacing part |
| footnote typography where the source is silent (fbe, mbg, sagbil, cografya) | 10 pt, single, body font | non-source; NOT_SPECIFIED |

## Per target
### aku-sbe
- Programme line on the inner cover: printed only when `PROGRAM_NAME` is filled, exactly as the author enters it (wording unknown → no invented "… PROGRAMI" suffix).
- Sanatta Yeterlik and foreign-language (EN) variants are registered from the 2026 guide evidence. Sanatta ethics wording/copy count and English front-page labels remain UNKNOWN Tier 2; the Sanatta template uses an editable grammar-preserving INFERRED default and does not claim official form wording. English variants order the instruction-language abstract before Turkish ÖZET and require the extended Turkish summary after appendices.
- Tanıtım (window) page: first sheet, uncounted/unnumbered, 12 pt, first baseline 228.34 mm (only EK 1 evidence); window size UNKNOWN → soft width limit 80 mm from the example, NOT_SPECIFIED.
- TOC "Sayfa": one empty line under the title (explicit text; example shows none).
- Enstitü Onayı: counted placeholder page (iii) — official e-signed web form is not reproduced.
- Paragraph indent in the abstract: none (EK 5 normative).

### aku-fbe
- ÖZET/ABSTRACT: Anahtar Kelimeler before the year/pages line (guide text explicit); ÖZGEÇMİŞ before EKLER; ÖZGEÇMİŞ required for both degrees.
- Outer cover: physical page 1, not counted, not numbered; text confined to x 55–155 mm, y 210–275 mm, top-anchored at 210 mm; the template's mock-up positions are rejected (they lie outside the area).
- Institute director: editable metadata, prefilled with nothing; never validated (template's "Prof. Dr. Bekir YALÇIN" is 2019 sample content).
- Jury rows: data-driven (`visibleWhen`), 5 default, rows 6–7 only when filled.

### aku-sagbil
- Guide currency (2009 vs "2015"): implemented as the only source; flag `outdated-source` kept in `source.notes`.
- Font/size: author choice in the guide; template default Times New Roman 12 pt (INFERRED default, not a requirement); covers Times New Roman (explicit §1.19).
- Page numbers: top; default right-aligned (x1 = 185 mm); centre would be equally valid.
- İçindekiler before Önsöz; table label "Tablo" (default); lists ŞEKİLLER / TABLOLAR; İç Kapak not in the TOC.
- Bibliography entry gap 18 pt (text) over the example's ~7 pt; bibliography size body − 1.
- Outer cover card (blue band, window): a physical print item, not produced; the page behind the window is produced (bottom-anchored, x 55–155 mm, y 217–282 mm).
- Master's approval page reuses the PhD grid with optional member rows.

### aku-cografya-lisans
- Special pages (outer cover, inner cover, approval, ethics, abstract heading block, year/pages string): the referenced "Bitirme Tezi Şablonu" is not in the sources → layout UNKNOWN. They are provided as counted/unnumbered **editable** pages without invented layout (the author pastes the department's template content); validation is `NOT_SPECIFIED`; documented in `orchestration/failures/aku-cografya-lisans-special-pages.md`. All other rules are implemented and validated.
- Paragraph indent 0 mm (explicit §2.4 beats the guide's own pages); body 6/6 pt additive → 32.7 pt between body baselines.
- Headings: one empty 1.5-spaced line (20.69 pt) each side + Word-additive 6/6 → 53.4 pt heading→paragraph baseline distance (41.4 pt is the source minimum).
- Titles: ÇİZELGELER DİZİNİ (only place prescribing it), KAYNAKLAR (bibliography numbered as next chapter, INFERRED), single-spaced 6/0 bibliography, 12.5 mm hanging.

### aku-mbg-lisans
- Guide (May 2025) wins over the template (Feb 2025) where explicit; template XML fills the rest.
- Inner cover: top margin 10.02 mm (template) — with 3 cm the official cover would not fit one page; Dış Kapak not generated (layout UNKNOWN; a department sample is required) → documented limitation, page absent.
- ÖZGEÇMİŞ optional, off by default, before EKLER; layout UNKNOWN (title/TOC entry only).
- SİMGELER title left (template, guide silent); index-page titles centred (guide).
- Logo-row extra (8.05 pt) uncertainty: cover lines below the logos may be 2.84 mm higher in real Word (needs a Microsoft Word render) → cover checks below the logo row are validated with that documented ±2.84 mm allowance recorded as `sourceUncertainty`, not as tolerance.

## Cross-target facts settled
- Real Times New Roman must be embedded in every AKU export (exact font requirement; verified from the PDF font programs).
- Author-choice items (sagbil font/size, table label, page-number alignment) are implemented as the documented default only; a choice UI is product work, not a formatting rule.
- Landscape pages, printing (duplex/binding/copies/paper) and physical covers are outside the exported document; recorded in `source.notes`.
