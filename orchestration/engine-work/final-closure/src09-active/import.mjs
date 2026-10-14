import {readFileSync,writeFileSync} from 'node:fs';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../engine/src/contentModel.js';
import generic from '../../../../engine/src/templates/generic.js';
const cases=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases;
for(const id of process.argv.slice(2)){
 const c=cases.find(c=>c.id===id),input=c.input||c.inputs[0];
 const doc=await importThesisDocx(readFileSync(input.path));
 const note=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},doc);
 writeFileSync(`TxtNote/frontend/tests/generated/${id}_ACTIVE.fixture.json`,JSON.stringify({...note,__template:generic}));
 console.log(`Fresh import: ${id}`);
}
