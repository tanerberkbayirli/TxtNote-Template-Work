import assert from "node:assert/strict";
import { it } from "node:test";
import { thesisMetadataPanel } from "../thesis/metadataPanel.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../thesis/registry.js";
import { compileThesisDocument } from "../thesis/engine.js";

const keys = result => result.fields.map(([key]) => key);
it("requests only content fields from active sections, preserving conditional and nested fields", () => {
  const template = { language: "tr", placeholders: { UNUSED: { label: "Unused" }, USED_PROGRAMS: { label: "Programs" }, TOTAL: { label: "Total", derived: "pageCount" } }, sections: [
    { id: "cover", blocks: [{ type: "metadata", field: "THESIS_TITLE" }, { type: "group", blocks: [{ type: "text", value: "{{STUDENT_NAME}}" }, { type: "metadata", field: "CO_ADVISOR_NAME", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] } }, { type: "metadata", field: "TOTAL" }] }] },
    { id: "declaration", content: "{{USED_PROGRAMS}}" },
  ] };
  const initial = thesisMetadataPanel(template, [{ id: "cover" }]);
  assert.equal(initial.hasPrimaryTitle, true);
  assert.deepEqual(keys(initial), ["STUDENT_NAME", "CO_ADVISOR_NAME"]);
  assert.ok(keys(thesisMetadataPanel(template, [{ id: "cover" }, { id: "declaration" }])).includes("USED_PROGRAMS"));
  assert.equal(thesisMetadataPanel(template, []).hasPrimaryTitle, false);
  assert.deepEqual(keys(thesisMetadataPanel(template, [])), []);
});

it("uses a single alias field and its actual template definition", () => {
  const definition = { label: "Actual department", required: true };
  const result = thesisMetadataPanel({ language: "tr", placeholders: { DEPARTMENT: definition }, sections: [{ id: "cover", content: "{{DEPARTMENT}} {{DEPARTMENT_NAME}}" }] }, [{ id: "cover" }]);
  assert.deepEqual(result.fields, [["DEPARTMENT_NAME", definition]]);
});

it("audits every registered template with optional sections off and on", async () => {
  for (const descriptor of THESIS_TEMPLATE_REGISTRY) {
    const { template } = await resolveThesisTemplate(descriptor);
    for (const enabledSections of [[], template.sections.filter(section => section.status === "optional").map(section => section.id)]) {
      const model = compileThesisDocument(template, { selection: descriptor, enabledSections }, "Test title", "<p>Body</p>");
      const panel = thesisMetadataPanel(template, model.sections);
      assert.equal(new Set(keys(panel)).size, panel.fields.length, template.id);
      assert.ok(!keys(panel).includes("UNIVERSITY_NAME"), template.id);
      if (template.language === "en") assert.ok(!keys(panel).includes("THESIS_TITLE_EN"), template.id);
      if (template.id.startsWith("iyte-eee")) {
        for (const unused of ["CITY", "YEAR", "CO_ADVISOR_NAME", "THESIS_TITLE_EN", "USED_PROGRAMS", "DEPARTMENT_NAME"]) assert.ok(!keys(panel).includes(unused), `${template.id}: ${unused}`);
        for (const required of ["STUDENT_NAME", "STUDENT_NUMBER", "ADVISOR_NAME", "DATE", "COURSE_CODE"]) assert.ok(keys(panel).includes(required), `${template.id}: ${required}`);
      }
    }
  }
});
