import {readFileSync,writeFileSync} from 'node:fs';
import {unzipSync,strFromU8} from '../../../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
import {auditDocxFields} from '../../../../engine/src/docx/fields.js';
const rows=[];
const contract=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
for(const id of ['SRC08','SRC10']){
 const files=unzipSync(readFileSync(`orchestration/engine-work/final-closure/performance/${id}.browser.docx`));
 const parts=Object.entries(files).filter(([path])=>/^word\/.*\.xml$/.test(path)).map(([,bytes])=>strFromU8(bytes));
 const fields=auditDocxFields(parts);
 const original=unzipSync(readFileSync(contract.cases.find(c=>c.id===id).input.path));
 const source=auditDocxFields(Object.entries(original).filter(([path])=>/^word\/.*\.xml$/.test(path)).map(([,bytes])=>strFromU8(bytes)));
 const introduced=fields.dangling.filter(row=>!source.dangling.some(old=>old.target===row.target));
 rows.push({id,fields,source,introduced,status:!introduced.length&&!fields.duplicates.length&&!fields.unbalanced?'PASS_SOURCE_RESIDUALS':'FAIL'});
}
writeFileSync('orchestration/engine-work/final-closure/performance/heldout-fields.json',JSON.stringify(rows,null,2));console.log(rows.map(row=>({id:row.id,sourceDangling:row.source.dangling.length,outputDangling:row.fields.dangling.length,introduced:row.introduced.length,status:row.status})));if(rows.some(row=>row.status==='FAIL'))process.exitCode=1;
