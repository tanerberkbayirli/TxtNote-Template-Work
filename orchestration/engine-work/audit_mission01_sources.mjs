import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const corpus=JSON.parse(readFileSync(join(root,'orchestration/engine-work/mission01/corpus.json'),'utf8'));
const edges=JSON.parse(readFileSync(join(root,'orchestration/engine-work/mission01/inputs',process.argv.includes('--final')?'native-inputs-final.json':'native-inputs-v2.json'),'utf8'));
const only=process.argv.includes('--only')?process.argv[process.argv.indexOf('--only')+1]:null;
const aligned=process.argv.includes('--aligned');
const selected=[...corpus.sources,...edges.sources].filter(x=>x.path.endsWith('.docx')&&(!only||x.id===only));
for(const source of selected){
  const input=join(root,source.path), folder=join(root,'orchestration/validation/mission01/source-references',source.id), out=join(folder,aligned?'audit-aligned.json':'audit.json');
  const hash=createHash('sha256').update(readFileSync(input)).digest('hex');
  if(hash!==source.sha256)throw new Error('Input hash changed: '+source.id);
  if(existsSync(out)){
    const old=JSON.parse(readFileSync(out,'utf8').replace(/^\uFEFF/,''));
    if(old.status!=='AUDITED'||old.sha256!==hash)throw new Error('Invalid existing audit '+source.id);
    console.log(source.id+': source audit preserved');continue;
  }
  console.log(source.id+': structural page audit starting');
  const runPath=out.replace(/\.json$/,'.run.json');
  if(existsSync(runPath))writeFileSync(out.replace(/\.json$/,`.previous-${Date.now()}.run.json`),readFileSync(runPath));
  let output='',errors='',pid=null,timedOut=false;
  const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(root,'orchestration/engine-work/word_source_audit.ps1'),'-In',input,'-Out',out,
    ...(aligned?['-ReferencePdf',join(folder,'audit-aligned.pdf')]:[])],{cwd:root,windowsHide:true});
  child.stdout.on('data',b=>{output+=b.toString();pid=Number(output.match(/WORDPID:(\d+)/)?.[1])||null});
  child.stderr.on('data',b=>{errors+=b.toString()});
  const timer=setTimeout(()=>{timedOut=true;if(pid)spawnSync('taskkill.exe',['/PID',String(pid),'/F'],{windowsHide:true});child.kill()},120000);
  const code=await new Promise((res,rej)=>{child.on('close',res);child.on('error',rej)});clearTimeout(timer);
  writeFileSync(runPath,JSON.stringify({id:source.id,pid,code,timedOut,output,errors},null,2)+'\n');
  if(code!==0||timedOut||!existsSync(out))throw new Error(source.id+': audit failed: '+errors.slice(-1500));
  const result=JSON.parse(readFileSync(out,'utf8').replace(/^\uFEFF/,''));
  console.log(`${source.id}: ${result.features.length} feature locations, ${result.physicalPages} physical pages`);
}
