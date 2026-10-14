// Real-editor parity regression for sections[].pageBreakBefore="oddPage".
// The official ADU template remains untouched; the fixture varies only the
// preceding acknowledgement text to exercise odd/even physical page counts.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import templateSource from "../src/thesis/templates/adu-ziraat-lisans.js";
import { strFromU8, unzipSync } from "fflate";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const base = process.argv[2] || "http://127.0.0.1:5181";
const output = path.resolve(import.meta.dirname, "../../output/adu-ziraat-parity");
const key = "txtnote-thesis-regression";
const template = structuredClone(templateSource);
const ethics = template.sections.find((section) => section.id === "ethics");
const preface = template.sections.find((section) => section.id === "preface");
assert.equal(ethics?.pageBreakBefore, "oddPage", "the source-derived ethics section must opt into oddPage");
assert.equal(preface?.mode, "editable", "the parity fixture varies the preceding editable acknowledgement text");

const values = {
  UNIVERSITY_NAME: "Aydın Adnan Menderes Üniversitesi",
  FACULTY_NAME: "Ziraat Fakültesi",
  DEPARTMENT_NAME: "Bitki Koruma",
  PROGRAM_CODE: "2026-01-001",
  THESIS_TITLE: "Parite Doğrulama Tezi",
  STUDENT_NAME: "Test Öğrenci",
  STUDENT_NUMBER: "2026001",
  ADVISOR_TITLE: "Dr. Öğr. Üyesi",
  ADVISOR_NAME: "Test Danışman",
  CITY_YEAR: "AYDIN - 2026",
  DECLARATION_DATE: "01.10.2026",
  ETHICS_DECLARATION_TEXT: "Etik beyan doğrulama metni",
};
const filler = "Bu bölümün sayfa akışını sınamak için kullanılan örnek metindir. ";
const makeDoc = (caseId) => {
  const prefaceHtml = caseId === "two-pages"
    ? `<p>${filler}</p><div class="academic-page-break" data-academic-page-break="true"></div><p>İkinci teşekkür sayfası.</p>`
    : `<p>${filler}</p>`;
  const sectionContent = {
    preface: prefaceHtml,
    "abstract-tr": `<p>${Array.from({ length: 260 }, (_, index) => `özet${index}`).join(" ")}</p>`,
    main: "<h1>GİRİŞ</h1><p>Deneme ana metni.</p>",
    bibliography: "<p>Örnek kaynak.</p>",
    cv: "<p>Öz geçmiş örneği.</p>",
  };
  return {
    title: "Odd page parity fixture",
    content: "",
    __template: template,
    researchData: { thesis: {
      templateId: template.id,
      templateVersion: template.templateVersion,
      selection: { universityId: template.universityId, degreeType: template.degreeType, language: template.language },
      values,
      sectionContent,
      enabledSections: [],
    } },
  };
};

async function capture(caseId, browser) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
  await context.grantPermissions(["local-fonts"], { origin: new URL(base).origin });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const fixture = makeDoc(caseId);
  await page.addInitScript(([storageKey, value]) => localStorage.setItem(storageKey, value), [key, JSON.stringify(fixture)]);
  await page.goto(`${base}/tests/thesis-batchb.html`);
  await page.waitForFunction((templateId) => {
    const root = document.querySelector('[aria-label="Belge sayfaları"]');
    return root?.getAttribute("data-thesis-template-id") === templateId
      && ["true", "fallback"].includes(root?.getAttribute("data-thesis-pagination-ready"));
  }, template.id, { timeout: 120000 });
  await page.locator('[data-thesis-section="ethics"]').waitFor({ state: "attached" });
  const geometry = await page.evaluate(() => {
    const articles = [...document.querySelectorAll('.thesis-paper[data-thesis-section]')];
    const targetIndex = articles.findIndex((article) => article.dataset.thesisSection === "ethics");
    const target = articles[targetIndex];
    const before = articles.slice(0, targetIndex).reduce((sum, article) => sum + article.closest(".thesis-page-stack").querySelectorAll(".thesis-sheet").length, 0);
    const sheets = [...target.closest(".thesis-page-stack").querySelectorAll(".thesis-sheet")];
    const firstTargetText = target.querySelector('.thesis-flow-section[data-thesis-flow-section="ethics"] .thesis-layout-text');
    const textRect = firstTargetText?.getBoundingClientRect();
    const flowRect = target.querySelector(".thesis-page-flow")?.getBoundingClientRect();
    const pitch = 297 * 96 / 25.4 + 28;
    const localPage = textRect && flowRect ? Math.floor((textRect.top - flowRect.top + 2) / pitch) : -1;
    return {
      precedingPages: before,
      oddPad: target.dataset.thesisOddPagePad === "true",
      sheets: sheets.map((sheet) => ({ label: sheet.dataset.thesisPageLabel || "", page: sheet.dataset.thesisPage })),
      targetLocalPage: localPage,
    };
  });
  console.log(`${caseId} editor parity: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.precedingPages >= 3, `${caseId}: expected two unnumbered covers and acknowledgements; got ${geometry.precedingPages} prior sheets`);
  assert.equal(geometry.oddPad, geometry.precedingPages % 2 === 1, `${caseId}: blank page must be added only after an odd number of prior sheets`);
  assert.equal(geometry.targetLocalPage, geometry.oddPad ? 1 : 0, `${caseId}: ethics content must start on the first odd physical page`);
  if (geometry.oddPad) {
    assert.equal(geometry.sheets[0].label, "", `${caseId}: the parity sheet is unlabelled`);
    assert.equal(geometry.sheets[0].page, String(geometry.precedingPages + 1));
  }
  assert.equal(geometry.sheets[geometry.oddPad ? 1 : 0].label, "iii", `${caseId}: both acknowledgements lead to the Roman iii declaration page`);

  await mkdir(output, { recursive: true });
  const downloads = {};
  for (const [tab, button, extension] of [["Dosya", "PDF", "pdf"], ["Dosya", "Word", "docx"]]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const downloadEvent = page.waitForEvent("download", { timeout: 120000 });
    await page.getByRole("button", { name: button, exact: true }).click();
    const download = await downloadEvent;
    downloads[extension] = path.join(output, `${caseId}.${extension}`);
    await download.saveAs(downloads[extension]);
  }
  assert.deepEqual(errors, [], `${caseId}: browser errors`);
  await context.close();
  return { ...geometry, ...downloads };
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
try {
  const results = [];
  for (const caseId of ["one-page", "two-pages"]) results.push(await capture(caseId, browser));
  assert.notEqual(results[0].precedingPages % 2, results[1].precedingPages % 2, "the acknowledgement variants must cover both prior parities");
  for (const result of results) {
    const data = new Uint8Array(await readFile(result.pdf));
    const task = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
    const pdf = await task.promise;
    const pages = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const text = (await (await pdf.getPage(number)).getTextContent()).items.map((item) => item.str).join(" ").replace(/\s+/g, " ");
      // The title also occurs in the generated TOC. Identify the actual body.
      if (text.includes("BİLİMSEL ETİK BEYANI") && text.includes("başlıklı Lisans")) pages.push(number);
    }
    assert.equal(pages.length, 1, `${path.basename(result.pdf)}: declaration appears exactly once`);
    assert.equal(pages[0] % 2, 1, `${path.basename(result.pdf)}: declaration starts on an odd physical page`);
    await task.destroy();
    const docx = new Uint8Array(await readFile(result.docx));
    const xml = strFromU8(unzipSync(docx)["word/document.xml"]);
    assert.match(xml, /<w:type w:val="oddPage"\s*\/>/, `${path.basename(result.docx)}: Word uses an oddPage section break`);
  }
  console.log(JSON.stringify(results.map(({ pdf, docx, ...geometry }) => ({ ...geometry, pdf, docx })), null, 2));
} finally {
  await browser.close();
}
