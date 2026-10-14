import {spawn,spawnSync} from 'node:child_process';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,basename} from 'node:path';
const files=process.argv.slice(2),out=resolve('orchestration/engine-work/mission08/resume-word');
if(!files.length)throw new Error('Provide one or more DOCX paths');
mkdirSync(out,{recursive:true});
const rows=[];
for(const file of files) {
  const stem=basename(file,'.docx'),pdf=resolve(out,stem+'.pdf');
  const started=performance.now();
  const row=await new Promise(resolveRow=>{
    const ps=spawn('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File','orchestration/tools/word2pdf.ps1','-In',resolve(file),'-Out',pdf,'-Refreshed',resolve(out,stem+'.refreshed.pdf'),'-FieldDump',resolve(out,stem+'.fields.json'),'-RenderInfo',resolve(out,stem+'.render.json')]);
    let output='',wordPid,finished=false;
    const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);resolveRow(value);};
    ps.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/WORDPID:(\d+)/);if(match)wordPid=match[1];});
    ps.stderr.on('data',chunk=>output+=chunk);
    const timer=setTimeout(()=>{
      if(wordPid)spawnSync('taskkill',['/PID',wordPid,'/F']);
      spawnSync('taskkill',['/PID',String(ps.pid),'/T','/F']);
      finish({status:'FAIL',reason:'Word timeout after 120 seconds',wordPid});
    },120000);
    ps.on('error',error=>finish({status:'FAIL',reason:error.message}));
    ps.on('close',code=>{
      writeFileSync(resolve(out,stem+'.log'),output);
      finish({status:code===0&&output.includes('OK')&&existsSync(pdf)?'PASS':'FAIL',exitCode:code,wordPid,pdf,output:output.slice(-500)});
    });
  });
  Object.assign(row,{input:resolve(file),seconds:(performance.now()-started)/1000});
  rows.push(row);writeFileSync(resolve(out,'manifest.json'),JSON.stringify(rows,null,2));console.log(`${stem}: ${row.status} ${row.reason||''}`);
}
if(rows.some(row=>row.status!=='PASS'))process.exitCode=1;
