import { afsu_cover_top_master, afsu_cover_top_phd, afsu_cover_band_master, afsu_cover_band_phd } from "./assets/afsuCoverArt.js";

/**
 * Afyonkarahisar Sağlık Bilimleri Üniversitesi, Lisansüstü Eğitim Enstitüsü.
 *
 * Source of truth: AFSÜ LEE Thesis Writing Guide (Dec 2025), adopted 20 Oct 2025,
 * plus the four 2026 defense checklists and the official 2026 thesis masters.
 * Source-backed rules and measured block geometry are recorded in
 * engine/specs/afsu-lee.json and .test-tmp/validation/afsu-lee/source/.
 *
 * Master and doctoral theses share common rules; degree differences are jury
 * size, thesis wording, and the source template's degree-specific special pages.
 */
const FONT = "Times New Roman";
const PT_TO_MM = 25.4 / 72;
const pt = (value) => value * PT_TO_MM;
const positioned = (type, value, box, style = {}) => ({ type, value, layoutMode: "absolute", ...box, style: { fontFamily: FONT, fontSizePt: 12, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
const positionedMeta = (field, fallback, box, style = {}, metadata = {}) => ({ type: "metadata", field, fallback, ...metadata, layoutMode: "absolute", ...box, style: { fontFamily: FONT, fontSizePt: 12, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
// TxtEngine's measured Word text-box first-line model is approximately 0.9336 em.
// Half of the measured editor-PDF residual per font size (the Word DOCX shows the opposite residual), so both exports stay within 0.15 mm of the official baselines

const ABSTRACT_TITLE_LEAD = 37.33;
const ABSTRACT_TITLE_LEAD_EN = 51.49;
const ABSTRACT_TITLE_GAP = 25.92;
const SIGN_GAP = 20.65;
const BASELINE_RESIDUAL_PT = { 12: -0.37, 14: -0.17, 16: -0.36 };
const topFromBaseline = (baselinePt, fontPt) => pt(baselinePt - fontPt * 0.9336 - (BASELINE_RESIDUAL_PT[fontPt] ?? 0));
const centeredTitle = { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1 };
const mainH1 = {
  fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", lineHeight: 1.5,
  textTransform: "uppercase", pageBreakBefore: true, spaceAfterPt: 18.5, // official template: one blank 1.5-spaced paragraph follows each H1
  numbering: { enabled: true, format: "{1}.", sequence: "arabic" },
};
// H2/H3: the official template has an empty 1.5-spaced paragraph before and after each (measured +14.75 pt before, +20.1 pt after the guide's 6 pt).
const heading = (level, format, style = {}) => {
  const { numbering: numberingOverride, ...styleProperties } = style;
  return {
    fontFamily: FONT,
    fontSizePt: level <= 2 ? 14 : 12,
    fontWeight: 700,
    align: "left",
    lineHeight: 1.5,
    keepWithNext: true,
    ...styleProperties,
    numbering: { enabled: true, format, sequence: "arabic", ...numberingOverride },
  };
};
const chapterNumbering = { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" };

/** Rules shared by both AFSÜ LEE degree variants. */
export const sharedCommonBase = {
  schemaVersion: 1,
  templateVersion: "1.0.0",
  universityId: "afsu",
  universityName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  instituteId: "lee",
  instituteName: "Lisansüstü Eğitim Enstitüsü",
  language: "tr",
  status: "official",
  source: {
    type: "official",
    documentName: "AFSU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx and AFSÜ LEE thesis templates/checklists 2026",
    verifiedAt: "2026-10-02",
    notes: [
      "Source rules and explicit Unknowns: engine/specs/afsu-lee.json and engine/docs/reports/afsu-lee-source-rules.md.",
      "DOCX structure and measured page geometry: .test-tmp/validation/afsu-lee/source/docx-structure.json and template-structure-evidence.json.",
      "Guide and final-thesis templates agree on 3 total members for master's and 5 total for doctoral, including the chair.",
      "Official 2026 final-thesis DOCX/PDF measures page numbers at 11 pt and footer distance at 709 twips (12.5069 mm); doctorate Roman footer is additionally anchored higher than its Arabic footer.",
      "The outside cover follows the institute's prescribed format (measured cover margins 12.7 mm); guide margins apply to inner cover, ethics, approval, abstracts, indexes, and body. Approval source template text intrudes left of the guide's 40 mm text/table boundary; implementation follows the guide and retains this source conflict in the report.",
      "Current APA Reference System is required; no numeric quotation-length limit is given. Pre-defense similarity must not exceed 30%.",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 },
    header: { heightMm: 0, distanceMm: 12.4888889 }, footer: { heightMm: 0, distanceMm: 12.5069444 },
    numbering: { enabled: true, position: "bottom", align: "right", format: "roman-lower", startAt: 1, restart: false, style: { fontFamily: FONT, fontSizePt: 11 } },
  },
  typography: {
    body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 },
    paragraph: { firstLineIndentMm: 0, spaceBeforePt: 6, spaceAfterPt: 6, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": mainH1,
      "2": heading(2, "{1}.{2}.", { spaceBeforePt: 20.75, spaceAfterPt: 26.09, textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }),
      // Preserve author-entered sentence case. The source requires only the first word
      // to start uppercase; automatic CSS capitalize would uppercase every word.
      "3": heading(3, "{1}.{2}.{3}.", { spaceBeforePt: 20.75, spaceAfterPt: 26.09, textTransform: "none" }),
      // Source says level four and deeper are not numbered; map the engine's H4 to this rule.
      "4": heading(4, "{1}.{2}.{3}.{4}.", { numbering: { enabled: false }, italic: true, textTransform: "none" }),
    },
    footnotes: { fontFamily: FONT, fontSizePt: 10 },
    // "collapse" preserves the source's literal Word before/after properties (6 pt each).
    // 1.15 em is the engine's Word-compatible line model, not an AFSÜ spacing value.
    lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse" },
  },
  placeholders: {
    UNIVERSITY_NAME: { label: "Üniversite", type: "text" },
    INSTITUTE_NAME: { label: "Enstitü", type: "text" },
    THESIS_TITLE: { label: "Tez başlığı", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Thesis title in English", type: "text", required: true },
    STUDENT_NAME: { label: "Ad Soyad", type: "text", required: true },
    DEPARTMENT_NAME: { label: "Anabilim dalı adı (yalnız adı; sonuna ‘Anabilim Dalı’ eklemeyin)", type: "text", required: true },
    PROGRAM_NAME: { label: "Program adı (yalnız adı; sonuna ‘Programı’ eklemeyin)", type: "text" },
    ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman adı soyadı", type: "text", required: true },
    CO_ADVISOR_TITLE: { label: "İkinci danışman unvanı (varsa)", type: "text" },
    CO_ADVISOR_NAME: { label: "İkinci danışman adı soyadı (varsa)", type: "text" },
    CITY: { label: "Şehir", type: "text", defaultValue: "Afyonkarahisar" },
    YEAR: { label: "Yıl", type: "number", required: true },
    DEFENSE_DATE: { label: "Tez savunma tarihi", type: "text" },
    DECLARATION_DATE: { label: "Beyan tarihi", type: "text" },
    INSTITUTE_DIRECTOR: { label: "Enstitü müdürü", type: "text" },
    INSTITUTE_DIRECTOR_DATE: { label: "Enstitü yönetim kurulu onay tarihi", type: "text" },
    BAP_SUPPORT_NOTE: { label: "BAP proje numarası (varsa)", type: "text", defaultValue: "" },
    KEYWORDS: { label: "Anahtar kelimeler (3–5, alfabetik, virgülle)", type: "text", required: true },
    KEYWORDS_EN: { label: "Keywords (3–5, alphabetical, comma-separated)", type: "text", required: true },
    PAGE_COUNT: { label: "Fiziksel sayfa sayısı", type: "number", derived: "totalPages" },
    JURY_CHAIR_TITLE: { label: "Jüri başkanı unvanı", type: "text" },
    JURY_CHAIR_NAME: { label: "Jüri başkanı adı soyadı", type: "text" },
    JURY_CHAIR_AFFILIATION: { label: "Jüri başkanı kurum/fakülte/anabilim dalı", type: "text" },
    ...Object.fromEntries([1, 2, 3, 4].flatMap((n) => [
      ["JURY_MEMBER_" + n + "_TITLE", { label: "Jüri üyesi " + n + " unvanı", type: "text" }],
      ["JURY_MEMBER_" + n + "_NAME", { label: "Jüri üyesi " + n + " adı soyadı", type: "text" }],
      ["JURY_MEMBER_" + n + "_AFFILIATION", { label: "Jüri üyesi " + n + " kurum/fakülte/anabilim dalı", type: "text" }],
    ])),
    JURY_DECISION: { label: "Jüri kararı", type: "text" },
  },
  validation: {
    KEYWORDS: { minItems: 3, separator: ",", severity: "warning", message: "Anahtar kelime sayısı en az 3 olmalıdır; üst sınır 5'tir." },
    KEYWORDS_EN: { minItems: 3, separator: ",", severity: "warning", message: "Keywords must contain at least 3 terms; the source maximum is 5." },
  },
  tables: {
    label: "Tablo", position: "above", style: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1 },
    numbering: chapterNumbering, labelFormat: "{label} {number}.", labelStyle: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700 },
    captionAlignment: "left", align: "center",
    cellStyle: { fontFamily: FONT, fontSizePt: 10, lineHeight: 1 },
  },
  figures: {
    label: "Şekil", position: "below", style: { fontFamily: FONT, fontSizePt: 12, align: "center", lineHeight: 1 },
    numbering: chapterNumbering, labelFormat: "{label} {number}.", labelStyle: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700 },
    captionAlignment: "center", align: "center",
  },
  bibliography: {
    heading: "KAYNAKLAR", citationStyle: "Current APA Reference System",
    style: { fontFamily: FONT, fontSizePt: 10, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 0 },
  },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" }, style: { fontFamily: FONT, fontSizePt: 10, align: "center" } },
  sections: [],
};

const variant = (degreeType, suffix, juryMembers) => ({
  ...sharedCommonBase,
  id: "afsu-lee-" + degreeType + "-tr-v1",
  degreeType,
  displayName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi · Lisansüstü Eğitim Enstitüsü · " + suffix,
  sections: sourceEthicsMarkers(sections(degreeType)),
  metadata: { juryMembers },
});

function coverBlocks(degreeType) {
  const phd = degreeType === "phd";
  const font14 = { fontSizePt: 14, fontWeight: 700 };
  const common = { xMm: pt(95), widthMm: pt(405) };
  const lines = [
    positioned("text", "T.C.", { ...common, yMm: topFromBaseline(phd ? 175.46 : 176.06, 14), heightMm: pt(18) }, font14),
    positioned("text", "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", { ...common, yMm: topFromBaseline(phd ? 191.54 : 192.14, 14), heightMm: pt(18) }, font14),
    positioned("text", "LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ", { ...common, yMm: topFromBaseline(phd ? 207.62 : 208.22, 14), heightMm: pt(18) }, font14),
    positionedMeta("DEPARTMENT_NAME", "…… ANABİLİM DALI", { ...common, yMm: topFromBaseline(phd ? 248.18 : 242.78, 14), heightMm: pt(18) }, { ...font14, textTransform: "uppercase" }, { suffix: " ANABİLİM DALI" }),
    positionedMeta("THESIS_TITLE", "TEZ BAŞLIĞI", { ...common, yMm: topFromBaseline(phd ? 353.45 : 352.61, 16), heightMm: pt(20) }, { fontSizePt: 16, fontWeight: 700 }),
    positionedMeta("STUDENT_NAME", "Ad SOYAD", { ...common, yMm: topFromBaseline(phd ? 466.63 : 465.91, 14), heightMm: pt(18) }, font14),
    positioned("text", phd ? "DOKTORA TEZİ" : "YÜKSEK LİSANS TEZİ", { ...common, yMm: topFromBaseline(phd ? 496.99 : 496.15, 12), heightMm: pt(16) }, { fontWeight: 700 }),
    positioned("text", "Danışman", { ...common, yMm: topFromBaseline(phd ? 577.03 : 576.31, 14), heightMm: pt(18) }, font14),
    positioned("text", "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", { ...common, yMm: topFromBaseline(phd ? 593.11 : 592.39, 14), heightMm: pt(18) }, font14),
    positioned("text", "{{YEAR}}–{{CITY}}", { ...common, yMm: topFromBaseline(phd ? 754.18 : 753.34, 14), heightMm: pt(18) }, { ...font14, textTransform: "uppercase" }),
  ];
  return [
    { type: "image", source: phd ? afsu_cover_top_phd : afsu_cover_top_master, layoutMode: "absolute", xMm: pt(phd ? 37.5 : 36.9), yMm: pt(phd ? 35.5 : 35), widthMm: pt(phd ? 528.7 : 525.5), heightMm: pt(phd ? 122 : 121), zIndex: 0 },
    { type: "image", source: phd ? afsu_cover_band_phd : afsu_cover_band_master, layoutMode: "absolute", xMm: pt(36), yMm: pt(phd ? 783 : 785.4), widthMm: pt(526), heightMm: pt(phd ? 28.7 : 31.4), zIndex: 0 },
    ...lines,
  ];
}

function innerCoverBlocks(degreeType) {
  const phd = degreeType === "phd";
  // Inner-page content follows the explicit 40 mm / 25 mm margin frame.
  const center = { xMm: 40, widthMm: 145 };
  const line = (text, baseline, size = 12, style = {}) => positioned("text", text, { ...center, yMm: topFromBaseline(baseline, size), heightMm: pt(size * 1.4) }, { fontSizePt: size, fontWeight: 700, ...style });
  const meta = (field, fallback, baseline, size = 12, style = {}, metadata = {}) => positionedMeta(field, fallback, { ...center, yMm: topFromBaseline(baseline, size), heightMm: pt(size * 1.4) }, { fontSizePt: size, fontWeight: 700, ...style }, metadata);
  return [
    line("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", 84, 14),
    line("LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ", 102.5, 14),
    meta("DEPARTMENT_NAME", "…… ANABİLİM DALI", 160, 14, { textTransform: "uppercase" }, { suffix: " ANABİLİM DALI" }),
    meta("PROGRAM_NAME", "…… PROGRAMI", 187.9, 12, { textTransform: "uppercase" }, { suffix: " PROGRAMI" }),
    meta("THESIS_TITLE", "TEZ BAŞLIĞI", 272.7, 14),
    meta("STUDENT_NAME", "Ad SOYAD", 355.8, 12),
    line(phd ? "DOKTORA TEZİ" : "YÜKSEK LİSANS TEZİ", 424.8, 12),
    positioned("text", "Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}", { ...center, yMm: topFromBaseline(505.4, 12), heightMm: pt(16) }, { fontWeight: 700 }),
    { type: "text", value: "İkinci Danışman: {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}", visibleWhen: { anyFilled: ["CO_ADVISOR_TITLE", "CO_ADVISOR_NAME"] }, layoutMode: "absolute", xMm: center.xMm, yMm: topFromBaseline(533, 12), widthMm: center.widthMm, heightMm: pt(16), style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } },
    { type: "spacer", heightMm: pt(474) },
    { type: "metadata", field: "BAP_SUPPORT_NOTE", fallback: "", prefix: "Bu çalışma; Afyonkarahisar Sağlık Bilimleri Üniversitesi Bilimsel Araştırma Projeleri Koordinasyon Birimi tarafından ", suffix: " proje numarası ile desteklenmiştir.", layoutMode: "absolute", xMm: center.xMm, yMm: topFromBaseline(612.3, 12), widthMm: center.widthMm, heightMm: pt(45), style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } },
    line("{{YEAR}}–{{CITY}}", 747.6, 12, { textTransform: "uppercase" }),
  ];
}

function approvalBlocks(degreeType) {
  const count = degreeType === "phd" ? 4 : 2;
  // Official table: single 0.5 pt rules, 5.4 pt cell side margins, rows at least 1127 / 939 twips high, centred cells,
  // column widths 1702 / 5675 / 1129 twips; paragraph spacing inside cells follows the template XML (Normal 1.15 line).
  const border = { outerPt: 0.5, paddingXMm: pt(5.4), paddingYMm: 0, collapse: true };
  const cellStyleBase = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.15, align: "center", spaceBeforePt: 0, spaceAfterPt: 0 };
  const cell = (widthPercent, blocks, style = {}) => ({ type: "group", widthPercent, border, verticalAlign: "center", style: { ...cellStyleBase, ...style }, blocks });
  const text = (value, style = {}) => ({ type: "text", value, style });
  const meta = (field, fallback, style = {}) => ({ type: "metadata", field, fallback, style });
  const row = (cells, minHeightPt) => ({ type: "group", direction: "row", gapMm: 0, minHeightMm: pt(minHeightPt), blocks: cells });
  const bold = { fontWeight: 700 };
  const rows = [row([
    cell(20.01, [text("TEZ SINAV JÜRİSİ", { ...bold, spaceAfterPt: 10 })], bold),
    cell(66.72, [text("Ünvan Adı Soyadı", { ...bold, spaceAfterPt: 10 }), text("Üniversite/Fakülte/Anabilim - Bilim Dalı Adı", { ...bold, spaceAfterPt: 10 })], bold),
    cell(13.27, [text("İmza", { ...bold, spaceAfterPt: 10 })], bold),
  ], 56.9)];
  // The template's first member row has "after 0" everywhere; later rows use Word's default 10 pt after the last paragraph of each cell.
  const memberRow = (first, label, titleField, nameField, affiliationField) => {
    const after = first ? 0 : 10;
    return row([
      cell(20.01, [text(label, { ...bold, spaceAfterPt: after })], { align: "left" }),
      cell(66.72, [text(`{{${titleField}}} {{${nameField}}}`), meta(affiliationField, "Üniversite / Fakülte / Anabilim Dalı", { spaceAfterPt: after })], { align: "left" }),
      cell(13.27, [text(" ", { spaceAfterPt: after })]),
    ], 46.95);
  };
  rows.push(memberRow(true, "Jüri Başkanı", "JURY_CHAIR_TITLE", "JURY_CHAIR_NAME", "JURY_CHAIR_AFFILIATION"));
  for (let index = 1; index <= count; index += 1) rows.push(memberRow(false, "Jüri Üyesi", `JURY_MEMBER_${index}_TITLE`, `JURY_MEMBER_${index}_NAME`, `JURY_MEMBER_${index}_AFFILIATION`));
  return rows;
}

function sections(degreeType) {
  const phd = degreeType === "phd";
  const footerBox = phd
    ? { baselineFromTopMm: pt(801), align: "center", xMm: pt(493.42), widthMm: pt(36.94) }
    : { baselineFromTopMm: pt(797.04), align: "center", xMm: pt(498.02), widthMm: pt(56.25) };
  const romanNumbering = phd
    ? { baselineFromTopMm: pt(766.9), align: "right" }
    : footerBox;
  const noNumber = { numbering: { enabled: false } };
  const blankHeading = { align: "center", fontFamily: FONT, fontSizePt: 12, fontWeight: 700, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 };
  const pageUnnumbered = { page: { numbering: { enabled: false } }, body: { lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } };
  const roman = { page: { numbering: { ...romanNumbering, enabled: true, format: "roman-lower", startAt: 1, restart: false } } };
  const romanStart = { page: { numbering: { ...romanNumbering, enabled: true, format: "roman-lower", startAt: 1, restart: true } } };
  const arabic = { enabled: true, format: "arabic", restart: false, ...footerBox };
  return [
    { id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none", overrides: { ...pageUnnumbered, page: { ...pageUnnumbered.page, // The official doctorate template's cover section has a right-aligned PAGE footer (prints "1"); the master template has none.
      ...(degreeType === "phd" ? { numbering: { enabled: true, format: "arabic", startAt: 1, restart: false, baselineFromTopMm: pt(766.18), align: "right", style: { fontFamily: "Calibri", fontSizePt: 11 } } } : {}), margins: { topMm: 12.7, bottomMm: 12.7, leftMm: 12.7, rightMm: 12.7 }, header: { heightMm: 0, distanceMm: degreeType === "phd" ? 12.4888889 : 6.4381944 }, footer: { heightMm: 0, distanceMm: degreeType === "phd" ? 12.4888889 : 6.4381944 } } }, blocks: coverBlocks(degreeType) },
    { id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none", overrides: { ...pageUnnumbered, page: { ...pageUnnumbered.page, margins: { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 } } }, blocks: innerCoverBlocks(degreeType) },
    { id: "ethics", type: "ethicsDeclaration", title: "BİLİMSEL ETİĞE UYGUNLUK", status: "required", group: "front", mode: "static", tocEntry: "none", overrides: { ...pageUnnumbered, page: { ...pageUnnumbered.page, margins: { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 } } }, blocks: [
    positioned("text", "BİLİMSEL ETİĞE UYGUNLUK", { xMm: 40, yMm: topFromBaseline(82.1, 12), widthMm: 145, heightMm: pt(16) }, { ...blankHeading }),
      { type: "spacer", heightMm: pt(21.6) },
      { type: "text", value: "Afyonkarahisar Sağlık Bilimleri Üniversitesi Lisansüstü Eğitim Enstitüsü Tez Yazım Kurallarına uygun olarak hazırladığım bu tez çalışmasında;", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 } },
      { type: "text", value: "•	Tez içinde sunduğum verileri, bilgileri ve dokümanları akademik ve etik kurallar çerçevesinde elde ettiğimi,", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 0.96, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "text", value: "•	Tüm bilgi, belge, değerlendirme ve sonuçları bilimsel etik ve ahlak kurallarına uygun olarak sunduğumu,", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 0.96, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "text", value: "•	Tez çalışmasında yararlandığım eserlerin tümüne uygun atıfta bulunarak kaynak gösterdiğimi,", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 0.96, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "text", value: "•	Kullanılan verilerde ve ortaya çıkan sonuçlarda herhangi bir değişiklik yapmadığımı,", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 0.96, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "text", value: "•	Yapay Zeka kullanıldığı durumlarda: Yükseköğretim Kurulunun belirlediği üretken yapay zeka kullanım rehberine uygun davrandığımı,", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1.5, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 0.96, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "text", value: "•	Bu tezde sunduğum çalışmanın özgün olduğunu bildirir, aksi bir durumda aleyhime doğabilecek tüm hak kayıplarını kabullendiğimi beyan ederim.", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 2, spaceAfterPt: 0, firstLineIndentMm: 0, spaceBeforePt: 8.98, leftIndentMm: pt(18), hangingIndentMm: pt(18), tabStopMm: pt(18) } },
      { type: "spacer", heightMm: pt(SIGN_GAP) },
      { type: "text", value: "{{DECLARATION_DATE}}", style: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, leftIndentMm: pt(319.2) } },
      { type: "spacer", heightMm: pt(20.7) },
      { type: "text", value: "İmza", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 } },
      { type: "metadata", field: "STUDENT_NAME", fallback: "Adı ve Soyadı", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0 } },
    ] },
    { id: "approval", type: "approval", title: "KABUL VE ONAY", status: "required", group: "front", mode: "static", tocEntry: "none", overrides: { ...pageUnnumbered, page: { ...pageUnnumbered.page, margins: { topMm: 25, bottomMm: 25, leftMm: pt(100.7), rightMm: pt(69.05) } } }, blocks: [
      positioned("text", "KABUL VE ONAY", { xMm: 40, yMm: topFromBaseline(82.1, 12), widthMm: 145, heightMm: pt(16) }, { ...blankHeading }),
      { type: "spacer", heightMm: pt(31.56) },
      { type: "text", value: `{{ADVISOR_TITLE}} {{ADVISOR_NAME}} danışmanlığında {{STUDENT_NAME}} tarafından hazırlanan “{{THESIS_TITLE}}” adlı bu çalışma jürimiz tarafından Afyonkarahisar Sağlık Bilimleri Üniversitesi Lisansüstü Eğitim Enstitüsü {{DEPARTMENT_NAME}} Anabilim Dalı {{PROGRAM_NAME}} Programında ${degreeType === "phd" ? "doktora" : "yüksek lisans"} tezi olarak kabul edilmiştir.`, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, lineHeight: 1.5, align: "justify", spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, leftIndentMm: pt(-1.44), rightIndentMm: pt(1.85) } },
      { type: "text", value: "{{DEFENSE_DATE}}", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1, spaceBeforePt: 10, spaceAfterPt: 0, rightIndentMm: pt(1.75) } },
      { type: "text", value: "(Tez savunma sınav tarihi yazılacaktır)", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1, spaceBeforePt: 10, spaceAfterPt: degreeType === "phd" ? 12.4 : 21, rightIndentMm: pt(1.75) } },
      ...approvalBlocks(degreeType),
      { type: "spacer", heightMm: pt(23.9) },
      { type: "text", value: "ONAY:", style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, lineHeight: 1.5, align: "left", spaceBeforePt: 0, spaceAfterPt: 0, leftIndentMm: pt(5.64), rightIndentMm: pt(15.85) } },
      { type: "text", value: "Bu tezin kabulü Enstitü Yönetim Kurulunun ………....… tarih ve …………..…… sayılı kararı ile onaylanmıştır.", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.5, align: "justify", spaceBeforePt: 0, spaceAfterPt: 0, leftIndentMm: pt(5.64), rightIndentMm: pt(15.85) } },
      { type: "spacer", heightMm: pt(degreeType === "phd" ? 13.9 : 27.6) },
      { type: "text", value: "{{INSTITUTE_DIRECTOR_DATE}}", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: pt(1.85) } },
      ...(degreeType === "phd" ? [] : [{ type: "spacer", heightMm: pt(20.7) }]),
      { type: "text", value: "{{INSTITUTE_DIRECTOR}}", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: pt(1.85) } },
      { type: "text", value: "Enstitü Müdürü", style: { fontFamily: FONT, fontSizePt: 12, align: "right", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, rightIndentMm: pt(1.85) } },
    ] },
    { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "none", overrides: { ...pageUnnumbered, headings: { "1": blankHeading } } },
    { id: "abstract-header", type: "abstract", title: "ÖZET", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title", overrides: { ...romanStart, body: { ...sharedCommonBase.typography.body, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } }, blocks: [
      positioned("text", "ÖZET", { xMm: 40, yMm: topFromBaseline(94.1, 12), widthMm: 145, heightMm: pt(16) }, { ...blankHeading }),
      { type: "spacer", heightMm: pt(ABSTRACT_TITLE_LEAD) },
      { type: "metadata", field: "THESIS_TITLE", fallback: "TEZ BAŞLIĞI", style: { ...blankHeading, textTransform: "uppercase", spaceAfterPt: ABSTRACT_TITLE_GAP } },
    ] },
    { id: "abstract-tr", type: "abstract", title: "Özet metni", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false, overrides: { ...roman, body: { ...sharedCommonBase.typography.body, lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 6, spaceAfterPt: 6, align: "justify" }, paragraph: { lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 6, spaceAfterPt: 6, align: "justify" } } },
    { id: "abstract-tr-footer", type: "abstract", title: "Anahtar kelimeler", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, overrides: { ...roman, body: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 } }, blocks: [{ type: "metadata", field: "KEYWORDS", prefix: "Anahtar Kelimeler: ", fallback: "Anahtar Kelimeler: …" }] },
    { id: "abstract-en-header", type: "englishAbstract", title: "ABSTRACT", status: "required", group: "front", mode: "static", standalone: false, tocEntry: "title", overrides: { ...roman, body: { ...sharedCommonBase.typography.body, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } }, blocks: [
      positioned("text", "ABSTRACT", { xMm: 40, yMm: topFromBaseline(107.9, 12), widthMm: 145, heightMm: pt(16) }, { ...blankHeading }),
      { type: "spacer", heightMm: pt(ABSTRACT_TITLE_LEAD_EN) },
      { type: "metadata", field: "THESIS_TITLE_EN", fallback: "THESIS TITLE", style: { ...blankHeading, textTransform: "none", spaceAfterPt: ABSTRACT_TITLE_GAP } },
    ] },
    { id: "abstract-en", type: "englishAbstract", title: "Abstract text", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false, overrides: { ...roman, body: { ...sharedCommonBase.typography.body, lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 6, spaceAfterPt: 6, align: "justify" }, paragraph: { lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 6, spaceAfterPt: 6, align: "justify" } } },
    { id: "abstract-en-footer", type: "englishAbstract", title: "Keywords", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, overrides: { ...roman, body: { fontFamily: FONT, fontSizePt: 12, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 } }, blocks: [{ type: "metadata", field: "KEYWORDS_EN", prefix: "Keywords: ", fallback: "Keywords: …" }] },
    { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title", // Official template TOC styles T1/T2/T3 win over the guide prose (user rule): regular weight, single line + 5 pt after, 11 pt per level, 11 pt "Sayfa" label.
    generatedIndex: { kind: "toc", leader: "dots", indentMm: pt(11), style: { lineHeight: 1.15, spaceBeforePt: 0, spaceAfterPt: 5 }, pageHeading: "Sayfa", pageHeadingStyle: { fontSizePt: 11, fontWeight: 400, lineHeight: 1.073, spaceBeforePt: 12, spaceAfterPt: 0 }, levelStyles: { "1": { textTransform: "uppercase", fontWeight: 400, spaceAfterPt: 5 }, "unnumbered": { fontWeight: 400, spaceAfterPt: 5 }, "2": { spaceAfterPt: 5, textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }, "3": { spaceAfterPt: 5, textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }, "4": { spaceAfterPt: 5, textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] } } }, overrides: { ...roman, headings: { "1": { ...blankHeading, spaceAfterPt: 14.2 } } } },
    { id: "abbreviations", type: "listOfAbbreviations", title: "KISALTMALAR VE SİMGELER", status: "required", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { ...roman, headings: { "1": blankHeading } } },
    { id: "index-tables", type: "listOfTables", title: "TABLOLAR DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title", generatedIndex: { kind: "tables", leader: "dots" }, overrides: { ...roman, headings: { "1": blankHeading } } },
    { id: "index-figures", type: "listOfFigures", title: "ŞEKİLLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title", generatedIndex: { kind: "figures", leader: "dots" }, overrides: { ...roman, headings: { "1": blankHeading } } },
    { id: "main", type: "mainContent", title: "GİRİŞ", status: "required", group: "body", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "continueH1", pageBreakBefore: true, overrides: { page: { numbering: { ...arabic, startAt: 1, restart: true } } } },
    { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "continueH1", overrides: { page: { numbering: { ...arabic } } } },
    { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: { numbering: { ...arabic } }, headings: { "1": { align: "center", fontSizePt: 14, fontWeight: 700, textTransform: "uppercase", numbering: { enabled: false } } } } },
    { id: "cv", type: "curriculumVitae", title: "ÖZGEÇMİŞ", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", overrides: { page: { numbering: { ...arabic } }, headings: { "1": { align: "center", fontSizePt: 14, fontWeight: 700, numbering: { enabled: false } } } } },
  ];
}

sharedCommonBase.sections = sections("master");

// Official 2026 ethics list: Symbol U+F0B7 (numId 3), followed by TNR text.
// Keep the marker font confined to its run; the paragraph typography stays TNR.
const sourceEthicsMarkers = (items) => items.map((section) => section.id !== "ethics" ? section : {
  ...section,
  blocks: section.blocks.map((block) => block.type === "text" && block.value.startsWith("•\t") ? {
    ...block,
    value: `\uF0B7${block.value.slice(1)}`,
    runs: [{ text: "\uF0B7", fontFamily: "Symbol" }, { text: block.value.slice(1) }],
  } : block),
});

export const afsuLeeMaster = variant("master", "Yüksek Lisans", 3);
export const afsuLeePhd = variant("phd", "Doktora", 5);
export default afsuLeeMaster;
