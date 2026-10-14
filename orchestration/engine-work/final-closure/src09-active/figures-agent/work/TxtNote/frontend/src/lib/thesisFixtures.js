// Test-only invented template fixtures (no university policy implied). Never import from production code.
import generic from "../thesis/templates/generic.js";

const fixtureA = (() => {
  
  
  const [cover, abstract, ...rest] = generic.sections;
  const label = { fontWeight: 700 };
  const lines = { spaceAfterPt: 0 };
  
  const TEMPLATE = {
    ...generic,
    id: "fixture-university-a-master-tr-v1",
    universityId: "fixture-university-a",
    universityName: "DEMO Üniversite A",
    instituteId: "graduate",
    instituteName: "DEMO Lisansüstü Enstitüsü",
    status: "demo",
    source: { type: "manual", documentName: "Test verisi A — resmî değildir" },
    sections: [
      { ...cover, blocks: [
        { type: "spacer", heightMm: 10 },
        { type: "text", value: "{{UNIVERSITY_NAME}}", style: { fontSizePt: 15, fontWeight: 700 } },
        { type: "text", value: "{{INSTITUTE_NAME}}", style: label },
        { type: "spacer", heightMm: 38 },
        { type: "metadata", field: "THESIS_TITLE", style: { fontSizePt: 17, fontWeight: 700, textTransform: "uppercase" } },
        { type: "spacer", heightMm: 25 },
        { type: "metadata", field: "STUDENT_NAME" },
        { type: "spacer", heightMm: 20 },
        { type: "text", value: "YÜKSEK LİSANS TEZİ", style: label },
        { type: "spacer", heightMm: 17 },
        { type: "group", style: lines, marginBottomMm: 2.1, blocks: [{ type: "text", value: "Danışman" }, { type: "metadata", field: "ADVISOR_NAME" }] },
        { type: "spacer", heightMm: 23 },
        { type: "group", style: lines, marginBottomMm: 2.1, blocks: [{ type: "metadata", field: "CITY" }, { type: "metadata", field: "YEAR" }] },
      ] },
      ...[abstract, ...rest].map((section) => ({ ...section })),
    ],
  };
  return TEMPLATE;
})();
const fixtureB = (() => {
  
  
  const label = { fontWeight: 700 };
  const lines = { spaceAfterPt: 0 };
  const juryMember = (field, role) => ({ type: "group", direction: "row", gapMm: 10, marginBottomMm: 8, blocks: [
    { type: "group", widthPercent: 60, style: lines, blocks: [{ type: "metadata", field, fallback: "……………………………" }, { type: "text", value: role, style: { fontSizePt: 10, italic: true } }] },
    { type: "group", blocks: [{ type: "spacer", heightMm: 6 }, { type: "separator" }, { type: "text", value: "İmza", style: { ...lines, fontSizePt: 10, align: "center" } }] },
  ] });
  const infoRow = (title, field) => ({ type: "group", direction: "row", gapMm: 4, style: lines, marginBottomMm: 2, blocks: [
    { type: "text", value: title, widthPercent: 28, style: label },
    { type: "metadata", field },
  ] });
  
  const font = "Arial";
  const TEMPLATE = {
    ...generic,
    id: "fixture-university-b-master-tr-v1",
    universityId: "fixture-university-b",
    universityName: "DEMO Üniversite B",
    instituteId: "science",
    instituteName: "DEMO Fen Enstitüsü",
    status: "demo",
    source: { type: "manual", documentName: "Test verisi B — resmî değildir" },
    placeholders: {
      ...generic.placeholders,
      JURY_MEMBER_1: { label: "Jüri üyesi 1 (Başkan)", type: "text" },
      JURY_MEMBER_2: { label: "Jüri üyesi 2", type: "text" },
      JURY_MEMBER_3: { label: "Jüri üyesi 3", type: "text" },
      DEFENSE_DATE: { label: "Savunma tarihi", type: "date" },
    },
    page: { ...generic.page, margins: { topMm: 30, bottomMm: 20, leftMm: 35, rightMm: 20 }, header: { ...generic.page.header, content: "{{UNIVERSITY_NAME}} · {{STUDENT_NAME}}" }, numbering: { ...generic.page.numbering, align: "right" } },
    typography: {
      body: { ...generic.typography.body, fontFamily: font, fontSizePt: 11, lineHeight: 1.4 },
      headings: Object.fromEntries(Object.entries(generic.typography.headings).map(([level, style]) => [level, { ...style, fontFamily: font, textTransform: level === "1" ? "uppercase" : "none", numbering: { enabled: true, format: { 1: "BÖLÜM {1}", 2: "{1}.{2}" }[level] || style.numbering.format } }])),
    },
    sections: [
      { ...generic.sections[0], overrides: { ...generic.sections[0].overrides, page: { ...generic.sections[0].overrides.page, header: { firstPage: "omit" } } }, blocks: [
        { type: "spacer", heightMm: 18 },
        { type: "metadata", field: "UNIVERSITY_NAME", style: { fontSizePt: 14, fontWeight: 700, align: "left", textTransform: "uppercase", firstLineIndentMm: 0 } },
        { type: "metadata", field: "INSTITUTE_NAME", style: { fontSizePt: 11, align: "left", firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 48 },
        { type: "metadata", field: "THESIS_TITLE", style: { fontSizePt: 21, fontWeight: 700, align: "left", lineHeight: 1.2, firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 18 },
        { type: "metadata", field: "STUDENT_NAME", style: { fontSizePt: 13, align: "right", firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 32 },
        { type: "text", value: "YÜKSEK LİSANS TEZİ\nDanışman: {{ADVISOR_NAME}}", style: { fontSizePt: 11, align: "left", firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 23 },
        { type: "text", value: "{{CITY}} · {{YEAR}}", style: { fontSizePt: 11, align: "right", firstLineIndentMm: 0 } },
      ] },
      // Counted as page i but printed without a number; wider top margin than the body.
      { id: "approval", type: "approval", title: "Onay", status: "required", group: "front", mode: "static",
        overrides: { page: { margins: { topMm: 35 }, numbering: { enabled: false, format: "roman-lower", startAt: 1, restart: true } }, body: { firstLineIndentMm: 0, align: "left" } },
        blocks: [
          { type: "text", value: "TEZ ONAY SAYFASI", style: { fontSizePt: 14, fontWeight: 700, align: "center" }, marginBottomMm: 10 },
          { type: "text", value: "Aşağıda bilgileri verilen tez, jüri tarafından yüksek lisans tezi olarak incelenmiş ve kabul edilmiştir. (Demo metin — resmî değildir.)", style: { align: "justify" }, marginBottomMm: 8 },
          infoRow("Tez başlığı", "THESIS_TITLE"),
          infoRow("Öğrenci", "STUDENT_NAME"),
          infoRow("Danışman", "ADVISOR_NAME"),
          { type: "separator", marginTopMm: 8, marginBottomMm: 8, thicknessPt: 0.5 },
          { type: "text", value: "JÜRİ ÜYELERİ", style: label, marginBottomMm: 6 },
          juryMember("JURY_MEMBER_1", "Jüri Başkanı"),
          juryMember("JURY_MEMBER_2", "Jüri Üyesi"),
          juryMember("JURY_MEMBER_3", "Jüri Üyesi"),
          { type: "spacer", heightMm: 6 },
          infoRow("Savunma tarihi", "DEFENSE_DATE"),
        ] },
      { id: "ethics", type: "ethicsDeclaration", title: "Etik beyan", status: "required", group: "front", mode: "static",
        overrides: { page: { numbering: { format: "roman-lower" } } },
        blocks: [
          { type: "text", value: "ETİK BEYAN", style: { fontSizePt: 14, fontWeight: 700, align: "center", firstLineIndentMm: 0 }, marginBottomMm: 12 },
          { type: "text", value: "Bu tezin hazırlanmasında bilimsel ve etik kurallara uyulduğunu, başkalarının eserlerinden yararlanılan bütün bölümlerde ilgili kaynaklara atıf yapıldığını, tezde kullanılan verilerde herhangi bir tahrifat yapılmadığını ve tezin herhangi bir bölümünün bu üniversitede ya da başka bir kurumda başka bir tez çalışması olarak sunulmadığını beyan ederim." },
          { type: "text", value: "Bu metin yalnızca şablon motorunu göstermek için yazılmış bir demo beyandır; herhangi bir kurumun resmî etik beyanı değildir." },
          { type: "spacer", heightMm: 20 },
          { type: "group", style: { ...lines, align: "right", firstLineIndentMm: 0 }, blocks: [
            { type: "metadata", field: "DATE", fallback: "…… / …… / ……" },
            { type: "metadata", field: "STUDENT_NAME" },
            { type: "separator", widthPercent: 40, align: "right", marginTopMm: 14, marginBottomMm: 1 },
            { type: "text", value: "İmza", style: { fontSizePt: 10 } },
          ] },
        ] },
      // The roman sequence started on the approval page; the abstract continues it.
      { ...generic.sections[1], overrides: { page: { numbering: { format: "roman-lower" } } } },
      ...generic.sections.slice(2).map((section) => ({ ...section })),
    ],
    tables: { ...generic.tables, style: { ...generic.tables.style, fontFamily: font } },
    figures: { ...generic.figures, style: { ...generic.figures.style, fontFamily: font } },
    bibliography: { ...generic.bibliography, style: { ...generic.bibliography.style, fontFamily: font } },
  };
  return TEMPLATE;
})();
const fixtureC = (() => {
  
  
  const TEMPLATE = {
    ...generic,
    id: "fixture-university-c-phd-en-v1",
    universityId: "fixture-university-c",
    universityName: "DEMO University C",
    instituteId: "research",
    instituteName: "DEMO Research Institute",
    degreeType: "phd",
    language: "en",
    status: "demo",
    source: { type: "manual", documentName: "Test data C — not official" },
    placeholders: {
      ...generic.placeholders,
      JURY_MEMBER_1: { label: "Examiner 1", type: "text" },
      JURY_MEMBER_2: { label: "Examiner 2", type: "text" },
      JURY_MEMBER_3: { label: "Examiner 3", type: "text" },
      DEFENSE_DATE: { label: "Date of defence", type: "date" },
    },
    page: { ...generic.page, margins: { topMm: 22, bottomMm: 28, leftMm: 28, rightMm: 28 }, numbering: { ...generic.page.numbering, position: "top", align: "right" } },
    typography: {
      body: { ...generic.typography.body, fontFamily: "Times New Roman", fontSizePt: 12, lineHeight: 1.6 },
      headings: Object.fromEntries(Object.entries(generic.typography.headings).map(([level, style]) => [level, { ...style, italic: level === "2", textTransform: level === "1" ? "uppercase" : "none", pageBreakBefore: level === "1" }])),
    },
    sections: [
      { ...generic.sections[0], title: "Title page", blocks: [
        { type: "spacer", heightMm: 17 },
        { type: "text", value: "{{UNIVERSITY_NAME}}", style: { fontSizePt: 13, fontWeight: 700, align: "right", firstLineIndentMm: 0 } },
        { type: "text", value: "{{INSTITUTE_NAME}}", style: { fontSizePt: 11, align: "right", firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 39 },
        { type: "text", value: "DOCTORAL DISSERTATION", style: { fontSizePt: 11, fontWeight: 700, align: "center", characterSpacingPt: 1, firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 14 },
        { type: "text", value: "{{THESIS_TITLE}}", style: { fontSizePt: 19, fontWeight: 700, align: "center", lineHeight: 1.25, firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 28 },
        { type: "text", value: "{{STUDENT_NAME}}", style: { fontSizePt: 13, align: "center", firstLineIndentMm: 0 } },
        { type: "spacer", heightMm: 27 },
        { type: "text", value: "Supervisor: {{ADVISOR_NAME}}\n{{CITY}} · {{YEAR}}", style: { fontSizePt: 11, align: "center", firstLineIndentMm: 0 } },
      ] },
      // Same generic renderer as the cover; here the declaration precedes an optional approval page.
      { id: "declaration", type: "declaration", title: "Declaration", status: "required", group: "front", mode: "static", overrides: { page: { numbering: { format: "roman-upper", startAt: 1, restart: true } }, body: { firstLineIndentMm: 0 } }, blocks: [
        { type: "text", value: "DECLARATION", style: { fontSizePt: 14, fontWeight: 700, align: "center" }, marginBottomMm: 12 },
        { type: "text", value: "I declare that this work is my own. All material taken from the work of others has been cited, no part of this dissertation has been submitted for another degree, and the data reported here have not been altered. (Demo text — not an official declaration.)" },
        { type: "spacer", heightMm: 18 },
        { type: "group", style: { align: "left", spaceAfterPt: 0 }, blocks: [
          { type: "metadata", field: "STUDENT_NAME", prefix: "Name: " },
          { type: "metadata", field: "DATE", prefix: "Date: ", fallback: "Date:" },
          { type: "separator", widthPercent: 45, align: "left", marginTopMm: 14, marginBottomMm: 1 },
          { type: "text", value: "Signature", style: { fontSizePt: 10, italic: true } },
        ] },
      ] },
      { id: "approval", type: "approval", title: "Approval", status: "optional", group: "front", mode: "static", overrides: { page: { numbering: { format: "roman-upper" } }, body: { firstLineIndentMm: 0, align: "center" } }, blocks: [
        { type: "text", value: "APPROVAL", style: { fontSizePt: 14, fontWeight: 700 }, marginBottomMm: 10 },
        { type: "metadata", field: "THESIS_TITLE", prefix: "“", suffix: "”", style: { italic: true } },
        { type: "metadata", field: "STUDENT_NAME", prefix: "submitted by " },
        { type: "spacer", heightMm: 16 },
        ...["JURY_MEMBER_1", "JURY_MEMBER_2", "JURY_MEMBER_3"].map((field) => ({ type: "group", direction: "row", gapMm: 8, marginBottomMm: 10, style: { spaceAfterPt: 0 }, blocks: [
          { type: "metadata", field, widthPercent: 55, fallback: "Examiner", style: { align: "left" } },
          { type: "separator", marginTopMm: 5 },
        ] })),
        { type: "metadata", field: "DEFENSE_DATE", prefix: "Date of defence: " },
      ] },
      { ...generic.sections[1], title: "Abstract", pageBreakBefore: false, overrides: { page: { numbering: { format: "roman-upper" } } } },
      { ...generic.sections[2], title: "Contents", overrides: { page: { numbering: { format: "roman-upper" } } } },
      { ...generic.sections[3], title: "Research chapters" },
      { ...generic.sections[5], title: "Appendices", status: "required", overrides: { headings: { "1": { numbering: { enabled: true, format: "APPENDIX {1}" }, textTransform: "uppercase" } } } },
      { ...generic.sections[4], title: "References" },
    ],
    tables: { ...generic.tables, label: "Table", numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
    figures: { ...generic.figures, label: "Figure", numbering: { scope: "document", format: "{n}", sequence: "arabic" } },
    bibliography: { ...generic.bibliography, heading: "References" },
    toc: { ...generic.toc, heading: "Contents" },
  };
  return TEMPLATE;
})();

export { fixtureA, fixtureB, fixtureC };

const descriptor = (template, instituteName, universityName) => ({ id: template.id, templateVersion: template.templateVersion, universityId: template.universityId, universityName, instituteId: template.instituteId, instituteName, degreeType: template.degreeType, language: template.language, status: template.status, selectors: {}, load: async () => ({ default: template }) });

export const FIXTURE_REGISTRY = Object.freeze([
  descriptor(fixtureA, fixtureA.instituteName, fixtureA.universityName),
  descriptor(fixtureB, fixtureB.instituteName, fixtureB.universityName),
  descriptor(fixtureC, fixtureC.instituteName, fixtureC.universityName),
]);
