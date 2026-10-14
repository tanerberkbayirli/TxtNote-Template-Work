import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='orchestration/engine-work/mission06', read=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]||0),0);
const general=read(`${dir}/general-manifest.json`), word=read(`${dir}/final-word-manifest.json`);
const baseline=new Map();
for(const file of ['regression-manifest.json','retry-manifest.json'])for(const r of read(`orchestration/engine-work/mission05/${file}`).targets)baseline.set(r.target,r);
const counts={};
for(const r of general.targets){
 assert.equal(r.error,null);assert.ok(r.report);const old=baseline.get(r.target);assert.ok(old?.report);
 const signature=p=>read(p).checks.map(c=>JSON.stringify([c.id,c.variant??null,c.status]));
 assert.deepEqual(signature(r.report),signature(old.report),r.target+' previous check statuses');
 for(const [k,v]of Object.entries(r.counts))counts[k]=(counts[k]||0)+v;
}
assert.equal(general.targets.length,23);assert.deepEqual(counts,{PASS:881,SKIPPED:836,FAIL:6,INFO:32});
assert.equal(word.targets.length,6);for(const r of word.targets){assert.equal(r.error,null);assert.equal(r.exitCode,0);assert.deepEqual(Object.keys(r.counts),['PASS']);}assert.equal(sum(word.targets.map(r=>r.counts),'PASS'),617);
const geometry=read(`${dir}/source-geometry-verification.json`),pdf=read(`${dir}/source-pdf-verification.json`),matrix=read(`${dir}/matrix-verification.json`),browser=read(`${dir}/browser-verification.json`);
for(const r of [geometry,pdf,matrix,browser])assert.equal(r.status,'PASS');
assert.equal(sum(geometry.results,'checks'),314);assert.equal(sum(geometry.results,'sections'),16);
assert.equal(pdf.results.reduce((n,r)=>n+r.pages.length,0),17);assert.equal(sum(matrix.matrices,'pages'),19);assert.equal(browser.results.length,3);
const unit=readFileSync(`${dir}/unit-tests-final-code.log`,'utf8');for(const s of ['tests 818','pass 818','fail 0','skipped 0','cancelled 0'])assert.ok(unit.includes(s));assert.ok(readFileSync(`${dir}/build-final-code.log`,'utf8').includes('built in'));
const inputs=[];for(const r of read(`${dir}/source-audit.json`)){for(const f of r.input?[r.input]:[...r.fixtures,r.checks]){assert.equal(hash(f.path),f.sha256);inputs.push(f);}}
const files=[];const walk=p=>{for(const e of readdirSync(p)){const f=p+'/'+e;if(statSync(f).isDirectory())walk(f);else if(!f.endsWith('/completion.json'))files.push(f);}};
walk(dir);walk('TxtNote/frontend/src/thesis');files.push('TxtNote/frontend/src/features/editor/ThesisSectionPages.jsx','TxtNote/frontend/src/lib/thesisSectionGeometry.test.js','TxtNote/frontend/src/lib/thesisEngine.test.js','orchestration/MISSION.md');
for(const f of readdirSync('engine'))if(/^(mission06_|verify_mission06_|close_mission06)/.test(f))files.push('orchestration/engine-work/'+f);
const inventory=[...new Set(files)].sort().map(path=>({path,sha256:hash(path)}));
if(process.argv.includes('--freeze'))writeFileSync(`${dir}/completion.json`,JSON.stringify({status:'COMPLETE',mission:'06',closedAt:new Date().toISOString(),unitTests:818,wordChecks:617,generalCounts:counts,sourceGeometryChecks:314,sourceSections:16,sourcePages:17,matrixPages:19,inputs,limitations:['Geometry excerpts are not full long-thesis pagination acceptance.','Six pre-existing general failures remain unchanged; skipped checks are not passes.','Complex unsupported source chrome retains located notices.'],nextMission:'07 — awaiting explicit user instruction',inventory},null,2)+'\n');
else if(!process.argv.includes('--check')){const frozen=read(`${dir}/completion.json`);assert.deepEqual(inventory,frozen.inventory,'Frozen evidence/code changed');assert.equal(frozen.status,'COMPLETE');}
console.log(JSON.stringify({status:'PASS',unitTests:818,wordChecks:617,generalCounts:counts,sourceGeometryChecks:314,sourcePages:17,matrixPages:19,inventoryFiles:inventory.length}));
