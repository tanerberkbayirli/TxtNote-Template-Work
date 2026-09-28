import generic from "./generic.js";

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
export default {
  ...generic,
  id: "demo-university-b-master-tr-v1",
  universityId: "demo-university-b",
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
