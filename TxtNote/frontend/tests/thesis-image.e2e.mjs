// Görev 5B: ThesisEditor image insert must not freeze and must persist.
// Run with the dev server up: node tests/thesis-image.e2e.mjs <small> <large> [baseUrl]
import { chromium } from "playwright-core";
const [small, large, base = "http://localhost:5173"] = process.argv.slice(2);
const url = `${base}/tests/thesis.html`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const fail = (msg) => { console.error("FAIL:", msg, errors.slice(0, 5)); process.exitCode = 1; };
const step = (msg) => console.log("OK:", msg);

// The UI is "frozen" if the main thread cannot answer within the budget.
async function responsive(label, budget = 3000) {
  const t = Date.now();
  const ok = await Promise.race([page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(true)))), new Promise((r) => setTimeout(() => r(false), budget))]);
  if (!ok) throw new Error(`UI donuk: ${label}`);
  return Date.now() - t;
}
const mainBody = () => page.locator('[aria-label="Ana Metin metni"], [aria-label$="metni"]').filter({ has: page.locator("xpath=.") });

async function focusMain() {
  const editors = page.locator('.thesis-flow-section[data-thesis-section-mode="editable"] [contenteditable="true"][role="textbox"]');
  const count = await editors.count();
  let target = null;
  for (let i = 0; i < count; i += 1) {
    const label = await editors.nth(i).getAttribute("aria-label");
    if (/Ana|Main|Giriş|İçerik/i.test(label || "")) { target = editors.nth(i); break; }
  }
  target ||= editors.last();
  await target.scrollIntoViewIfNeeded();
  await target.click();
  await page.keyboard.press("Control+End");
  return target;
}
async function insert(file, label) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  await (await chooser).setFiles(file);
  const before = Date.now();
  await responsive(`${label} sonrası`, 5000);
  await page.waitForFunction((n) => document.querySelectorAll(".thesis-content .academic-figure img").length >= n, label === "ikinci" ? 2 : 1, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const ms = await responsive(`${label} yerleşim sonrası`, 3000);
  step(`${label} görsel eklendi, UI yanıt veriyor (${Date.now() - before}ms, rAF ${ms}ms)`);
}
try {
  await page.goto(url);
  const paragraphs = Number(process.env.PREFILL || 0);
  await page.evaluate((n) => {
    localStorage.clear();
    if (!n) return;
    const content = Array.from({ length: n }, (_, i) => `<p>Paragraf ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p>`).join("");
    localStorage.setItem("txtnote-thesis-regression", JSON.stringify({ title: "Test tezi", content, researchData: { thesis: { templateId: "demo-university-a-master-tr-v1", templateVersion: "1.0.0", selection: { universityId: "demo-university-a", instituteId: "graduate", degreeType: "master", language: "tr" }, values: { YEAR: "2026" }, sectionContent: {}, enabledSections: [] } } }));
  }, paragraphs);
  await page.reload();
  await page.waitForSelector(".thesis-flow-section", { timeout: 20000 });
  const target = await focusMain();
  const label = await target.getAttribute("aria-label");
  step(`Odak: ${label}`);
  await page.keyboard.type("Görsel testi ");
  await insert(small, "ilk");
  const img = page.locator(".thesis-content .academic-figure img").first();
  if (!(await img.isVisible())) throw new Error("görsel görünmüyor");
  step("görsel görünür");
  await img.click();
  await page.waitForSelector(".academic-image-controls", { timeout: 5000 });
  step("görsel seçildi (boyut kontrolleri açıldı)");
  // Pages are drawn at the fit zoom; the selection box must sit on the image, not zoom² off.
  const ib = await img.boundingBox(); const cb = await page.locator(".academic-image-controls").boundingBox();
  if (Math.abs(ib.x - cb.x) > 2 || Math.abs(ib.y - cb.y) > 2 || Math.abs(ib.width - cb.width) > 2) throw new Error(`seçim kutusu görselle hizalı değil: img ${JSON.stringify(ib)} kutu ${JSON.stringify(cb)}`);
  step("seçim kutusu yakınlaştırmada görselle hizalı");
  const handle = await page.locator(".academic-resize-handle").nth(3).boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down(); await page.mouse.move(handle.x - 20, handle.y + 5, { steps: 4 }); await page.mouse.up();
  await responsive("tutamaçla boyutlandırma sonrası");
  const dragged = await page.locator(".thesis-content .academic-figure img").first().getAttribute("style");
  if (!/width:\s*\d+px/.test(dragged || "")) throw new Error(`tutamaçla boyutlandırma uygulanmadı: ${dragged}`);
  step(`tutamaçla boyutlandırma çalışıyor (${dragged})`);
  const w0 = (await img.boundingBox()).width;
  await page.locator('[aria-label="Görsel genişliği (px)"]').fill("40");
  await page.getByRole("button", { name: "Uygula" }).click();
  await responsive("boyutlandırma sonrası");
  await page.waitForTimeout(500);
  const style = await page.locator(".thesis-content .academic-figure img").first().getAttribute("style");
  if (!/width:\s*40px/.test(style || "")) throw new Error(`boyutlandırma uygulanmadı: ${style} (önce ${w0})`);
  step(`boyutlandırma çalışıyor (${style})`);
  await page.keyboard.press("Escape");
  await focusMain();
  await insert(large, "ikinci");
  const stored = await page.evaluate(() => { const d = window.thesisTest.getDoc(); return (d.content.match(/<img/g) || []).length; });
  if (stored !== 2) throw new Error(`kayıtta ${stored} görsel var`);
  step("kayıtta 2 görsel");
  await page.click("#switch-note");
  await page.waitForSelector("#other-note");
  await page.click("#switch-note");
  await page.waitForFunction(() => document.querySelectorAll(".thesis-content .academic-figure img").length === 2, null, { timeout: 15000 });
  await responsive("not dönüşü");
  step("başka nota geçip dönünce 2 görsel duruyor");
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll(".thesis-content .academic-figure img").length === 2, null, { timeout: 15000 });
  await responsive("yenileme sonrası");
  const loaded = await page.evaluate(() => [...document.querySelectorAll(".thesis-content .academic-figure img")].every((i) => i.complete && i.naturalWidth > 0));
  if (!loaded) throw new Error("yenileme sonrası görsel yüklenmedi");
  step("yenileme sonrası 2 görsel duruyor");
  if (errors.length) console.log("Konsol hataları:", errors.slice(0, 5));
} catch (error) { fail(error.message); }
finally { await browser.close(); }
