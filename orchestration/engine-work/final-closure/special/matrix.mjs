// Dedicated static-special-page acceptance: same template/metadata, short editable
// body, real editor/Chrome DOM. Full-document checks remain a separate gate.
import { readFile, readdir, writeFile, mkdir, access } from 'node:fs/promises';
import { chromium } from '../../../tools/node_modules/playwright/index.mjs';
const base = process.env.THESIS_BASE_URL || 'http://127.0.0.1:5194';
const out = process.env.SPECIAL_MATRIX_OUT || 'orchestration/engine-work/final-closure/special/dom-matrix';
await mkdir(out, { recursive: true });
if(await access(out+'/results.json').then(()=>true,()=>false))throw new Error('Matrix acceptance requires a fresh output directory');
async function bounded(promise,ms,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out')),ms)})]);}finally{clearTimeout(timer)}}
const fixtures = new Map();
for (const file of (await readdir('orchestration/specs')).sort()) {
  if (!/\.fixture.*\.json$/.test(file) || /engine-|phase52|overrides/.test(file)) continue;
  const doc = JSON.parse(await readFile('orchestration/specs/' + file, 'utf8'));
  const id = doc.researchData?.thesis?.templateId;
  if (id && !doc.__template && !fixtures.has(id)) fixtures.set(id, { file, doc });
}
const titleKeys = ['THESIS_TITLE', 'THESIS_TITLE_EN', 'THESIS_TITLE_TR', 'PROJECT_TITLE', 'PROJECT_TITLE_EN'];
const tr = 'Dijital Okuryazarlığın Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Öz Yeterlik Algıları Üzerindeki Etkisinin Karşılaştırmalı Olarak İncelenmesi ';
const en = 'An Examination of the Comparative Effects of Digital Literacy on Pre-Service Teachers Self-Efficacy Perceptions in Online Learning Environments ';
function variant(source, name) {
  const doc = structuredClone(source), values = doc.researchData.thesis.values;
  doc.content = '<p>Araştırma metni.</p>';
  doc.researchData.thesis.sectionContent = Object.fromEntries(Object.keys(doc.researchData.thesis.sectionContent || {}).map(key => [key, '<p>Özel sayfa denetimi.</p>']));
  if (name.startsWith('title')) {
    for (const key of titleKeys.filter(key => key in values)) values[key] = (key.endsWith('_EN') ? en : tr).repeat(10).slice(0, Number(name.slice(5))).trim();
  } else if (name === 'coadv') {
    const keys = Object.keys(values).filter(key => key.startsWith('CO_ADVISOR'));
    if (!keys.length) return null;
    for (const key of keys) values[key] = key.endsWith('NAME') ? 'Prof. Dr. Muhammed Abdurrahman KARAHASANOĞLU-YILDIRIMOĞLU' : key.includes('AFFIL') ? 'Afyon Kocatepe Üniversitesi Fen-Edebiyat Fakültesi Matematik Bölümü' : 'Prof. Dr.';
    for (const key of Object.keys(values).filter(key => key.startsWith('ADVISOR') && key.endsWith('NAME'))) values[key] = 'Doç. Dr. Hacı Muhammed Abdurrahman KARAHASANOĞLU-YILDIRIMOĞLU';
  } else if (name.startsWith('jury')) {
    const slots = new Map();
    for (const key of Object.keys(values)) {
      const match = key.match(/^JURY_(?:MEMBER_)?(\d+)/);
      const slot = key.startsWith('JURY_CHAIR') ? 0 : match ? Number(match[1]) : null;
      if (slot !== null) slots.set(slot, [...(slots.get(slot) || []), key]);
    }
    const n = Number(name.slice(4)); if (slots.size < Math.max(3, n)) return null;
    const keep = [...slots.keys()].sort((a,b)=>a-b).slice(0,n);
    for (const [slot, keys] of slots) for (const key of keys) values[key] = !keep.includes(slot) ? '' : /AFFIL|UNIV|_2$/.test(key) ? 'Afyon Kocatepe Üniversitesi Sağlık Bilimleri Fakültesi' : key.includes('TITLE') && !key.includes('NAME') ? 'Prof. Dr.' : `Prof. Dr. Jüri Üyesi Numara ${slot} UZUNSOYADOĞLU`;
  }
  return doc;
}
const variants = (process.env.SPECIAL_MATRIX_VARIANTS || 'base,title120,title250,title400,coadv,jury3,jury5,jury7').split(',');
const only = process.env.SPECIAL_MATRIX_TARGETS?.split(',');
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-blink-features=MulticolColumnWrapping', '--font-render-hinting=none'] });
const results = [], baselines = new Map();
try {
  for (const [id, source] of fixtures) {
    if (only && !only.includes(id)) continue;
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    let page;
    for (const name of variants) {
      const doc = variant(source.doc, name);
      if (!doc) { results.push({ id, variant: name, status: 'n/a' }); continue; }
      const started = performance.now();
      try {
        if (page) await bounded(page.close(),10000,'Closing previous page');
        page = await context.newPage();
        page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);
        const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error)));
        if(process.env.SPECIAL_MATRIX_DEBUG)page.on('console',message=>console.log('BROWSER',message.type(),message.text()));
        await page.addInitScript(([d,origin]) => { if(location.origin!==origin)return;localStorage.clear();localStorage.setItem('txtnote-thesis-regression',JSON.stringify(d)); }, [doc,base]);
        await page.goto(base + '/tests/thesis.html');
        await page.locator('.thesis-sheet').first().waitFor({ timeout: 60000 });
        await page.waitForFunction(id => document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisTemplateId === id, id, { timeout: 60000 });
        await page.getByLabel('Yakınlaştır', { exact: true }).selectOption('100');
        await bounded(page.evaluate(() => document.fonts.ready),60000,'Font loading');
        if(process.env.SPECIAL_MATRIX_DEBUG)console.log('WAIT_READY',id,name,await page.evaluate(()=>({ready:document.querySelector('[data-thesis-pagination-ready]')?.dataset.thesisPaginationReady,fonts:document.fonts.status})),pageErrors);
        await page.waitForFunction(() => document.querySelector('[data-thesis-pagination-ready]')?.dataset.thesisPaginationReady === 'true', null, { timeout: 120000 });
        const data = await bounded(page.evaluate(async () => {
          const [{ THESIS_TEMPLATE_REGISTRY }, { compileThesisDocument, groupThesisSections }, { pageMetrics }, { measureSpecialPageFit }, { walkSpecialPage }] = await Promise.all([import('/engine/registry.js'),import('/engine/engine.js'),import('/engine/pageLayout.js'),import('/engine/specialPageFit.js'),import('/engine/specialPages.js')]);
          const saved = window.thesisTest.getDoc(), descriptor = THESIS_TEMPLATE_REGISTRY.find(item => item.id === saved.researchData.thesis.templateId);
          const template = (await descriptor.load()).default, model = compileThesisDocument(template,saved.researchData.thesis,saved.title,saved.content);
          const sourceSections = model.sections.filter(section=>[...walkSpecialPage(section.layout)].some(node=>node.type==='text'));
          const sourceSectionIds = sourceSections.map(section=>section.id).sort();
          const textCoverage = sourceSections.map(section=>{
            const normalize=text=>String(text||'').replace(/\s+/g,'').toUpperCase();
            const expected=[...walkSpecialPage(section.layout)].filter(node=>node.type==='text').map(node=>normalize(node.text)).join('');
            const actual=[...document.querySelectorAll(`[data-thesis-flow-section="${CSS.escape(section.id)}"] .thesis-layout-text`)].map(node=>normalize(node.textContent)).join('');
            return {id:section.id,expectedChars:expected.length,actualChars:actual.length,equal:expected===actual};
          });
          const fits = measureSpecialPageFit(document.querySelector('[aria-label="Belge sayfaları"]'),groupThesisSections(model.sections),pageMetrics);
          const notices = [...document.querySelectorAll('.thesis-ribbon-warning p')].map(el=>el.textContent).filter(text=>/taşıyor|üst üste/.test(text));
          const missingWarnings = fits.flatMap(item=>item.messages).filter(message=>!notices.includes(message));
          const sections = [], alignments = [], overlaps = [], physicalOverflow = [], clipped = [];
          for (const host of document.querySelectorAll('[data-thesis-flow-section]')) {
            const blocks = [...host.querySelectorAll('.thesis-layout-text')]; if (!blocks.length) continue;
            const id = host.dataset.thesisFlowSection, flow = host.closest('.thesis-page-flow'), flowTop = flow.getBoundingClientRect().top;
            const sheets = [...flow.closest('.thesis-page-stack').querySelectorAll('.thesis-sheet')].map(el=>el.getBoundingClientRect());
            const lines = [];
            for (const block of blocks) {
              const style = getComputedStyle(block), box = block.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(block);
              for(let ancestor=block;ancestor&&ancestor!==host.parentElement;ancestor=ancestor.parentElement){const s=getComputedStyle(ancestor);if(/hidden|clip/.test(s.overflowX+' '+s.overflowY)&&(ancestor.scrollHeight>ancestor.clientHeight+1||ancestor.scrollWidth>ancestor.clientWidth+1))clipped.push({id,block:block.dataset.thesisBlock,ancestor:ancestor.className});}
              const rows = new Map();
              for (const r of range.getClientRects()) {
                if (r.width < .5 || r.height < 1) continue;
                const key = Math.round(r.top / 3), row = rows.get(key) || { left: Infinity, right: -Infinity, top: r.top, bottom: r.bottom };
                row.left = Math.min(row.left, r.left); row.right = Math.max(row.right, r.right); rows.set(key, row);
              }
              const left = box.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth), right = box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
              if (rows.size > 1 && ['center','right','left','start','end'].includes(style.textAlign)) {
                const offsets = [...rows.values()].map(row => style.textAlign === 'center' ? (row.left-left)-(right-row.right) : ['right','end'].includes(style.textAlign) ? right-row.right : row.left-left);
                if (Math.max(...offsets)-Math.min(...offsets) > 6) alignments.push({ id, block: block.dataset.thesisBlock, align: style.textAlign, text: block.textContent.slice(0,60), offsets });
              }
              for (const row of rows.values()) {
                lines.push({ ...row, block: block.dataset.thesisBlock, text: block.textContent.slice(0,60) });
                if(!sheets.some(sheet=>row.left>=sheet.left-1&&row.right<=sheet.right+1&&row.top>=sheet.top-1&&row.bottom<=sheet.bottom+1))physicalOverflow.push({id,block:block.dataset.thesisBlock,text:block.textContent.slice(0,60),row});
              }
            }
            for (let a=0;a<lines.length;a++) for(let b=a+1;b<lines.length;b++) {
              const A=lines[a],B=lines[b];if(A.block===B.block)continue;
              const x=Math.min(A.right,B.right)-Math.max(A.left,B.left), y=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top), h=Math.min(A.bottom-A.top,B.bottom-B.top);
              if(x>1&&y>.5*h)overlaps.push({id,a:A.block,b:B.block,textA:A.text,textB:B.text});
            }
            const pitch = sheets.length>1 ? sheets[1].top-sheets[0].top : (sheets[0]?.height || 1122.52)+28;
            sections.push({ id, lines: lines.length, pages: Math.max(1,...lines.map(row=>1+Math.floor((row.top-flowTop+.75)/pitch))), fallback: getComputedStyle(host.querySelector(':scope>.thesis-body')).display !== 'flex' });
          }
          return { sections, sourceSectionIds, textCoverage, alignments, overlaps, fits, notices, missingWarnings, physicalOverflow, clipped, sheets: document.querySelectorAll('.thesis-sheet').length };
        }),120000,'Special-page DOM measurement');
        if(name==='base')baselines.set(id,data.sections.map(section=>section.id).sort());
        const expected=baselines.get(id), actual=data.sections.map(section=>section.id).sort();
        const coverage = !!expected && JSON.stringify(actual)===JSON.stringify(expected) && JSON.stringify(actual)===JSON.stringify(data.sourceSectionIds) && data.textCoverage.every(item=>item.equal);
        const row = { id, file: source.file, variant: name, status: coverage && !data.alignments.length && !data.overlaps.length && !data.missingWarnings.length && !data.physicalOverflow.length && !data.clipped.length ? 'ok' : 'inspect', coverage, expectedSections: expected, ...data, seconds: +( (performance.now()-started)/1000).toFixed(2) };
        results.push(row); console.log(results.length,id,name,row.status,'overlaps',data.overlaps.length,'alignment',data.alignments.length);
        if(row.status==='inspect')await page.screenshot({path:`${out}/${id}__${name}.png`,fullPage:false,timeout:10000});
      } catch(error) {
        const diagnostic = await bounded(page?.evaluate(()=>({ready:document.querySelector('[data-thesis-pagination-ready]')?.dataset.thesisPaginationReady,fonts:document.fonts.status,pendingMath:document.querySelectorAll('.math-formula__render--pending').length,sheets:document.querySelectorAll('.thesis-sheet').length,body:document.body.innerText.slice(-2500)})),5000,'Failure diagnostic').catch(()=>null);
        if(page)await page.screenshot({path:`${out}/${id}__${name}__error.png`,timeout:5000}).catch(()=>{});
        results.push({id,variant:name,status:'error',error:String(error),diagnostic});console.log(id,name,'ERROR',String(error).slice(0,160),JSON.stringify(diagnostic));
      }
      await writeFile(out+'/results.json',JSON.stringify({scope:'Real editor static special pages; metadata/template unchanged; editable body/sectionContent shortened; derived totalPages differs; full fixture acceptance separate.',results},null,2));
    }
    await bounded(context.close(),10000,'Closing template context');
  }
} finally { await bounded(browser.close(),10000,'Closing matrix browser'); }
await writeFile(out+'/results.json',JSON.stringify({scope:'Real editor static special pages; metadata/template unchanged; editable body/sectionContent shortened; derived totalPages differs; full fixture acceptance separate.',results},null,2));
console.log('TOTAL',results.length,'inspect',results.filter(r=>r.status==='inspect').length,'errors',results.filter(r=>r.status==='error').length);
if(results.length!==fixtures.size*variants.length && !only || results.some(r=>r.status==='inspect'||r.status==='error'))process.exitCode=1;
