import test from "node:test";
import assert from "node:assert/strict";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { buildTemplateRules, NOT_VERIFIED, templateRuleStatus } from "./templateRulesGuide.js";
import { APP_GUIDE_SECTIONS } from "./appGuideContent.js";

const load = async (id) => (await THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === id).load()).default;
const ORDER = ["kaynak", "sayfa", "sira", "kapak", "ozet", "icindekiler", "ana-metin", "gorseller", "atif", "ekler", "belirsizlik"];

test("every visible template yields the 11 ordered sections and its own identity", async () => {
  for (const entry of THESIS_TEMPLATE_REGISTRY) {
    const template = await load(entry.id);
    const rules = buildTemplateRules(template);
    assert.deepEqual(rules.sections.map((section) => section.id), ORDER, entry.id);
    assert.equal(rules.id, entry.id);
    assert.equal(rules.identity.university, entry.universityName);
    assert.ok(!JSON.stringify(rules).includes("undefined") && !JSON.stringify(rules).includes("[object"), entry.id);
  }
});

test("same university, different institutes: rules and sources differ", async () => {
  const aku = THESIS_TEMPLATE_REGISTRY.filter((entry) => entry.universityId === "aku" && entry.degreeType === "master");
  assert.ok(aku.length >= 2);
  const [a, b] = await Promise.all([load(aku[0].id), load(aku[1].id)]);
  const ra = buildTemplateRules(a), rb = buildTemplateRules(b);
  assert.notEqual(ra.identity.institute, rb.identity.institute);
  assert.notDeepEqual(ra.sections, rb.sections);
});

test("master and doctorate variants of one institute keep their own degree", async () => {
  const pair = THESIS_TEMPLATE_REGISTRY.filter((entry) => entry.degreeType === "doctorate" || entry.degreeType === "phd");
  assert.ok(pair.length > 0);
  const rules = buildTemplateRules(await load(pair[0].id));
  assert.equal(rules.identity.degree, "Doktora");
});

test("limits come only from a recorded or officially read source; otherwise they are shown as not verified", async () => {
  const find = (rules, label) => rules.sections.find((section) => section.id === "ozet").items.find((row) => row.label === label);
  // MCBÜ guide (22.10.2025) read in full: no word/page limit, only keyword count — stated with its source.
  const mcbu = buildTemplateRules(await load("mcbu-lee-master-tr-v1"));
  assert.match(find(mcbu, "Türkçe özet — kelime sınırı").value, /açık bir kelime\/sayfa sınırı bulunmadı/);
  assert.ok(find(mcbu, "Türkçe özet — kelime sınırı").source.location);
  assert.match(find(mcbu, "Türkçe özet — anahtar kelime").value, /en az 5/);
  // AKÜ FBE guide p.18: keyword count 4-6 (template record only had the minimum).
  const aku = buildTemplateRules(await load("aku-fbe-master-tr-v1"));
  assert.match(find(aku, "Türkçe özet — anahtar kelime").value, /^4–6/);
  assert.ok(find(aku, "Türkçe özet — anahtar kelime").source.url.startsWith("https://fenbil.aku.edu.tr/"));
  // A template with no recorded limit and no reviewed overlay must not invent one.
  const other = buildTemplateRules(await load("aku-sbe-master-tr-v1"));
  const row = find(other, "Türkçe özet — kelime sınırı");
  assert.equal(row.known, false);
  assert.match(row.value, /Şablon kaydında yok/);
});

test("every overlay is bound to a source document that the template itself records", async () => {
  const { TEMPLATE_RULE_OVERLAYS } = await import("./templateRuleOverlays.js");
  const { templateSourceDocuments } = await import("./templateRulesGuide.js");
  for (const [id, rules] of Object.entries(TEMPLATE_RULE_OVERLAYS)) {
    const docs = templateSourceDocuments(await load(id));
    for (const rule of rules) assert.ok(docs.some((doc) => doc.sha256?.startsWith(rule.source.doc)), `${id}: ${rule.label}`);
  }
});

test("drafts are labelled and never claimed complete; source links only come from https records", async () => {
  let drafts = 0;
  for (const entry of THESIS_TEMPLATE_REGISTRY) {
    const template = await load(entry.id);
    const status = templateRuleStatus(template);
    if (template.status !== "official") { drafts++; assert.notEqual(status.level, "checked", entry.id); }
    for (const doc of buildTemplateRules(template).documents) assert.ok(doc.url === null || doc.url.startsWith("https://"), entry.id);
  }
  assert.ok(drafts > 0);
  assert.ok(NOT_VERIFIED);
});

test("the shared app guide is one fixed content without any template or university name", async () => {
  const text = JSON.stringify(APP_GUIDE_SECTIONS);
  for (const entry of THESIS_TEMPLATE_REGISTRY) assert.ok(!text.includes(entry.universityName), entry.universityName);
  assert.equal(APP_GUIDE_SECTIONS.length, 8);
  assert.ok(APP_GUIDE_SECTIONS.every((section) => section.steps.length > 0));
});

test("a registry entry that fails to load falls back to the generic draft and is never presented as verified", async () => {
  for (const entry of THESIS_TEMPLATE_REGISTRY) {
    const resolved = await resolveThesisTemplate({ templateId: entry.id });
    if (!resolved.fallback) continue;
    const rules = buildTemplateRules(resolved.template);
    assert.notEqual(rules.status.level, "checked", entry.id);
    assert.equal(rules.status.label, NOT_VERIFIED);
  }
});

test("every overlay rule is actually shown with its source, and only for sections the template has", async () => {
  const { TEMPLATE_RULE_OVERLAYS } = await import("./templateRuleOverlays.js");
  for (const [id, rules] of Object.entries(TEMPLATE_RULE_OVERLAYS)) {
    const template = await load(id);
    const types = new Set(template.sections.map((section) => section.type));
    const built = buildTemplateRules(template);
    for (const rule of rules) {
      const row = built.sections.find((section) => section.id === rule.section).items.find((entry) => entry.label === rule.label);
      assert.ok(row?.source?.location, `${id}: ${rule.label}`);
      if (rule.label.startsWith("Türkçe özet")) assert.ok(types.has("abstract"), `${id}: ${rule.label}`);
      if (rule.label.startsWith("Yabancı dilde özet")) assert.ok(types.has("englishAbstract"), `${id}: ${rule.label}`);
    }
  }
});
