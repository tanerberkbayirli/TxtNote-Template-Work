import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';

const root=resolve(process.argv[2]||'orchestration/engine-work/final-closure/final');
const checks=[];
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8').replace(/^\uFEFF/,''));
function gate(name,fn){try{const details=fn();checks.push({name,status:'PASS',details});}catch(error){checks.push({name,status:'FAIL',error:error.message});}}
function requireTrue(value,message){if(!value)throw new Error(message);}
const sameSet=(actual,expected)=>actual.length===expected.length&&new Set(actual).size===actual.length&&[...actual].sort().join('\n')===[...expected].sort().join('\n');
const familyIds=['adu-ziraat-lisans-tr-v1','afsu-lee-master-tr-v1','aku-fbe-master-tr-v1','aku-sagbil-master-tr-v1','aku-sbe-master-tr-v1','iyte-lee-master-en-v1','mcbu-tip-uzmanlik-tr-v1'];
const stageNames={base:['unit','extra-unit','build','desktop-font-unit','checker-unit'],browser:['special-matrix','special-families','special-families-compare','fixture-SRC09','long-SRC09','breaks-SRC09','fixture-SRC10','long-SRC10','breaks-SRC10','benchmark-SRC09','interact-SRC10'],word:['all-word']};
for(const stage of ['base','browser','word','sbe','schema'])gate(stage,()=>{
  const gates=read(`${stage}-gates.json`);
  requireTrue(gates.length>0&&gates.every(row=>row.exitCode===0),'A required command failed or is missing');
  requireTrue(read(`${stage}-inputs-before.json`).sha256===read(`${stage}-inputs-after.json`).sha256,'Inputs changed during acceptance');
  requireTrue(new Set(gates.map(row=>row.name)).size===gates.length,'Duplicate gate evidence');
  if(stageNames[stage])requireTrue(sameSet(gates.map(row=>row.name),stageNames[stage]),'Missing or unexpected required command');
  if(stage==='base')requireTrue(gates.length===5,'Expected five base gates');
  if(stage==='sbe')requireTrue(gates.length===10&&[1,4].every(rate=>[1,2,3,4,5].every(i=>gates.some(row=>row.name===`sbe-cpu${rate}-${i}`))),'Expected five normal and five CPU-throttled runs');
  return {commands:gates.length};
});
gate('same-code-across-stages',()=>{
  const hashes=['base','browser','word','sbe','schema'].map(stage=>read(`${stage}-inputs-after.json`).sha256);
  requireTrue(new Set(hashes).size===1,'Acceptance stages used different orchestration/engine-work/checker inputs');
  const current=spawnSync(process.execPath,['orchestration/engine-work/final-closure/fingerprint.mjs'],{encoding:'utf8'});
  requireTrue(current.status===0,'Cannot fingerprint current acceptance inputs');
  requireTrue(JSON.parse(current.stdout).sha256===hashes[0],'Current orchestration/engine-work/harness/source inputs differ from acceptance evidence');
  return {sha256:hashes[0]};
});
gate('word-targets',()=>{
  const report=read('all-word-manifest.json');
  requireTrue(report.wordRequested&&report.targets.length===25,'Expected all 25 targets with Word requested');
  const expected=readdirSync('orchestration/specs').filter(file=>file.endsWith('.checks.json')).map(file=>file.replace(/\.checks\.json$/,''));
  requireTrue(sameSet(report.targets.map(row=>row.target),expected),'Missing or duplicate Word targets');
  requireTrue(report.targets.every(row=>row.exitCode===0&&row.report&&row.counts.PASS>0&&(row.counts.FAIL||0)===0&&(row.counts.SKIPPED||0)===0&&(row.counts.UNKNOWN||0)===0&&(row.counts.CONFLICT||0)===0),'Failed, skipped, unknown or missing acceptance checks');
  for(const target of report.targets){
    const details=JSON.parse(readFileSync(target.report,'utf8').replace(/^\uFEFF/,''));
    requireTrue(Object.entries(details.counts).every(([status,count])=>['PASS','INFO'].includes(status)||count===0),'Unexpected conformance status');
    requireTrue(Object.entries(details.counts).every(([status,count])=>target.counts[status]===count),'Manifest counts do not match measured checks');
    for(const [variant,artifacts] of Object.entries(details.variants))for(const name of ['fixture','pdf','docx','layout','wordPdf','wordRenderInfoPath']){
      const hash=details.artifactSha256?.[variant]?.[name];
      requireTrue(artifacts[name]&&hash&&createHash('sha256').update(readFileSync(artifacts[name])).digest('hex')===hash,`Changed or missing measured artifact: ${target.target}/${variant}/${name}`);
    }
  }
  return {targets:report.targets.length,pass:report.targets.reduce((sum,row)=>sum+(row.counts.PASS||0),0)};
});
gate('docx-schema',()=>{
  const rows=read('schema-manifest.json');
  requireTrue(rows.length>0&&rows.every(row=>row.status==='PASS'&&row.errorCount===0&&row.inputSha256),'Missing or invalid freshly exported DOCX');
  const expected=[];
  for(const target of read('all-word-manifest.json').targets){
    const targetReport=JSON.parse(readFileSync(target.report,'utf8').replace(/^\uFEFF/,''));
    for(const [variant,artifacts] of Object.entries(targetReport.variants)){
      const name=`${target.target}.${variant}`;expected.push(name);
      const row=rows.find(row=>row.name===name);
      requireTrue(row?.inputSha256===createHash('sha256').update(readFileSync(artifacts.docx)).digest('hex'),`Schema evidence does not match DOCX: ${name}`);
    }
  }
  for(const path of [...familyIds.map(id=>`special-families/${id}.docx`),'performance/benchmark-SRC09.docx']){
    const name='additional.'+path.split('/').at(-1).replace(/\.docx$/,'');expected.push(name);
    requireTrue(rows.find(row=>row.name===name)?.inputSha256===createHash('sha256').update(readFileSync(join(root,path))).digest('hex'),`Schema evidence does not match additional DOCX: ${name}`);
  }
  requireTrue(sameSet(rows.map(row=>row.name),expected),'Missing or duplicate schema documents');
  requireTrue(sameSet(read('schema-gates.json').map(row=>row.name),expected),'Missing schema validation commands');
  return {documents:rows.length};
});
gate('special-matrix',()=>{
  const rows=read('special-matrix/results.json').results;
  requireTrue(rows.length===232&&new Set(rows.map(row=>row.id)).size===29,'Expected 29 templates × eight variants');
  requireTrue(rows.every(row=>['ok','n/a'].includes(row.status)),'An applicable special-page case failed');
  const variants=['base','title120','title250','title400','coadv','jury3','jury5','jury7'];
  requireTrue(new Set(rows.map(row=>`${row.id}/${row.variant}`)).size===232,'Duplicate matrix slots');
  for(const id of new Set(rows.map(row=>row.id)))requireTrue(sameSet(rows.filter(row=>row.id===id).map(row=>row.variant),variants),`Incomplete variants: ${id}`);
  for(const row of rows.filter(row=>row.status==='ok')){
    requireTrue(row.coverage===true&&row.textCoverage?.length>0&&row.textCoverage.every(item=>item.equal),'Missing source text coverage');
    for(const name of ['alignments','overlaps','missingWarnings','physicalOverflow','clipped'])requireTrue(Array.isArray(row[name])&&row[name].length===0,`Invalid matrix ${name}`);
    requireTrue(sameSet(row.sections.map(section=>section.id),row.sourceSectionIds),'Missing source special pages');
  }
  return {applicable:rows.filter(row=>row.status==='ok').length,unsupportedSlots:rows.filter(row=>row.status==='n/a').length};
});
gate('special-word-families',()=>{
  const rows=read('special-families/comparison.json');
  requireTrue(rows.length===7&&rows.every(row=>row.status==='PASS'),'Expected seven passing real Word families');
  requireTrue(sameSet(rows.map(row=>row.id),familyIds),'Missing or duplicate Word families');
  requireTrue(rows.every(row=>row.editableTitle===true&&row.pdfPages===row.wordPages&&row.docxTextRuns>0&&Object.keys(row.missingLetters).length===0&&Object.keys(row.extraLetters).length===0),'Incomplete Word family content proof');
  return {families:rows.length};
});
for(const [id,pages] of [['SRC09',180],['SRC10',91]])gate(`long-${id}`,()=>{
  const report=read(`long/${id}.json`);
  requireTrue(report.status==='MEASURED'&&report.pages===pages&&report.pageErrors.length===0,`Expected ${pages} pages without browser errors`);
  return {pages:report.pages,loadMs:report.loadMs};
});
for(const id of ['SRC09','SRC10'])gate(`long-breaks-${id}`,()=>{
  const report=read(`long/${id}.breaks.json`);
  requireTrue(report.wordPages===report.editorPages,`Page totals differ: editor ${report.editorPages}, Word ${report.wordPages}`);
  requireTrue(report.misalignedOpenings===0,`${report.misalignedOpenings} of ${report.openingsChecked} Word page openings are not an editor page opening (first: ${JSON.stringify(report.firstMisaligned?.[0])})`);
  requireTrue(report.textCoverage>=report.coverageMin,`Text coverage ${report.textCoverage} is below ${report.coverageMin}`);
  return {openingsChecked:report.openingsChecked,textCoverage:report.textCoverage};
});
gate('performance-SRC09',()=>{
  const report=read('performance/benchmark-SRC09.json');
  requireTrue(report.status==='MEASURED'&&report.samples.length===20&&report.errors.length===0,'Expected 20 completed keyboard samples');
  requireTrue(report.save?.documentEqual===true,'Save/reopen changed the document');
  requireTrue(report.twentySamplesRestoreAuthorContent===true,'Alternating edits did not restore the authored content');
  requireTrue(existsSync(join(root,'performance/benchmark-SRC09.pdf'))&&existsSync(join(root,'performance/benchmark-SRC09.docx')),'Missing actual production exports');
  return {openMs:report.openMs,inputToFrame:report.inputToFrame,settle:report.settle,timingAcceptance:report.timingAcceptance};
});
gate('long-interactions-SRC10',()=>{
  const report=read('performance/interact-SRC10.json');
  requireTrue(report.status==='PASS'&&report.pageErrors.length===0,'Long-document interaction flow failed');
  for(const name of ['typing','selection','real-copy-clipboard','real-paste','ime-commit','undo-removes-edits','redo-restores-edits','save-reopen-keeps-edits','enter-splits-paragraph','enter-caret-moves-to-new-paragraph'])requireTrue(report.steps[name]==='PASS',`Missing interaction evidence: ${name}`);
  return {timings:report.timings};
});
const report={measuredAt:new Date().toISOString(),root,status:checks.every(row=>row.status==='PASS')?'PASS':'FAIL',checks};
writeFileSync(join(root,'closure-gates.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
