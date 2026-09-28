import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { settle } from "./task10a1-checks.mjs";

const paper = (page, id) => page.locator(`.thesis-paper[data-thesis-section="${id}"]`);
const metadata = async (page, field, value) => {
  await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByLabel(field, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  await settle(page);
};
export async function task10b2Checks(page, pass, exportFiles) {
  await settle(page);
  assert.equal(await paper(page, "inner-cover").getAttribute("data-thesis-page-count"), "1");
  assert.match(await paper(page, "inner-cover").innerText(), /MANİSA CELAL BAYAR ÜNİVERSİTESİ/);
  const logo = paper(page, "inner-cover").locator(".thesis-layout-image");
  assert.equal(await logo.count(), 1);
  assert.ok(await logo.evaluate((i) => i.complete && i.naturalWidth === 262 && i.naturalHeight === 323));
  pass("cover: correct university whitespace, official logo decoded, one A4 page");
  await metadata(page, "Department (English)", "");
  assert.match(await paper(page, "abstract-en-header").innerText(), /Department of \[English department required\]/);
  assert.doesNotMatch(await paper(page, "abstract-en-header").innerText(), /Department of Eğitim|ANABİLİMDALI/);
  assert.match(await page.getByRole("status").filter({ hasText: "belge uyarısı" }).getAttribute("title"), /Department \(English\)/);
  await metadata(page, "Department (English)", "Educational Sciences");
  assert.match(await paper(page, "abstract-en-header").innerText(), /Department of Educational Sciences/);
  assert.match(await paper(page, "abstract-header").innerText(), /Eğitim Bilimleri Anabilim Dalı/);
  assert.equal(await page.getByRole("status").filter({ hasText: "belge uyarısı" }).count(), 0);
  pass("English department: separate input, visible empty warning/placeholder, TR stays Turkish");
  assert.equal(await paper(page, "declaration").locator('[data-thesis-field="USED_PROGRAMS"]').count(), 0);
  const empty = await exportFiles("empty-program");
  let xml = strFromU8(unzipSync(new Uint8Array(await readFile(empty.docx)))["word/document.xml"]);
  assert.doesNotMatch(xml, /Kullanılan program:|yokprogram/);
  await metadata(page, "Kullanılan program (varsa, Taahhütname)", "yokprogram");
  assert.match(await paper(page, "declaration").innerText(), /Kullanılan program: yokprogram/);
  await metadata(page, "Kullanılan program (varsa, Taahhütname)", "TxtNote");
  assert.match(await paper(page, "declaration").innerText(), /Kullanılan program: TxtNote/);
  pass("program: absent when empty; label when filled; yokprogram preserved as literal input");
  const headingState = await page.locator('[data-thesis-flow-section="main"]').evaluate((root) => {
    const stack = root.closest(".thesis-page-stack"), origin = stack.getBoundingClientRect().top;
    const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const sheets = [...stack.querySelectorAll(".thesis-sheet")];
    return [...root.querySelectorAll("h1,h2,h3,h4")].map((h) => {
      const range = document.createRange(); range.selectNodeContents(h);
      const rect = [...range.getClientRects()].find((r) => r.width && r.height);
      const offset = (rect.top - origin) / scale;
      const index = Math.floor((offset + 0.5) / (297 * 96 / 25.4 + 28));
      const s = getComputedStyle(h);
      return { text: h.textContent, label: h.dataset.thesisNumber.trim(), anchor: h.dataset.thesisAnchor, page: sheets[index].dataset.thesisPageLabel, index, topMm: (offset - index * (297 * 96 / 25.4 + 28)) * 25.4 / 96, transform: s.textTransform, afterPt: parseFloat(s.marginBottom) * .75 };
    });
  });
  assert.deepEqual(headingState.slice(0,4).map((h) => h.label), ["1.", "1.1.", "1.1.1.", "1.1.1.1."]);
  assert.ok(headingState.some((h) => h.label === "2.1."));
  const h1 = headingState.filter((h) => /^\d+\.$/.test(h.label));
  assert.ok(h1.every((h) => h.transform === "uppercase" && Math.abs(h.afterPt - 20.7) < .1 && h.topMm < 27));
  assert.ok(h1.slice(1).every((h,i) => h.index > h1[i].index));
  const rows = await page.locator('[data-thesis-generated="toc"] li').evaluateAll((rows) => rows.map((r) => ({ anchor:r.dataset.indexTarget, text:r.querySelector(".thesis-index-text").textContent, page:r.querySelector(".thesis-index-page").textContent })));
  for (const h of headingState) {
    const row = rows.find((r) => r.anchor === h.anchor);
    assert.ok(row); assert.equal(row.page, h.page);
    assert.equal(row.text, `${h.label} ${h.transform === "uppercase" ? h.text.toLocaleUpperCase("tr") : h.text}`);
  }
  pass("editor + TOC: real numbered H1–H4, trailing dots, H1 uppercase/new page/20.7 pt gap; TOC page labels match anchors");
  const files = await exportFiles("mcbu-final");
  const { getDocument, OPS } = await import(new URL("../node_modules/pdfjs-dist/legacy/build/pdf.mjs", import.meta.url).href);
  const pdf = await getDocument({ data:new Uint8Array(await readFile(files.pdf)),useSystemFonts:true,disableFontFace:true }).promise;
  const labels = await page.locator(".thesis-sheet").evaluateAll((s) => s.map((x) => x.dataset.thesisPageLabel || ""));
  assert.equal(pdf.numPages, labels.length);
  const texts = [];
  for (let i=1;i<=pdf.numPages;i++) {
    const items = (await (await pdf.getPage(i)).getTextContent()).items;
    // Painted heading numbers follow their text in the stream; compare reading
    // order from actual PDF coordinates, not the order of drawing operations.
    items.sort((a,b) => Math.abs(a.transform[5]-b.transform[5]) > 1 ? b.transform[5]-a.transform[5] : a.transform[4]-b.transform[4]);
    texts.push(items.map((x)=>x.str).join(" ").replace(/\s+/g," "));
  }
  assert.match(texts[0], /MANİSA CELAL BAYAR ÜNİVERSİTESİ/);
  const ops = await (await pdf.getPage(1)).getOperatorList();
  assert.ok(ops.fnArray.includes(OPS.paintImageXObject));
  assert.match(texts[1], /Kullanılan program: TxtNote/);
  assert.match(texts[3], /Department of Educational Sciences/);
  for (const h of headingState) {
    const physical = labels.indexOf(h.page);
    const title = h.transform === "uppercase" ? h.text.toLocaleUpperCase("tr") : h.text;
    assert.ok(texts[physical].includes(`${h.label} ${title}`), `${h.label} ${title} on ${h.page}`);
    assert.ok(texts[8].includes(`${h.label} ${title}`));
  }
  const zip = unzipSync(new Uint8Array(await readFile(files.docx)));
  xml = strFromU8(zip["word/document.xml"]);
  const styles = strFromU8(zip["word/styles.xml"]);
  assert.match(xml, /Department of Educational Sciences/); assert.match(xml, /Kullanılan program: TxtNote/);
  for (let i=1;i<=4;i++) {
    assert.match(xml, new RegExp(`w:pStyle w:val="Heading${i}"`));
    assert.match(styles, new RegExp(`w:styleId="Heading${i}"[\\s\\S]*?w:outlineLvl w:val="${i-1}"`));
  }
  assert.match(xml, /w:w="11906" w:h="16838"/);
  assert.match(xml, /w:top="1417" w:right="1417" w:bottom="1417" w:left="2268"/);
  assert.ok(Object.keys(zip).some((k) => k.startsWith("word/media/") && zip[k].length > 1000));
  pass(`real PDF/Word buttons: ${pdf.numPages} PDF pages match editor, logo/text/TOC/H1–H4; DOCX Heading1–4 outline 0–3, A4/margins/images and metadata`);
  await metadata(page, "Kullanılan program (varsa, Taahhütname)", "");
  assert.equal(await paper(page, "declaration").locator('[data-thesis-field="USED_PROGRAMS"]').count(),0);
  return {files, emptyFiles:empty, headings:headingState, toc:rows, pages:pdf.numPages};
}
