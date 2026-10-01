// Task 10B.1: MCBÜ final polish on the real thesis editor (Vite fixture), PDF and DOCX.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fillMcbuThesis } from "./task10b-checks.mjs";
import { task10b1Checks } from "./task10b1-checks.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.context().grantPermissions(["local-fonts"], { origin: new URL(process.argv[2] || "http://127.0.0.1:5175").origin });
const errors = [], checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => { if (/content security policy|refused to|uncaught/i.test(e.text())) errors.push(e.text()); });
const out = new URL("../../output/task10b1/", import.meta.url);
const file = (name) => new URL(name, out).pathname.replace(/^\/(\w:)/, "$1");
await mkdir(out, { recursive: true });
const pass = (message) => { checks.push(message); console.log(`PASS ${message}`); };
const download = async (prefix) => {
  const files = {};
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    await (await event).saveAs(file(`${prefix}.${extension}`)); files[extension] = file(`${prefix}.${extension}`);
  }
  return files;
};

try {
  await page.goto(`${process.argv[2] || "http://127.0.0.1:5175"}/tests/thesis.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]').waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await fillMcbuThesis(page, { degree: "master" });
  const result = await task10b1Checks(page, pass, () => download("mcbu-master"));
  assert.deepEqual(errors, []);
  await writeFile(new URL("browser.json", out), JSON.stringify({ status: "passed", checks, errors, result: { ...result, files: undefined } }, null, 2));
} catch (e) {
  await page.screenshot({ path: file("failure.png"), fullPage: true }).catch(() => {});
  await writeFile(new URL("failure.json", out), JSON.stringify({ error: String(e?.stack || e), checks, errors }, null, 2));
  throw e;
} finally { await browser.close(); }
