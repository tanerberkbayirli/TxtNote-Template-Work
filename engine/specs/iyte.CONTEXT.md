# İYTE local template integration — 10 October 2026

Scope: all seven document sources in `Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü`.
Five selectable templates share one lazy-loaded data module. No remote AI, paid conversion,
new fonts, network source download or shared pagination/export engine change was needed.
Existing Tasks 1–5 closure snapshots are historical and were not regenerated.

## Selection

- İYTE → Lisansüstü Eğitim Enstitüsü → Yüksek lisans → English.
- Same institute → Doktora → English.
- İYTE → Lisansüstü Eğitim Enstitüsü · Makalelerden Tez → Yüksek lisans / Doktora → English.
- İYTE → Elektrik-Elektronik Mühendisliği · Bitirme Projesi → Lisans → English.

The existing creator has university/institute/degree/language selectors, so the article format
uses a distinct institute **selection category**, not a claim that there is a second institution.
All five identities resolve without generic fallback. Existing documents are not migrated.
The editor also exposes the entries in its template selector. Usage notes are shown in the
existing thesis information panel. The status bar reads the template's page size instead of
always displaying A4.

## Sources, coverage and precedence

1. `IYTE_EEE_BSc_Project_Final_Report_Format_2025-12.docx`: actual undergraduate template.
   Original SHA, XML/style/section extraction and a private owned-Word render are retained in
   `orchestration/artifacts/iyte/source/eee-extracted.json` and `eee-word/render-manifest.json`.
   Letter (12240×15840 twips), 1440-twip margins, Arial 11, 1.15 automatic lines, 10 pt paragraph
   after-spacing, body left indent 709 twips. Cover logo bytes come directly from image1.png.
   Cover rectangle is reconstructed from the Word PDF's 6 pt stroked rect
   (123,280.5)–(513.7,717.5) pt. Text remains editable metadata, never a page screenshot.
   A positioned block has `flowHeightMm:0`; it never had a normal-flow slot in the source.
   Source figures/data, old page labels and the broken TOC bookmark are not copied.
   Chapter structure, continuous Arabic pagination, document-wide illustration numbers and
   **below-table** captions follow this department document rather than the graduate guide.
2. `IYTE_Lisansustu_Tez_Yazim_Kilavuzu_EN_2019.pdf`: common master's/doctoral rules.
   §2.1–2.4: A4; left 35 mm, other margins 25 mm; Times New Roman 12; 1.5 body lines.
   §2.7: 12.7 mm first-line indent, no inter-paragraph gap, center between text margins.
   Measured guide pp.5/7 give CHAPTER/title/body baselines 30.27/49.74/67.84 mm. The chapter 3× line box already includes the lower gap; no extra after-spacing is added. Subheadings use one blank 1.5-spaced 14 pt Word pitch (24.15 pt) before and after. §2.8: widows/orphans; §2.9: hidden but counted title/approval/acknowledgment pages,
   lowercase Roman front matter, Arabic restart at first body page and continuation into back matter.
   Number baseline/right edge 20 mm from paper edges. §3.2: chapter number/title 16 pt,
   separate lines; subheadings 14 pt bold. Caption text 12 pt; table above / figure below. Footnotes 10 pt, single-spaced, 10 mm left indent; 50 mm separator over the 150 mm text width.
   §§3.1.3–4: English abstract and Turkish ÖZET, maximum 250 words each.
   §3.3: references unnumbered, single-spaced entries; appendices continue Arabic numbering;
   standard PhD-only VITA is unnumbered and excluded from TOC, maximum one page.
   Fig.2.1 / §2.11: bound front cover artwork 205×290 mm, 20–24 pt; 20 pt selected.
   Black hard binding, gold lettering and spine are a physical print-shop operation.
   Fig.3.1: title 18 pt, other title-page text 14 pt, programme and degree wording retained.
   Its 3/10/4/7 single-line gaps are represented by explicit 14-pt spacing; diagrams are
   scaled illustrations inside a guide page, so their enclosing PDF coordinates are not
   treated as full-size thesis coordinates. No pixel-identical master-page claim is made.
   Fig.3.2: editable committee/affiliation/supervisor/head/dean fields, no copied signatures.
3. `IYTE_Referans_Sistemleri_Senato_Karari_2024.pdf`: image-only Turkish scan, visually read.
   The decision itself is dated **19 September 2017**, number 18/4, applies from 2018–2019 fall:
   ACS or Chicago. The archive filename is not the decision date.
4. `IYTE_Senate_Decision_Reference_System_EN_2024-08.pdf`: English counterpart confirms
   the same ACS/Chicago requirement; not a separate thesis template.
5. `IYTE_Kaynak_Gosterme_Yontemleri_2026.pdf`: ACS superscript, italic-number and author-date
   examples plus Chicago examples. Used for usage policy, not as a new document template.
   Numeric ACS references follow first appearance; ACS author-date/Chicago bibliography
   uses alphabetical ordering and hanging indent. No quantitative hanging-indent measurement
   is specified here. Citation syntax, reference ordering and the choice of subtype remain
   author decisions; this integration does not add a citation formatter or claim automatic
   bibliography compliance. The default ACS numeric layout does not impose hanging indent.
6. `IYTE_Doctoral_Theses_from_Articles_Guidelines_EN_2024-08.pdf`: older doctorate-only
   article-thesis directive. Its three-publication, authorship, permissions and chapter rules
   are corroborated by the newer Turkish directive.
7. `IYTE_Makale_Tez_Yonergesi_2026.pdf`: newer local directive extends the article format to
   **both master's and PhD**. Takes precedence over source 6 for degree eligibility.
   Three published/accepted eligible-index articles minimum; student first author; advisor
   co-author; English; no reuse in another thesis; publisher permissions and advisor approval.
   Separate introduction, each article a separate chapter starting with its publication citation,
   optional additional/submitted work, conclusion/recommendations, references, appendices, CV.
   Both article variants therefore have three required editable article slots, optional further
   articles, a separate conclusion and VITA. A DOI-list count warning helps identify incomplete
   work; it does not verify DOIs, indexed journals, authorship or permissions.
   Outer cover is required for article variants and optional for conventional digital theses.

All seven current hashes and paths are in `orchestration/artifacts/iyte/source-manifest.json`.
Local files were read without modification. Official websites were not reverified.

## Explicit decisions and limits

- English thesis templates include Turkish ÖZET; no unsupported Turkish full-thesis variant.
- 2019 guide's open discipline-style choice is narrowed by the Senate's ACS/Chicago decision.
- Fig.3.3 has overlapping old annotations (including 18 pt). The visible corrected arrows
  identify ABSTRACT 16 pt bold and thesis title 14 pt regular; those labels are followed.
- Fig.3.2 has five committee slots but no explicit degree-specific jury count. Three slots
  are always present; slots 4–5 and co-supervisor appear when metadata is filled. This is
  a configurable layout, not an assertion of a legally sufficient committee.
- Article directive's list omits approval while requiring the current writing guide.
  The guide's mandatory signed approval page is retained.
- Abstract word/content restrictions, one-page VITA, copyright permission and submission
  eligibility require author review. Readable usage notes disclose these author responsibilities.
- The standard engine's four heading levels are available; deeper headings may be written
  manually. No university-specific code was put in the shared engine.
- Physical binding, spine and obsolete CD/disc delivery instructions are not electronic
  document templates and are not added as artificial choices.

## Verification

- 795 frontend tests passed, including ten focused İYTE tests. The registry-wide H3 test
  now derives the chapter counter instead of assuming that only chapters 1 or 2 can precede
  the main editable content; distinct labels and both subordinate levels remain required.
- Production build passed; existing font externalization / chunk-size advisories remain.
- Real creator/editor browser flow passed for all five choices: select, create, edit,
  reload, metadata persistence, source notes, correct Letter/A4 label, no page errors.
- Five fresh editor PDF/DOCX exports and five owned Microsoft Word renders are retained in
  `orchestration/validation/iyte/completed/run`. 12/13/17/17/13 physical pages respectively.
- Final acceptance: **124 PASS**, no failures/skips. Source-based sizes, actual embedded
  font programs and sizes, first-line indents, XML margins, valid packages, measured layout
  correspondence, Word opening, editor/Word page counts and labels, and one-page EEE cover.
  The final measurement reuses fresh final-code exports (`existing-artifacts` mode),
  with the CHAPTER 1 selector choosing the actual chapter after its Word contents entry.
  Report: `orchestration/validation/iyte/acceptance-final/check-20261010-0913.json`.
  Earlier check-definition mistakes
  (font PostScript names, line-attribute selector, exact Arabic fixture labels) are retained
  in diagnostic reports; their correction did not change source rules or tolerances.
  Final source measurement also checks the first body baseline after CHAPTER 1 at 67.84 mm
  and the four-line 14 pt title-page submission statement in editor PDF and Word.
- Every final PDF and Word-rendered page was rasterized for visual review, including title,
  approval, both abstracts, contents, body, back matter and bound covers.
- Historical broader six failures are outside this data-only addition. They were not
  rerun or relabelled. Tasks 1–5 snapshots and Task 6 status remain untouched.
