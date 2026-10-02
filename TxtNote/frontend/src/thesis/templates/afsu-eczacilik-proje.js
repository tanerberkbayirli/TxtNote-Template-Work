import { afsuEczacilikUniversitySeal as universitySeal, afsuEczacilikFacultySeal as facultySeal } from "./assets/afsuEczacilikLogos.js";

/**
 * Afyonkarahisar Sağlık Bilimleri Üniversitesi, Eczacılık Fakültesi,
 * undergraduate research-project report (Turkish).
 *
 * Source: AFSU_Eczacilik_Arastirma_Projesi_Dersleri_Yonergesi_2024.pdf.
 * Extraction and source decisions: orchestration/specs/afsu-eczacilik-proje.json
 * and orchestration/reports/afsu-eczacilik-proje-source.md.
 * The embedded cover seals are crops of the two logos on the official EK-1.1
 * sample (PDF p.8); their report-page dimensions/positions are not specified.
 */

const FONT = "Times New Roman";
const BODY = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0 };
const ROMAN_PAGE = { numbering: { enabled: true, position: "bottom", align: "center", centerOnPage: true, format: "roman-lower", restart: false } };
const ARABIC_PAGE = { numbering: { enabled: true, position: "bottom", align: "center", centerOnPage: true, format: "arabic", restart: false } };
const ARABIC_START_PAGE = { numbering: { enabled: true, position: "bottom", align: "center", centerOnPage: true, format: "arabic", startAt: 1, restart: true } };
const CENTER_TITLE = { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0, numbering: { enabled: false } };
const H1 = { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", textTransform: "uppercase", lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0, pageBreakBefore: true, keepWithNext: true, numbering: { enabled: true, format: "{1}.", sequence: "arabic" } };
const subheading = (level) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"], lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0, keepWithNext: true, numbering: { enabled: true, format: Array.from({ length: level }, (_, i) => `{${i + 1}}`).join(".") + ".", sequence: "arabic" } });
const line = (value, style = {}) => ({ type: "text", value, style: { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", lineHeight: 1.5, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
const meta = (field, fallback, style = {}) => ({ type: "metadata", field, fallback, style: { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", lineHeight: 1.5, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
const gap = (heightMm) => ({ type: "spacer", heightMm });
const staticPage = (id, type, title, blocks, { group = "front", tocEntry = "title", page = ROMAN_PAGE, body = BODY } = {}) => ({
  id, type, title, status: "required", group, mode: "static", tocEntry,
  overrides: { page, body }, blocks,
});
const editableFront = (id, type, title, { page = ROMAN_PAGE, headings = { "1": CENTER_TITLE }, paragraph = {} } = {}) => ({
  id, type, title, status: "required", group: "front", mode: "editable", showTitle: false, tocEntry: "none", pageBreakBefore: false,
  overrides: { page, headings, paragraph },
});

const outerCover = {
  id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none",
  // The prose gives report margins but no distinct cover exception. The sample
  // positions are illustrative guide-page coordinates, so use the report margins
  // and flow layout rather than treating those coordinates as a page grid.
  overrides: { page: { numbering: { enabled: false, position: "bottom", align: "center", format: "roman-lower", startAt: 1, restart: true, indexLabelWhenHidden: true } }, body: { ...BODY, align: "center", spaceAfterPt: 0 } },
  blocks: [
    { type: "group", direction: "row", gapMm: 0, marginBottomMm: 7, blocks: [
      { type: "image", source: universitySeal, widthMm: 30, heightMm: 30, align: "left", widthPercent: 30 / 150 * 100 },
      { type: "spacer", heightMm: 0 },
      { type: "image", source: facultySeal, widthMm: 19.7, heightMm: 30, align: "right", widthPercent: 19.7 / 150 * 100 },
    ] },
    line("T.C."),
    line("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ"),
    line("ECZACILIK FAKÜLTESİ"),
    meta("DEPARTMENT_NAME", "…… ANABİLİM DALI"),
    gap(20),
    meta("PROJECT_TITLE", "ARAŞTIRMA PROJESİ KONUSU", { textTransform: "uppercase" }),
    gap(14),
    meta("STUDENT_NAME", "Öğrencinin Adı-SOYADI"),
    gap(18),
    line("LİSANS ARAŞTIRMA PROJESİ"),
    gap(18),
    line("Danışman"),
    meta("ADVISOR_NAME", "Ünvanı Adı-SOYADI"),
    gap(22),
    line("AFYONKARAHİSAR"),
    meta("PROJECT_YEAR", "Yıl"),
  ],
};

const innerCover = {
  id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "title",
  overrides: { page: { numbering: { enabled: false, position: "bottom", align: "center", format: "roman-lower", restart: false, indexLabelWhenHidden: true } }, body: { ...BODY, align: "center", spaceAfterPt: 0 } },
  blocks: [
    gap(16),
    line("T.C.", { fontSizePt: 12 }),
    line("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", { fontSizePt: 12 }),
    line("ECZACILIK FAKÜLTESİ", { fontSizePt: 12 }),
    meta("DEPARTMENT_NAME", "…… ANABİLİM DALI", { fontSizePt: 12 }),
    gap(19),
    meta("PROJECT_TITLE", "ARAŞTIRMA PROJESİ KONUSU", { fontSizePt: 14, fontWeight: 700, textTransform: "uppercase" }),
    gap(8),
    line("Hazırlayan", { fontSizePt: 12 }),
    meta("STUDENT_NAME", "Ad-SOYADI", { fontSizePt: 12 }),
    gap(14),
    line("LİSANS ARAŞTIRMA PROJESİ", { fontSizePt: 12 }),
    gap(16),
    line("Danışman", { fontSizePt: 12 }),
    meta("ADVISOR_NAME", "Ünvanı Adı-SOYADI", { fontSizePt: 12 }),
    gap(23),
    line("AFYONKARAHİSAR", { fontSizePt: 12 }),
    meta("PROJECT_YEAR", "Yıl", { fontSizePt: 12 }),
  ],
};

const approval = staticPage("approval", "approval", "ONAY", [
  line("Ana Bilim Dalı Onayı", { fontSizePt: 12, align: "left" }),
  { type: "text", value: "{{STUDENT_NAME}}'ın “{{PROJECT_TITLE}}” başlıklı, {{DEPARTMENT_NAME}}'ndaki araştırma projesi, Afyonkarahisar Sağlık Bilimleri Üniversitesi Ön lisans ve Lisans Eğitim-Öğretim ve Sınav Yönetmeliği'nin ilgili maddeleri uyarınca değerlendirilerek {{APPROVAL_DATE}} tarihinde kabul edilmiştir.", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0 } },
  gap(18),
  { type: "group", direction: "row", gapMm: 0, blocks: [
    { type: "group", direction: "column", widthPercent: 50, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1.5 }, blocks: [
      line("Ana Bilim Dalı Başkanı", { fontSizePt: 12 }), gap(22), meta("DEPARTMENT_CHAIR_NAME", "Adı Soyadı", { fontSizePt: 12 }),
    ] },
    { type: "group", direction: "column", widthPercent: 50, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1.5 }, blocks: [
      line("Araştırma Projesi Danışmanı", { fontSizePt: 12 }), gap(22), meta("ADVISOR_NAME", "Ünvanı Adı Soyadı", { fontSizePt: 12 }),
    ] },
  ] },
]);

const declaration = staticPage("declaration", "declaration", "BEYAN", [
  { type: "text", value: "Bu araştırma raporunun bana ait olduğunu, tüm aşamalarında etik dışı davranışımın olmadığını, içinde yer alan bütün bilgileri akademik ve etik kurallar içinde elde ettiğimi, kullanmış olduğum bütün bilgilere kaynak gösterdiğimi ve bu kaynakları da kaynaklar listesine aldığımı, yine bu araştırma projesinin yürütülmesi ve yazımı sırasında patent ve telif haklarını ihlal edici bir davranışımın olmadığını beyan ederim.", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, spaceAfterPt: 12, firstLineIndentMm: 0 } },
  gap(45),
  { type: "text", value: "Öğrencinin Adı Soyadı, İmzası", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "right", lineHeight: 1.5, spaceAfterPt: 0 } },
  meta("STUDENT_NAME", "Öğrencinin Adı Soyadı", { fontSizePt: 12, align: "right" }),
]);

const abstractTitlePage = (id, title) => ({
  id, type: id === "abstract-tr-title" ? "abstract" : "englishAbstract", title, status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title",
  overrides: { page: { ...ROMAN_PAGE }, body: { ...BODY, align: "center", spaceAfterPt: 0 } },
  blocks: [
    line(title, { fontSizePt: 14, textTransform: "uppercase" }),
    meta(id === "abstract-tr-title" ? "PROJECT_TITLE" : "PROJECT_TITLE_EN", id === "abstract-tr-title" ? "ARAŞTIRMA PROJESİ KONUSU" : "RESEARCH PROJECT TITLE", { fontSizePt: 12, ...(id === "abstract-tr-title" ? { textTransform: "uppercase" } : {}) }),
  ],
});
const abstractKeywords = (id, type, text) => ({
  id, type, title: text, status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, tocEntry: "none",
  overrides: { page: { ...ROMAN_PAGE }, body: { ...BODY, spaceAfterPt: 0 } },
  blocks: [{ type: "text", markup: "inline", value: text, style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1, firstLineIndentMm: 0, align: "left" } }],
});

const indexStyle = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5 };
const indexSection = (id, type, title, kind, visibleCount) => ({
  id, type, title, status: "required", group: "front", mode: "generated", tocEntry: "title", visibleWhen: { count: visibleCount, gte: 1 },
  generatedIndex: { kind, title, leader: "dots", includePageNumbers: true, style: indexStyle },
  overrides: { page: { ...ROMAN_PAGE }, headings: { "1": CENTER_TITLE } },
});

const mainSection = (id, title, type = "mainContent", options = {}) => ({
  id, type, title, status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: options.titleNumbering ?? "continueH1",
  ...(options.pageBreakBefore === false ? { pageBreakBefore: false } : {}),
  overrides: { page: id === "introduction" ? ARABIC_START_PAGE : ARABIC_PAGE, ...(options.overrides || {}) },
});

const template = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: "afsu-eczacilik-proje-lisans-tr-v1",
  universityId: "afsu",
  universityName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  instituteId: "eczacilik",
  instituteName: "Eczacılık Fakültesi",
  degreeType: "undergraduate",
  language: "tr",
  status: "official",
  displayName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi · Eczacılık Fakültesi · Lisans Araştırma Projesi",
  source: {
    type: "official",
    documentName: "AFSU_Eczacilik_Arastirma_Projesi_Dersleri_Yonergesi_2024.pdf",
    revisionDate: "2024-01-16",
    verifiedAt: "2026-10-02",
    notes: [
      "Source evidence and explicit UNKNOWN values are in orchestration/specs/afsu-eczacilik-proje.json and orchestration/reports/afsu-eczacilik-proje-source.md.",
      "The report has a Turkish variant and requires an English Abstract; no full-English variant is established.",
      "The source specifies a 12 pt total gap between paragraphs but does not allocate it to Word before/after fields; this template encodes it as 12 pt after and leaves before unspecified as an implementation convention.",
      "The 2024 outline omits approval, while detailed §2.2 and EK-1.3 establish it; approval follows the inner cover and precedes the declaration.",
      "The §1.8 example 'Giriş ve Amaç' conflicts with the outline/detail heading 'GİRİŞ'; the template uses GİRİŞ and keeps aims/hypothesis at the end of that section.",
      "The guide page-number font/size and visible cover numbering are UNKNOWN. Cover number glyphs are hidden while their Roman labels remain counted; this is an implementation inference from 'from the beginning of the report'.",
      "Cover logos reproduce the two marks shown in the official EK-1.1 sample; their required status, report-page size, and exact report-page coordinates are UNKNOWN. Cover text uses flow layout because sample positions are measured on guide pages, not normalized report pages.",
      "The PDF and DOCX outputs must be inspected for actual embedded fonts during validation; the template source alone does not establish exported font identity.",
      "The single-line Word line model uses the engine's 1.15 em calibration to render the explicit 1.5-line rule; 1.15 em itself is not stated by AFSÜ.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 35, leftMm: 40, bottomMm: 20, rightMm: 20 },
    numbering: { enabled: true, position: "bottom", align: "center", centerOnPage: true, format: "roman-lower" },
  },
  typography: {
    body: BODY,
    paragraph: { firstLineIndentMm: 0, spaceAfterPt: 12, lineHeight: 1.5 },
    headings: { "1": H1, "2": subheading(2), "3": subheading(3), "4": subheading(4) },
    footnotes: { placement: "pageBottom", fontFamily: FONT, fontSizePt: 10, lineHeight: 1, firstLineIndentMm: 0 },
    // Word-compatible single-line calibration only; source requirement is 1.5 lines.
    lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch", figureExitGap: "spacing" },
  },
  placeholders: {
    PROJECT_TITLE: { label: "Araştırma projesi konusu", type: "multiline", required: true },
    STUDENT_NAME: { label: "Öğrencinin adı soyadı", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim dalı", type: "text", required: true },
    ADVISOR_NAME: { label: "Araştırma projesi danışmanı", type: "text", required: true },
    PROJECT_YEAR: { label: "Yıl", type: "number", required: true },
    APPROVAL_DATE: { label: "Onay tarihi", type: "date", required: true },
    DEPARTMENT_CHAIR_NAME: { label: "Ana Bilim Dalı Başkanı", type: "text" },
    PROJECT_TITLE_EN: { label: "Araştırma projesi konusu (İngilizce)", type: "multiline", required: true },
    KEYWORDS_TR: { label: "Anahtar sözcükler (Türkçe, en çok 5)", type: "text" },
    KEYWORDS_EN: { label: "Keywords (English, up to 5)", type: "text" },
  },
  sections: [
    outerCover,
    innerCover,
    approval,
    declaration,
    { id: "preface", type: "preface", title: "ÖNSÖZ", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: { ...ROMAN_PAGE }, headings: { "1": CENTER_TITLE } } },
    abstractTitlePage("abstract-tr-title", "ÖZET"),
    editableFront("abstract-tr", "abstract", "Özet metni", { paragraph: { firstLineIndentMm: 0, lineHeight: 1 } }),
    abstractKeywords("abstract-tr-keywords", "abstract", "**Anahtar Sözcükler:** {{KEYWORDS_TR}}"),
    abstractTitlePage("abstract-en-title", "ABSTRACT"),
    editableFront("abstract-en", "englishAbstract", "Abstract text", { paragraph: { firstLineIndentMm: 0, lineHeight: 1 } }),
    abstractKeywords("abstract-en-keywords", "englishAbstract", "**Keywords:** {{KEYWORDS_EN}}"),
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "none", generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", levels: [1, 2, 3, 4], includePageNumbers: true, leader: "dots", style: indexStyle }, overrides: { page: { ...ROMAN_PAGE }, headings: { "1": CENTER_TITLE } } },
    indexSection("list-tables", "listOfTables", "TABLOLAR DİZİNİ", "tables", "tables"),
    indexSection("list-figures", "listOfFigures", "ŞEKİLLER DİZİNİ", "figures", "figures"),
    indexSection("list-photos", "custom", "RESİMLER DİZİNİ", "photo", "photo"),
    { id: "symbols", type: "listOfAbbreviations", title: "SEMBOLLER VE KISALTMALAR DİZİNİ", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: { ...ROMAN_PAGE }, headings: { "1": CENTER_TITLE }, paragraph: { firstLineIndentMm: 0, lineHeight: 1 } } },
    mainSection("introduction", "GİRİŞ", "mainContent"),
    mainSection("general-information", "GENEL BİLGİLER", "custom"),
    mainSection("materials-methods", "MATERYAL VE YÖNTEM", "custom"),
    mainSection("findings", "BULGULAR", "custom"),
    mainSection("discussion-conclusion", "TARTIŞMA VE SONUÇ", "custom"),
    { id: "references", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "none", overrides: { page: { ...ARABIC_PAGE } } },
    { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "none", overrides: { page: { ...ARABIC_PAGE } } },
  ],
  tables: {
    label: "Tablo", position: "above", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" },
    spacingAfterPt: 6, captionAlignment: "center",
    style: { fontFamily: FONT, fontSizePt: 10, align: "center", lineHeight: 1, spaceAfterPt: 0 },
  },
  figures: {
    label: "Şekil", position: "below", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" },
    spacingBeforePt: 6, spacingAfterPt: 0, captionAlignment: "center",
    style: { fontFamily: FONT, fontSizePt: 10, align: "center", lineHeight: 1, spaceAfterPt: 0 },
    box: { align: "center" },
  },
  captionKinds: {
    photo: {
      label: "Resim", position: "below", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" },
      spacingBeforePt: 6, spacingAfterPt: 0, captionAlignment: "center",
      style: { fontFamily: FONT, fontSizePt: 10, align: "center", lineHeight: 1, spaceAfterPt: 0 },
      box: { align: "center" },
    },
  },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" } },
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1, spaceAfterPt: 6, firstLineIndentMm: 0 }, citationStyle: "author-year" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
  validation: {
    KEYWORDS_TR: { minItems: 1, separator: ",", severity: "warning", message: "Özet için en çok beş Türkçe anahtar sözcük girin." },
    KEYWORDS_EN: { minItems: 1, separator: ",", severity: "warning", message: "Abstract için en çok beş İngilizce keyword girin." },
  },
};

export const afsuEczacilikProje = template;
export default template;
