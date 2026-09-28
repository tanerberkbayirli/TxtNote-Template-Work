import generic from "./generic.js";

const [cover, abstract, ...rest] = generic.sections;
const label = { fontWeight: 700 };
const lines = { spaceAfterPt: 0 };

export default {
  ...generic,
  id: "demo-university-a-master-tr-v1",
  universityId: "demo-university-a",
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
