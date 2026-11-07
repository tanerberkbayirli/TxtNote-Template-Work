// Install only the validated regional rebuild. Official PDF/DOCX/DOC packages are read-only.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {install, reindex, toEngineTemplate} from './install-template-draft.mjs';
import {validateThesisTemplate} from '../../src/validation.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const plan=read('engine/output/ege-rebuild/rebuild-plan.json');
const sources=read('engine/output/ege-rebuild/sources.json');
for(const reading of read('engine/references/ege-rebuild/manual-readings.json')){
  const source=sources.find(s=>s.key===reading.key);
  if(!source || source.sha256!==reading.sha256) throw new Error('Visual reading needs renewal: '+reading.key);
  source.status='visually-read';source.visualReading=reading;
}
const region=path.join(root,'Butun-Sablonlar/Ege');
const handRegistry=fs.readFileSync(path.join(root,'engine/src/registry.js'),'utf8');
const handIds=new Set([...handRegistry.matchAll(/\{ id: "([^"]+)"/g)].map(m=>m[1]));
const prepared=[];
for(const row of plan.drafts){
  const draft=read(row.draft);
  const errors=validateThesisTemplate(toEngineTemplate(draft.template));
  if(errors.length) throw new Error(`${row.id}: ${errors.join('; ')}`);
  const main=path.resolve(root,row.source);
  if(!main.startsWith(region+path.sep)) throw new Error('Source outside Ege region');
  const source=sources.find(s=>s.path===row.source);
  const sha=createHash('sha256').update(fs.readFileSync(main)).digest('hex');
  if(!source || source.sha256!==sha) throw new Error('Changed source: '+row.source);
  if(row.guide && path.dirname(row.guide)!==path.dirname(row.source)) throw new Error('Cross-institute guide: '+row.id);
  prepared.push({row,draft});
}
// All inputs are checked before the first mutation.
const installed=[];
for(const {row,draft} of prepared){
  const result=install(draft,{status:'generic'});
  if(handIds.has(row.id)){
    // This ID already has a stable hand-written loader. Reuse it, keeping one descriptor.
    fs.rmSync(path.join(root,'engine/src/templates/generated',row.id+'.js'));
  }
  installed.push({...row,unknown:draft.unknown?.length||0,conflicts:draft.conflicts?.length||0,
    reviewedFields:Object.keys(draft.evidence||{}).filter(k=>draft.evidence[k].status==='REVIEWED_SOURCE'),
    file:path.relative(root,result.jsonPath).split(path.sep).join('/')});
}
// Intermediate entries created during this rebuild were superseded after reading
// the sources' actual language and their separate Word front-page templates.
for(const id of ['ieu-gastronomi-undergraduate-tr-kaynak','ieu-lee-master-en-kaynak','ieu-lee-master-tr-kaynak']){
  const modulePath=path.join(root,'engine/src/templates/generated',id+'.js');
  const dataPath=path.join(region,'İzmir Ekonomi Üniversitesi',id+'.json');
  if(fs.existsSync(dataPath)){
    const old=JSON.parse(fs.readFileSync(dataPath,'utf8'));
    if(old.source?.rebuildKind!=='guide-rules' || old.status!=='generic') throw new Error('Unexpected superseded template: '+id);
    fs.rmSync(dataPath);
  }
  if(fs.existsSync(modulePath)) fs.rmSync(modulePath);
}
reindex();
const auditDir=path.join(root,'engine/references/ege-rebuild');
fs.mkdirSync(auditDir,{recursive:true});
fs.writeFileSync(path.join(auditDir,'sources.json'),JSON.stringify(sources,null,1)+'\n');
fs.writeFileSync(path.join(auditDir,'coverage.json'),JSON.stringify({date:'2026-10-23',
  sourceCount:sources.length,scopeCount:plan.coverage.filter(x=>x.scope).length,
  retainedLayouts:plan.retained,templates:installed,coverage:plan.coverage,
  limitations:['Schema validation does not certify visual conformity.','Unresolved source fields remain in source.review; new entries are drafts.']},null,1)+'\n');
console.log(JSON.stringify({installed:installed.length,retainedLayouts:plan.retained.length,sources:sources.length}));
