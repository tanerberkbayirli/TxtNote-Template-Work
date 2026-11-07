import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createThesisDocument } from "../../../../engine/src/document.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { validateThesisPageCounts } from "../../../../engine/src/contentConformance.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { walkSpecialPage } from "../../../../engine/src/specialPages.js";
import { citationHtml } from "../../../../engine/src/citations.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const entries = THESIS_TEMPLATE_REGISTRY.filter(entry => entry.universityId === "afsu");

test("all seven AFSÜ selections create and reopen their own programme, with retained official source bytes", async () => {
  assert.equal(entries.length, 7);
  const checked = new Set();
  for (const entry of entries) {
    const selection = Object.fromEntries(["universityId", "instituteId", "degreeType", "language"].map(key => [key, entry[key]]));
    const result = await resolveThesisTemplate(selection);
    assert.equal(result.fallback, false, result.reason);
    assert.equal(result.template.id, entry.id);
    assert.deepEqual(validateThesisTemplate(result.template), []);
    const saved = JSON.parse(JSON.stringify(createThesisDocument(result.template, selection, 2026)));
    const reopened = await resolveThesisTemplate({ ...saved.selection, templateId: saved.templateId });
    assert.equal(reopened.fallback, false, reopened.reason);
    assert.equal(reopened.template.id, entry.id);
    const documents = reopened.template.source.currentSourceVerification.documents;
    assert.ok(documents.length > 0, entry.id);
    for (const document of documents) {
      if (checked.has(document.path)) continue;
      assert.equal(createHash("sha256").update(readFileSync(root + document.path)).digest("hex"), document.sha256, document.path);
      assert.match(document.url, /^https:\/\/[^/]*afsu\.edu\.tr\//);
      checked.add(document.path);
    }
  }
});

test("AFSÜ enforces source keyword limits and language-specific alphabetical order", async () => {
  for (const entry of entries.filter(entry => !entry.id.includes("proposal"))) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const fields = Object.keys(template.validation).filter(key => key.startsWith("KEYWORDS"));
    const compile = value => compileThesisDocument(template, { values: Object.fromEntries(fields.map(field => [field, value])) }, "Tez", "");
    const tooMany = compile("A, B, C, D, E, F");
    for (const field of fields) {
      assert.ok(tooMany.validation.warnings.some(issue => issue.code === "maxItems" && issue.field === field), `${entry.id}.${field}`);
      assert.ok(compile("Z, B, A").validation.warnings.some(issue => issue.code === "alphabetical" && issue.field === field));
      assert.ok(!compile("A, B, C, D, E").validation.warnings.some(issue => issue.field === field));
    }
  }
});

test("LEE abstract minimum excludes the separately generated title and keyword text", async () => {
  for (const entry of entries.filter(entry => /^afsu-lee-(master|phd)-/.test(entry.id))) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const compile = count => compileThesisDocument(template, {
      values: { KEYWORDS: "A, B, C", KEYWORDS_EN: "A, B, C" },
      sectionContent: { "abstract-tr": `<p>${"kelime ".repeat(count)}</p>`, "abstract-en": `<p>${"word ".repeat(count)}</p>` },
    }, "Uzun tez başlığı ve ek kelimeler", "");
    for (const field of ["abstract-tr", "abstract-en"]) {
      assert.ok(compile(249).validation.warnings.some(issue => issue.code === "minWords" && issue.field === field && issue.actual === 249));
      assert.ok(!compile(250).validation.warnings.some(issue => issue.code === "minWords" && issue.field === field));
    }
  }
});

test("LEE and medical theses report missing or reordered source-required chapters", async () => {
  for (const entry of entries.filter(entry => !/proposal|eczacilik/.test(entry.id))) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const titles = ["GİRİŞ", "GENEL BİLGİLER", "GEREÇ VE YÖNTEM", "BULGULAR", "TARTIŞMA", "SONUÇ VE ÖNERİLER"];
    const compile = headings => compileThesisDocument(template, {}, "Tez", headings.map(title => `<h1>${title}</h1><p>Metin.</p>`).join(""));
    assert.ok(!compile(titles).validation.warnings.some(issue => ["missingHeadings", "headingOrder"].includes(issue.code)));
    assert.ok(compile(titles.slice(1)).validation.warnings.some(issue => issue.code === "missingHeadings"));
    assert.ok(compile([...titles].reverse()).validation.warnings.some(issue => issue.code === "headingOrder"));
  }
});

test("one-page abstract limits apply to the full physical group, including heading and keyword footer", async () => {
  for (const entry of entries.filter(entry => !entry.id.includes("proposal"))) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const model = compileThesisDocument(template, {}, "Tez", "");
    const ids = entry.id.includes("eczacilik") ? ["abstract-tr-title", "abstract-en-title"] : ["abstract-header", "abstract-en-header"];
    for (const id of ids) {
      assert.equal(validateThesisPageCounts(model, { [id]: 2 })[0]?.code, "maxPages", entry.id);
      assert.deepEqual(validateThesisPageCounts(model, { [id]: 1 }), []);
    }
  }
});

test("both proposal degrees render the APA bibliography required by proposal guide section 1.1", async () => {
  for (const entry of entries.filter(entry => entry.id.includes("proposal"))) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const model = compileThesisDocument(template, { sectionContent: { bibliography: "<p>Yılmaz, A. (2026). Örnek çalışma.</p>" } }, "Öneri", "");
    const section = model.sections.find(section => section.type === "bibliography");
    assert.ok(section);
    assert.match(section.html, /Yılmaz/);
    assert.equal(template.bibliography.citationStyle, "apa");
  }
});

test("AFSÜ covers print the department suffix once for either input form", async () => {
 for (const entry of entries) {
  const { template } = await resolveThesisTemplate({ templateId: entry.id });
  for (const name of ["Farmasötik Teknoloji", "Farmasötik Teknoloji ANABİLİM DALI", "Farmasötik Teknoloji Ana Bilim Dalı"]) {
    const model = compileThesisDocument(template, { values: { DEPARTMENT_NAME: name } }, "Proje", "");
    for (const section of model.sections.filter(section=>['outerCover','innerCover'].includes(section.type))) {
      const nodes = [...walkSpecialPage(section.layout)];
      for (const node of nodes.filter(node=>node.field === 'DEPARTMENT_NAME')) {
       const text=node.text;
       assert.equal((text.toLocaleLowerCase("tr").match(/ana\s*bilim\s+dalı/gu) || []).length, 1, `${entry.id}: ${text}`);
      }
    }
  }
 }
});

test("medical linked citations follow first-use numbering instead of alphabetical author order", async () => {
  const sources = [{ id: "z", authors: "Zeren, Deniz", kind: "book", year: "2026", title: "Z kitabı" }, { id: "a", authors: "Aksoy, Ada", kind: "book", year: "2025", title: "A kitabı" }];
  for (const id of ["afsu-tip-uzmanlik-tr-v1", "afsu-dis-hekimligi-uzmanlik-tr-v1"]) {
    const { template } = await resolveThesisTemplate({ templateId: id });
    const model = compileThesisDocument(template, { sources }, "Tez", `<p>${citationHtml("z", { key: "z1" })} ${citationHtml("a", { key: "a1" })} ${citationHtml("z", { key: "z2" })}</p>`);
    assert.equal(model.citations.mode, "numeric");
    const html = model.sections.find(section => section.id === "bibliography").html;
    assert.ok(html.indexOf('data-thesis-source-id="z"') < html.indexOf('data-thesis-source-id="a"'));
  }
});
