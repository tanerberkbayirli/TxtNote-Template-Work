import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const base='orchestration/engine-work/final-closure/performance/headings';
const child=spawn('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File','orchestration/tools/word2pdf.ps1','-In',base+'.docx','-Out',base+'.word.pdf','-RenderInfo',base+'.word.render.json'],{windowsHide:true});
let output='',pid=null,timedOut=false;
child.stdout.on('data',data=>{const text=data.toString();output+=text;process.stdout.write(text);pid=/WORDPID:(\d+)/.exec(output)?.[1]||pid});child.stderr.on('data',data=>{output+=data.toString();process.stderr.write(data)});
const timer=setTimeout(()=>{timedOut=true;if(pid)execFileSync('powershell',['-NoProfile','-Command',`$p=Get-CimInstance Win32_Process -Filter "ProcessId=${Number(pid)}";if($p.Name -eq 'WINWORD.EXE' -and $p.CommandLine -match '/Automation\\s+-Embedding'){Stop-Process -Id ${Number(pid)}}`],{windowsHide:true});child.kill()},120000);
const code=await new Promise(resolve=>child.on('exit',resolve));clearTimeout(timer);
writeFileSync(base+'.render-run.json',JSON.stringify({status:code===0&&!timedOut?'PASS':'FAIL',code,timedOut,ownedWordPid:pid,output},null,2));if(code!==0||timedOut)process.exitCode=1;
