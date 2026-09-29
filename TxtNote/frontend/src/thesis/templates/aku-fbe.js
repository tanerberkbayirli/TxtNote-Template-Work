/**
 * Afyon Kocatepe Üniversitesi, Fen Bilimleri Enstitüsü (yüksek lisans ve doktora).
 *
 * Sources (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/): "AKÜ Fen Bilimleri Enstitüsü Tez Yazım
 * Kılavuzu" (2020) and the Word template "AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx" (a 2025 re-save of the
 * 2019/2020 template generation). Rule order: explicit guide text > template XML (what the text leaves
 * open) > the guide's example-page geometry. The reviewed spec is orchestration/specs/aku-fbe.json.
 *
 * Word line model (measured on the guide): a single line of Times New Roman is 1.15 em, the first
 * baseline of a line box sits 0.9336 em below its top and the extra leading of "1,5 satır" goes below
 * the text; paragraph spacing is additive. Special pages are laid out with spacers of whole Word lines
 * ("n satır boşluk") so the absolute baselines of the guide's example pages are reproduced.
 *
 * One shared base; the master's and doctoral variants differ only in their degree strings.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt and as an empty-line spacer in mm. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** One empty 12 pt line at 1.5 spacing: 20.7 pt (the guide's "bir satır boşluk"). */
const BLANK_PT = linePt(12, 1.5);
/** First baseline of a line sits 0.9336 em below its line box top (Word: lineGap + ascent). */
const ascentMm = (sizePt) => 0.9336 * sizePt * MM_PER_PT;

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
const grey = { color: "#bfbfbf" };
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const noNumber = { numbering: { enabled: false } };
const roman = { numbering: { format: "roman-lower" } };
const dots = "……………………";

const degreeLabels = {
  master: { cover: "YÜKSEK LİSANS TEZİ", tr: "Yüksek Lisans Tezi", en: "M.Sc. Thesis" },
  phd: { cover: "DOKTORA TEZİ", tr: "Doktora Tezi", en: "Ph.D. Thesis" },
};

// The cover page's own optional lines vanish together with their slot (whether the slot stays is not stated).
const coAdvisorLines = (children) => ({ type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: children });

/** Front-matter title (ÖZET, TEŞEKKÜR, dizinler): centered, bold, unnumbered, one empty 1.5 line (or `spaceAfterPt`) below. */
const frontTitle = (spaceAfterPt = BLANK_PT) => ({ "1": { align: "center", textTransform: "none", spaceAfterPt, numbering: { enabled: false } } });

// ---- special pages -------------------------------------------------------------------------------------

// Dış Kapak: printed onto the purchased cover; text only inside x 55-155 mm, y 210-275 mm (12 pt, centred).
// The section margins are that area: first baseline 215.53 mm = top + 0.9336 em.
const OUTER_TOP_MM = 215.53 - ascentMm(12);
const DOCX_SOURCE_MARGINS = { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 };
const outerCover = (degree) => ({
  id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static",
  // The guide's printed cover box ends at y=275 mm on an A4 page (297 - 22 mm).
  overrides: { page: { margins: { topMm: OUTER_TOP_MM, bottomMm: 22, leftMm: 55, rightMm: 55 }, docxMargins: DOCX_SOURCE_MARGINS, docxContentFrame: { xMm: 55, yMm: OUTER_TOP_MM, widthMm: 100 }, numbering: { enabled: false } }, body: { ...page15, lineHeight: 1, align: "center" } },
  blocks: [
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...bold, ...upper } },
    { type: "text", value: degree.cover, style: { spaceBeforePt: 6 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI", style: { spaceBeforePt: 6 } },
    { type: "text", value: "Danışman", style: { spaceBeforePt: 6 } },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    coAdvisorLines([
      { type: "text", value: "İkinci Danışman", style: { spaceBeforePt: 6 } },
      { type: "text", value: "{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" },
    ]),
    { type: "metadata", field: "DEPARTMENT_NAME", suffix: " ANABİLİM DALI", fallback: "ANABİLİM DALI", style: { spaceBeforePt: 6, ...upper } },
    { type: "text", value: "{{DEFENSE_MONTH}} {{DEFENSE_YEAR}}", style: { spaceBeforePt: 6 } },
  ],
});

// İç Kapak: 14 pt bold, 1.5 lines everywhere; the gaps are the guide's own empty lines.
const innerCover = (degree) => ({
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static",
  overrides: { page: { margins: { bottomMm: 30 }, numbering: { enabled: false }, trimTerminalTextLeading: true }, body: { ...page15, align: "center", fontSizePt: 14, fontWeight: 700 } },
  blocks: [
    { type: "group", visibleWhen: { anyFilled: ["PROJECT_NUMBER"] }, blocks: [
      { type: "text", value: "Bu tez çalışması {{PROJECT_NUMBER}} numaralı proje ile {{PROJECT_FUNDER}} tarafından desteklenmiştir.", style: { fontSizePt: 12, fontWeight: 400 } },
    ] },
    blank(1, 14),
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "FEN BİLİMLERİ ENSTİTÜSÜ" },
    blank(3, 14),
    { type: "text", value: degree.cover },
    blank(3, 14),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: upper },
    blank(2, 14),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    blank(2, 14),
    { type: "text", value: "Danışman" },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    coAdvisorLines([
      blank(1, 14),
      { type: "text", value: "İkinci Danışman" },
      { type: "text", value: "{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" },
    ]),
    blank(2, 14),
    { type: "metadata", field: "DEPARTMENT_NAME", suffix: " ANABİLİM DALI", fallback: "ANABİLİM DALI", style: upper },
    blank(1, 14),
    { type: "text", value: "{{DEFENSE_MONTH}} {{DEFENSE_YEAR}}" },
  ],
});

// Tez Onay Sayfası. The template sets it in a cell whose outer frame edges are x 27.32 and 178.91 mm; the page margins are that box,
// text lines carry the distance to the text edges (x 30.0 / 176.2 mm) as indents. Rows are label | ": value" columns (colon at x 67.47 mm).
const FRAME_L_MM = 27.32;
const FRAME_R_MM = 178.91;
const FRAME_W_MM = FRAME_R_MM - FRAME_L_MM;
const cellLeft = { leftIndentMm: 30 - FRAME_L_MM };
const cellRight = { rightIndentMm: FRAME_R_MM - 176.2 };
const LABEL_PERCENT = (67.47 - FRAME_L_MM) / FRAME_W_MM * 100;
const approvalRow = (label, value, labelStyle, valueStyle = {}) => ({ type: "group", direction: "row", blocks: [
  { type: "text", value: label, widthPercent: LABEL_PERCENT, style: { ...bold, ...labelStyle } },
  { type: "text", value: `: ${value}`, style: { ...cellRight, ...valueStyle } },
] });
// Juror row: name line + affiliation line (+ the grey signature hint). The template pitch is 14.29 mm (name single, affiliation 1.5, 6 pt after);
// with jurors 6-7 (doctorate, second advisor) that cannot fit above the 30 mm bottom margin, so all rows use a compact pitch
// (both lines single, 4 pt after: 11.15 mm) - a non-source layout choice.
const jurorRow = (n, compact, visibleWhen) => {
  const single = { lineHeight: 1 };
  const after = compact ? 4 : 6;
  const affil = compact ? single : {};
  return { type: "group", visibleWhen, blocks: [
    approvalRow(n === 1 ? "Başkan" : "Üye", `{{JURY_${n}_TITLE_NAME}}`, { ...single, leftIndentMm: 42.49 - FRAME_L_MM }, single),
    { type: "group", direction: "row", blocks: [
      { type: "text", value: "", widthPercent: LABEL_PERCENT, style: { ...affil, spaceAfterPt: after } },
      { type: "metadata", field: `JURY_${n}_AFFILIATION`, style: { ...affil, leftIndentMm: 69.6 - 67.47, spaceAfterPt: after } },
      { type: "text", value: "…… İmza ……", widthPercent: 30, style: { ...affil, ...grey, ...cellRight, align: "right", spaceAfterPt: after } },
    ] },
  ] };
};
const MANY_JURORS = ["JURY_6_TITLE_NAME", "JURY_7_TITLE_NAME"];
const jurors = (n) => n <= 5
  ? [jurorRow(n, false, { noneFilled: MANY_JURORS }), jurorRow(n, true, { anyFilled: MANY_JURORS })]
  : [jurorRow(n, true, { anyFilled: [`JURY_${n}_TITLE_NAME`] })];
// Outer frame: Word thickThinSmallGap (top/left) and thinThickSmallGap (bottom/right), drawn as in the guide: thin 0.75 pt outside, gap, thick 3 pt inside.
const FRAME_BORDER = { outerPt: 0.75, gapPt: 0.75, innerPt: 3, paddingMm: 0, docx: { style: "thickThinSmallGap", sizePt: 3, sides: { top: "thickThinSmallGap", left: "thickThinSmallGap", bottom: "thinThickSmallGap", right: "thinThickSmallGap" } } };
const FRAME_BORDER_MM = (0.75 + 0.75 + 3) * MM_PER_PT;
const approval = (degree) => ({
  id: "approval", type: "approval", title: "TEZ ONAY SAYFASI", status: "required", group: "front", mode: "static",
  overrides: { page: { margins: { leftMm: FRAME_L_MM, rightMm: 210 - FRAME_R_MM, bottomMm: 30 }, docxMargins: DOCX_SOURCE_MARGINS, docxContentFrame: { xMm: FRAME_L_MM, yMm: 30, widthMm: FRAME_W_MM }, numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "TEZ ONAY SAYFASI", style: { ...bold, align: "center" } },
    blank(1),
    { type: "text", markup: "inline", style: { align: "justify", ...cellLeft, ...cellRight },
      value: `{{STUDENT_NAME}} tarafından hazırlanan “{{THESIS_TITLE}}” adlı tez çalışması lisansüstü eğitim ve öğretim yönetmeliğinin ilgili maddeleri uyarınca {{DEFENSE_DATE}} tarihinde aşağıdaki jüri tarafından **{{DECISION}}** ile Afyon Kocatepe Üniversitesi Fen Bilimleri Enstitüsü **{{DEPARTMENT_NAME}} Anabilim Dalı’nda ${degree.cover}** olarak kabul edilmiştir.` },
    blank(1),
    approvalRow("Danışman", "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", cellLeft),
    { type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: [approvalRow("İkinci Danışman", "{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}", cellLeft)] },
    blank(1),
    ...[1, 2, 3, 4, 5, 6, 7].flatMap(jurors),
    // With jurors 6-7 the empty line above the frame is dropped (non-source) so that the block still ends above the bottom margin.
    { type: "group", visibleWhen: { noneFilled: MANY_JURORS }, blocks: [blank(1)] },
    // Institute approval frame, top edge at 189.0 mm with five jurors.
    { type: "group", border: FRAME_BORDER, style: { align: "center" }, blocks: [
      { type: "spacer", heightMm: 6.43 - FRAME_BORDER_MM },
      { type: "text", value: "Afyon Kocatepe Üniversitesi" },
      { type: "text", value: "Fen Bilimleri Enstitüsü Yönetim Kurulu’nun" },
      { type: "text", value: "…… / …… / ……… tarih ve" },
      { type: "text", value: "……………. sayılı kararıyla onaylanmıştır." },
      blank(2),
      { type: "text", value: "……………………………….", style: grey },
      { type: "metadata", field: "INSTITUTE_DIRECTOR", fallback: "(Ünvanı Adı ve SOYADI)" },
      { type: "text", value: "Enstitü Müdürü" },
      { type: "spacer", heightMm: 0.6 - (FRAME_BORDER_MM - 3 * MM_PER_PT) },
    ] },
  ],
});

// Bilimsel Etik Bildirim Sayfası.
const ethicsItem = (text) => ({ type: "group", direction: "row", blocks: [
  { type: "text", value: "-", widthPercent: 5 },
  { type: "text", value: text, style: { align: "justify" } },
] });
const ethics = {
  id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BİLDİRİM SAYFASI", status: "required", group: "front", mode: "static",
  overrides: { page: { margins: { bottomMm: 30 }, numbering: { enabled: false } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "BİLİMSEL ETİK BİLDİRİM SAYFASI", style: { ...bold, align: "center" } },
    { type: "text", value: "Afyon Kocatepe Üniversitesi", style: { ...bold, align: "center" } },
    blank(1),
    { type: "text", value: "Fen Bilimleri Enstitüsü, tez yazım kurallarına uygun olarak hazırladığım bu tez çalışmasında;", style: { ...bold, align: "justify", firstLineIndentMm: 12.5 } },
    ethicsItem("Tez içindeki bütün bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi,"),
    ethicsItem("Görsel, işitsel ve yazılı tüm bilgi ve sonuçları bilimsel ahlak kurallarına uygun olarak sunduğumu,"),
    ethicsItem("Başkalarının eserlerinden yararlanılması durumunda ilgili eserlere bilimsel normlara uygun olarak atıfta bulunduğumu,"),
    ethicsItem("Atıfta bulunduğum eserlerin tümünü kaynak olarak gösterdiğimi,"),
    ethicsItem("Kullanılan verilerde herhangi bir tahrifat yapmadığımı,"),
    ethicsItem("Ve bu tezin herhangi bir bölümünü bu üniversite veya başka bir üniversitede başka bir tez çalışması olarak sunmadığımı"),
    { type: "text", value: "beyan ederim.", style: bold },
    blank(1),
    { type: "metadata", field: "SIGN_DATE", fallback: "GG / AA / YYYY", style: { ...bold, align: "right" } },
    blank(1),
    { type: "text", value: "İmza", style: { ...bold, ...grey, align: "right" } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı ve SOYADI", style: { ...bold, align: "right" } },
  ],
};

// ÖZET / ABSTRACT: header block, the abstract text (editable), keywords, then the year/pages line. Header lines are 1.5
// spaced; the title lines are single spaced with the 1.5 line's extra leading after the last one.
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: id === "abstract-tr" ? { numbering: { format: "roman-lower", startAt: 1, restart: true } } : roman, body: { ...page15, align: "center" } },
  blocks: lines,
});
const abstractTitle = (field, fallback, transform = upper) => ({ type: "metadata", field, fallback, style: { ...transform, lineHeight: 1, spaceAfterPt: BLANK_PT - linePt(12, 1) } });
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0 } } });
const abstractFooter = (id, type, title, keywords, pages) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page15, align: "left" } },
  // The abstract's last paragraph already carries its empty line (paragraph spacing) before the keywords.
  blocks: [
    { type: "text", markup: "inline", value: keywords, style: { align: "justify", hangingIndentMm: pagesHang(keywords) } },
    blank(1),
    { type: "text", value: pages, style: bold },
  ],
});
const pagesHang = (keywords) => (keywords.startsWith("**Keywords") ? 25.51 : 37.52);
const abstractTr = (degree) => [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET", style: bold },
    { type: "text", value: degree.tr },
    blank(1),
    abstractTitle("THESIS_TITLE", "TEZİN TÜRKİYE TÜRKÇESİ BAŞLIĞI"),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" },
    { type: "text", value: "Afyon Kocatepe Üniversitesi" },
    { type: "text", value: "Fen Bilimleri Enstitüsü" },
    { type: "metadata", field: "DEPARTMENT_NAME", suffix: " Anabilim Dalı", fallback: `${dots} Anabilim Dalı` },
    { type: "text", markup: "inline", value: "**Danışman:** {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    coAdvisorLines([{ type: "text", markup: "inline", value: "**İkinci Danışman:** {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" }]),
    blank(1),
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS}}", "{{DEFENSE_YEAR}}, {{FRONT_PAGES_ROMAN}} + {{MAIN_PAGES}} sayfa"),
];
const abstractEn = (degree) => [
  abstractHeader("abstract-en-header", "ABSTRACT", "englishAbstract", [
    { type: "text", value: "ABSTRACT", style: bold },
    { type: "text", value: degree.en },
    blank(1),
    abstractTitle("THESIS_TITLE_EN", "TITLE OF THESIS", {}),
    blank(1),
    { type: "metadata", field: "STUDENT_NAME", fallback: "Name SURNAME" },
    { type: "text", value: "Afyon Kocatepe University" },
    { type: "text", value: "Graduate School of Natural and Applied Sciences" },
    { type: "metadata", field: "DEPARTMENT_NAME_EN", prefix: "Department of ", fallback: `Department of ${dots}` },
    { type: "text", markup: "inline", value: "**Supervisor:** {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}" },
    coAdvisorLines([{ type: "text", markup: "inline", value: "**Co-Supervisor:** {{CO_ADVISOR_TITLE_EN}} {{CO_ADVISOR_NAME}}" }]),
    blank(1),
  ]),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "**Keywords:** {{KEYWORDS_EN}}", "{{DEFENSE_YEAR}}, {{FRONT_PAGES_ROMAN}} + {{MAIN_PAGES}} pages"),
];

const listRule = (kind, title, extra = {}) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", labelStyle: bold, indentMm: 0, pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 },
  // Single spaced rows, 6 pt after each entry (the row style is the level-1 style: entries are index rows, not paragraphs).
  style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" }, levelStyles: { "1": { spaceAfterPt: 6 } }, ...extra,
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 1 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(0) },
});

function sections(degree) {
  return [
    outerCover(degree),
    innerCover(degree),
    approval(degree),
    ethics,
    ...abstractTr(degree),
    ...abstractEn(degree),
    // TEŞEKKÜR: title, one empty line, text; two empty lines before the signature (template).
    { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0 } } },
    { id: "acknowledgements-signature", type: "acknowledgements", title: "Teşekkür imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: roman, body: { ...page15, align: "right" } },
      blocks: [blank(1), { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrencinin Adı SOYADI" }, { type: "text", value: "Afyonkarahisar {{YEAR}}" }] },
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: { kind: "toc", title: "İÇİNDEKİLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 5, matchHeadingTransform: true,
        pageHeadingStyle: { ...bold, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 }, style: { lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
      overrides: { page: roman, headings: frontTitle(0) } },
    // Symbols: single spaced, definitions aligned on a tab stop (40.69 mm) and hanging under it.
    { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER ve KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(), paragraph: { firstLineIndentMm: 0, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, tabStopMm: 40.69, hangingIndentMm: 40.69 } } },
    generatedList("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
    generatedList("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables", "tables"),
    generatedList("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
    // 1. GİRİŞ restarts the numbering in Arabic at 1; the numbered chapters follow in "Bölümler".
    { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, titleNumbering: "continueH1",
      overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } } } },
    { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
    { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, titleNumbering: "continueH1",
      // The first entry's 6 pt space-before adds to the title's empty line (Word), which CSS would collapse across the section wrapper.
      overrides: { headings: { "1": { spaceAfterPt: BLANK_PT + 6 } } } },
    // ÖZGEÇMİŞ (required for both degrees) before EKLER: labels at the margin, colons 50 mm in, education rows indented 12.5 mm.
    { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: frontTitle(), paragraph: { firstLineIndentMm: 0, align: "left", spaceAfterPt: 0, tabStopMm: 12.5 } } },
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: frontTitle() } },
  ];
}

// ---- typography ----------------------------------------------------------------------------------------

const EXCEPTIONS = ["ve", "veya", "ile"];
const heading = (format, extra = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0, keepWithNext: true, textTransform: "capitalize", textTransformExceptions: EXCEPTIONS, numbering: { enabled: true, format, sequence: "arabic" }, ...extra });
const captionNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };
// Figure/Resim: the image bottom is 5.96 mm above the first caption baseline (measured); the caption's own ascent is 0.9336 em.
const FIGURE_GAP_PT = 5.96 / MM_PER_PT - 0.9336 * 11;
const caption = (label, position, extra = {}) => ({
  label, position, numbering: captionNumbering, labelFormat: "{label} {number}", labelStyle: bold, hangingIndent: "label", captionAlignment: "justify", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6 },
  spacingBeforePt: 0, spacingAfterPt: 6, ...extra,
});
const figureCaption = (label) => caption(label, "below", { spacingBeforePt: Math.round(FIGURE_GAP_PT * 100) / 100, box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } });

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "fbe",
  instituteName: "Fen Bilimleri Enstitüsü",
  language: "tr",
  status: "official",
  source: {
    type: "official",
    documentName: "AKÜ Fen Bilimleri Enstitüsü Tez Yazım Kılavuzu (2020) — AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf; AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx",
    revisionDate: "2020-01 (kılavuz, Ocak 2020'den itibaren geçerli); şablon dosyası 2025-01-23",
    verifiedAt: "2026-09-28",
    notes: [
      "Kılavuz 2020, şablon dosyası 2025: şablon, kılavuzla birlikte hazırlanan 2019/2020 şablonunun yeniden kaydıdır; daha yeni bir kural seti yoktur (flag guide-template-version-gap). Şablondaki 2019/2020 yılları ve müdür adı (Prof. Dr. Bekir YALÇIN) örnek içeriktir, basılmaz.",
      "Öncelik: kılavuzun açık cümlesi > şablon XML > kılavuzdaki örnek sayfa geometrisi. Sol/üst/sağ/alt kenar boşlukları 3 cm (kılavuzun kendi sayfalarında sağ kenar 28,9 mm; açık kural ve şablon 30 mm).",
      "ÖZET/ABSTRACT: Anahtar Kelimeler, yıl/sayfa satırından önce gelir (kılavuz metni p.18); kılavuzun örnek sayfası ve şablon ters sırayı gösterir (needsConfirmation). ÖZGEÇMİŞ, EKLER'den önce gelir (kılavuzun sıra listesi, İçindekiler örneği ve şablon; metin 'en son sayfa' der, needsConfirmation).",
      "Onay sayfası: şablon (dış kenarlar 27,32-178,91 mm, 14,29 mm jüri aralığı, müdür adı sırası) kılavuz örneğinden (154 mm, 12,91 mm) önceliklidir; jüri satırlarının taban çizgileri şablon XML'inden hesaplanmıştır (INFERRED). Jüri sayısı yüksek lisans için belirtilmemiştir: 5 satır varsayılan, 6-7. satırlar yalnızca doldurulunca (doktora, ikinci danışman) görünür. 6 veya 7 jüri üyesinde kaynak kendi içinde çelişir (şablon aralığı 30 mm alt kenar boşluğuna sığmaz): tüm jüri satırları sıkışık aralıkla (iki satır tek aralık, 4 pt sonra: 11,15 mm) yazılır ve çerçevenin üstündeki boş satır çıkarılır; blok 267 mm'nin üstünde biter (7 jüri düzeni kaynak dışı, NOT_SPECIFIED).",
      "Enstitü müdürü adı düzenlenebilir alandır; 2019 örnek içeriği yazılmaz. Gri 'İmza' ipuçları şablondaki gibi (BFBFBF) basılır; basılıp basılmayacağı kaynakta belirtilmemiştir.",
      "Dış Kapak: fiziksel 1. sayfa, numarasız ve sayılmaz; metin yalnız x 55-155 mm, y 210-275 mm alanında, üstten hizalı (ilk taban çizgisi 215,53 mm, INFERRED); kapak kartonunun kendisi ve kenarlığı üretilmez. İsteğe bağlı satırlar (proje numarası, ikinci danışman) yoksa yuvasıyla birlikte çıkar (kaynak: belirsiz).",
      "Onay sayfası çerçevesi: kılavuzdaki gibi dışta ince 0,75 pt, boşluk, içte kalın 3 pt çizgi; Word'de şablonun kenarlıkları (üst/sol thickThinSmallGap, alt/sağ thinThickSmallGap, sz 24) kenar başına yazılır. Dış kenarlar x 27,32 ve 178,91 mm.",
      "Liste dizinleri (ŞEKİLLER/ÇİZELGELER/RESİMLER): şablondaki açıklama görselinin ayarı (tek satır aralığı, 6 nk sonra, sola yaslı, etiket genişliği kadar asılı girinti); kılavuz örneği 1,5 satır aralığı gösterir (needsConfirmation). RESİMLER DİZİNİ için örnek sayfa yoktur (Şekil dizini benzetmesi).",
      "Dipnotlar: kaynak sessiz; 10 pt, tek satır, Times New Roman (kaynak dışı, NOT_SPECIFIED). Denklem yazı tipi kılavuzda Cambria Math; bu yazı tipi gömülemez, denklem numarası Times New Roman 12 pt basılır.",
      "Yatay sayfa (gerekirse, sayfa numarası dikey sayfadaki gibi altta ortada): TxtNote'ta yatay sayfa yoktur; sınırlama. A4'ten büyük şekiller katlanarak EKLER'e konur (yazar işi).",
      "Baskı: tek yüz, 70-100 g/m² beyaz kâğıt; savunma nüshası spiral, son nüshalar (en az 7) enstitü kapağıyla ciltlenir; Word'den yazdırılır, PDF'den değil (fiziksel üretim, belge içeriği değildir). Şablonun tek/çift sayfa bölüm sonları tek yüzlü baskıda boş sayfa üretmez.",
      "Sınırlamalar: şekil/resim için '(Devam)' başlığı yalnız çizelgelerde desteklenir (bölünen şekil yoktur: şekil sayfa içinde bölünmez). Denklemler için Cambria Math gereklidir; PDF ve Word çıktısındaki yazı tipini ve özel matematik simgelerini kontrol edin.",
      "Uzun tez başlıkları veya isteğe bağlı kapak/jüri bilgileri resmî kapak ve onay alanını aşabilir; çıktıyı baskıdan önce elle gözden geçirin. İç kapak tarihi ayrı sayfaya düşerse PDF'yi kontrol edin.",
      "Dikey ritim tek tabloda (blockGap.js): paragraf, başlık, şekil, çizelge, çizelge notu, liste ve denklem arasındaki boşluk hem editörde/PDF'de hem Word'de aynı tablodan gelir. Liste paragrafları, gövde paragrafları gibi, sonrasında bir boş satır (20,7 pt) bırakır. Denklem tek satırlıksa taban çizgisi önceki/sonraki bloğa 14,6 mm uzaktadır; uzun (kesir, toplam, integral) denklemler kendi satır kutusunu kullanır ve aralığı büyütür (Word'de de). Denklem sayfa başındaysa 33,95 mm'de başlar.",
      "DOCX: içindekiler ve dizin satırlarının sayfa numaraları PAGEREF alanlarıdır (önbellekteki değer editörün etiketi); Word kendi sayfalamasında alanları günceller, LibreOffice ön ekli (i, ii) etiketleri sade rakam gösterebilir. Bölünen çizelgeler için '(Devam)' başlığı DOCX'te editörün sayfa kırılımında sabit metindir (Word kendi kırılımını yapar).",
      "Kaynak dışı değerler: boşluk (widow/orphan) kılavuzda zorunlu, şablonun Normal stili kapalıdır (kılavuz uygulanır). H3/H4 Baş Harfleri Büyük biçimi örneklerden çıkarılmıştır (INFERRED).",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 10 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: BLANK_PT, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": heading("{1}.", { textTransform: "uppercase", pageBreakBefore: true }),
      "2": heading("{1}.{2}"),
      "3": heading("{1}.{2}.{3}"),
      "4": heading("{1}.{2}.{3}.{4}"),
    },
    // Word numbers footnotes continuously through the document; the guide is silent, so the sections continue.
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10, lineHeight: 1 },
    // blockGap: a paragraph/heading after a figure, table or table note keeps the paragraph baseline pitch (the guide's empty 1.5 line).
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" },
    // Table notes: below the table, 10 pt, single spaced, block (no indent), 6 pt before and after.
    paragraphStyles: { tableNote: { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 } },
  },
  placeholders: {
    UNIVERSITY_NAME: { label: "Üniversite", type: "text" },
    INSTITUTE_NAME: { label: "Enstitü", type: "text" },
    THESIS_TITLE: { label: "Tez başlığı (Türkçe)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of thesis (English)", type: "text" },
    STUDENT_NAME: { label: "Öğrencinin Adı SOYADI", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim dalı (Baş Harfleri Büyük)", type: "text", required: true },
    DEPARTMENT_NAME_EN: { label: "Department (English)", type: "text" },
    ADVISOR_TITLE: { label: "Danışman unvanı (Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi)", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Supervisor title (Prof. / Assoc. Prof. / Asst. Prof.)", type: "text" },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true },
    CO_ADVISOR_TITLE: { label: "İkinci danışman unvanı (varsa)", type: "text" },
    CO_ADVISOR_TITLE_EN: { label: "Co-supervisor title (if any)", type: "text" },
    CO_ADVISOR_NAME: { label: "İkinci danışman Adı SOYADI (varsa)", type: "text" },
    DEFENSE_MONTH: { label: "Savunma ayı (Ocak, Şubat, …)", type: "text", required: true },
    DEFENSE_YEAR: { label: "Savunma yılı", type: "number", required: true },
    DEFENSE_DATE: { label: "Savunma tarihi (GG / AA / YYYY)", type: "text", required: true },
    DECISION: { label: "Karar (oy birliği / oy çokluğu)", type: "text", required: true },
    ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].flatMap((n) => [
      [`JURY_${n}_TITLE_NAME`, { label: n === 1 ? "Jüri Başkanı (Ünvanı Adı SOYADI)" : `Jüri Üyesi ${n} (Ünvanı Adı SOYADI)`, type: "text" }],
      [`JURY_${n}_AFFILIATION`, { label: `Jüri ${n}: Üniversite adı, Fakültesi`, type: "text" }],
    ])),
    INSTITUTE_DIRECTOR: { label: "Enstitü Müdürü (Ünvanı Adı SOYADI)", type: "text" },
    SIGN_DATE: { label: "Etik bildirim tarihi (GG / AA / YYYY)", type: "text" },
    PROJECT_NUMBER: { label: "Destekleyen proje numarası (varsa)", type: "text" },
    PROJECT_FUNDER: { label: "Destekleyen kuruluş (varsa)", type: "text" },
    KEYWORDS: { label: "Anahtar Kelimeler (4-6, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (4-6)", type: "text" },
    YEAR: { label: "Yıl (Teşekkür)", type: "number", required: true },
    // "2026, xi + 44 sayfa": last roman page label and the Arabic pages from GİRİŞ to the end (ekler dahil), from the layout.
    FRONT_PAGES_ROMAN: { label: "Son romen sayfa (Özet/Abstract)", type: "text", derived: "frontLastLabel" },
    MAIN_PAGES: { label: "Giriş'ten sonraki sayfa sayısı (Özet/Abstract)", type: "number", derived: "mainPageCount" },
  },
  validation: {
    KEYWORDS: { minItems: 4, separator: ",", severity: "warning", message: "Anahtar Kelimeler 4-6 tane olmalı ve virgülle ayrılmalıdır." },
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
    style: { fontFamily: "Cambria Math", fontSizePt: 12, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: BLANK_PT },
    // One line of the equation style on the block-gap grid (blank 1.5 line before and after, guide p.9); measured placement in the editor (blockGap.js).
  },
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 12.5 }, hangingIndentMm: 0, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER DİZİNİ", levels: [1, 2, 3, 4], showPageNumbers: true },
};

const variant = (degreeType, suffix) => ({ ...base, id: `aku-fbe-${degreeType}-tr-v1`, degreeType, sections: sections(degreeLabels[degreeType]), displayName: `Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · ${suffix}` });

export const akuFbeMaster = variant("master", "Yüksek Lisans");
export const akuFbePhd = variant("phd", "Doktora");
export default akuFbeMaster;
