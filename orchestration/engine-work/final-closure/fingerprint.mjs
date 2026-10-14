import {createHash} from 'node:crypto';
import {existsSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';

// Bind final evidence to orchestration/engine-work/checker inputs; exclude generated output and runtimes.
const roots=['engine/src','TxtNote/frontend/src','TxtNote/frontend/tests','TxtNote/src-tauri/src','orchestration/specs','orchestration/tools'];
const files=new Set();
function visit(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','__pycache__','.venv','generated'].includes(entry.name))continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory())visit(path);
    else if(/\.(?:[cm]?js|jsx|ts|tsx|css|html|json|py|ps1|rs)$/.test(entry.name))files.add(path);
  }
}
roots.forEach(visit);
for(const file of ['engine/package.json','engine/package-lock.json','TxtNote/jsconfig.json','TxtNote/frontend/package.json','TxtNote/frontend/package-lock.json','TxtNote/frontend/vite.config.js','TxtNote/src-tauri/Cargo.toml','TxtNote/src-tauri/Cargo.lock','orchestration/engine-work/mission07_fixture.mjs','orchestration/engine-work/mission01/acceptance-v3.json'])if(existsSync(file))files.add(file);
// Harness changes invalidate evidence too. Never hash generated reports/artifacts.
function visitHarness(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())visitHarness(path);
    else if(/\.(?:mjs|js|py|ps1)$/.test(entry.name))files.add(path);
  }
}
visitHarness('orchestration/engine-work/final-closure');
for(const file of readdirSync('orchestration/engine-work/final-closure/special/families')){
  if(!file.endsWith('.json'))continue;
  const path=join('orchestration/engine-work/final-closure/special/families',file);
  if(JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,'')).researchData?.thesis)files.add(path);
}
const corpus=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
for(const id of ['SRC09','SRC10']){
  const entry=corpus.cases.find(item=>item.id===id),input=entry?.input||entry?.inputs?.[0];
  if(!input?.path||!existsSync(input.path))throw new Error(`Missing original ${id} acceptance source`);
  files.add(input.path);
  files.add(`orchestration/engine-work/mission01/references/${id}/word.pdf`);
}
const inputs=[...files].sort().map(path=>({path:relative(process.cwd(),path).replaceAll('\\','/'),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
const result={measuredAt:new Date().toISOString(),sha256:createHash('sha256').update(JSON.stringify(inputs)).digest('hex'),inputs};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2));
console.log(JSON.stringify({sha256:result.sha256,files:inputs.length}));
