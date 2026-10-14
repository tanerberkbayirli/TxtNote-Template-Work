import { readdir,readFile,mkdir,writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn,spawnSync } from 'node:child_process';
import { resolve,join } from 'node:path';
const source='orchestration/engine-work/final-closure/special/families',out=process.env.SPECIAL_FAMILY_OUT||source;
await mkdir(out,{recursive:true});
const env={...process.env,PLAYWRIGHT_MODULE:resolve('orchestration/tools/node_modules/playwright'),THESIS_BROWSER_EXECUTABLE:'C:/Program Files/Google/Chrome/Application/chrome.exe'};
const base=env.THESIS_BASE_URL||'http://127.0.0.1:5194';
const log=[];
const expectedIds=['adu-ziraat-lisans-tr-v1','afsu-lee-master-tr-v1','aku-fbe-master-tr-v1','aku-sagbil-master-tr-v1','aku-sbe-master-tr-v1','iyte-lee-master-en-v1','mcbu-tip-uzmanlik-tr-v1'];
await writeFile(join(out,'runs.json'),JSON.stringify(log));
async function run(command,args,word=false){
  return new Promise((resolveResult,reject)=>{
    const child=spawn(command,args,{env,windowsHide:true});let output='',ownedPid;
    const timer=setTimeout(()=>{if(ownedPid)spawnSync('taskkill',['/PID',ownedPid,'/F']);spawnSync('taskkill',['/PID',String(child.pid),'/T','/F']);reject(new Error('Timed out; stopped only owned processes '+(ownedPid||child.pid)));},word?120000:180000);
    child.stdout.on('data',chunk=>{output+=chunk;process.stdout.write(chunk);ownedPid=output.match(/WORDPID:(\d+)/)?.[1]||ownedPid;});
    child.stderr.on('data',chunk=>{output+=chunk;process.stderr.write(chunk);});
    child.on('error',error=>{clearTimeout(timer);reject(error)});
    child.on('close',code=>{clearTimeout(timer);if(code!==0)reject(new Error(output.slice(-1500)));else resolveResult({ownedPid,output});});
  });
}
for(const file of(await readdir(source)).filter(file=>file.endsWith('.json')).sort()){
  const fixture=JSON.parse((await readFile(join(source,file),'utf8')).replace(/^\uFEFF/,''));
  if(!fixture.researchData?.thesis)continue;
  if(!expectedIds.includes(fixture.researchData.thesis.templateId)||file!==fixture.researchData.thesis.templateId+'.json')throw new Error('Unexpected family fixture '+file);
  if(env.SPECIAL_FAMILY_TARGETS&&!env.SPECIAL_FAMILY_TARGETS.split(',').includes(fixture.researchData.thesis.templateId))continue;
  const prefix=resolve(out,file.slice(0,-5));
  if(['.pdf','.docx','.word.pdf'].some(extension=>existsSync(prefix+extension)))throw new Error('Family acceptance requires fresh output artifacts: '+prefix);
  if(resolve(source)!==resolve(out))await writeFile(prefix+'.json',JSON.stringify(fixture,null,2));
  await run(process.execPath,['orchestration/tools/export.mjs',resolve(source,file),prefix,base]);
  const word=await run('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File','orchestration/tools/word2pdf.ps1','-In',prefix+'.docx','-Out',prefix+'.word.pdf','-RenderInfo',prefix+'.word.render.json'],true);
  if(!existsSync(prefix+'.word.pdf'))throw new Error('Missing Word PDF '+file);
  log.push({fixture:file,prefix,wordPid:word.ownedPid});
  await writeFile(join(out,'runs.json'),JSON.stringify(log,null,2));
}
if(!env.SPECIAL_FAMILY_TARGETS&&(log.length!==7||new Set(log.map(row=>row.fixture)).size!==7))throw new Error('Expected seven distinct family fixtures; got '+log.length);
