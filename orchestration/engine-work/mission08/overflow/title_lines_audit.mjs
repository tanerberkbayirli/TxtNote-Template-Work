// 08-C audit: every line of every special-page text block keeps the block's alignment (centre stays centred).
// 08-D evidence: the special-page fit notice (overflow / overlap) appears in the real editor for a sample document.
// usage: node orchestration/engine-work/mission08/overflow/title_lines_audit.mjs [templateId ...]   (needs the Vite server on :5175)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const specs = 'orchestration/specs/';
const TR = 'Dijital Okuryazarlığın Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Öz Yeterlik Algıları Üzerindeki Etkisinin Karşılaştırmalı Olarak İncelenmesi ';
const EN = 'An Examination of the Comparative Effects of Digital Literacy on Pre-Service Teachers Self-Efficacy Perceptions in Online Learning Environments ';
const LEN = Number(process.env.TITLE_LEN || 400);
const TITLE_KEYS = ['THESIS_TITLE', 'THESIS_TITLE_EN', 'THESIS_TITLE_TR', 'PROJECT_TITLE', 'PROJECT_TITLE_EN'];
const fixtures = new Map();
for (const f of readdirSync(specs).filter((n) => /\.fixture.*\.json$/.test(n)).sort()) {
  if (/engine-|phase52|overrides/.test(f)) continue;
  const d = JSON.parse(readFileSync(specs + f, 'utf8'));
  const id = d?.researchData?.thesis?.templateId;
  if (!id || fixtures.has(id) || d.__template) continue;
  fixtures.set(id, { file: f, doc: d });
}
const only = process.argv.slice(2);
const KEY = 'txtnote-thesis-regression';
const baseUrl = process.env.THESIS_BASE_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-blink-features=MulticolColumnWrapping'] });
const results = [];
for (const [id, { file, doc: base }] of fixtures) {
  if (only.length && !only.includes(id)) continue;
  const doc = structuredClone(base);
  const values = doc.researchData.thesis.values;
  const keys = TITLE_KEYS.filter((k) => k in values);
  for (const k of keys) values[k] = ((k.endsWith('_EN') ? EN : TR).repeat(10)).slice(0, LEN).trim();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.addInitScript(([k, v, origin]) => { if (location.origin !== origin) return; localStorage.clear(); localStorage.setItem(k, v); }, [KEY, JSON.stringify(doc), new URL(baseUrl).origin]);
  try {
    await page.goto(baseUrl + '/tests/thesis.html');
    await page.locator('.thesis-sheet').first().waitFor({ timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3000);
    const out = await page.evaluate(() => {
      const bad = []; let blocks = 0; let multi = 0;
      for (const el of document.querySelectorAll('[data-thesis-flow-section] .thesis-layout-text')) {
        const cs = getComputedStyle(el);
        const align = cs.textAlign;
        if (!['center', 'right', 'left', 'start', 'end'].includes(align)) continue;
        const box = el.getBoundingClientRect();
        const left = box.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
        const right = box.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
        const range = document.createRange(); range.selectNodeContents(el);
        const lines = new Map();
        for (const r of range.getClientRects()) {
          if (r.width < 0.5 || r.height < 1) continue;
          const key = Math.round(r.top / 3);
          const l = lines.get(key) || { l: Infinity, r: -Infinity };
          l.l = Math.min(l.l, r.left); l.r = Math.max(l.r, r.right); lines.set(key, l);
        }
        blocks += 1; if (lines.size > 1) multi += 1;
        // Requirement: every line of a multi-line block keeps the block's alignment, so the per-line offset
        // (centre: lead-trail, right: trail, left: lead) must be the same on all lines. A single-line block is skipped.
        if (lines.size > 1) {
          const offs = [...lines.values()].map((l) => (align === 'center' ? (l.l - left) - (right - l.r) : align === 'right' || align === 'end' ? right - l.r : l.l - left));
          const spread = Math.max(...offs) - Math.min(...offs);
          if (spread > 6) bad.push({ block: el.getAttribute('data-thesis-block'), align, text: el.textContent.slice(0, 40), lines: lines.size, offsets: offs.map((o) => Math.round(o)), textIndent: cs.textIndent });
        }
      }
      const notices = [...document.querySelectorAll('.thesis-ribbon-warning p')].map((p) => p.textContent).filter((t) => /taşıyor|üst üste/.test(t));
      return { blocks, multi, bad, notices };
    });
    results.push({ id, file, ...out });
    console.log(id, 'blocks', out.blocks, 'multiline', out.multi, 'BAD', out.bad.length, 'notices', out.notices.length, out.bad.length ? JSON.stringify(out.bad.slice(0, 3)) : '');
  } catch (e) {
    results.push({ id, file, error: String(e).slice(0, 200) });
    console.log(id, 'ERROR', String(e).slice(0, 200));
  }
  await page.close();
}
await browser.close();
writeFileSync(process.env.TITLE_AUDIT_OUT || 'orchestration/engine-work/mission08/overflow/title_lines_audit.result.json', JSON.stringify(results, null, 1));
console.log('TOTAL templates', results.length, 'misaligned', results.filter((r) => r.bad?.length).length, 'errors', results.filter((r) => r.error).length);
if (!results.length || results.some((r) => r.error || r.bad?.length)) process.exitCode = 1;
