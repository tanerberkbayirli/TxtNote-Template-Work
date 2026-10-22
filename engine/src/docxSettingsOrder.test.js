import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "./registry.js";
import { compileThesisDocument } from "./engine.js";
import { buildThesisDocx } from "./export.js";
import { orderSettingsChildren } from "./docx/package.js";

// HE-DX-01: w:settings children follow the ECMA-376 CT_Settings sequence (defaultTabStop before evenAndOddHeaders, …).
const SCHEMA_PREFIX = ["w:displayBackgroundShape", "w:defaultTabStop", "w:evenAndOddHeaders", "w:updateFields", "w:footnotePr", "w:endnotePr", "w:compat"];

test("settings.xml children are reordered without losing any", () => {
  const xml = '<w:settings xmlns:w="w"><w:evenAndOddHeaders/><w:updateFields w:val="true"/><w:defaultTabStop w:val="709"/><w14:docId w14:val="1"/><w:compat><w:compatSetting w:name="a"/></w:compat><w:displayBackgroundShape/></w:settings>';
  assert.equal(orderSettingsChildren(xml), '<w:settings xmlns:w="w"><w:displayBackgroundShape/><w:defaultTabStop w:val="709"/><w:evenAndOddHeaders/><w:updateFields w:val="true"/><w:compat><w:compatSetting w:name="a"/></w:compat><w14:docId w14:val="1"/></w:settings>');
});

test("every official template's DOCX writes settings in schema order", async () => {
  for (const entry of THESIS_TEMPLATE_REGISTRY.filter((item) => item.status === "official")) {
    const { template } = await resolveThesisTemplate({ templateId: entry.id });
    const model = compileThesisDocument(template, {}, "T", "<h1>Giriş</h1><p>Metin.</p>", []);
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/settings.xml"]);
    const body = xml.replace(/^[\s\S]*?<w:settings\b[^>]*>/, "").replace(/<\/w:settings>[\s\S]*$/, "");
    const top = [...body.matchAll(/<(\/?)([\w:]+)[^>]*?(\/?)>/g)].reduce((state, [, close, name, self]) => {
      if (close) state.depth -= 1; else { if (state.depth === 0) state.names.push(name); if (!self) state.depth += 1; }
      return state;
    }, { depth: 0, names: [] }).names.filter((name) => SCHEMA_PREFIX.includes(name));
    const ranks = top.map((name) => SCHEMA_PREFIX.indexOf(name));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${entry.id}: ${top.join(", ")}`);
  }
});
