import generic from "./generic.js";

/**
 * Invented test fixture for editable layouts (`layoutMode: "editable"`): the Demo A cover
 * and a jury page are seeded from blocks and then edited like any other section. No
 * university policy is implied.
 */
const [cover, abstract, ...rest] = generic.sections;
const label = { fontWeight: 700 };
const lines = { spaceAfterPt: 0 };
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export default {
  ...generic,
  id: "demo-university-d-master-tr-v1",
  universityId: "demo-university-d",
  universityName: "DEMO Üniversite D",
  instituteId: "graduate",
  instituteName: "DEMO Lisansüstü Enstitüsü",
  status: "demo",
  source: { type: "manual", documentName: "Test verisi D — düzenlenebilir kapak; resmî değildir" },
  sections: [
    { ...cover, mode: "editable", layoutMode: "editable", blocks: [
      { type: "spacer", heightMm: 10 },
      { type: "image", source: PNG, widthMm: 20, heightMm: 20, align: "center" },
      { type: "text", value: "{{UNIVERSITY_NAME}}", style: { fontSizePt: 15, fontWeight: 700 } },
      { type: "text", value: "{{INSTITUTE_NAME}}", style: label },
      { type: "spacer", heightMm: 38 },
      { type: "metadata", field: "THESIS_TITLE", style: { fontSizePt: 18, fontWeight: 700, textTransform: "uppercase" } },
      { type: "spacer", heightMm: 25 },
      { type: "metadata", field: "STUDENT_NAME", fallback: "Ad SOYAD" },
      { type: "spacer", heightMm: 20 },
      { type: "text", value: "YÜKSEK LİSANS TEZİ", style: label },
      { type: "spacer", heightMm: 17 },
      { type: "group", style: lines, marginBottomMm: 2.1, blocks: [{ type: "text", value: "Danışman" }, { type: "metadata", field: "ADVISOR_NAME", fallback: "Unvan Ad SOYAD" }] },
      { type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, style: lines, blocks: [{ type: "text", value: "İkinci Danışman" }, { type: "metadata", field: "CO_ADVISOR_NAME" }] },
      { type: "spacer", heightMm: 23 },
      { type: "group", style: lines, marginBottomMm: 2.1, blocks: [{ type: "metadata", field: "CITY", fallback: "Şehir" }, { type: "metadata", field: "YEAR" }] },
    ] },
    { id: "jury", type: "juryApproval", title: "Jüri Onayı", status: "required", group: "front", mode: "editable", layoutMode: "editable",
      overrides: { page: { numbering: { enabled: false } }, body: { firstLineIndentMm: 0, spaceAfterPt: 0, lineHeight: 1 } },
      blocks: [
        { type: "text", value: "JÜRİ ONAYI", style: { fontWeight: 700, align: "center" } },
        { type: "spacer", heightMm: 8 },
        { type: "text", value: "{{STUDENT_NAME}} tarafından hazırlanan “{{THESIS_TITLE}}” başlıklı tez jürimiz tarafından oy birliği ile kabul edilmiştir.", style: { align: "justify" } },
        { type: "spacer", heightMm: 20 },
        { type: "group", direction: "row", gapMm: 6, blocks: [
          { type: "group", blocks: [{ type: "separator", widthPercent: 100, thicknessPt: 0.75 }, { type: "text", value: "Danışman", style: { align: "center" } }] },
          { type: "group", blocks: [{ type: "separator", widthPercent: 100, thicknessPt: 0.75 }, { type: "text", value: "Üye", style: { align: "center" } }] },
          { type: "group", blocks: [{ type: "separator", widthPercent: 100, thicknessPt: 0.75 }, { type: "text", value: "Üye", style: { align: "center" } }] },
        ] },
      ] },
    ...[abstract, ...rest].map((section) => ({ ...section })),
  ],
};
