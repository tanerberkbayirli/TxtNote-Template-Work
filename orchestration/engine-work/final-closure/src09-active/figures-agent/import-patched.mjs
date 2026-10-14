import {register} from 'node:module';
register(new URL('./hook.mjs',import.meta.url));
const {readFileSync,writeFileSync}=await import('node:fs');
const {importThesisDocx}=await import('../../../../../engine/src/importDocx.js');
const {installContentDocument}=await import('../../../../../engine/src/contentModel.js');
const generic=(await import('../../../../../engine/src/templates/generic.js')).default;
const cases=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases;
const [name,...ids]=process.argv.slice(2);
for(const id of ids){
 const c=cases.find(c=>c.id===id),input=c.input||c.inputs[0];
 const doc=await importThesisDocx(readFileSync(input.path));
 const note=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},doc);
 writeFileSync(`TxtNote/frontend/tests/generated/${id}_${name}.fixture.json`,JSON.stringify({...note,__template:generic}));
 console.log('imported',id,name);
}
