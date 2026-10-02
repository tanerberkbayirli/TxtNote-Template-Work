/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Kimya Bölümü, lisans bitirme tezi (Türkçe).
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Kimya_Bolumu_Bitirme_Tezi/): "Kimya Bölümü Bitirme Tezi Yazım Kılavuzu"
 * (AKU_Kimya_Bitirme_Tezi_Yazim_Kilavuzu_2023.pdf, 29 pages, cover 'AFYONKARAHİSAR 2023') and the Word template
 * AKU_Kimya_Bitirme_Tezi_Sablonu_2026.docx (core.xml 2026-02-24). The reviewed spec is orchestration/specs/aku-kimya-lisans.json
 * (rule evidence, conflicts and decisions); the report is orchestration/reports/aku-kimya-lisans.md.
 *
 * Rule order (USER DECISION, binding): the official DOCX (sectPr, styles, paragraph/run properties, empty-paragraph structure, tables,
 * and the PDF Word renders from it) > the guide's explicit text where the DOCX defines nothing > UNKNOWN (never invented). Where guide and
 * DOCX disagree the DOCX value is implemented and both values are recorded in `source.notes` / the spec.
 *
 * Word line model (measured on the Word-rendered template PDF): a single Times New Roman line is 1.15 em, the first baseline of a line
 * box sits near 0.93 em below its top and the extra leading of "1,5 satır" goes below the text; paragraph spacing is Word-additive.
 * The template separates paragraphs/headings by EMPTY 1.5-spaced paragraphs: one empty line = 20.7 pt (measured pitch 7.30 mm).
 */
import { MM_PER_PT } from "../units.js";
import { akuSeal } from "./assets/akuMbgLogos.js";
import { kimyaLogo } from "./assets/akuKimyaLogo.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt and as an empty-line spacer in mm. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** One empty 12 pt line at 1.5 spacing: 20.7 pt (an empty template paragraph; the guide's "1 satır boşluk (1,5 aralıklı)"). */
const BLANK_PT = linePt(12, 1.5);

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const grey = { color: "#bfbfbf" };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const single = { lineHeight: 1 };
const roman = { numbering: { format: "roman-lower" } };

// ---- special pages (template word/document.xml sections 1-3) ------------------------------------------------

// İç Kapak (template section 1): 14 pt bold, 1.5 lines everywhere ("Sadece bu sayfada 14 punto", guide §4.2.2). Measured in the Word render of the template:
// AKÜ seal 26.19 mm at x 30.00 / y 10.02 (top-and-bottom wrapped: the next text line starts below it, 45.0 mm), Kimya Bölümü logo 34.08 mm at
// x 148.59..182.67 / y 5.29..39.37 (wrapNone: floats over the margins). The engine has no floating images, so the cover section uses the template's
// own extents as its margins: top 5.29 (logo top), right 27.33 (logo right edge 182.67) with a 2.67 mm right indent on the cover text so that the text frame
// stays x 30..180; the seal is lowered by 4.73 mm to its measured y 10.02. Text starts 5.63 mm below the logo bottom (45.0 mm). The cover's header distance is 0.3 mm
// so that Word's (empty) header paragraph does not push the body below the 5.29 mm top margin (the template's section 1 has no header part).
const SEAL_MM = 26.19;
const LOGO_MM = 34.08;
const COVER_RIGHT_OVERHANG_MM = 2.67;
const COVER_FRAME_MM = 150 + COVER_RIGHT_OVERHANG_MM;
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { margins: { topMm: 5.29, bottomMm: 30, rightMm: 30 - COVER_RIGHT_OVERHANG_MM }, header: { distanceMm: 0.3 }, numbering: { enabled: false }, trimTerminalTextLeading: true },
    body: { ...page15, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    { type: "group", direction: "row", marginBottomMm: 5.63, blocks: [
      { type: "group", direction: "column", widthPercent: SEAL_MM / COVER_FRAME_MM * 100, blocks: [
        { type: "spacer", heightMm: 4.73 },
        { type: "image", source: akuSeal, widthMm: SEAL_MM, heightMm: SEAL_MM, align: "left" },
      ] },
      { type: "spacer", heightMm: 0 },
      { type: "image", source: kimyaLogo, widthMm: LOGO_MM, heightMm: LOGO_MM, align: "right", widthPercent: LOGO_MM / COVER_FRAME_MM * 100 },
    ] },
    // The text frame stays x 30..180 (the 2.67 mm right indent is not inherited by the images above).
    { type: "group", direction: "column", style: { rightIndentMm: COVER_RIGHT_OVERHANG_MM }, blocks: [
      { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
      { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ" },
      { type: "text", value: "KİMYA BÖLÜMÜ" },
      blank(4, 14),
      { type: "text", value: "BİTİRME TEZİ" },
      blank(3, 14),
      { type: "metadata", field: "THESIS_TITLE", fallback: "BİTİRME TEZİ BAŞLIĞI", style: upper },
      blank(2, 14),
      { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
      blank(2, 14),
      { type: "text", value: "Danışman" },
      { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
      blank(5, 14),
      { type: "text", value: "{{SUBMISSION_MONTH}}, {{SUBMISSION_YEAR}}" },
    ] },
  ],
};

// BİTİRME TEZİ ONAY SAYFASI (template section 2, paragraphs 28-39; measured y 30.22 ...): styles "Metinler - Bilgi - ..." (bold, caps, 14 pt, centred,
// single), three empty 10 pt single lines (no run size = Word default 10 pt) around the title, the 12 pt 1.5-spaced acceptance sentence ("…" blanks are filled in by the
// candidate after the defence, guide §4.2.3; only "BİTİRME TEZİ" is bold), two empty 1.5 lines, the bold advisor line with the signature word at the right.
const approval = {
  id: "approval", type: "approval", title: "BİTİRME TEZİ ONAY SAYFASI", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    blank(3, 10, 1),
    { type: "text", value: "BİTİRME TEZİ ONAY SAYFASI", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    blank(3, 10, 1),
    { type: "text", markup: "inline", value: "…….. tarafından hazırlanan ……….. başlıklı tez çalışması  ../../…. tarihinde Afyon Kocatepe Üniversitesi Fen Edebiyat Fakültesi Kimya Bölümü’nde lisans **BİTİRME TEZİ** olarak kabul edilmiştir.", style: { align: "justify" } },
    blank(2),
    { type: "group", direction: "row", style: bold, blocks: [
      { type: "text", value: "Bitirme Tezi Danışmanı : {{ADVISOR_TITLE}} {{ADVISOR_NAME}}", widthPercent: 80, style: { align: "left" } },
      { type: "text", value: "İMZA", widthPercent: 20, style: { align: "right" } },
    ] },
  ],
};

// BİLİMSEL ETİK BİLDİRİM SAYFASI (template paragraphs 88-103): not counted/numbered. Items are Symbol-font "−" (U+F02D = minus) bullets at 0 / text at 7.5 mm
// (numbering.xml numId 26, paragraph ind left=425 hanging=425), the intro sentence is bold with a 12.5 mm first-line indent, the signature block is the
// template's (date right, grey İmza at 167.37 mm, bold name right, 1.5 lines).
// Each item's first line is 0.34 mm taller than a plain 1.5 line (the Symbol-font bullet enlarges the Word line box: measured pitch 7.62 mm vs 7.28 mm).
const ethicsItem = (text) => ({ type: "group", direction: "row", marginTopMm: 0.34, blocks: [
  { type: "text", value: "−", widthPercent: 5 },
  { type: "text", value: text, style: { align: "justify" } },
] });
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİM SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "BİLİMSEL ETİK BİLDİRİM SAYFASI", style: { ...bold, align: "center" } },
    { type: "text", value: "Afyon Kocatepe Üniversitesi", style: { ...bold, align: "center" } },
    blank(1),
    { type: "text", value: "Kimya Bölümü, bitirme tezi yazım kurallarına uygun olarak hazırladığım bu bitirme tezi çalışmasında;", style: { ...bold, align: "justify", firstLineIndentMm: 12.5 } },
    ethicsItem("Bitirme tezi içindeki bütün bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi,"),
    ethicsItem("Görsel, işitsel ve yazılı tüm bilgi ve sonuçları bilimsel ahlak kurallarına uygun olarak sunduğumu,"),
    ethicsItem("Başkalarının eserlerinden yararlanılması durumunda ilgili eserlere bilimsel normlara uygun olarak atıfta bulunduğumu,"),
    ethicsItem("Atıfta bulunduğum eserlerin tümünü kaynak olarak gösterdiğimi,"),
    ethicsItem("Kullanılan verilerde herhangi bir tahrifat yapmadığımı,"),
    ethicsItem("Ve bu bitirme tezinin herhangi bir bölümünü bu üniversite veya başka bir üniversitede başka bir tez çalışması olarak sunmadığımı"),
    { type: "text", value: "beyan ederim.", style: { ...bold, align: "justify" } },
    blank(1),
    { type: "metadata", field: "DECLARATION_DATE", fallback: "GG / AA / YYYY", style: { ...bold, align: "right" } },
    blank(1),
    { type: "text", value: "İmza", style: { ...bold, ...grey, align: "left", leftIndentMm: 137.37 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI", style: { ...bold, align: "right" } },
  ],
};

// ÖZET / ABSTRACT (template paragraphs 104-156): title bold, "Bitirme Tezi" / "Graduation Thesis" regular (the English page must say so, guide §4.2.5),
// the title in capitals SINGLE spaced and regular weight, student, university, faculty, department, "Danışman:"/"Supervisor:" (label bold), empty line(s)
// (Turkish: 2 = template paragraphs 115+116, English: 1), the unindented 1.5-spaced text, then - DOCX ORDER - the bold "<year>, <front pages> + <body pages> sayfa" line
// and the keywords (4-6, label bold, hanging 37.52 / 22.0 mm). The guide (§4.2.5) has the keywords first: CONFLICT, DOCX followed (user decision).
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: id === "abstract-tr" ? { numbering: { format: "roman-lower", startAt: 1, restart: true } } : roman, body: { ...page15, align: "center" } },
  blocks: lines,
});
const abstractTitle = (field, fallback) => ({ type: "metadata", field, fallback, style: { ...upper, ...single } });
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0 } } });
const abstractFooter = (id, type, title, keywords, hangMm, pages) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page15, align: "left" } },
  // The abstract's last paragraph already carries its empty line (paragraph spacing) before the pages line.
  blocks: [
    { type: "text", value: pages, style: { ...bold, align: "justify" } },
    blank(1),
    { type: "text", markup: "inline", value: keywords, style: { align: "justify", hangingIndentMm: hangMm } },
  ],
});
const abstractTr = [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET", style: bold },
    { type: "text", value: "Bitirme Tezi" },
    blank(1),
    abstractTitle("THESIS_TITLE", "BİTİRME TEZİNİN TÜRKİYE TÜRKÇESİ BAŞLIĞI"),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    { type: "text", value: "Afyon Kocatepe Üniversitesi" },
    { type: "text", value: "Fen Edebiyat Fakültesi" },
    { type: "text", value: "Kimya Bölümü" },
    { type: "text", markup: "inline", value: "**Danışman:** {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(2),
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS_TR}}", 37.52, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} sayfa"),
];
const abstractEn = [
  abstractHeader("abstract-en-header", "ABSTRACT", "englishAbstract", [
    { type: "text", value: "ABSTRACT", style: bold },
    { type: "text", value: "Graduation Thesis" },
    blank(1),
    abstractTitle("THESIS_TITLE_EN", "TITLE OF GRADUATION THESIS"),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Student Name SURNAME" },
    { type: "text", value: "Afyon Kocatepe University" },
    { type: "text", value: "Faculty of Science and Arts" },
    { type: "text", value: "Department of Chemistry" },
    { type: "text", markup: "inline", value: "**Supervisor:** {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}" },
    blank(1),
  ]),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "**Keywords:** {{KEYWORDS_EN}}", 22.0, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} pages"),
];

/** Front-matter title (template style Balk1 = "No Spacing": bold, centred, 1.5 lines, unnumbered; ÖZET-like pages and TEŞEKKÜR: one empty 1.5 line below). */
const frontTitle = (spaceAfterPt = BLANK_PT, align = "center") => ({ "1": { align, textTransform: "none", spaceAfterPt, numbering: { enabled: false } } });

// Lists (template styles "table of figures" / "toc N"): "Sayfa" bold right under the title, dot leader to the right edge, rows 12 pt regular, 1.5 lines,
// 0 pt after (direct spacing after=0 on every row), entries hang under the caption text after the bold label.
const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", labelStyle: bold, indentMm: 0,
  pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(0) },
});

const sections = () => [
  innerCover,
  approval,
  ethics,
  ...abstractTr,
  ...abstractEn,
  // TEŞEKKÜR: title, one empty line, text (max one page); two empty lines before the right-aligned signature (template paragraphs 174-182).
  { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0 } } },
  { id: "acknowledgements-signature", type: "acknowledgements", title: "Teşekkür imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
    overrides: { page: roman, body: { ...page15, align: "right" } },
    blocks: [blank(1), { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" }, { type: "text", value: "Afyonkarahisar {{YEAR}}" }] },
  // İÇİNDEKİLER DİZİNİ: bold centred title, "Sayfa" bold right directly below; rows 12 pt regular, 1.5 lines, 0 pt after, dot leader to the right edge,
  // indents 0 / 5 / 10 / 15 mm for the levels (styles toc 3-5: 284, 567, 851 twips; measured 30.02 / 35.02 / 40.01 / 45.05 mm).
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 5, matchHeadingTransform: true,
      pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 }, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
    overrides: { page: roman, headings: frontTitle(0) } },
  // SİMGELER ve KISALTMALAR DİZİNİ (guide "varsa"): bold CENTRED title (template Balk1), one empty line, then single-spaced 0/0 pt lines (guide §2.11 "1 satır aralıklı",
  // the template's own table cells); definitions on a common stop 40.71 mm from the margin (template table: first column 2196 twips + 108 twips cell padding; measured x 70.71 mm).
  // The template writes the list as a 2-column table whose terms sit 1.95 mm in from the margin (cell padding); the guide says "boşluk bırakılmadan": 0 mm used.
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER ve KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, tabStopMm: 40.71, hangingIndentMm: 40.71 } } },
  generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
  generatedList("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables", "tables"),
  generatedList("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
  // 1. GİRİŞ restarts the numbering in Arabic at 1 (section 4: pgNumType start=1); the numbered chapters follow in "Bölümler" and KAYNAKLAR continues the chapter numbers.
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    // The first entry's 6 pt space-before adds to the title's empty line (Word, measured 46.91 mm = 44.79 + 2.12), which CSS would collapse across the section wrapper.
    overrides: { headings: { "1": { spaceAfterPt: BLANK_PT + 6 } } } },
  // ÖZGEÇMİŞ (template paragraphs 488-508, measured y 30.19): bold CENTRED title, one empty line, then the form-like field lines (Adı Soyadı, Doğum Yeri ve Tarihi, ...,
  // authored in the editor); unnumbered.
  { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false }, align: "center", spaceAfterPt: BLANK_PT } } } },
  // EKLER (template paragraphs 520-584): bold CENTRED title, the first appendix title ("EK 1. ...") directly below (no empty line), each appendix on its own page.
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false }, align: "center", spaceAfterPt: 0 } } } },
];

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
// Headings (template styles Balk2-Balk5, typed numbers "1." / "2.1" / "2.2.1" / "2.3.1.1"): TNR 12 bold, left, 1.5 lines, one empty 1.5 line before (the preceding
// paragraph's) and after (empty template paragraphs; guide §2.4/§2.6); H1 on a new page (guide §2.8). H1 typed in capitals ("ve/veya/ile" stay lower-case), H2 Title Case (guide §2.8);
// H3/H4 case is not prescribed (the template's placeholder titles are Title Case: not applied, UNKNOWN).
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
// Figure/Resim: measured in the Word render of the template: the image bottom is 2.58 mm above the caption's glyph box top = 6.04 mm above its first baseline
// (caption line-box top 2.42 mm = 6.86 pt below the image).
const FIGURE_GAP_PT = 6.86;
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", labelStyle: bold, hangingIndent: "label", captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6 },
  spacingBeforePt: 0, spacingAfterPt: 6, ...extra,
});
const figureCaption = (label) => caption(label, "below", { spacingBeforePt: FIGURE_GAP_PT, box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } });

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-kimya-lisans-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fef-kimya",
  instituteName: "Fen Edebiyat Fakültesi · Kimya Bölümü",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Kimya Bölümü · Bitirme Tezi",
  source: {
    type: "official",
    documentName: "AKÜ Kimya Bölümü Bitirme Tezi Yazım Kılavuzu (2023) — AKU_Kimya_Bitirme_Tezi_Yazim_Kilavuzu_2023.pdf; AKU_Kimya_Bitirme_Tezi_Sablonu_2026.docx",
    revisionDate: "2023-12 kılavuz (kapak 'AFYONKARAHİSAR 2023', Last-Modified 2023-12-28); 2026-02 şablon (core.xml 2026-02-24)",
    verifiedAt: "2026-10-02",
    notes: [
      "Öncelik (kullanıcı kararı, bağlayıcı): resmî DOCX şablonunun XML'i (sectPr, stiller, paragraf/çalıştırma özellikleri, boş paragraf yapısı, tablolar) ve onun Word çıktısı > kılavuzun DOCX'in tanımlamadığı açık metni > UNKNOWN (uydurma değer yok). Kılavuz ile DOCX çelişirse DOCX değeri uygulanır, iki değer de kayda geçer (orchestration/specs/aku-kimya-lisans.json 'conflicts'). Şablon (2026-02) kılavuzdan (2023-12) yenidir; eşleştirmeleri kaynaklarda belirtilmemiştir. Kırmızı açıklama kutuları ve '(Bir boşluk)'/'(*)' notları basılmaz. Tek tür (Türkçe lisans bitirme tezi).",
      "Sayfa: A4 dikey (11904 x 16838 tw), dört kenar 30 mm (1701 tw; kılavuz §2.3 'sayfa kenarlarından 3 cm' aynı). Üst/alt bilgi uzaklığı 12,51 mm (709 tw; son bölümde 708 tw), kılavuz sessiz. Sayfa numarası altta ortada, süssüz, Times New Roman 10 pt (altbilgi paragrafında boyut yok = Word varsayılanı 10 pt; kılavuz §2.7 de 10 punto der: uyumlu). Numaralama: kapak, onay ve etik numarasız (şablon bölüm 1-2 altbilgisi boş; kılavuz §2.7), ÖZET i, ABSTRACT ii ... (bölüm 3 lowerRoman start=1), 1. GİRİŞ Arapça 1 (bölüm 4 start=1), KAYNAKLAR/ÖZGEÇMİŞ/EKLER devam eder.",
      "İç Kapak (şablon bölüm 1): 14 pt koyu, 1,5 satır. Üst kenar boşluğu 10,02 mm (568 tw) şablondan, kılavuzun genel 3 cm kuralı ile ÇELİŞKİ (DOCX uygulanır). AKÜ mührü 26,19 mm (x 30,00, y 10,02, üst-alt sarmalı) ve Kimya Bölümü logosu 34,08 mm (x 148,59-182,67, y 5,29-39,37; wrapNone, kenar boşluklarının üstüne taşar): motorda kayan resim yok; kapak bölümü şablonun ölçülen uçlarını kenar boşluğu yapar (üst 5,29, sağ 27,33 mm + metne 2,67 mm sağ girinti, mühür 4,73 mm aşağıda). Şablondaki '(Devam)' başlık satırı ayrı tek aralıklı bir örnek paragraftır (ikinci başlık satırı örneği), kural olarak alınmadı (sonraki satırlar 5,68 mm yukarıda başlar). Dış Kapak: kılavuzda yalnız 'plastik spiralli ciltlenmelidir' (§4.2.1); ne kılavuzda ne şablonda sayfası vardır: düzeni UNKNOWN, üretilmez.",
      "Onay sayfası (şablon bölüm 2, §4.2.3): 14 pt koyu büyük harf tek aralıklı iki üst satır, 10 pt tek aralıklı üç boş satır (satır boyutu yok = 10 pt), başlık, üç boş, 12 pt 1,5 aralıklı kabul cümlesi, iki boş satır, koyu danışman satırı ve sağda İMZA. Bölüm 2'nin onay ile etik sayfasını ayıran boş paragraflar (47 adet, 10 pt) sayfa dolgusudur: motorda ayrı sayfa olarak uygulanır. Etik sayfası: madde işareti Symbol yazı tipinde U+F02D (eksi '−'), sol 0 / metin 7,5 mm (numbering.xml numId 26 + paragraf ind 425/425 tw); ad satırı koyu, 1,5 aralıklı, sağa yaslı.",
      "Gövde: Times New Roman 12 pt, iki yana yaslı, 1,5 satır (Word 20,7 pt), girintisiz; paragraflar arası ve başlık öncesi/sonrası bir BOŞ 1,5 satır (şablonun boş paragrafları, ölçülen kaynak/paragraf perdesi 14,61 mm = 2 satır; kılavuz §2.4/§2.6 'önce ve sonra 1 satır boşluk (1,5 aralıklı)' aynı): motorda paragraf sonrası 20,7 pt, başlık öncesi 0 (Word toplamlı aralık). Başlıklar: şablon stilleri Balk2-Balk5, 4 düzey, hepsi TNR 12 koyu, sola yaslı; sayılar elle yazılır (1. / 2.1 / 2.2.1 / 2.3.1.1); 1. düzey büyük harf ('ve/veya/ile' küçük) ve yeni sayfa, 2. düzey Baş Harfleri Büyük (kılavuz §2.8); 3./4. düzey büyük/küçük harf kılavuzda ve şablon stillerinde belirtilmemiştir (şablonun örnek başlıkları Baş Harfleri Büyük, ama yer tutucu metindir): uygulanmadı, UNKNOWN. Widow/orphan denetimi kılavuzda zorunlu (§2.4), şablon Normal stilinde kapalıdır: kılavuz uygulanır.",
      "Şekil/Çizelge/Resim: bölüm numaralı ('Şekil 2.1', yalnız boşluk), etiket koyu, 11 pt, tek satır, iki yana yaslı, devam satırları etiket genişliğinde asılı, sonra 6 nk (şablon örnekleri ve kılavuz §3.3 aynı; şablon örneklerinin sonundaki nokta yazar içeriğidir). Çizelge başlığı üstte, Şekil ve Resim başlığı altta; görsel ile başlık arası 6,86 pt (Word çıktısında ölçüldü). Bölünen çizelge: 'Çizelge 3.1 (Devam) …' (kılavuz §3.1 ve şablonun 'EK 2. (Devam)' örneği). Çizelge: üst, başlık altı ve son satır altı 0,5 pt çizgi, yan çizgi yok (şablon tcBorders sz=4, dört örnek de aynı); hücre yazısı 12 pt (şablonun iki örneği 12 pt, ikisi boyutsuz = 10 pt: tutarsız; kılavuz §2.2 12 pt der, en küçük 8 pt). Çizelge altı açıklama 10 pt tek satır iki yana yaslı, 6 nk önce/sonra (şablon açıklama paragrafı boyutsuz = 10 pt, kılavuz §3.3 10 punto: uyumlu). Denklem: Cambria Math 12 pt, ortalı, numara (bölüm.sıra) sağda, öncesi ve sonrası boş 1,5 satır (şablon ve kılavuz §2.10).",
      "ÖZET/ABSTRACT (şablon bölüm 3): başlık koyu, 'Bitirme Tezi' / 'Graduation Thesis' normal, tez başlığı büyük harf tek aralıklı normal kalınlık, 'Danışman:' / 'Supervisor:' etiketi koyu; Türkçe sayfada danışman ile metin arasında 2 boş satır, İngilizcede 1 (şablon paragrafları 115+116 / 151). SIRA ÇELİŞKİSİ: şablon metin, 'yıl, ön sayfa + giriş sonrası sayfa' satırı, anahtar kelimeler (4-6) sıralar; kılavuz §4.2.5 anahtar kelimeleri sayfa satırından önce ister: DOCX izlendi. Özetin sözcük/sayfa sınırı UNKNOWN.",
      "Dizinler: İÇİNDEKİLER / ŞEKİLLER / ÇİZELGELER / RESİMLER DİZİNİ ve SİMGELER ve KISALTMALAR DİZİNİ başlıkları koyu, ORTALI (şablon stili Balk1; kılavuz §4.2.7-4.2.11 de ortalı), 'Sayfa' koyu sağda hemen altta; satırlar 12 pt normal, 1,5 satır, 0 nk sonra, nokta kılavuzu sağ kenara; içindekiler girintileri 0/5/10/15 mm (stiller toc 3-5); şekil/çizelge/resim satırlarında etiket koyu, devam satırları metne hizalı asılı (Word çıktısı 16,3 mm). Simgeler/Kısaltmalar: tek aralıklı, 0 nk, tanımlar ortak sekmede 40,71 mm (şablon tablosu: 2196 + 108 tw); şablon tablo kullanır ve simgeleri hücre iç boşluğu kadar (1,95 mm) içeride gösterir, kılavuz §2.11 'boşluk bırakılmadan' der: 0 mm uygulandı (motorda tablo içeriği yazar işidir).",
      "Kaynaklar: '6. KAYNAKLAR' bir sonraki bölüm gibi numaralanır (şablon başlığı), 12 pt, 1,5 satır, öncesi 6 nk sonrası 0 nk, iki yana yaslı, 12,5 mm asılı girinti (709 tw), soyadına göre alfabetik; atıf 'Yazar Yıl' (kılavuz §2.9). 'İnternet Kaynakları' ayrı bir grup olarak '1-' ile yazarca yazılır (motorda ayrı grup yok). ÖZGEÇMİŞ ve EKLER: başlıklar koyu ortalı (şablon), EKLER başlığının hemen altında 'EK 1.' gelir (boş satır yok), ÖZGEÇMİŞ başlığından sonra bir boş satır; ÖZGEÇMİŞ'in alan satırları (Adı Soyadı, Doğum Yeri ve Tarihi, ...) yazar içeriği olarak bırakıldı.",
      "Dipnot: kılavuzda dipnot biçimi yoktur; şablonun 'footnote text' stili (DipnotMetni) Normal'dan türer ve boyut vermez (Word varsayılanı 10 pt, tek satır): DOCX değeri 10 pt tek satır uygulandı (kılavuzun 'tezin tamamında 12 punto' genel cümlesi ile çelişir; dipnot adıyla anılmadığı için INFERRED). Bitirme tezi benzerlik üst sınırı %20 ve baskı (tek yüz, 70-100 g/m², Word'den yazdırma, spiral cilt) fiziksel/gönderim kuralıdır, belge içeriği değildir. Yatay sayfa: motorda belge içi tek yatay sayfa yok.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.51, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.51, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 10 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", textTransformExceptions: EXCEPTIONS, pageBreakBefore: true }),
      "2": heading("{1}.{2}", { textTransform: "capitalize", textTransformExceptions: EXCEPTIONS }),
      "3": heading("{1}.{2}.{3}"),
      "4": heading("{1}.{2}.{3}.{4}"),
    },
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10, lineHeight: 1 },
    // blockGap: a paragraph/heading after a figure, table or table note keeps the paragraph baseline pitch (an empty 1.5 line, template).
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" },
    // Table notes: below the table, 10 pt, single spaced, block (no indent), justified, 6 pt before and after (template note paragraph).
    paragraphStyles: { tableNote: { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Bitirme tezi başlığı (Türkçe)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of graduation thesis (English)", type: "text" },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Supervisor title (Prof. / Assoc. Prof. / Asst. Prof.)", type: "text" },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    SUBMISSION_MONTH: { label: "Tezin teslim edildiği ay (kapak)", type: "text", required: true },
    SUBMISSION_YEAR: { label: "Tezin teslim edildiği yıl (kapak)", type: "number", required: true },
    DECLARATION_DATE: { label: "Etik bildirim tarihi (GG / AA / YYYY)", type: "text" },
    DEFENSE_YEAR: { label: "Savunma yılı (Özet/Abstract)", type: "number", required: true },
    YEAR: { label: "Yıl (Teşekkür)", type: "number", required: true },
    KEYWORDS_TR: { label: "Anahtar Kelimeler (4-6, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (4-6)", type: "text" },
    // "2023, ix + 16 sayfa": last roman page label and the Arabic pages from GİRİŞ to the end (ekler dahil), from the layout.
    FRONT_PAGE_COUNT: { label: "Son romen sayfa (Özet/Abstract)", type: "text", derived: "frontLastLabel" },
    BODY_PAGE_COUNT: { label: "Giriş'ten sonraki sayfa sayısı (Özet/Abstract)", type: "number", derived: "mainPageCount" },
  },
  validation: {
    KEYWORDS_TR: { minItems: 4, separator: ",", severity: "warning", message: "Anahtar Kelimeler 4-6 tane olmalı ve virgülle ayrılmalıdır." },
    KEYWORDS_EN: { minItems: 4, separator: ",", severity: "warning", message: "Keywords 4-6 tane olmalı ve virgülle ayrılmalıdır." },
  },
  tables: {
    ...caption("Çizelge", "above"),
    borders: { preset: "threeRule", widthPt: 0.5 },
    cellStyle: { fontSizePt: 12, lineHeight: 1, align: "left" },
    continuation: { format: "{label} {number} (Devam) {title}" },
  },
  figures: figureCaption("Şekil"),
  captionKinds: { photo: figureCaption("Resim") },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "right",
    style: { fontFamily: "Cambria Math", fontSizePt: 12, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT } },
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 12.5 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER DİZİNİ", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export const akuKimyaLisans = { ...base, sections: sections() };
export default akuKimyaLisans;
