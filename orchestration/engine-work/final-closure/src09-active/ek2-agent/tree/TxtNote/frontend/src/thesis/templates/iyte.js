import { iyteLogo, iyteEeeFrame } from "./assets/iyteLogo.js";

// Local official sources and every precedence decision: orchestration/specs/iyte.CONTEXT.md.
// The graduate guide's diagrams are scaled illustrations, not full-size page masters.
const font = "Times New Roman";
const noNumber = { enabled: false };
const roman = { enabled: true, format: "roman-lower" };
const bodyNumber = { enabled: true, format: "arabic", startAt: 1, restart: true };
const style = { fontFamily: font, fontSizePt: 12, align: "justify", lineHeight: 1.5, firstLineIndentMm: 12.7, spaceBeforePt: 0, spaceAfterPt: 0, widowControl: true };
const centered = { ...style, align: "center", firstLineIndentMm: 0 };
const text = (value, extra = {}) => ({ type: "text", value, ...extra });
const meta = (field, extra = {}) => ({ type: "metadata", field, ...extra });
const gap = heightMm => ({ type: "spacer", heightMm });
const at = (block, xMm, yMm, widthMm, heightMm, extra = {}) => ({ ...block, layoutMode: "absolute", flowHeightMm: 0, xMm, yMm, widthMm, heightMm, ...extra });
const field = (label, required = false, defaultValue) => ({ label, type: "text", required, ...(defaultValue === undefined ? {} : { defaultValue }) });
const section = (id, type, title, group = "front", extra = {}) => ({ id, type, title, group, status: "required", mode: "editable", showTitle: true, tocEntry: "title", ...extra });
const front = (id, type, title, extra = {}) => section(id, type, title, "front", { overrides: { page: { numbering: roman }, headings: { "1": { ...centered, fontSizePt: 16, fontWeight: 700, lineHeight: 1, spaceAfterPt: 36, numbering: { enabled: false } } } }, ...extra });
const caption = (label, position) => ({ label, position, style: { ...style, firstLineIndentMm: 0, lineHeight: 1 }, numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" }, align: "center", spacingBeforePt: 18, spacingAfterPt: 18 });
const placeholders = {
  THESIS_TITLE: field("Thesis title (English)", true), THESIS_TITLE_TR: field("Türkçe tez başlığı", true),
  STUDENT_NAME: field("Author (surname in CAPITALS)", true), PROGRAM_NAME: field("Programme name (English)", true),
  MONTH_YEAR: field("Month and year (e.g. October 2026)", true), CITY: field("City", false, "İZMİR"),
  ADVISOR_NAME: field("Supervisor: title and name", true), ADVISOR_AFFILIATION: field("Supervisor: department / institution"),
  CO_ADVISOR_NAME: field("Co-supervisor (if any)"), CO_ADVISOR_AFFILIATION: field("Co-supervisor: department / institution"),
  DEFENSE_DATE: field("Defense date (e.g. 10 October 2026)"), HEAD_NAME: field("Head of department: title and name"),
  DEPARTMENT_NAME: field("Department name"), DEAN_NAME: field("Graduate school dean: title and name"),
  REFERENCE_SYSTEM: field("Citation system: ACS or Chicago (choose with your advisor)", false, "ACS"),
  ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [[`JURY_${i + 1}_NAME`, field(`Committee member ${i + 1}: title and name`)], [`JURY_${i + 1}_AFFILIATION`, field(`Committee member ${i + 1}: department / institution`)] ]).flat()),
};
const titlePage = degree => ({ id: "title-page", type: "innerCover", title: "TITLE PAGE", group: "cover", mode: "static", status: "required", overrides: { body: { ...centered, fontSizePt: 14, fontWeight: 700, lineHeight: 1 }, page: { numbering: { ...roman, enabled: false, startAt: 1, restart: true } } }, blocks: [
  gap(14.8), meta("THESIS_TITLE", { style: { fontSizePt: 18, textTransform: "uppercase" } }), gap(49.4),
  ...["A Thesis Submitted to", "the Graduate School of Engineering and Sciences of", "İzmir Institute of Technology", "in Partial Fulfillment of the Requirements for the Degree of"].map(value => text(value)), gap(5),
  text(degree === "phd" ? "DOCTOR OF PHILOSOPHY" : "MASTER OF SCIENCE"), gap(5), meta("PROGRAM_NAME", { prefix: "in " }),
  gap(19.8), text("by"), meta("STUDENT_NAME"), gap(34.6), meta("MONTH_YEAR"), meta("CITY"),
] });
const outerCover = { id: "outer-cover", type: "outerCover", title: "BOUND COPY FRONT COVER", group: "cover", status: "optional", mode: "static", overrides: { page: { size: "custom", widthMm: 205, heightMm: 290, margins: { leftMm: 25, rightMm: 25, topMm: 25, bottomMm: 25 }, numbering: noNumber }, body: { ...centered, fontSizePt: 20, fontWeight: 700, lineHeight: 1 } }, blocks: [
  // Title and student name flow (page y 80 and 180 for a short title) so a long title pushes the name down instead of overlapping it.
  gap(55), { ...meta("THESIS_TITLE", { style: { textTransform: "uppercase" } }), heightMm: 50 }, gap(50),
  { ...meta("STUDENT_NAME"), heightMm: 30 },
  at(text("İzmir Institute of Technology\n{{MONTH_YEAR}}"), 25, 240, 155, 30),
] };
// Approval rows are flowing column groups with a minimum height equal to the official row pitch: short names keep the source
// positions, a long name wraps inside its own cell and grows downward, and the label never shares a line with it.
const sigCol = (name, affiliation, widthMm, role = "", optional = false, sourceMm = widthMm) => {
  const visibleWhen = optional ? { anyFilled: [name] } : undefined;
  return { type: "group", direction: "column", gapMm: 0, widthPercent: widthMm * 100 / 150, blocks: [
    { type: "separator", thicknessPt: 0.5, widthPercent: sourceMm * 70 / widthMm, align: "left", visibleWhen }, gap(1.8236),
    { ...meta(name, { fallback: "Title Name LASTNAME", visibleWhen, style: { fontWeight: 700 } }), heightMm: 5 },
    ...(role ? [{ ...text(role, { visibleWhen }), heightMm: 5 }] : []),
    { ...meta(affiliation, { visibleWhen }), heightMm: 9 }] };
};
const slot = (minHeightMm, blocks, direction = "column", gapMm = 0) => ({ type: "group", direction, gapMm, minHeightMm, blocks });
const approval = { id: "approval", type: "approval", title: "APPROVAL", group: "front", status: "required", mode: "static", overrides: { page: { numbering: { ...roman, enabled: false } }, body: { ...style, lineHeight: 1, align: "left", firstLineIndentMm: 0 } }, blocks: [
  { ...text("We approve the thesis of {{STUDENT_NAME}}"), heightMm: 15 }, { ...text("Examining Committee Members:", { style: { fontWeight: 700 } }), heightMm: 16 },
  ...Array.from({ length: 5 }, (_, i) => slot(25, [sigCol(`JURY_${i + 1}_NAME`, `JURY_${i + 1}_AFFILIATION`, 150, "", i >= 3)])),
  slot(32, [gap(11), { ...meta("DEFENSE_DATE", { style: { leftIndentMm: 80 } }), widthMm: 150, heightMm: 8 }]),
  slot(38, [sigCol("ADVISOR_NAME", "ADVISOR_AFFILIATION", 78, "Supervisor", false, 74), sigCol("CO_ADVISOR_NAME", "CO_ADVISOR_AFFILIATION", 72, "Co-Supervisor", true)], "row", 0),
  slot(0, [sigCol("HEAD_NAME", "DEPARTMENT_NAME", 78, "Head of the Department", false, 74), { ...sigCol("DEAN_NAME", "DEAN_NAME", 72, "Dean of the Graduate School of Engineering and Sciences"), blocks: sigCol("DEAN_NAME", "DEAN_NAME", 72, "Dean of the Graduate School of Engineering and Sciences").blocks.slice(0, 4) }], "row", 0),
] };
const abstract = (id, title, titleField) => [
  { ...front(id + "-heading", "custom", title), mode: "static", standalone: false, showTitle: false, tocEntry: "title", blocks: [text(title, { style: { ...centered, fontSizePt: 16, fontWeight: 700, lineHeight: 1, spaceAfterPt: 18 } }), meta(titleField, { style: { ...centered, fontSizePt: 14, lineHeight: 1, textTransform: "uppercase", spaceAfterPt: 18 } })] },
  { ...front(id, "abstract", title), showTitle: false, tocEntry: "none", pageBreakBefore: false },
];

export const iyteGraduateBase = {
  schemaVersion: 1, templateVersion: "1.0.0", universityId: "iyte", universityName: "İzmir Yüksek Teknoloji Enstitüsü", instituteId: "lee", instituteName: "Lisansüstü Eğitim Enstitüsü", language: "en", status: "official",
  source: { type: "official", documentName: "IYTE_Lisansustu_Tez_Yazim_Kilavuzu_EN_2019.pdf; local Senate and article-thesis guidelines 2024–2026", verifiedAt: "2026-10-10", notes: [
    "Local archived sources; websites were not reverified. Full source coverage and conflicts: orchestration/specs/iyte.CONTEXT.md.",
    "English thesis and Turkish ÖZET; each abstract is limited to 250 words and must omit references, equations, tables and footnotes (guide §3.1.3–4). Review content before submission.",
    "ACS or Chicago is required by the Senate decision (document dated 19 September 2017 despite archive filename 2024). Choose consistently with your advisor; this template does not automatically validate citation syntax.",
    "Approval example has five signature positions but does not state degree-specific jury counts. Members 4–5 and co-supervisor appear only when filled; confirm the actual committee.",
    "Optional bound cover: 205×290 mm, 20 pt; black hard binding / gold lettering and spine require the binder. Export contains the front artwork only.",
    "Figure 3.3 contains obsolete overlapping labels; the visible corrected labels specify ABSTRACT 16 pt bold / thesis title 14 pt regular.",
  ], usage: ["Tez İngilizce yazılır; ABSTRACT ve Türkçe ÖZET ayrı ayrı en fazla 250 sözcük olmalıdır. Özetlere tablo, denklem, dipnot veya kaynakça eklemeyin.", "Kaynak göstermede danışmanınızla ACS ya da Chicago sistemini seçip tutarlı uygulayın. Şablon kaynakça yazımını otomatik doğrulamaz.", "Jüri üye sayısını kendi kurul kararınıza göre doldurun. Dördüncü/beşinci üye ve ikinci danışman alanları boşsa basılmaz.", "Ciltli dış kapak ayrı bir seçenektir. Siyah cilt, altın yazı ve sırt baskısını basımevi hazırlamalıdır."] },
  page: { size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait", margins: { topMm: 25, bottomMm: 25, leftMm: 35, rightMm: 25 }, header: { heightMm: 0, distanceMm: 0, content: "" }, footer: { heightMm: 0, distanceMm: 20, content: "" }, numbering: { ...roman, position: "bottom", align: "right", startAt: 1, restart: false, baselineFromTopMm: 277, xMm: 170, widthMm: 20, style: { fontFamily: font, fontSizePt: 12 } } },
  typography: { body: style, paragraph: style, headings: {
    // The own-line chapter's 3× line box already includes the required gap below its title.
    // Adding another 36 pt doubles that gap. Guide pp.5/7: baselines 30.27, 49.74, 67.84 mm.
    "1": { ...centered, fontSizePt: 16, fontWeight: 400, textTransform: "uppercase", lineHeight: 3, spaceAfterPt: 0, pageBreakBefore: true, keepWithNext: true, numbering: { enabled: true, format: "CHAPTER {1}", placement: "ownLine" } },
    ...Object.fromEntries([2, 3, 4].map(level => [String(level), { ...style, fontSizePt: 14, fontWeight: 700, firstLineIndentMm: 0, align: "left", lineHeight: 1.5, spaceBeforePt: 24.15, spaceAfterPt: 24.15, keepWithNext: true, numbering: { enabled: true, format: Array.from({ length: level }, (_, i) => `{${i + 1}}`).join(".") + "." } }])),
  }, paragraphStyles: { blockQuote: { ...style, fontSizePt: 10, lineHeight: 1, leftIndentMm: 10, firstLineIndentMm: 0 } }, footnotes: { fontFamily: font, fontSizePt: 10, lineHeight: 1, leftIndentMm: 10, separator: { widthPercent: 100 / 3 } }, lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse" }, justify: "word" },
  placeholders, tables: caption("Table", "above"), figures: caption("Figure", "below"),
  bibliography: { heading: "REFERENCES", style: { ...style, firstLineIndentMm: 0, lineHeight: 1, spaceAfterPt: 12 }, hangingIndentMm: 0 },
  toc: { heading: "TABLE OF CONTENTS", levels: [1, 2, 3, 4], showPageNumbers: true, style: { ...style, firstLineIndentMm: 0, lineHeight: 1 } },
};
function graduate(degree, articles = false) {
  const instituteId = articles ? "lee-articles" : "lee";
  const acknowledgement = front("acknowledgements", "acknowledgements", "ACKNOWLEDGMENTS", { status: "optional", overrides: { ...front("", "", "").overrides, page: { numbering: { ...roman, enabled: false, indexLabelWhenHidden: true } } } });
  const preface = front("preface", "preface", "PREFACE", { status: "optional" });
  const dedication = front("dedication", "dedication", "DEDICATION", { status: "optional", showTitle: false, tocEntry: "none", overrides: { body: centered, page: { numbering: roman } } });
  const sections = [{ ...outerCover, status: articles ? "required" : "optional" }, titlePage(degree), approval,
    ...(articles ? [preface, acknowledgement] : [acknowledgement]), ...abstract("abstract", "ABSTRACT", "THESIS_TITLE"), ...abstract("ozet", "ÖZET", "THESIS_TITLE_TR"), dedication,
    ...(!articles ? [preface] : []),
    front("toc", "tableOfContents", "TABLE OF CONTENTS", { mode: "generated", tocEntry: "none" }),
    front("figures", "listOfFigures", "LIST OF FIGURES", { mode: "generated", visibleWhen: { count: "figures", gte: 1 } }),
    front("tables", "listOfTables", "LIST OF TABLES", { mode: "generated", visibleWhen: { count: "tables", gte: 1 } }),
    front("symbols", "listOfAbbreviations", "SYMBOLS AND ABBREVIATIONS", { status: "optional" }),
    ...(!articles ? [front("dictionary", "custom", "ENGLISH–TURKISH DICTIONARY", { status: "optional" })] : []),
    ...(articles ? [section("introduction", "introduction", "INTRODUCTION", "body", { titleNumbering: "continueH1", overrides: { page: { numbering: bodyNumber } } })] : []),
    section("main", "mainContent", articles ? "ARTICLE 1" : "CHAPTERS", "body", { showTitle: articles, tocEntry: articles ? "title" : "headings", ...(articles ? { titleNumbering: "continueH1" } : { overrides: { page: { numbering: bodyNumber } } }) }),
    ...(articles ? [section("article-2", "custom", "ARTICLE 2", "body", { titleNumbering: "continueH1" }), section("article-3", "custom", "ARTICLE 3", "body", { titleNumbering: "continueH1" }), section("additional-articles", "custom", "ADDITIONAL ARTICLES / SUBMITTED WORK", "body", { status: "optional", showTitle: false, tocEntry: "headings" })] : []),
    ...(articles ? [section("conclusions", "custom", "CONCLUSIONS AND RECOMMENDATIONS", "body", { titleNumbering: "continueH1" })] : []),
    section("bibliography", "bibliography", "REFERENCES", "back", { overrides: { body: { lineHeight: 1, firstLineIndentMm: 0, spaceAfterPt: 12 }, headings: { "1": { ...centered, fontSizePt: 16, lineHeight: 1, spaceAfterPt: 36, numbering: { enabled: false } } } } }),
    section("appendices", "appendices", "APPENDIX A", "back", { status: "optional", overrides: { body: { lineHeight: 1 } } }),
    ...(degree === "phd" || articles ? [section("vita", "curriculumVitae", "VITA", "back", { tocEntry: "none", overrides: { page: { numbering: noNumber } } })] : []),
  ];
  return { ...iyteGraduateBase, id: `iyte-${instituteId}-${degree}-en-v1`, degreeType: degree, instituteId,
    instituteName: articles ? "Lisansüstü Eğitim Enstitüsü · Makalelerden Tez" : iyteGraduateBase.instituteName,
    sections: sections.map(item => ["body", "back"].includes(item.group) ? { ...item, overrides: { ...item.overrides, page: { ...item.overrides?.page, numbering: { enabled: true, format: "arabic", restart: false, ...item.overrides?.page?.numbering } } } } : item),
    ...(articles ? { placeholders: { ...placeholders, ARTICLE_DOIS: field("Accepted / published article DOIs (at least 3; separate with semicolons)", true) }, validation: { ARTICLE_DOIS: { minItems: 3, severity: "warning", message: "2026 yönergesi: en az üç yayımlanmış/kabul edilmiş makale; öğrenci birinci yazar, danışman ortak yazar olmalı. Yayın izinlerini ve danışman onayını ayrıca doğrulayın." } }, source: { ...iyteGraduateBase.source, usage: [...iyteGraduateBase.source.usage.slice(0, 3), "Her makalenin yayın künyesini bölümün ilk paragrafına yazın. En az üç uygun yayın, öğrencinin birinci yazarlığı, danışmanın ortak yazarlığı, yayıncı izinleri ve danışman onayı gerekir. Dış kapak bu tez türünde zorunludur; cilt ve sırt baskısını basımevi hazırlar."], notes: [...iyteGraduateBase.source.notes, "2026 directive supersedes the older doctorate-only scope: master and doctorate eligible; at least 3 articles, English, student first author, advisor co-author, publisher permissions and advisor approval. Each article is a new chapter, preceded by its publication citation. Use INTRODUCTION, one H1 per article, and the separate conclusion section; unpublished submitted work is optional. VITA applies to both degrees under Article 4."] } } : {}),
  };
}
export const iyteMaster = graduate("master");
export const iytePhd = graduate("phd");
export const iyteArticlesMaster = graduate("master", true);
export const iyteArticlesPhd = graduate("phd", true);

const arial = { fontFamily: "Arial", fontSizePt: 11, lineHeight: 1.15, align: "justify", firstLineIndentMm: 0, leftIndentMm: 12.5069, spaceAfterPt: 10, spaceBeforePt: 0 };
const eeeCaption = label => ({ label, position: "below", style: { ...arial, leftIndentMm: 0, fontWeight: 700, align: "center", lineHeight: 1 }, numbering: { scope: "document", format: "{n}", sequence: "arabic" }, align: "center" });
export const iyteEee = {
  schemaVersion: 1, templateVersion: "1.0.0", id: "iyte-eee-undergraduate-en-v1", universityId: "iyte", universityName: iyteGraduateBase.universityName,
  instituteId: "eee", instituteName: "Elektrik-Elektronik Mühendisliği · Bitirme Projesi", degreeType: "undergraduate", language: "en", status: "official",
  source: { type: "official", documentName: "IYTE_EEE_BSc_Project_Final_Report_Format_2025-12.docx", verifiedAt: "2026-10-10", notes: ["Source DOCX SHA / XML extraction / Word render: orchestration/artifacts/iyte/source/eee-word and eee-extracted.json.", "Letter 215.9×279.4 mm, 25.4 mm margins, Arial 11; preserve this department source rather than applying the graduate guide.", "The official sample contains a broken PROBLEM DEFINITION TOC bookmark; generated live indexes replace the broken sample. Example research figures/data and author names are not copied into new work.", "The example table caption is BELOW its table. Citation examples are numbered [n]; the graduate ACS/Chicago mandate is not imposed on undergraduate projects."], usage: ["Bu bölümün resmî dosyası Letter boyutunda ve Arial 11 punto kullanır; lisansüstü tez kuralları uygulanmaz.", "EE491 / EE492 kodunu, öğrenci numarasını, danışmanı ve tarihi doldurun. Denklemleri düzenlenebilir denklem olarak ekleyin.", "Giriş, problem tanımı, önerilen çözüm, sonuçların tartışılması ve sonuç bölümlerini tamamlayın. İçindekiler ve görsel listeleri belgeden üretilir."] },
  page: { size: "Letter", widthMm: 215.9, heightMm: 279.4, orientation: "portrait", margins: { topMm: 25.4, bottomMm: 25.4, leftMm: 25.4, rightMm: 25.4 }, header: { heightMm: 0, distanceMm: 0 }, footer: { heightMm: 0, distanceMm: 12.7 }, numbering: { enabled: true, position: "bottom", align: "right", format: "arabic", startAt: 1, restart: false, style: { fontFamily: "Arial", fontSizePt: 11, fontWeight: 700 } } },
  typography: { body: arial, paragraph: arial, headings: Object.fromEntries([1, 2, 3, 4].map(level => [String(level), { ...arial, fontWeight: 700, leftIndentMm: level === 1 ? 0 : 6.35, align: "left", keepWithNext: true, ...(level === 1 ? { pageBreakBefore: true, textTransform: "uppercase" } : {}), numbering: { enabled: true, format: Array.from({ length: level }, (_, i) => `{${i + 1}}`).join(".") + "." } }])), lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse" }, justify: "word" },
  placeholders: { THESIS_TITLE: field("Project title", true), STUDENT_NAME: field("Student name and surname", true), STUDENT_NUMBER: field("Student number", true), ADVISOR_NAME: field("Advisor name and surname", true), DATE: { label: "Report date", type: "date", required: true }, COURSE_CODE: field("Course code", false, "EE491 / EE492") },
  sections: [
    { id: "cover", type: "outerCover", title: "PROJECT COVER", group: "cover", mode: "static", status: "required", overrides: { page: { numbering: noNumber }, body: { ...arial, leftIndentMm: 0, align: "center", spaceAfterPt: 0, lineHeight: 1 } }, blocks: [
      at({ type: "image", source: iyteLogo }, 95, 25.4, 25, 25),
      at(text("DEPARTMENT OF ELECTRICAL\nAND ELECTRONICS\nENGINEERING", { style: { fontWeight: 700 } }), 76, 59, 67, 20),
      at(text("{{COURSE_CODE}} PROJECT REPORT", { style: { fontWeight: 700 } }), 44, 88, 129, 9),
      at({ type: "image", source: iyteEeeFrame }, 42.34, 97.89, 139.95, 156.28),
      at(meta("THESIS_TITLE"), 47, 105.6, 125, 30),
      at(text("{{STUDENT_NAME}}\n{{STUDENT_NUMBER}}"), 47, 159, 125, 20),
      at(meta("ADVISOR_NAME"), 47, 214.8, 125, 20),
      at(meta("DATE", { prefix: "DATE: ", style: { fontFamily: "Calibri" } }), 47, 243.4, 125, 8),
    ] },
    section("abstract", "abstract", "ABSTRACT", "front", { overrides: { page: { numbering: { enabled: true, format: "arabic", startAt: 1, restart: true } } } }),
    section("toc", "tableOfContents", "TABLE OF CONTENTS", "front", { mode: "generated", tocEntry: "none" }),
    section("abbreviations", "listOfAbbreviations", "ABBREVIATIONS"),
    section("figures", "listOfFigures", "LIST OF FIGURES", "front", { mode: "generated" }),
    section("tables", "listOfTables", "LIST OF TABLES", "front", { mode: "generated" }),
    section("introduction", "introduction", "INTRODUCTION", "body", { titleNumbering: "continueH1" }),
    section("problem", "custom", "PROBLEM DEFINITION", "body", { titleNumbering: "continueH1" }),
    section("main", "mainContent", "PROPOSED SOLUTION", "body", { titleNumbering: "continueH1" }),
    section("results", "custom", "RESULTS AND DISCUSSIONS", "body", { titleNumbering: "continueH1" }),
    section("conclusions", "custom", "CONCLUSIONS", "body", { titleNumbering: "continueH1" }),
    section("bibliography", "bibliography", "REFERENCES", "back"),
    section("appendices", "appendices", "APPENDIX", "back", { status: "optional" }),
  ],
  tables: eeeCaption("Table"), figures: eeeCaption("Figure"), bibliography: { heading: "REFERENCES", style: { ...arial, leftIndentMm: 0 }, hangingIndentMm: 12.5 }, toc: { heading: "TABLE OF CONTENTS", levels: [1, 2], showPageNumbers: true },
};
