import assert from "node:assert/strict";
import { test } from "node:test";
import { contentRuleIssues, validateThesisPageCounts } from "./contentConformance.js";
import { compileThesisDocument } from "./engine.js";
import { mcbuTipUzmanlik } from "./templates/mcbu-tip.js";

test("required chapter alternatives are matched in order and missing chapters are reported", () => {
  const rule = { headingSequence:["GİRİŞ",["SONUÇ VE ÖNERİLER","SONUÇLAR VE ÖNERİLER"]], headingLevel:1 };
  assert.deepEqual(contentRuleIssues("main",rule,'<h1>I. Giriş</h1><h2>Başka</h2><h1>Sonuçlar ve Öneriler</h1>'),[]);
  assert.equal(contentRuleIssues("main",rule,'<h1>Sonuç ve Öneriler</h1><h1>Giriş</h1>')[0].code,"headingOrder");
  assert.equal(contentRuleIssues("main",rule,'<h1>Giriş</h1>')[0].code,"missingHeadings");
});

test("numeric citation checks reject author-year and incorrect first-use order without rewriting prose", () => {
  const rule = {numericCitations:true};
  assert.deepEqual(contentRuleIssues("main",rule,"<p>Metin (1). Devam (2, 3). Tekrar (1).</p>"),[]);
  assert.ok(contentRuleIssues("main",rule,"<p>Metin (Karasar, 2020, s. 45).</p>").some(row=>row.code==="authorYearCitation"));
  assert.ok(contentRuleIssues("main",rule,"<p>Metin (2). Sonra (1).</p>").some(row=>row.code==="citationOrder"));
  assert.deepEqual(contentRuleIssues("main",rule,"<p>Metin (1–3). Sonra (4).</p>"),[]);
});

test("bibliography accepts explicit numeric rows and automatic ordered lists; flags unnumbered or broken rows", () => {
  const rule = {numberedEntries:true};
  for (const html of ['<p>1. A.</p><p>2. B.</p>','<ol><li>A.</li><li>B.</li></ol>','<ul><li>1. A.</li><li>2. B.</li></ul>']) assert.deepEqual(contentRuleIssues("bibliography",rule,html),[]);
  for (const html of ['<p>Smith (2020). A.</p>','<p>1. A.</p><p>3. B.</p>','<ol start="2"><li>A.</li></ol>']) assert.equal(contentRuleIssues("bibliography",rule,html)[0].code,"numberedBibliography");
});

test("MCBU medical output exposes incomplete structure/citations and the English title, while valid content passes", () => {
  const required = mcbuTipUzmanlik.validation.main.headingSequence.map(group=>Array.isArray(group)?group[0]:group);
  const sections = { preface:"<p>Önsöz</p>", abstract:"<p>Özet</p>", "abstract-en":"<p>Abstract</p>", bibliography:"<p>1. First source.</p><p>2. Second source.</p>" };
  const main = required.map((title,index)=>`<h1>${title}</h1><p>Metin${index<2?` (${index+1})`:''}.</p>`).join('');
  const correct = compileThesisDocument(mcbuTipUzmanlik,{values:{THESIS_TITLE_EN:"Clinical study"},sectionContent:sections},"Klinik araştırma",main);
  assert.deepEqual(correct.validation.errors,[]);
  assert.match(correct.sections.find(row=>row.id==="abstract-en").html,/Clinical study/);
  const wrong = compileThesisDocument(mcbuTipUzmanlik,{sectionContent:{...sections,bibliography:"<p>Karasar (2020).</p>"}},"Tez",'<h1>Kuramsal Çerçeve</h1><p>(Karasar, 2020)</p>');
  for (const code of ["missingHeadings","authorYearCitation","numberedBibliography","minItems"]) assert.ok(wrong.validation.errors.some(row=>row.code===code),code);
});

test("physical page-limit checks require measured counts and leave other templates/sections alone", () => {
  const model={sections:[{id:"abstract",title:"ÖZET",maxPages:1},{id:"main",title:"Bölümler"}]};
  assert.deepEqual(validateThesisPageCounts(model),[]);
  assert.deepEqual(validateThesisPageCounts(model,{abstract:1,main:30}),[]);
  assert.equal(validateThesisPageCounts(model,{abstract:2})[0].actual,2);
});
