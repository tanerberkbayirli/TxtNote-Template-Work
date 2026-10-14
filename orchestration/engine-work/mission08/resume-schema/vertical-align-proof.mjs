import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { compileThesisDocument, buildThesisCss, groupThesisSections } from '../../../../engine/src/engine.js';
import { thesisPagedCss } from '../../../../engine/src/pageLayout.js';
const require = createRequire(new URL('../../../tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const fixture = JSON.parse(readFileSync('orchestration/specs/engine-word-structure.fixture.json', 'utf8'));
const template = structuredClone(fixture.__template);
const model = compileThesisDocument(template, fixture.researchData.thesis, fixture.title, '');
model.sections = model.sections.filter((section) => ['ALIGN_CENTER', 'ALIGN_BOTTOM'].includes(section.id));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-blink-features=MulticolColumnWrapping'] });
try {
  const page = await browser.newPage();
  const css = buildThesisCss(model) + thesisPagedCss(groupThesisSections(model.sections));
  await page.setContent(`<style>${css}</style>${model.sections.map((section) => `<article class="thesis-paper" data-thesis-layout="paged" data-thesis-section="${section.id}"><div class="thesis-page-flow"><section class="thesis-flow-section" data-thesis-flow-section="${section.id}"><div class="thesis-body"><div>${section.html}</div></div></section></div></article>`).join('')}`);
  const measure = () => page.evaluate(() => [...document.querySelectorAll('.thesis-flow-section')].map((host) => {
    const block = host.querySelector('[data-thesis-block]');
    return { id: host.dataset.thesisFlowSection, display: getComputedStyle(host).display, justify: getComputedStyle(host).justifyContent, hostHeight: host.getBoundingClientRect().height, blockHeight: block.getBoundingClientRect().height, blockTop: block.getBoundingClientRect().top - host.getBoundingClientRect().top };
  }));
  const before = await measure();
  await page.addStyleTag({ content: '.thesis-flow-section{height:247mm;contain:size;}' });
  const after = await measure();
  writeFileSync('orchestration/engine-work/mission08/resume-schema/vertical-align-proof.json', JSON.stringify({ before, after }, null, 2));
  console.log(JSON.stringify({ before, after }));
} finally { await browser.close(); }
