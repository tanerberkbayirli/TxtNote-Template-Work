/**
 * Aydın Adnan Menderes Üniversitesi Ziraat Fakültesi lisans tezi (Türkçe).
 * Rules are limited to the official guide and its cached embedded sample pages; see
 * orchestration/specs/adu-ziraat-lisans.json and adu-ziraat-lisans.CONTEXT.md.
 * The example inner-cover XML/PDF is more specific than prose where their line pitch differs.
 */
import { MM_PER_PT } from "../units.js";
const FONT = "Times New Roman";
const FONT_BLACK = "#000000";
const mmFromPt = (pt) => pt * MM_PER_PT;
const measuredGap = (baselineDeltaMm, lineSizePt) => baselineDeltaMm - mmFromPt(lineSizePt);
const romanStart = { numbering: { format: "roman-lower", startAt: 1, restart: true } };
const roman = { numbering: { format: "roman-lower", restart: false } };
const arabic = { numbering: { format: "arabic", startAt: 1, restart: true } };
const mainTitle = { "1": { fontFamily: FONT, align: "center", textTransform: "uppercase", fontSizePt: 14, fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 41.4, keepWithNext: true, pageBreakBefore: true, numbering: { enabled: true, format: "{1}.", sequence: "arabic" } } };
const headings = {
  "1": { ...mainTitle["1"], fontFamily: FONT },
  "2": { fontFamily: FONT, align: "left", fontSizePt: 12, fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 20.7, spaceAfterPt: 20.7, keepWithNext: true, numbering: { enabled: true, format: "{1}.{2}.", sequence: "arabic" } },
  "3": { fontFamily: FONT, align: "left", fontSizePt: 12, fontWeight: 700, lineHeight: 1.5, spaceBeforePt: 20.7, spaceAfterPt: 20.7, keepWithNext: true, numbering: { enabled: true, format: "{1}.{2}.{3}.", sequence: "arabic" } },
  "4": { fontFamily: FONT, align: "left", fontSizePt: 12, fontWeight: 700, lineHeight: 1.5, keepWithNext: true, numbering: { enabled: true, format: "{1}.{2}.{3}.{4}.", sequence: "arabic" } },
};
const unnumberedTitle = { "1": { fontFamily: FONT, align: "center", fontSizePt: 14, fontWeight: 700, lineHeight: 1.5, numbering: { enabled: false } } };
const index = (id, type, title, kind) => ({ id, type, title, status: "optional", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count: kind, gte: 1 }, generatedIndex: { kind, title, leader: "dots", style: { align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 } }, overrides: { page: roman, headings: unnumberedTitle } });

const measuredCoverLine = (block) => ({ ...block, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, align: "center", ...block.style } });
const coverHeader = [
  { type: "text", value: "T.C." },
  { type: "text", value: "AYDIN ADNAN MENDERES ÜNİVERSİTESİ" },
  { type: "text", value: "ZİRAAT FAKÜLTESİ" },
  { type: "metadata", field: "DEPARTMENT_NAME", fallback: "BÖLÜM ADI" },
  { type: "metadata", field: "PROGRAM_CODE", fallback: "TEZ YILI-PROGRAM KODU-TEZ NUMARASI" },
].flatMap((block, index, rows) => index === rows.length - 1 ? [measuredCoverLine(block)] : [measuredCoverLine(block), { type: "spacer", heightMm: measuredGap([7.028, 6.942, 7.028, 7.027][index], 12) }]);
const cover = (id, type, title) => ({
  id, type, title, status: "required", group: "cover", mode: "static", tocEntry: "none",
  overrides: { page: { numbering: { enabled: false } }, body: { align: "center", fontFamily: FONT, fontSizePt: 12, fontWeight: 700, lineHeight: 1, firstLineIndentMm: 0, color: FONT_BLACK } },
  blocks: [
    ...coverHeader,
    { type: "spacer", heightMm: measuredGap(98.231 - 61.602, 12) - 1.45 },
    { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { fontFamily: FONT, fontSizePt: 16, fontWeight: 700, align: "center", lineHeight: 1.15, spaceBeforePt: 0, spaceAfterPt: 0 } },
    { type: "spacer", heightMm: measuredGap(140.014 - 111.185, 16 * 1.15) - 0.535 },
    { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrenci Adı SOYADI", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 2, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: 14.32, firstLineIndentMm: 8.75 } },
    { type: "spacer", heightMm: measuredGap(149.461 - 140.014, 24) },
    { type: "text", value: "LİSANS TEZİ", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 2, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: 14.32, firstLineIndentMm: 8.75 } },
    { type: "spacer", heightMm: measuredGap(177.867 - 149.461, 24) },
    { type: "text", value: "DANIŞMAN", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 2, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: 1.465 } },
    { type: "spacer", heightMm: measuredGap(187.265 - 177.867, 24) },
    { type: "text", value: "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 2, spaceBeforePt: 0, spaceAfterPt: 0 } },
    { type: "spacer", heightMm: measuredGap(215.554 - 187.265, 24) },
    { type: "metadata", field: "FUNDING_NOTE", fallback: "", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, leftIndentMm: 0 } },
    { type: "spacer", heightMm: measuredGap(251.199 - 222.836, 12 * 1.5) },
    { type: "metadata", field: "CITY_YEAR", fallback: "AYDIN - YIL", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 } },
  ],
});

const aduZiraatLisans = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "adu-ziraat-lisans-tr-v1",
  universityId: "adu",
  universityName: "Aydın Adnan Menderes Üniversitesi",
  instituteId: "ziraat-fakultesi",
  instituteName: "Ziraat Fakültesi",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  source: { type: "official", documentName: "Aydın Adnan Menderes Üniversitesi Ziraat Fakültesi Lisans Tezi Yazım Kılavuzu", verifiedAt: "2026-10-04", notes: [
    "¶330 says five centered uppercase institution/faculty/department lines, followed by year/program/thesis number; sample ¶463-466 and official.pdf physical page 30 supply the five-line structure (¶464 wraps across university and faculty lines).",
    "¶330 prose says single line spacing for the top block; official sample embedded XML/PDF has measured line pitch about 6.94 mm for 12 pt (EXPLICIT prose vs MEASURED sample conflict). Following the user source-priority ruling, implement the official example's measured structure and retain both values in the spec.",
    "¶338 requires a 16 pt bold centered uppercase title after three blank 12 pt lines; sample ¶472 is three rendered lines. ¶344 requires 12 pt TNR double-spaced name/degree/advisor/city/year content.",
    "¶432-433 gives two ethics declaration variants, depending on whether the thesis derives from the author's publication. The appendix sample provides the non-publication declaration text (¶497, 501-509). ¶434 requires an odd-numbered page; physical recto interpretation is INFERRED.",
  ] },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 30, bottomMm: 20, leftMm: 30, rightMm: 30 },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1, restart: false },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, color: FONT_BLACK, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 10 },
    paragraph: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, color: FONT_BLACK, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 10 },
    headings,
    footnotes: { placement: "pageBottom", numbering: "document", fontFamily: FONT, fontSizePt: 10 },
  },
  placeholders: {
    UNIVERSITY_NAME: { label: "Üniversite", type: "text", required: true }, FACULTY_NAME: { label: "Fakülte", type: "text", required: true }, FUNDING_NOTE: { label: "Kaynak desteği metni", type: "text" },
    DEPARTMENT_NAME: { label: "Bölüm", type: "text", required: true }, PROGRAM_CODE: { label: "Tez yılı-program kodu-tez numarası", type: "text", required: true },
    THESIS_TITLE: { label: "Tez başlığı", type: "text", required: true }, STUDENT_NAME: { label: "Öğrenci Adı SOYADI", type: "text", required: true },
    STUDENT_NUMBER: { label: "Öğrenci numarası", type: "text" }, ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman Adı SOYADI", type: "text", required: true }, CITY_YEAR: { label: "Şehir ve yıl", type: "text", required: true },
    ABSTRACT: { label: "Özet (en az 250 sözcük)", type: "text" }, KEYWORDS: { label: "Anahtar kelimeler (en az 3)", type: "text" }, DECLARATION_DATE: { label: "Etik beyan tarihi", type: "text" }, ETHICS_DECLARATION_TEXT: { label: "Etik beyan metni (resmî varyant)", type: "text", required: true },
  },
  sections: [
    cover("outer-cover", "outerCover", "DIŞ KAPAK"),
    cover("inner-cover", "innerCover", "İÇ KAPAK"),
    { id: "preface", type: "preface", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: romanStart, paragraph: { firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" }, headings: unnumberedTitle } },
    { id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİK BEYANI", status: "required", group: "front", mode: "static", tocEntry: "title", pageBreakBefore: "oddPage", blocks: [
      { type: "text", value: "BİLİMSEL ETİK BEYANI", style: { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center" } },
      { type: "text", value: "“", style: { fontFamily: FONT, fontSizePt: 12, align: "justify" } },
      { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { fontFamily: FONT, fontSizePt: 12, align: "justify" } },
      { type: "text", value: "” başlıklı Lisans tezimdeki bütün bilgileri etik davranış ve akademik kurallar çerçevesinde elde ettiğimi, tez yazım kurallarına uygun olarak hazırlanan bu çalışmada, bana ait olmayan her türlü ifade ve bilginin kaynağına eksiksiz atıf yaptığımı bildiririm. İfade ettiklerimin aksi ortaya çıktığında ise her türlü yasal sonucu kabul ettiğimi beyan ederim.", style: { fontFamily: FONT, fontSizePt: 12, align: "justify" } },
      { type: "metadata", field: "STUDENT_NAME", fallback: "Öğrenci Adı SOYADI", style: { fontFamily: FONT, fontSizePt: 12, align: "right" } },
      { type: "metadata", field: "DECLARATION_DATE", fallback: "… / … / …", style: { fontFamily: FONT, fontSizePt: 12, align: "right" } },
    ], overrides: { page: roman, body: { fontFamily: FONT, fontSizePt: 12, color: FONT_BLACK, lineHeight: 1.5, firstLineIndentMm: 0 } } },
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title", generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", leader: "dots", style: { fontSizePt: 12, lineHeight: 1.5, align: "left" } }, overrides: { page: roman, headings: unnumberedTitle } },
    { id: "symbols", type: "listOfSymbols", title: "SİMGELER DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: roman, headings: unnumberedTitle, paragraph: { firstLineIndentMm: 0, lineHeight: 1.5 } } },
    { id: "abbreviations", type: "listOfAbbreviations", title: "KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: roman, headings: unnumberedTitle, paragraph: { firstLineIndentMm: 0, lineHeight: 1.5 } } },
    index("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures"),
    index("list-photos", "listOfFigures", "RESİMLER DİZİNİ", "photo"),
    index("list-tables", "listOfTables", "ÇİZELGELER DİZİNİ", "tables"),
    { id: "abstract-tr-header", type: "abstract", title: "ÖZET", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title", overrides: { page: roman, body: { align: "center", lineHeight: 1, firstLineIndentMm: 0 }, headings: { "1": { ...unnumberedTitle["1"], fontSizePt: 14 } } }, blocks: [
      { type: "text", value: "ÖZET", style: { fontSizePt: 14, fontWeight: 700, align: "center" } }, { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { fontSizePt: 12, align: "center", textTransform: "uppercase" } },
    ] },
    { id: "abstract-tr", type: "abstract", title: "Özet metni", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false, minWords: 250, tocEntry: "none", overrides: { page: roman, body: { align: "justify", lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 }, paragraph: { align: "justify", lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } } },
    { id: "abstract-tr-footer", type: "abstract", title: "Anahtar kelimeler", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, tocEntry: "none", overrides: { page: roman, body: { align: "left", lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } }, blocks: [{ type: "metadata", field: "KEYWORDS", prefix: "Anahtar kelimeler: ", fallback: "Anahtar kelimeler: …" }] },
    { id: "main", type: "mainContent", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title", pageBreakBefore: true, overrides: { page: arabic } },
    { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "continueH1" },
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "continueH1" },
    { id: "cv", type: "cv", title: "ÖZ GEÇMİŞ", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "none" },
  ],
  bibliography: { heading: "KAYNAKLAR", citationStyle: "apa-7" },
  tables: { label: "Çizelge", position: "above", style: { fontFamily: FONT, fontSizePt: 12, align: "center" }, numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" } },
  figures: { label: "Şekil", position: "below", style: { fontFamily: FONT, fontSizePt: 12, align: "center" }, numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" } },
  captionKinds: { photo: { label: "Resim", position: "below", style: { fontFamily: FONT, fontSizePt: 12, align: "center" }, numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" } } },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
};

export default aduZiraatLisans;
