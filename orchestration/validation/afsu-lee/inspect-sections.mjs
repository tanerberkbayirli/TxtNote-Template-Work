import fs from 'node:fs';
import { THESIS_TEMPLATE_REGISTRY } from '../../../engine/src/registry.js';
const reg=THESIS_TEMPLATE_REGISTRY.find(x=>x.id==='afsu-lee-master-tr-v1'); const m=await reg.load(); const temp=m.default;
const fixture=JSON.parse(fs.readFileSync('orchestration/validation/afsu-lee/master-fixture.json','utf8'));
const {compileThesisDocument}=await import('../../../engine/src/engine.js');
const doc=compileThesisDocument(temp,fixture.researchData.thesis,fixture.title,fixture.content,[]);
console.log(doc.sections.map(s=>({id:s.id,type:s.type,pageBreakBefore:s.pageBreakBefore,blocks:s.layoutBlocks?.length,mode:s.mode,standalone:s.standalone,content:s.editableHtml?.slice(0,30)})));
