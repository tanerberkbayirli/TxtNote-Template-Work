import fs from 'node:fs';
import {compileThesisDocument,groupThesisSections} from '../../../../../engine/src/engine.js';
import {pageMetrics} from '../../../../../engine/src/pageLayout.js';
const id=process.argv[2];
const d=JSON.parse(fs.readFileSync(`TxtNote/frontend/tests/generated/${id}.fixture.json`,'utf8'));
const {__template,...note}=d;
const m=compileThesisDocument(__template,note.researchData.thesis,note.title,note.content);
const groups=groupThesisSections(m.sections);
groups.forEach((g,i)=>{const p=g.rules.page;const pm=pageMetrics(p);console.log(i,g.id,p.firstFooterExtraMm,JSON.stringify(p.margins),JSON.stringify(p.docxMargins),'footerDist',p.footer?.distanceMm,'fparas',(p.footer?.paragraphs||[]).length,'hmm',JSON.stringify(pm).slice(0,200))});
