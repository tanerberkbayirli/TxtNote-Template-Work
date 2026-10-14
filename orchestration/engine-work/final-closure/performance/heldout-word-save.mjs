import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const id of ['SRC08','SRC10']){
 const base=`orchestration/engine-work/final-closure/performance/${id}`;
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File','orchestration/engine-work/final-closure/performance/word-save-reopen.ps1','-In',base+'.browser.docx','-Out',base+'.save-before.pdf','-Roundtrip',base+'.word-roundtrip.docx','-Refreshed',base+'.save-refreshed.pdf','-FieldDump',base+'.save-fields.json','-RenderInfo',base+'.save.render.json'];
 const child=spawn('powershell',args,{windowsHide:true});let output='',pid=null,timedOut=false;
 child.stdout.on('data',data=>{const text=data.toString();output+=text;process.stdout.write(text);pid=/WORDPID:(\d+)/.exec(output)?.[1]||pid});child.stderr.on('data',data=>{output+=data.toString();process.stderr.write(data)});
 const timer=setTimeout(()=>{timedOut=true;if(pid)execFileSync('powershell',['-NoProfile','-Command',`$p=Get-CimInstance Win32_Process -Filter "ProcessId=${Number(pid)}";if($p.Name -eq 'WINWORD.EXE' -and $p.CommandLine -match '/Automation\\s+-Embedding'){Stop-Process -Id ${Number(pid)}}`],{windowsHide:true});child.kill()},180000);
 const code=await new Promise(resolve=>child.on('exit',resolve));clearTimeout(timer);
 rows.push({id,status:code===0&&!timedOut?'PASS':'FAIL',code,timedOut,ownedWordPid:pid,output});writeFileSync('orchestration/engine-work/final-closure/performance/heldout-word-save.json',JSON.stringify(rows,null,2));
}
if(rows.some(row=>row.status!=='PASS'))process.exitCode=1;

