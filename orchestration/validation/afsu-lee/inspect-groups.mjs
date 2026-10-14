import fs from 'node:fs';
import { THESIS_TEMPLATE_REGISTRY } from '../../../engine/src/registry.js';
const reg=THESIS_TEMPLATE_REGISTRY.find(x=>x.id==='afsu-lee-master-tr-v1'); const temp=(await reg.load()).default;
const fixture=JSON.parse(fs.readFileSync('orchestration/validation/afsu-lee/master-fixture.json','utf8'));
const {compileThesisDocument,groupThesisSections}=await import('../../../engine/src/engine.js');
const doc=compileThesisDocument(temp,fixture.researchData.thesis,fixture.title,fixture.content,[]);
console.log('groups',groupThesisSections(doc.sections).map(g=>g.sections.map(s=>[s.id,s.pageBreakBefore,s.standalone,s.rules.page.numbering.format,s.rules.page.numbering.restart])));
