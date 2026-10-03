/**
 * Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Coğrafya Bölümü, lisans bitirme tezi (Türkçe).
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/): "Bitirme Tezi Yazım Kılavuzu"
 * (AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf, 23 pages, 2024-03-11) and the Word template
 * AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx (core.xml 2024-03-31). The reviewed spec is orchestration/specs/aku-cografya-lisans.json
 * (rule evidence, conflicts and decisions); the report is orchestration/reports/aku-cografya-lisans.md.
 *
 * Rule order: unambiguous guide prose > template XML (sectPr, styles, direct formatting of the special pages; also what the
 * prose leaves open or words ambiguously) > the guide's own page geometry (Word line pitch only). Conflicts are listed in
 * `source.notes`; UNKNOWN stays UNKNOWN (no invented values). The template's special pages are the source of every
 * cover/approval/ethics/abstract/acknowledgement layout below (spacings are whole Word lines of the template's empty paragraphs).
 *
 * Word line model (measured on the Word-made guide): a single Times New Roman line is 1.15 em, the first baseline of a line
 * box sits near 0.93 em below its top and the extra leading of "1,5 satır" goes below the text; paragraph spacing (6 nk before + 6 nk after) is Word-collapsed (max, 6 pt gap; measured on the Word render of the template);
 * not additive.
 */
import { MM_PER_PT } from "../units.js";
// The AKÜ seal (word/media/image1.jpeg) and the Fen-Edebiyat Fakültesi seal (word/media/image2.png) of this template are byte-identical
// to the files already stored in this module (md5 checked); they are reused, not copied.
import { akuSeal, fefSeal } from "./assets/akuMbgLogos.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt and as an empty-line spacer in mm. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** One empty 12 pt line at 1.5 spacing: 20.7 pt (the guide's "1 satır boşluk (1,5 aralıklı)"). */
const BLANK_PT = linePt(12, 1.5);
/** Paragraph spacing of the guide (§2.2 "öncesi-sonrası 6 nk") and the template's body paragraphs. */
const PARA_GAP_PT = 6;
/**
 * First-line indent of body paragraphs: 708/709 twips = 12.5 mm on 15 of 16 template body paragraphs and on the Word-made guide's own
 * paragraphs (12.45 mm). The guide prose (§2.4: "paragraf başları ... boşluk bırakılmadan başlamalıdır") reads as 0; CONFLICT, see notes.
 */
const PARA_INDENT_MM = 12.5;
/** Heading gap: one empty 1.5 line (20.7 pt) between the heading and the text next to it = this + the 6 pt paragraph spacing (additive). */
const HEADING_GAP_PT = PARA_GAP_PT;

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const grey = { color: "#bfbfbf" };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const single = { lineHeight: 1 };
const roman = { numbering: { format: "roman-lower" } };

// ---- special pages (template word/document.xml, paragraphs of sections 1-2) ---------------------------------

// İç Kapak = the template's first page: 14 pt bold, 1.5 lines everywhere ("Sadece bu sayfada 14 punto", guide §4.2.2), margins as the
// body (25 / 30 mm, sectPr of section 1), the two seals in a right-aligned run (AKÜ seal 32.49 mm from the left edge, Fen-Edebiyat seal at the right edge).
// The template's "(Devam)" title line is a separate single-spaced placeholder paragraph and is not generated.
const SEAL_MM = 26.19;
const FEF_SEAL_MM = 26.25;
const COVER_TEXT_WIDTH_MM = 150;
/** Word render of the template: first text baselines 58.94/67.44/75.95/118.59 mm = our flow + 3.07 mm (MEASURED); the name/advisor/year baselines already matched, so the same amount is taken back after the title. */
const COVER_TOP_SHIFT_MM = 3.07;
const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false }, trimTerminalTextLeading: true }, body: { ...page15, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    { type: "group", direction: "row", blocks: [
      { type: "spacer", heightMm: 0, widthPercent: 2.49 / COVER_TEXT_WIDTH_MM * 100 },
      { type: "image", source: akuSeal, widthMm: SEAL_MM, heightMm: SEAL_MM, align: "left", widthPercent: SEAL_MM / COVER_TEXT_WIDTH_MM * 100 },
      { type: "spacer", heightMm: 0 },
      { type: "image", source: fefSeal, widthMm: FEF_SEAL_MM, heightMm: FEF_SEAL_MM, align: "right", widthPercent: FEF_SEAL_MM / COVER_TEXT_WIDTH_MM * 100 },
    ] },
    { type: "spacer", heightMm: COVER_TOP_SHIFT_MM },
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ" },
    { type: "text", value: "COĞRAFYA BÖLÜMÜ" },
    blank(4, 14),
    { type: "text", value: "BİTİRME TEZİ" },
    blank(3, 14),
    { type: "metadata", field: "THESIS_TITLE", fallback: "BİTİRME TEZİ BAŞLIĞI", style: upper },
    { type: "spacer", heightMm: 2 * linePt(14, 1.5) * MM_PER_PT - COVER_TOP_SHIFT_MM },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    blank(2, 14),
    { type: "text", value: "Danışman" },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(5, 14),
    { type: "metadata", field: "SUBMISSION_YEAR", fallback: "Yıl" },
  ],
};

// BİTİRME TEZİ ONAY SAYFASI (template paragraphs 26-37): 14 pt bold single-spaced heading lines (styles "Metinler - Bilgi - ...": bold, caps, 14 pt,
// centred), three empty 12 pt single lines around the title, the 12 pt 1.5-spaced acceptance sentence (blanks "…" are filled in by the candidate after
// the defence, guide §4.2.3; only "BİTİRME TEZİ" is bold) and the advisor line with the signature word on the right.
const approval = {
  id: "approval", type: "approval", title: "BİTİRME TEZİ ONAY SAYFASI", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    { type: "text", value: "FEN EDEBİYAT FAKÜLTESİ", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    blank(3, 12, 1),
    { type: "text", value: "BİTİRME TEZİ ONAY SAYFASI", style: { ...bold, ...single, fontSizePt: 14, align: "center" } },
    blank(3, 12, 1),
    { type: "text", markup: "inline", value: "…….. tarafından hazırlanan ……….. başlıklı tez çalışması  ../../…. tarihinde Afyon Kocatepe Üniversitesi Fen Edebiyat Fakültesi Coğrafya Bölümü’nde lisans **BİTİRME TEZİ** olarak kabul edilmiştir.", style: { align: "justify" } },
    blank(2),
    { type: "group", direction: "row", style: bold, blocks: [
      { type: "text", value: "Bitirme Tezi Danışmanı: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}", widthPercent: 80, style: { align: "left" } },
      { type: "text", value: "İMZA", widthPercent: 20, style: { align: "right" } },
    ] },
  ],
};

// BİLİMSEL ETİK BİLDİRİM SAYFASI (template paragraphs 38-53): not numbered (guide §2.7). Items are "•" rows (hanging 425 twips = 7.5 mm), the intro sentence
// is bold with a 12.5 mm first-line indent, the signature block is the template's (date right, grey İmza at 167.37 mm, name right, bold, single).
/** Symbol-font marker line is taller than TNR in Word: +0.32 mm per item (MEASURED, template Word render). */
const ETHICS_MARKER_EXTRA_PT = 0.32 / MM_PER_PT;
const ethicsItem = (text) => ({ type: "group", direction: "row", style: { spaceAfterPt: ETHICS_MARKER_EXTRA_PT }, blocks: [
  { type: "text", value: "−", widthPercent: 5 },
  { type: "text", value: text, style: { align: "justify" } },
] });
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİM SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { format: "roman-lower", startAt: 2, restart: true } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "BİLİMSEL ETİK BİLDİRİM SAYFASI", style: { ...bold, align: "center" } },
    { type: "text", value: "Afyon Kocatepe Üniversitesi", style: { ...bold, align: "center" } },
    blank(1),
    { type: "text", value: "Coğrafya Bölümü, bitirme tezi yazım kurallarına uygun olarak hazırladığım bu bitirme tezi çalışmasında;", style: { ...bold, align: "justify", firstLineIndentMm: 12.5 } },
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
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI", style: { ...bold, ...single, align: "right" } },
  ],
};

// ÖZET / ABSTRACT (template paragraphs 55-111): title bold single, "Bitirme Tezi" / "Graduation Thesis" (the English page must say so, guide §4.2.5), the
// title in capitals single-spaced and regular weight, one empty line, student, university, faculty, department, advisor (Danışman:/Supervisor: bold),
// empty line(s), then the unindented 1.5-spaced text. Guide order after the text: keywords (4-6, label bold, hanging 37.52 / 22.0 mm), then
// "yıl, ön sayfa + giriş sonrası sayfa sayısı" bold; the template has these two reversed (CONFLICT, guide followed).
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: roman, body: { ...page15, align: "center" } },
  blocks: lines,
});
const abstractTitle = (field, fallback) => ({ type: "metadata", field, fallback, style: { ...upper, ...single } });
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } } });
const abstractFooter = (id, type, title, keywords, hangMm, pages) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page15, align: "left" } },
  blocks: [
    blank(1),
    { type: "text", markup: "inline", value: keywords, style: { align: "justify", hangingIndentMm: hangMm } },
    blank(1),
    { type: "text", value: pages, style: { ...bold, align: "justify" } },
  ],
});
/** Single-spaced title -> 1.5 empty line -> name: Word 14.61 mm vs 12.17 mm in the flow (MEASURED, template Word render): +2.44 mm. */
const ABSTRACT_TITLE_GAP_MM = 2.44;
const abstractTr = [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET", style: { ...bold, ...single, fontSizePt: 11 } },
    { type: "text", value: "Bitirme Tezi" },
    blank(1),
    abstractTitle("THESIS_TITLE", "BİTİRME TEZİNİN TÜRKÇE BAŞLIĞI"),
    { type: "spacer", heightMm: linePt(12, 1.5) * MM_PER_PT + ABSTRACT_TITLE_GAP_MM },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    { type: "text", value: "Afyon Kocatepe Üniversitesi" },
    { type: "text", value: "Fen Edebiyat Fakültesi" },
    { type: "text", value: "Coğrafya Bölümü" },
    { type: "text", markup: "inline", value: "**Danışman:** {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    blank(2),
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS_TR}}", 37.52, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} sayfa"),
];
const abstractEn = [
  abstractHeader("abstract-en-header", "ABSTRACT", "englishAbstract", [
    { type: "text", value: "ABSTRACT", style: { ...bold, ...single } },
    blank(1, 12, 1),
    { type: "text", value: "Graduation Thesis" },
    blank(1),
    abstractTitle("THESIS_TITLE_EN", "TITLE OF GRADUATION THESIS"),
    { type: "spacer", heightMm: linePt(12, 1.5) * MM_PER_PT + ABSTRACT_TITLE_GAP_MM },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Student Name SURNAME" },
    { type: "text", value: "Afyon Kocatepe University" },
    { type: "text", value: "Faculty of Science and Arts" },
    { type: "text", value: "Department of Geography" },
    { type: "text", markup: "inline", value: "**Supervisor:** {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}" },
    blank(1),
  ]),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "**Keywords:** {{KEYWORDS_EN}}", 22.0, "{{DEFENSE_YEAR}}, {{FRONT_PAGE_COUNT}} + {{BODY_PAGE_COUNT}} pages"),
];

/**
 * Front-matter title (template: bold, centred, single-spaced, unnumbered; the TOC/list titles carry the "Sayfa" line directly below, TEŞEKKÜR and
 * ÖZET-like pages one empty 1.5 line).
 */
const frontTitle = (spaceAfterPt = 0, align = "center") => ({ "1": { align, textTransform: "none", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt, numbering: { enabled: false } } });

// Lists (template styles "table of figures"/"toc N"): "Sayfa" bold right under the title, dot leader to the right edge (tab at 8494 twips = 149.8 mm),
// list rows 12 pt regular; figures/tables list rows single-spaced with 10 pt after (style spacing after=200), TOC rows 1.5 lines, 0 pt after.
const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", indentMm: 0,
  pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "justify" },
  levelStyles: { "1": { spaceBeforePt: 0, spaceAfterPt: 10 } },
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
  // TEŞEKKÜR: bold centred title, one empty 1.5 line, unindented 1.5-spaced paragraphs separated by an empty line, then two empty lines before the
  // right-aligned name and "Afyonkarahisar <yıl>" (template paragraphs 113-121).
  { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(BLANK_PT), paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT } } },
  { id: "acknowledgements-signature", type: "acknowledgements", title: "Teşekkür imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
    overrides: { page: roman, body: { ...page15, align: "right" } },
    blocks: [blank(1), { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" }, { type: "text", value: "Afyonkarahisar {{YEAR}}" }] },
  // İÇİNDEKİLER DİZİNİ: bold centred title, "Sayfa" bold right directly below; rows 12 pt regular, 1.5 lines, 0 pt after, dot leader to the right edge,
  // indents 0 / 5 / 10 / 15 mm for the levels (styles toc 2-5: 0, 284, 567, 851 twips); the front-matter titles (Roman) are listed as well.
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", indentMm: 5, matchHeadingTransform: true,
      pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 }, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
    overrides: { page: roman, headings: frontTitle(0) } },
  // SİMGELER ve KISALTMALAR DİZİNİ: bold centred title (template), entries directly below, single-spaced, 0 pt, justified (template); definitions start at a
  // common tab stop (guide §2.10) - 25 mm is the hanging indent of the template's own hanging entries (1416 twips = 24.98 mm); the template otherwise
  // writes "Simge:  tanım" run-in with a bold symbol (CONFLICT, recorded). Optional ("varsa").
  { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER ve KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { page: roman, headings: frontTitle(0), paragraph: { firstLineIndentMm: 0, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } } },
  generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
  generatedList("list-tables", "listOfTables", "TABLOLAR DİZİNİ", "tables", "tables"),
  // 1. GİRİŞ restarts the numbering in Arabic at 1 (template section 3: pgNumType start=1); the numbered chapters follow in "Bölümler" and KAYNAKLAR
  // continues the chapter numbers ("6. KAYNAKLAR", guide §4 and the template).
  { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
    // The editor/PDF collapse the title's space-after with the first paragraph's space-before across the section wrapper (Word adds them): the title carries the
    // whole empty line so that the measured PDF gap is 20.7 pt (the Word file then has 6 pt more, engine gap noted in the report).
    overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1" },
  // EKLER ("varsa", guide §2.6/§4): the template has no appendix sample and no ÖZGEÇMİŞ/RESİMLER page (they occur only in its stale cached TOC), so only a
  // minimal optional appendices section is offered; its title typography is UNKNOWN (the unnumbered H1 style is used).
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
    overrides: { headings: { "1": { numbering: { enabled: false } } } } },
];

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
// Headings (guide §2.8; template H1 samples "1. GİRİŞ"): TNR 12 bold, left, no indent, 1.5 lines; H1 typed in capitals ("ve/veya/ile" stay lower-case) on a new
// page, H2 Title Case; H3/H4 Title Case as in the template's TOC placeholders (not prescribed by the guide, INFERRED). One empty 1.5 line between a heading
// and the text next to it (guide §2.4/§2.6, EXPLICIT; the template's own H1 has only 6/6 pt: CONFLICT) = HEADING_GAP_PT + the 6 pt paragraph spacing.
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: HEADING_GAP_PT, spaceAfterPt: HEADING_GAP_PT, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
// Captions (guide §3.3 + template samples): 11 pt, single, justified, label bold, no period after the number, continuation lines hang under the caption text.
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", labelStyle: bold, hangingIndent: "label", captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: PARA_GAP_PT },
  spacingBeforePt: 0, spacingAfterPt: PARA_GAP_PT, ...extra,
});

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "aku-cografya-lisans-tr-v1",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fef-cografya",
  instituteName: "Fen Edebiyat Fakültesi · Coğrafya Bölümü",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Coğrafya Bölümü · Bitirme Tezi",
  source: {
    type: "official",
    documentName: "AKÜ Coğrafya Bölümü Bitirme Tezi Yazım Kılavuzu (2024) — AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf; AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx",
    revisionDate: "2024-03 (kılavuz: Last-Modified 2024-03-11, kapak 'AFYONKARAHİSAR 2024'; şablon: core.xml 2024-03-31)",
    verifiedAt: "2026-10-02",
    notes: [
      "Öncelik: kılavuzun açık ve tek anlamlı cümlesi > şablon XML'i (sectPr, stiller, özel sayfaların doğrudan biçimi; kılavuzun açık bırakıp ya da belirsiz yazdığı değerler) > kılavuzun kendi sayfa geometrisi (yalnız Word satır aralığı için; kendi sayfaları 12,45 mm paragraf girintili, 6,35 mm girintili başlıklı ve 6 nk aralıklıdır, bunların çoğu kendi metnine aykırıdır). Şablondaki kırmızı not satırları ((*) ve '(Bir boşluk)' vb.) basılmaz. Tek tür (Türkçe lisans bitirme tezi); İngilizce tez veya alt tür yoktur.",
      "Dış Kapak: kılavuzda yalnız 'ciltletilmelidir' (§4.2.1); ne kılavuzda ne şablonda sayfası vardır (şablonun ilk sayfası İç Kapaktır: 14 punto koyu, iki mühür) - düzeni UNKNOWN, üretilmez. İç Kapak, Onay ve Etik sayfaları şablondan birebir (başlık, satır boşlukları, 14 pt koyu). Şablondaki '(Devam)' başlık satırı ayrı tek aralıklı bir paragraftır, kural olarak alınmadı. Onay sayfasındaki '…….. tarafından hazırlanan …' boşlukları kılavuza göre (§4.2.3) savunma sonrası adayca doldurulur: sabit metin olarak bırakıldı.",
      "Sayfa: A4 dikey, üst/alt 25 mm (1418 tw = 25,01), sağ/sol 30 mm (1701 tw) - kılavuz §2.3 ve şablon sectPr aynıdır. Üst/alt bilgi uzaklığı 12,5 mm (şablon sectPr header/footer 708-709 tw; kılavuz sessiz). Sayfa numarası altta ortada, süssüz: kılavuz Times New Roman 10 pt der; şablon altbilgisi Normal stilinden 12 pt'tir (ÇELİŞKİ, kılavuzun açık değeri 10 pt uygulandı). Kapak, Onay ve Etik bildirim numarasızdır (kılavuz §2.7); ÖZET i, ABSTRACT ii ...; 1. GİRİŞ Arapça 1 (şablon: bölüm 3 start=1). ÇELİŞKİ: şablonun 2. bölümü (Etik'ten Teşekkür/dizinlere) pgNumType lowerRoman start=2 ile başlar, yani Etik sayfası 'ii', ÖZET 'iii' basardı; şablonun kendi önbellekli içindekileri ve kılavuz ÖZET = i der: kılavuz izlendi.",
      "Gövde: Times New Roman 12 pt, iki yana yaslı, 1,5 satır (Word 20,7 pt), paragraf öncesi ve sonrası 6 nk (kılavuz §2.2 ve şablon gövde paragrafları; Word toplamlı: ardışık paragraflar arası 12 pt). Paragraf ilk satır girintisi 12,5 mm: şablonun 16 gövde paragrafından 15'i ve kılavuzun kendi paragrafları (12,45 mm) böyledir; kılavuz §2.4 'paragraf başları ... boşluk bırakılmadan' cümlesi 0 mm okunabilir (ÇELİŞKİ, onay gerekir; tek sabit PARA_INDENT_MM). Widow/orphan denetimi kılavuzda zorunlu (§2.4), şablonun Normal stilinde kapalıdır: kılavuz uygulanır.",
      "Başlıklar: 4 düzey, hepsi TNR 12 koyu, sola yaslı, girintisiz; sayılar 1. / 2.1 / 2.2.1 / 2.3.1.1 (şablon içindekiler önbelleği); 1. düzey BÜYÜK HARF ('ve/veya/ile' küçük kalır: textTransformExceptions) ve yeni sayfa, 2. düzey Baş Harfleri Büyük; 3./4. düzey kılavuzca belirtilmemiştir, şablonun örnek başlıkları ('Üçüncü Dereceden Başlık') Baş Harfleri Büyüktür: capitalize (INFERRED). Başlık öncesi/sonrası 1 satır boşluk (1,5 aralıklı) kılavuz §2.4 ve §2.6'da iki kez açıktır: başlık aralığı 14,7 pt + 6 pt paragraf aralığı = 20,7 pt (INFERRED yorum). ÇELİŞKİ: şablonun 1. düzey başlıkları yalnız 6/6 nk aralıklıdır (alt başlık örneği yok) ve kılavuzun kendi sayfaları da 6 nk kullanır; kılavuz metni izlendi.",
      "Şekil/Tablo: bölüm numaralı ('Şekil 2.1', 'Tablo 3.1', yalnız boşluk, nokta/iki nokta yok; kılavuz §3.2) - şablonun örnek başlıkları belge boyunca ardışık ve çoğunlukla noktalıdır ('Şekil 1.', 'Tablo 1') ve kendi içinde tutarsızdır (ÇELİŞKİ, kılavuz izlendi). Başlık 11 pt, tek satır, iki yana yaslı, etiket ('Şekil 2.1') koyu metin normal (şablon ve kılavuz ölçümü), sonra 6 nk; devam satırları asılı (kılavuz §3.3 metni, şablon 15-17,5 mm asılı; kılavuzun kendi örneği asılı değildir: ÇELİŞKİ). Tablo başlığı üstte, Şekil başlığı altta, ortalı yerleşim. Bölünen tablo: 'Tablo 3.1 (Devamı) …' (kılavuz §3.1). Tablo: ortalı, tüm kenarlıklar tek çizgi 0,5 pt (şablon tblBorders sz=4), hücre içi tek satır; hücre yazı boyutu kılavuzda 12 pt (en küçük 8 pt'e inilebilir, §2.2); şablon örnekleri 11 pt'tir (izinli aralıkta, 12 pt uygulandı). Tablo altı açıklama 11 pt tek satır iki yana yaslı (kılavuz §3.3); şablonun kırmızı notu '10 punto' der (ÇELİŞKİ, kılavuz izlendi, onay gerekir); 6/6 nk aralık şablondan.",
      "İçindekiler/dizinler: başlıklar 'İÇİNDEKİLER DİZİNİ', 'SİMGELER ve KISALTMALAR DİZİNİ', 'ŞEKİLLER DİZİNİ', 'TABLOLAR DİZİNİ' (şablon sayfa başlığı, kılavuz §2.6/§4.1 ve etiket 'Tablo'); kılavuz §4.2.10 ve şablonun önbellekli içindekileri 'ÇİZELGELER DİZİNİ' yazar (ÇELİŞKİ, kayıt altında). Başlıklar koyu, ortalı, tek satır; 'Sayfa' koyu sağda hemen altta (şablonda şekiller listesinde de var). Sayfa başı: kılavuz her ana başlığın yeni sayfada başlamasını ister (şablonda simgeler/şekiller aynı sayfada akar: ÇELİŞKİ, kılavuz izlendi). İçindekiler satırları 12 pt normal, 1,5 satır, 0 nk sonra, nokta kılavuzu sağ kenara (tab 8494 tw = 149,8 mm), girintiler 0/5/10/15 mm (stiller toc 2-5); şekiller/tablolar listesi satırları tek satır, 10 pt sonra (stil 'table of figures' after=200). Simgeler listesi tek satır, 0 nk, iki yana yaslı; tanımlar ortak sekmede (kılavuz §2.10; sekme 25 mm, şablonun asılı girinti değeri).",
      "ÖZET/ABSTRACT: tez başlığı büyük harf, tek aralıklı; 'Danışman:' / 'Supervisor:' etiketi koyu; İngilizce sayfada 'Graduation Thesis' (kılavuz §4.2.5); anahtar kelimeler 4-6 (etiket koyu, asılı girinti 37,52 / 22,0 mm şablon). Sıra: kılavuz metin, anahtar kelimeler, sonra 'yıl, ön sayfa + giriş sonrası sayfa (ekler dahil)' satırı; şablon son ikisini ters sıralar (ÇELİŞKİ, kılavuz izlendi). Şablonda 'ÖZET' başlığı 11 pt'tir (sz=22), kılavuz tüm metinler için 12 pt der (§2.2): 12 pt uygulandı. Özetin sözcük/sayfa sınırı UNKNOWN. Bibliyografya: 1,5 değil tek satır, 12 pt, 6 nk önce 0 nk sonra, 12,5 mm asılı girinti, iki yana yaslı, kaynaklar arası boşluk yok (kılavuz §4.3.6 ve ekran görüntüsü); şablon örnekleri 11 pt, 5 mm asılı, 0/0 nk'dır (ÇELİŞKİ, kılavuz izlendi). 'KAYNAKLAR' bir sonraki bölüm gibi numaralanır ('6. KAYNAKLAR', kılavuz §4 ve şablon); 'İnternet Kaynakları' ayrı grup olarak yazarca yazılır (motorda ayrı grup yok).",
      "UNKNOWN / üretilmeyenler: Dış Kapak düzeni; dipnot punto ve satır aralığı (kaynaklarda yok: kılavuzun genel 12 pt kuralı yazı tipi/punto için uygulandı, INFERRED); denklem numaralandırma ve stili; ÖZGEÇMİŞ ve RESİMLER DİZİNİ (yalnız şablonun eski önbellekli içindekilerinde, kılavuz §4.1 sıralamasında yok); EKLER başlık biçimi; ciltleme türü; yatay sayfa (şablonun örnek yatay şekil sayfası tek sayfalık bölümdür; motorda belge içi tek yatay sayfa yok). Fiziksel/gönderim kuralları (tek yüz, 70-100 g/m², %30 benzerlik) belge içeriği değildir.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 17.37, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 12 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, firstLineIndentMm: PARA_INDENT_MM },
    paragraph: { firstLineIndentMm: PARA_INDENT_MM, spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", textTransformExceptions: EXCEPTIONS, pageBreakBefore: true, spaceBeforePt: 0 }),
      "2": heading("{1}.{2}", { textTransform: "capitalize", textTransformExceptions: EXCEPTIONS }),
      "3": heading("{1}.{2}.{3}", { textTransform: "capitalize", textTransformExceptions: EXCEPTIONS }),
      "4": heading("{1}.{2}.{3}.{4}", { textTransform: "capitalize", textTransformExceptions: EXCEPTIONS }),
    },
    // Footnotes are not defined by the sources; the guide's general "12 punto" rule is applied to the type (INFERRED), the rest is the engine default.
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 12 },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "collapse" },
    // Table notes: below the table, 11 pt, single spaced, block (no indent), justified (guide §3.3); 6/6 nk as the template's note paragraph.
    paragraphStyles: { tableNote: { fontSizePt: 11, lineHeight: 1, align: "justify", spaceBeforePt: PARA_GAP_PT, spaceAfterPt: PARA_GAP_PT, firstLineIndentMm: 0 } },
  },
  placeholders: {
    THESIS_TITLE: { label: "Bitirme tezi başlığı (Türkçe)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of graduation thesis (English)", type: "text" },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Supervisor title (Prof. / Assoc. Prof. / Asst. Prof.)", type: "text" },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
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
    ...caption("Tablo", "above", { spacingAfterPt: 0, style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } }),
    cellStyle: { fontSizePt: 11, lineHeight: 1, align: "left" },
    continuation: { format: "{label} {number} (Devamı) {title}" },
  },
  figures: caption("Şekil", "below", { box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } }),
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 5.01 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER DİZİNİ", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export const akuCografyaLisans = { ...base, sections: sections() };
export default akuCografyaLisans;
