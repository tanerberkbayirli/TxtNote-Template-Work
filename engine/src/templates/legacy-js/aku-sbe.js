/**
 * Afyon Kocatepe Üniversitesi, Sosyal Bilimler Enstitüsü (master, doctoral, Sanatta Yeterlik; Turkish and English programmes).
 *
 * Source (Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyal_Bilimler_Enstitusu_Tez/): "Lisansüstü Tez Hazırlama
 * Yazım ve Basım Kılavuzu" (AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf, 53 pages; guide text pp.2-35,
 * example pages EK 1-12 pp.36-53). The reviewed spec is engine/specs/aku-sbe.json; the policy decisions that
 * fill what the guide leaves open are engine/docs/reports/AKU_DECISIONS.md. Rule order: explicit guide text >
 * example-page structure (blank lines, case, alignment; never their 11 pt / 1.08 size or their page frame) > nothing
 * (UNKNOWN stays a documented non-source choice, see `source.notes`).
 *
 * Word line model (measured on the Word-made guide): a single Times New Roman line is 1.15 em, the first baseline of a
 * line box sits 0.9336 em below its top and the leading of "1,5 satır" goes below the text; paragraph spacing is
 * Word-additive (after(previous) + before(next)). Special pages use spacers of whole Word lines ("n satır boşluk").
 *
 * One shared base; degree and language variants reuse the same evidenced rules. Sanatta ethics wording/copies and
 * English front-page titles remain UNKNOWN and are called out as editable defaults in each variant's source notes.
 */
import { MM_PER_PT } from "../units.js";

const FONT = "Times New Roman";
const SINGLE_LINE_EM = 1.15;
/** Word line of `sizePt` type at `spacing` (n lines), in pt. */
const linePt = (sizePt, spacing) => sizePt * SINGLE_LINE_EM * spacing;
const blank = (lines = 1, sizePt = 12, spacing = 1.5) => ({ type: "spacer", heightMm: lines * linePt(sizePt, spacing) * MM_PER_PT });
/** One empty single-spaced 12 pt line: 13.8 pt (the guide's "bir satır aralığı" on single-spaced pages). */
const SINGLE_PT = Math.round(linePt(12, 1) * 100) / 100;
/** First baseline of a line sits 0.9336 em below its line box top (Word: lineGap + ascent). */
const ascentMm = (sizePt) => 0.9336 * sizePt * MM_PER_PT;

const bold = { fontWeight: 700 };
const upper = { textTransform: "uppercase" };
/** A special-page line: no indent, no paragraph spacing, 1.5 lines (§2.1 i: 12 pt, bold, 1.5 lines, centred). */
const page15 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5 };
const page1 = { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1 };
const roman = { numbering: { format: "roman-lower" } };

const degreeLabels = {
  master: { cover: "YÜKSEK LİSANS TEZİ", tanitim: "Yüksek Lisans Tezi", ethics: "Yüksek Lisans tezi" },
  phd: { cover: "DOKTORA TEZİ", tanitim: "Doktora Tezi", ethics: "Doktora tezi" },
  // Degree name is explicit; this ethics wording is a grammar-preserving substitution, not a source form.
  sanattaYeterlik: { cover: "SANATTA YETERLİK TEZİ", tanitim: "Sanatta Yeterlik Tezi", ethics: "Sanatta Yeterlik tezi" },
};

// ---- special pages -------------------------------------------------------------------------------------

// Tez Tanıtım Sayfası (EK 1): the first sheet, read through the window of the institute's outer cover. Not counted, not
// numbered. Window position/size are UNKNOWN: the block is top-anchored at the only evidence (first baseline 228.34 mm,
// EK 1) and kept within 80 mm (the widest example line) by the side margins. 12 pt (§5.2 general rule), single spacing.
const OUTER_TOP_MM = 228.34 - ascentMm(12);
const TEXT_MARGINS = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 };
const outerCover = (degree) => ({
  id: "outer-cover", type: "outerCover", title: "TEZ TANITIM SAYFASI", status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { margins: { topMm: OUTER_TOP_MM, bottomMm: 10, leftMm: 65, rightMm: 65 }, docxMargins: TEXT_MARGINS, docxContentFrame: { xMm: 65, yMm: OUTER_TOP_MM, widthMm: 80 }, numbering: { enabled: false } }, body: { ...page1, align: "center" } },
  blocks: [
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...bold, ...upper, spaceAfterPt: 6 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
    { type: "text", value: degree.tanitim },
    { type: "text", value: "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    { type: "text", value: "{{DEFENSE_MONTH}}, {{DEFENSE_YEAR}}" },
    { type: "text", value: "Afyonkarahisar" },
  ],
});

// Başlık Sayfası (İç Kapak), §2.1 + EK 2a/2b: 12 pt bold caps 1.5-line header block, 16 pt title, "Hazırlayan", jury rows
// (role | name), city + year, optional funding statement. Blank-line counts 2 / 3 / 3 / 3 are those of the official Word forms
// (AKU_Sosyal_Bilimler_Ic_Kapak_*_2026.docx: empty paragraphs after the header, after the title, after the name, after the jury).
// EK 2a shows 4 / 3 / 4 / 3 (typeset at 11 pt, 1.08 lines); with the guide's 12 pt / 16 pt at 1.5 lines that overflows the page for a
// 4-line title, so the official forms' counts are used (CONFLICT recorded in source.notes).
const juryRow = (label, valueBlock, visibleWhen) => ({ type: "group", direction: "row", ...(visibleWhen ? { visibleWhen } : {}), blocks: [
  { type: "text", value: label, widthPercent: 30 },
  valueBlock,
] });
// A jury of five or more rows (two advisors, or four and more members) takes one blank line less before "Jüri Üyeleri" and before the city
// line: the official 5-member Word form has 2 / 3 / 2 / 2 blank paragraphs where the 3-member form has 2 / 3 / 3 / 3 (and EK 2b is tighter than EK 2a).
const TIGHT_JURY = ["CO_ADVISOR_NAME", "JURY_4_TITLE_NAME", "JURY_5_TITLE_NAME", "JURY_6_TITLE_NAME"];
const looseBlank = { type: "group", visibleWhen: { noneFilled: TIGHT_JURY }, blocks: [blank(1)] };
const member = (n) => juryRow("Üye", { type: "metadata", field: `JURY_${n}_TITLE_NAME`, fallback: "Unvan Ad SOYAD" }, n > 2 ? { anyFilled: [`JURY_${n}_TITLE_NAME`] } : undefined);
const innerCover = (degree) => ({
  id: "inner-cover", type: "innerCover", title: "BAŞLIK SAYFASI", status: "required", group: "cover", mode: "static", tocEntry: "none",
  // The inner cover is page "i" (counted, no number printed); the outer sheet before it is not counted.
  overrides: { page: { numbering: { enabled: false, format: "roman-lower", startAt: 1, restart: true }, trimTerminalTextLeading: true }, body: { ...page15, align: "center", fontWeight: 700 } },
  blocks: [
    { type: "text", value: "T.C." },
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "SOSYAL BİLİMLER ENSTİTÜSÜ" },
    { type: "text", value: "{{DEPARTMENT_NAME}} {{DEPARTMENT_KIND}}", style: upper },
    { type: "metadata", field: "PROGRAM_NAME", visibleWhen: { anyFilled: ["PROGRAM_NAME"] }, style: upper },
    { type: "text", value: degree.cover },
    blank(2),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...upper, fontSizePt: 16 } },
    blank(3),
    { type: "text", value: "Hazırlayan" },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
    blank(2),
    looseBlank,
    { type: "text", value: "Jüri Üyeleri" },
    juryRow("Danışman", { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}" }),
    juryRow("İkinci Danışman", { type: "text", value: "{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" }, { anyFilled: ["CO_ADVISOR_NAME"] }),
    ...[1, 2, 3, 4, 5, 6].map(member),
    blank(2),
    looseBlank,
    { type: "text", value: "AFYONKARAHİSAR {{YEAR}}", style: upper },
    { type: "group", visibleWhen: { anyFilled: ["PROJECT_FUNDER"] }, blocks: [
      { type: "text", value: "Bu tez çalışması; {{PROJECT_FUNDER}} tarafından desteklenmiştir. Proje No: {{PROJECT_NUMBER}}", style: { fontWeight: 400 } },
    ] },
  ],
});

// ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI (EK 3, ii): 12 pt, 1.5 lines, justified, 12.5 mm first-line indent; the
// date / İmza / name block sits in the right column on one centre axis (the official Word form indents it 6371 twips).
const ethics = (degree) => ({
  id: "ethics", type: "ethicsDeclaration", title: "ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: { numbering: { enabled: true, format: "roman-lower" } }, body: { ...page15, align: "left" } },
  blocks: [
    { type: "text", value: "ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI", style: { ...bold, align: "center" } },
    { type: "text", markup: "inline", style: { align: "justify", firstLineIndentMm: 12.5, spaceBeforePt: 6, spaceAfterPt: 6 },
      value: `${degree.ethics} olarak sunduğum “**{{THESIS_TITLE}}**” adlı çalışmanın tüm hazırlanma süreçlerinde bilimsel etik kurallara ve atıf gösterme ilkelerine riayet ettiğimi belirterek aksi bir durumun tespiti hâlinde sorumluluğun tamamen bana ait olduğunu kabul, beyan ve taahhüt ederim.` },
    { type: "group", style: { leftIndentMm: 112.4, align: "center" }, blocks: [
      { type: "metadata", field: "SIGN_DATE", fallback: "GG/AA/YYYY", style: { spaceBeforePt: 6 } },
      { type: "text", value: "İmza" },
      { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
    ] },
  ],
});

// ENSTİTÜ ONAYI (EK 4, iii): the official form is e-signed and downloaded from the institute's site (§2.3, EK 4 Not 1),
// so a counted placeholder page reserves "iii"; the form itself is not reproduced.
const approval = {
  id: "approval", type: "approval", title: "ENSTİTÜ ONAYI", status: "required", group: "front", mode: "static", tocEntry: "title",
  overrides: { page: { numbering: { enabled: true, format: "roman-lower" } }, body: { ...page15, align: "center" } },
  blocks: [
    { type: "text", value: "ENSTİTÜ ONAYI", style: bold },
    { type: "text", value: "Bu sayfa web sayfamızdan indirilebilir. Süreçleri tamamlanan tezin, bu kılavuzda belirtilen yerine bu sayfa eklenecektir.", style: { align: "justify", lineHeight: 1, spaceBeforePt: 6 } },
  ],
};

// ÖZET / ABSTRACT (EK 5 / EK 6): bold centred header block, then the abstract text (single spaced, justified, no indent),
// then "Anahtar Kelimeler:" with the continuation lines hanging at the end of the bold label. The 6 pt gaps between the
// header groups are the examples' (line pitch + 6 pt); the last header line has none, the text paragraph brings 6 pt before.
const after6 = { spaceAfterPt: 6 };
const abstractHeader = (id, title, type, lines) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: id === "abstract-tr" ? { numbering: { enabled: true, format: "roman-lower" } } : roman, body: { ...page1, align: "center", fontWeight: 700 } },
  blocks: lines,
});
const abstractText = (id, type, title) => ({ id, type, title, status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false,
  overrides: { page: roman, paragraph: { firstLineIndentMm: 0, lineHeight: 1, align: "justify" } } });
const abstractFooter = (id, type, title, keywords, hangMm) => ({
  id, type, title, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
  overrides: { page: roman, body: { ...page1, align: "justify" } },
  blocks: [{ type: "text", markup: "inline", value: keywords, style: { hangingIndentMm: hangMm } }],
});
// Hanging indent = width of the bold label at 12 pt Times New Roman ("Anahtar Kelimeler:" 35.62 mm, "Keywords:" 19.75 mm; font metrics).
const KEYWORDS_TR_HANG_MM = 35.62;
const KEYWORDS_EN_HANG_MM = 19.75;
const abstractTr = [
  abstractHeader("abstract-tr", "ÖZET", "abstract", [
    { type: "text", value: "ÖZET" },
    blank(1, 12, 1),
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...upper, ...after6 } },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD", style: after6 },
    { type: "text", value: "AFYON KOCATEPE ÜNİVERSİTESİ" },
    { type: "text", value: "SOSYAL BİLİMLER ENSTİTÜSÜ" },
    { type: "text", value: "{{DEPARTMENT_NAME}} {{DEPARTMENT_KIND}}", style: { ...upper, ...after6 } },
    { type: "text", value: "{{DEFENSE_MONTH}}, {{DEFENSE_YEAR}}", style: after6 },
    { type: "text", value: "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}" },
    { type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: [{ type: "text", value: "İkinci Danışman: {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}" }] },
  ]),
  abstractText("abstract", "abstract", "Özet metni"),
  abstractFooter("abstract-footer", "abstract", "Özet anahtar kelimeler", "**Anahtar Kelimeler:** {{KEYWORDS}}", KEYWORDS_TR_HANG_MM),
];
const abstractEn = [
  abstractHeader("abstract-en-header", "ABSTRACT", "englishAbstract", [
    { type: "text", value: "ABSTRACT" },
    blank(1, 12, 1),
    { type: "metadata", field: "THESIS_TITLE_EN", fallback: "TITLE OF THESIS", style: after6 },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Name SURNAME", style: after6 },
    { type: "text", value: "AFYON KOCATEPE UNIVERSITY" },
    { type: "text", value: "INSTITUTE OF SOCIAL SCIENCES" },
    { type: "metadata", field: "DEPARTMENT_NAME_EN", prefix: "DEPARTMENT OF ", fallback: "DEPARTMENT OF …", style: after6 },
    { type: "text", value: "{{DEFENSE_MONTH_EN}}, {{DEFENSE_YEAR}}", style: after6 },
    { type: "text", value: "Advisor: {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}" },
    { type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: [{ type: "text", value: "Second Advisor: {{CO_ADVISOR_TITLE_EN}} {{CO_ADVISOR_NAME}}" }] },
  ]),
  abstractText("abstract-en", "englishAbstract", "Abstract text"),
  abstractFooter("abstract-en-footer", "englishAbstract", "Abstract keywords", "**Keywords:** {{KEYWORDS_EN}}", KEYWORDS_EN_HANG_MM),
];

/** Front-matter title: bold centred (H1 style), single spaced, unnumbered; 6 pt before and `after` pt after. */
const frontTitle = (after = 6, before = 6) => ({ "1": { align: "center", textTransform: "none", lineHeight: 1, spaceBeforePt: before, spaceAfterPt: after, numbering: { enabled: false } } });
/** Titles of the main and back parts (GİRİŞ, TARTIŞMA…, KAYNAKÇA, EKLER): uppercase bold centred, single (EXPLICIT),
 *  one blank single line after the title (EXPLICIT §4.1 "bir satır boşluk"; the official sample measures 27.6 pt
 *  title→first entry = one blank 13.8 pt line), 12 pt before (INFERRED). */
const mainTitle = { "1": { align: "center", textTransform: "none", lineHeight: 1, spaceBeforePt: 12, spaceAfterPt: SINGLE_PT, numbering: { enabled: false } } };

// Row style of the lists (TABLOLAR / ŞEKİLLER / RESİMLER LİSTESİ): the TOC rules; entries single, 0/0 pt, bold label, wrapped lines hang under the title.
const listRule = (kind, title) => ({
  kind, title, leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", labelStyle: bold, indentMm: 0,
  pageHeadingStyle: { ...bold, decoration: "underline", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 },
  style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
});
const generatedList = (id, type, title, kind, count) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count, gte: 3 },
  generatedIndex: listRule(kind, title),
  overrides: { page: roman, headings: frontTitle(6) },
});

const extendedTurkishSummary = {
  id: "extended-turkish-summary", type: "custom", title: "GENİŞLETİLMİŞ TÜRKÇE ÖZET", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
  overrides: { headings: mainTitle, paragraph: { lineHeight: 1, firstLineIndentMm: 12.5, align: "justify" } },
};

function sections(degree, language = "tr") {
  const abstracts = language === "en" ? [...abstractEn, ...abstractTr] : [...abstractTr, ...abstractEn];
  return [
    outerCover(degree),
    innerCover(degree),
    ethics(degree),
    approval,
    ...abstracts,
    // ÖN SÖZ: single spaced text (§2.5), signature one line below, ending at the right edge.
    { id: "preface", type: "preface", title: "ÖN SÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(6), paragraph: { lineHeight: 1, firstLineIndentMm: 12.5 } } },
    { id: "preface-signature", type: "preface", title: "Ön söz imza", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false,
      overrides: { page: roman, body: { ...page1, align: "right" } },
      blocks: [blank(1, 12, 1), { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" }, { type: "text", value: "{{YEAR}}, Afyonkarahisar" }] },
    // İÇİNDEKİLER: "Sayfa" two single lines below the title (explicit text), rows single 0/0, dots to the right edge.
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
      generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 0, matchHeadingTransform: true,
        pageHeadingStyle: { ...bold, decoration: "underline", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 },
        style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" },
        // One empty single line (13.8 pt) between the last chapter row and TARTIŞMA, SONUÇ VE ÖNERİLER (§2.6 vii, EK 8).
        unnumberedAfterNumberedSpaceBeforePt: SINGLE_PT,
        levelStyles: {
          // chapter rows: "BİRİNCİ BÖLÜM" + title, bold, centred, 12/12 pt, no page number (§2.6 iii)
          "1": { fontWeight: 700, align: "center", includePageNumber: false, spaceBeforePt: 12, spaceAfterPt: 12 },
          "2": { fontWeight: 700 }, "3": { fontWeight: 400 }, "4": { fontWeight: 700 }, "5": { fontWeight: 400 },
          // titles of front, main and back parts: bold, from the left edge, with page number
          unnumbered: { fontWeight: 700, align: "left", includePageNumber: true, spaceBeforePt: 0, spaceAfterPt: 0 },
        } },
      overrides: { page: roman, headings: frontTitle(SINGLE_PT) } },
    generatedList("list-tables", "listOfTables", "TABLOLAR LİSTESİ", "tables", "tables"),
    generatedList("list-figures", "listOfFigures", "ŞEKİLLER LİSTESİ", "figures", "figures"),
    generatedList("list-photos", "custom", "RESİMLER LİSTESİ", "photo", "photo"),
    // SİMGELER VE KISALTMALAR DİZİNİ: alphabetical, single, 6/6 pt, 12.5 mm first-line indent (EK 10 + §5.2).
    { id: "symbols", type: "listOfAbbreviations", title: "SİMGELER VE KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: roman, headings: frontTitle(6), paragraph: { lineHeight: 1, firstLineIndentMm: 12.5, align: "left" } } },
    // GİRİŞ restarts the numbering in Arabic at 1 (§5.3).
    { id: "introduction", type: "introduction", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { page: { numbering: { format: "arabic", startAt: 1, restart: true } }, headings: mainTitle } },
    { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable" },
    { id: "conclusion", type: "conclusion", title: "TARTIŞMA, SONUÇ VE ÖNERİLER", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: mainTitle } },
    // KAYNAKÇA: no chapter number (§4.1), entries start one line below the title.
    { id: "bibliography", type: "bibliography", title: "KAYNAKÇA", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: mainTitle } },
    // EKLER DİZİNİ (§4.2): source-marked appendix title paragraphs become linked page-number rows.
    { id: "appendix-index", type: "custom", title: "EKLER DİZİNİ", status: "required", group: "back", mode: "generated", tocEntry: "title", visibleWhen: { count: "appendices", gte: 3 },
      generatedIndex: { kind: "appendices", title: "EKLER DİZİNİ", leader: "dots", leaderFlow: "inline", pageHeading: "Sayfa", hanging: "label", indentMm: 0,
        pageHeadingStyle: { ...bold, decoration: "underline", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 },
        style: { lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "left" } },
      overrides: { headings: mainTitle } },
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title",
      overrides: { headings: mainTitle, paragraph: { align: "center", firstLineIndentMm: 0 } } },
    ...(language === "en" ? [extendedTurkishSummary] : []),
  ];
}

// ---- typography ----------------------------------------------------------------------------------------

// Chapter heading (§5.5.1): "BİRİNCİ BÖLÜM" on its own line above the title, both bold uppercase centred, 12/12 pt, 1.5 lines, new page.
const chapterHeading = {
  fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1.5, spaceBeforePt: 12, spaceAfterPt: 12, firstLineIndentMm: 0,
  keepWithNext: true, textTransform: "uppercase", pageBreakBefore: true,
  numbering: { enabled: true, format: "{1} BÖLÜM", sequence: "ordinal-tr-upper", placement: "ownLine" },
};
// Sub-headings (§2.6 iv, §5.5.2): left, no indent, single spaced, 6/6 pt (level 5 INFERRED); numbers restart per chapter and omit the chapter.
const subHeading = (format, extra) => ({
  fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0, hangingIndentMm: 7.5, keepWithNext: true,
  numbering: { enabled: true, format, sequence: "arabic" }, ...extra,
});
// Captions (§6.5.3): above table, figure and picture, 11 pt, centred, single, 0/0 pt; bold "Tablo 1." and regular title; numbered through the whole thesis.
const captionNumbering = { scope: "document", format: "{n}", sequence: "arabic" };
const caption = (label, extra = {}) => ({
  label, position: "above", numbering: captionNumbering, labelFormat: "{label} {number}.", labelStyle: bold, captionAlignment: "center", align: "center",
  style: { fontFamily: FONT, fontSizePt: 11, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 }, spacingBeforePt: 0, spacingAfterPt: 0, ...extra,
});

const base = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  universityId: "aku",
  universityName: "Afyon Kocatepe Üniversitesi",
  instituteId: "sbe",
  instituteName: "Sosyal Bilimler Enstitüsü",
  language: "tr",
  status: "official",
  source: {
    type: "official",
    documentName: "AKÜ Sosyal Bilimler Enstitüsü Lisansüstü Tez Hazırlama Yazım ve Basım Kılavuzu (2026) — AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf",
    revisionDate: "2026-02 (dosya Last-Modified 2026-02-06; kılavuz kapağı: AFYONKARAHİSAR 2023)",
    verifiedAt: "2026-10-02",
    notes: [
      "Tek biçim kaynağı kılavuzdur. Öncelik: kılavuzun açık cümlesi > örnek sayfaların yapısı (boş satır sayısı, büyük/küçük harf, hizalama) > kaynak dışı seçim. Örnek sayfalar 11 punto, ~1,08 satır aralığı ve kılavuzun kendi sayfa çerçevesinde (sol 25 mm) dizilmiştir; boyut ve konum için kullanılmaz (açık kural 12 punto, 1,5 satır, 25/25/30/30 mm).",
      "Kaynak dışı uygulama seçimleri (NOT_SPECIFIED, doğrulama PASS/FAIL vermez): sayfa numarasının alt kenara uzaklığı 12,5 mm (kılavuz yalnız 'alt orta' der); H5 başlığı 6/6 nk (H2-H4'ten INFERRED); GİRİŞ/TARTIŞMA/KAYNAKÇA/EKLER başlıkları tek satır (açık, §2.6 Not) ve 12/12 nk (INFERRED); ön söz, simgeler ve liste başlıkları 6/6 nk (listeler için açık, diğerleri INFERRED); şekil/resim başlığı boşlukları 0/0 (tablo başlığı için açık); 'Kaynak:' ve blok alıntı paragraf stilleri 6/6 nk (genel paragraf kuralı) ve 11/10 punto; dipnot ayırıcı çizgisi 40 mm (kılavuz 'yaklaşık 4 cm').",
      "Paragraf aralığı Word toplamlıdır: önce 6 + sonra 6 nk = ardışık paragraflar arasında 12 nk (kılavuz §5.2 'Word for Windows'; resmî Word iç kapak şablonunun docDefaults değeri de 120/120 twip, 1,5 satır; kılavuzun kendi sayfalarında aralık 6 nk görünür, bkz. çelişki kaydı).",
      "Dış kapaktaki Tez Tanıtım Sayfası ilk fiziksel sayfadır, sayılmaz ve numarası yoktur; iç kapak 'i' (sayılır, numarası basılmaz), etik beyan 'ii', Enstitü Onayı 'iii'. Tanıtım sayfası: ilk taban çizgisi 228,34 mm (yalnız EK 1'den), 12 punto tek satır, pencere ölçüsü UNKNOWN (yan boşluklar 65 mm = en geniş örnek satırı ~80 mm), pencere konumu doğrulanamaz.",
      "Enstitü Onayı: resmî form web sitesinden alınan elektronik imzalı sayfadır (§2.3, EK 4 Not 1); sayılan yer tutucu sayfa 'iii' olarak ayrılır, form çoğaltılmaz.",
      "İç kapak: program satırı yalnız PROGRAM_NAME doldurulursa, yazar girdiği gibi basılır (ifade UNKNOWN; ek yazı eklenmez). Anabilim dalı satırında 'Anabilim Dalı' yerine 'Anasanat Dalı' DEPARTMENT_KIND ile seçilir. Jüri satırları (rol | ad) EK 2a/2b'den; sütun genişlikleri INFERRED; doktora jüri sayısı UNKNOWN (Üye satırları doldurulunca görünür, en çok 6). İç kapak boş satır sayıları resmî Word iç kapak şablonlarındandır (TEMPLATE): 3 üyeli formda 2/3/3/3, 5 üyeli formda 2/3/2/2 (jüri 5 satıra çıkınca, yani ikinci danışman veya 4 ve üzeri üye varsa, iki boşluk birer azalır); EK 2a'dan çıkarılan 4/3/4/3 (INFERRED, 11 punto/1,08 satırlı sayfada) 12/16 punto 1,5 satırla 4 satırlı başlıkta sayfayı aşar: ÇELİŞKİ KAYDI. 7 satırlı jüri + 4 satırlı başlık + iki satırlık destek metni tek sayfaya sığar (doğrulandı); daha uzunu sığmayabilir. Resmî Word iç kapak şablonları (…Ic_Kapak_*_2026.docx) 25 mm kenar boşluğu ve 14 punto yazı gösterir; kılavuzun açık metniyle (başlık 16, diğerleri 12 punto, 25/25/30/30) çelişir ve spec'te analiz edilmemiştir: ÇELİŞKİ KAYDI, insan kararı gerekir.",
      "Bölüm başlığı 'BİRİNCİ BÖLÜM' ayrı satırda, başlık altında (§5.5.1); alt başlıklar bölüm numarasını içermez ve her bölümde 1.'den başlar (ondalık sistem noktalı: 1. / 1.1. / 1.1.1. / 1.1.1.1.). İçindekiler: bölüm satırları ortalı ve sayfa numarasız (12/12), önsöz/giriş/kaynakça gibi başlık satırları kalın ve soldan; ana bölümlerden sonra 'bir satır boşluk' (§2.6 vii) TARTIŞMA satırından önce 13,8 nk olarak uygulanır.",
      "Tablo/şekil/resim numaraları tüm tez boyunca ardışık, bölüm numarasız ('Tablo 1.'); başlık üstte; yalnız etiket kalın; '(Devam)' tablo devamında. Tablo çizgileri kılavuz örneğinde tam ızgaradır (MEASURED, kaynak p.31); motorun varsayılan tablo çizgisi kullanılır. 'Kaynak:' satırı ve blok alıntı paragraf biçimi olarak sunulur (Paragraf biçimi menüsü: sourceLine, blockQuote).",
      "Listeler (Tablolar/Şekiller/Resimler Listesi) yalnız 3 veya daha fazla öğe varsa üretilir; başlık 6/6 nk, 'Sayfa' hemen altında (içindekilerdeki iki satır aralığı yalnız İÇİNDEKİLER için uygulanır; listeler için örnek sayfa 6 nk gösterir). Ekler Dizini motorda üretilmez: yazar tarafından yazılan isteğe bağlı bölümdür (sınırlama).",
      "Özet/Abstract: tek satır, iki yana yaslı, ilk satır girintisi YOK (EK 5, §2.4 normatif); Anahtar Kelimeler etiketi kalın, devam satırları etiketin sonuna asılı (etiket genişliği 12 punto Times New Roman kalın metriği); anahtar kelime sayısı en çok 5 (motor doğrulaması yok). Özetin bir sayfayı aşmaması yazar sorumluluğudur. Genişletilmiş Türkçe Özet TR sürümlerde yoktur.",
      "Dipnotlar: Times New Roman 9 punto, tek satır, girintisiz, tez boyunca ardışık numara. Ön bölüm tek yüzlü, GİRİŞ'ten itibaren çift yüzlü baskı ve son boş yaprak fiziksel üretim talimatıdır, belge içeriği değildir. Yatay sayfa desteklenmez. Sanatta Yeterlik ve yabancı dilli (İngilizce) sürümler kaynak eksikliğiyle kaydedilmemiştir.",
      "Denklem numaralandırması kaynakta yoktur (UNKNOWN): motor varsayılanı kullanılır. Birimler SI zorunluluğu (yazar içeriği) sayfa biçiminden doğrulanamaz.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 },
    header: { heightMm: 0, distanceMm: 12.5, content: "", firstPage: "same" },
    footer: { heightMm: 8, distanceMm: 12.5, content: "", firstPage: "same" },
    // Kocatürk, July 2026, institutional thesis copy pp.3/10/20/30/50:
    // 12 pt Times New Roman; number baseline 283.549 mm from the page top.
    // Example-based application decision, not an added guide requirement.
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false, baselineFromTopMm: 283.549, style: { fontFamily: FONT, fontSizePt: 12 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, color: "#000000", align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 12.5 },
    paragraph: { firstLineIndentMm: 12.5, spaceBeforePt: 6, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": chapterHeading,
      "2": subHeading("{2}.", { textTransform: "uppercase" }),
      "3": subHeading("{2}.{3}.", { fontWeight: 400, textTransform: "uppercase" }),
      "4": subHeading("{2}.{3}.{4}."),
      "5": subHeading("{2}.{3}.{4}.{5}.", { fontWeight: 400 }),
    },
    // §6.4: Times New Roman 9 pt, single, no indent, continuous numbering; separator ~4 cm from the left text edge (40 / 150 mm).
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 9, lineHeight: 1, firstLineIndentMm: 0, align: "left", separator: { widthPercent: 26.67 } },
    lineSpacing: { mode: "word", singleLineEm: SINGLE_LINE_EM, baseline: "word", paragraphSpacing: "additive" },
    paragraphStyles: {
      // "Kaynak:" line under a table/figure/picture: centred, 10 or 11 pt (11 chosen), bold label typed inline.
      sourceLine: { fontSizePt: 11, align: "center", lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 },
      // Block quotation, author-date system (§6.3.1 xiv): 10 pt, single, 2 cm in from both sides.
      blockQuote: { fontSizePt: 10, align: "justify", lineHeight: 1, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0, leftIndentMm: 20, rightIndentMm: 20 },
    },
  },
  placeholders: {
    THESIS_TITLE: { label: "Tez başlığı (Türkçe)", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Title of thesis (İngilizce, büyük harflerle)", type: "text" },
    STUDENT_NAME: { label: "Hazırlayan: Ad SOYAD", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim/Anasanat dalı adı", type: "text", required: true },
    DEPARTMENT_KIND: { label: "Anabilim Dalı / Anasanat Dalı", type: "text", defaultValue: "Anabilim Dalı" },
    DEPARTMENT_NAME_EN: { label: "Department (İngilizce, büyük harflerle)", type: "text" },
    PROGRAM_NAME: { label: "Program adı (iç kapakta aynen basılır; yoksa boş bırakın)", type: "text" },
    ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Ad SOYAD", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Advisor title (Prof. Dr. / Assoc. Prof. Dr. …)", type: "text" },
    CO_ADVISOR_TITLE: { label: "İkinci danışman unvanı (varsa)", type: "text" },
    CO_ADVISOR_NAME: { label: "İkinci danışman Ad SOYAD (varsa)", type: "text" },
    CO_ADVISOR_TITLE_EN: { label: "Second advisor title (if any)", type: "text" },
    ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`JURY_${n}_TITLE_NAME`, { label: `Jüri üyesi ${n} (Unvan Ad SOYAD)`, type: "text" }])),
    DEFENSE_MONTH: { label: "Tez kabul ayı (Ekim)", type: "text", required: true },
    DEFENSE_MONTH_EN: { label: "Acceptance month (October)", type: "text" },
    DEFENSE_YEAR: { label: "Tez kabul yılı", type: "number", required: true },
    YEAR: { label: "İç kapak ve ön söz yılı", type: "number", required: true },
    KEYWORDS: { label: "Anahtar Kelimeler (en çok 5, virgülle)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (at most 5)", type: "text" },
    SIGN_DATE: { label: "Etik beyan tarihi (GG/AA/YYYY)", type: "text" },
    PROJECT_FUNDER: { label: "Destekleyen kurum (varsa; örn. Afyon Kocatepe Üniversitesi Bilimsel Araştırma Projeleri Koordinasyon Birimi (BAPK))", type: "text" },
    PROJECT_NUMBER: { label: "Proje numarası (varsa)", type: "text" },
  },
  tables: { ...caption("Tablo", { cellStyle: { fontSizePt: 11, lineHeight: 1, align: "left" }, continuation: { format: "{label} {number}. (Devam) {title}" } }) },
  figures: caption("Şekil", { box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } }),
  captionKinds: { photo: caption("Resim", { box: { align: "center", spaceBeforePt: 0, spaceAfterPt: 0 } }) },
  // §4.1: single, 0/0 pt, entries hang 0.5 cm (measured 5.29 mm on p.34), no numbering; left aligned as in the example (ragged right).
  bibliography: { heading: "KAYNAKÇA", style: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, hangingIndentMm: 5 }, hangingIndentMm: 0, citationStyle: "author-date" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4, 5], showPageNumbers: true },
};

const variant = (degreeType, suffix, language = "tr") => ({
  ...base,
  id: `aku-sbe-${degreeType === "sanattaYeterlik" ? "sanatta-yeterlik" : degreeType}-${language}-v1`,
  degreeType: degreeType === "sanattaYeterlik" ? "sanatta-yeterlik" : degreeType,
  language,
  sections: sections(degreeLabels[degreeType], language),
  displayName: `Afyon Kocatepe Üniversitesi · Sosyal Bilimler Enstitüsü · ${suffix}`,
  source: {
    ...base.source,
    notes: [
      ...base.source.notes,
      ...(degreeType === "sanattaYeterlik" ? ["Sanatta Yeterlik degree line and approval checkbox are explicit (guide §2.1 i/EK 4; 2024 approval form). The ethics form covers Yüksek Lisans/Doktora only; 'Sanatta Yeterlik tezi' is an editable grammatical substitution inferred from the official degree name, not official form wording. Copies remain UNKNOWN."] : []),
      ...(language === "en" ? ["Foreign-language programmes use the thesis-language abstract first, then Turkish ÖZET, and require GENİŞLETİLMİŞ TÜRKÇE ÖZET after appendices. English front-page titles are UNKNOWN; existing Turkish labels are user-editable defaults and are not source-compliance claims."] : []),
    ],
  },
});

export const akuSbeMaster = variant("master", "Yüksek Lisans");
export const akuSbePhd = variant("phd", "Doktora");
export const akuSbeSanattaYeterlik = variant("sanattaYeterlik", "Sanatta Yeterlik");
export const akuSbeMasterEn = variant("master", "Master · English programme", "en");
export const akuSbePhdEn = variant("phd", "Doctorate · English programme", "en");
export default akuSbeMaster;
