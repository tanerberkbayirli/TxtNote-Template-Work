import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {importThesisDocx} from '../../engine/src/importDocx.js';
import {installContentDocument} from '../../engine/src/contentModel.js';
import {compileThesisDocument} from '../../engine/src/engine.js';
import generic from '../../engine/src/templates/generic.js';
const a=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')),out=[];
for(const id of a.missions?.['06']?.development||['SRC01','SRC04','SRC05','EDGE_STRUCTURE','SYN04']){
 const c=a.cases.find(c=>c.id===id);if(!c){const s=a.syntheticRegressionGroups.find(c=>c.id===id);for(const f of [...s.fixtures,s.checks]){if(createHash('sha256').update(readFileSync(f.path)).digest('hex')!==f.sha256)throw Error(id+' hash');}out.push(s);continue;}const input=c.input||c.inputs?.[0];
 const bytes=readFileSync(input.path),sha=createHash('sha256').update(bytes).digest('hex');if(sha!==input.sha256)throw Error('Hash '+id);
 if(!input.path.endsWith('.docx')){out.push({id,input,status:'NON_DOCX_REFERENCE'});continue;}
 const d=await importThesisDocx(bytes);const n=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},d);
 const m=compileThesisDocument(generic,n.researchData.thesis,n.title,n.content);
 const sections=m.sections.map((s,i)=>({id:s.id,break:s.pageBreakBefore,sourceBreak:d.sections[i].properties.breakType,page:s.rules.page}));
 out.push({id,input,sections,issues:d.source.unsupported});
 writeFileSync('orchestration/engine-work/mission06/'+id+'.fixture.json',JSON.stringify({...n,__template:generic},null,2));
}
writeFileSync('orchestration/engine-work/mission06/source-audit.json',JSON.stringify(out,null,2));console.log(out.map(s=>[s.id,s.sections?.length,s.status]));

