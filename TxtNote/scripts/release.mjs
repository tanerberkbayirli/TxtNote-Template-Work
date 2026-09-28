import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureUpdaterKey,signingEnv } from './ensure-updater-key.mjs';
import { filesBelow,sourceIdentity,writeIdentity,verifyEmbeddedAssets,verifyNsisPayload,verifyUpdaterArtifacts,sha256,assertCurrentIdentity } from './release-verification.mjs';
const root=path.resolve(import.meta.dirname,'..'),mode=process.argv.includes('--unsigned')?'unsigned':'signed';
const target=path.resolve(process.env.CARGO_TARGET_DIR||path.join(root,'.cargo-target-build'));
const output=path.join(root,'output/desktop-parity'),stage=path.join(output,'release-stage'),payload=path.join(output,'installer-payload'),dest=path.join(root,'dist-installer');
const tauri=path.join(root,'node_modules/@tauri-apps/cli/tauri.js');
let env={...process.env,CARGO_TARGET_DIR:target};
function run(command,args,options={}) {
  const r=spawnSync(command,args,{cwd:root,stdio:'inherit',env,...options});
  if(r.error) throw r.error;
  if(r.status!==0) throw Error(`${command} failed (${r.status})`);
}
function clearDirectory(dir) {
  const resolved=path.resolve(dir);
  if(!resolved.startsWith(root+path.sep)) throw Error(`Refusing to clear external directory ${resolved}`);
  fs.rmSync(resolved,{recursive:true,force:true});fs.mkdirSync(resolved,{recursive:true});
}
if(mode==='signed'){ensureUpdaterKey();env=signingEnv(env);}
const conf=JSON.parse(fs.readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
const name=`${conf.productName}_${conf.version}_x64-setup.exe`;
for(const dir of [stage,payload,dest,path.join(target,'release/bundle/nsis')]) clearDirectory(dir);
const frontendSource=sourceIdentity(root).fingerprint;
run(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{shell:process.platform==='win32'});
if(sourceIdentity(root).fingerprint!==frontendSource) throw Error('Source changed during frontend build');
const identity=writeIdentity(root);
fs.writeFileSync(path.join(output,'build-identity.json'),JSON.stringify(identity,null,2)+'\n');
const config=JSON.stringify({build:{beforeBuildCommand:''},bundle:{createUpdaterArtifacts:mode==='signed'}});
run(process.execPath,[tauri,'build','--no-bundle','--ci','--config',config]);
const executable=path.join(target,'release/txtnote.exe'),embedded=verifyEmbeddedAssets(root,target,executable,identity),applicationBytes=fs.readFileSync(executable);
run(process.execPath,[tauri,'bundle','--bundles','nsis','--ci','--config',config,...(mode==='unsigned'?['--no-sign']:[])]);
const bundle=path.join(target,'release/bundle/nsis');
for(const n of fs.readdirSync(bundle)) if(/\.(exe|sig)$/.test(n)) fs.copyFileSync(path.join(bundle,n),path.join(stage,n));
const installer=path.join(stage,name),stamp=new Date().toISOString();
if(mode==='signed') {
  const signature=fs.readFileSync(`${installer}.sig`,'utf8').trim(),origin=(process.env.TXTNOTE_UPDATE_ORIGIN||'http://localhost:3000').replace(/\/$/,'');
  fs.writeFileSync(path.join(stage,'latest.json'),JSON.stringify({version:conf.version,notes:'Tez editörü desktop CSP/parity düzeltmesi.',pub_date:stamp,platforms:{'windows-x86_64':{signature,url:`${origin}/updates/${name}`}}},null,2)+'\n');
}
const updater=verifyUpdaterArtifacts(stage,mode,name,conf);
const installerHash=sha256(fs.readFileSync(installer));
run(process.env.SEVEN_ZIP||'C:/Program Files/7-Zip/7z.exe',['x',installer,`-o${payload}`,'-y'],{stdio:'pipe'});
const payloadExes=filesBelow(payload).filter(f=>path.basename(f).toLowerCase()==='txtnote.exe');
if(payloadExes.length!==1) throw Error('Installer payload executable missing or ambiguous');
const payloadProof=verifyNsisPayload(applicationBytes,fs.readFileSync(payloadExes[0]));
const payloadEmbedded=verifyEmbeddedAssets(root,target,payloadExes[0],identity);
const exeHash=sha256(fs.readFileSync(executable));
run(process.execPath,[path.join(root,'scripts/desktop-smoke.mjs'),payloadExes[0]],{env:{...process.env,CARGO_TARGET_DIR:target,TXTNOTE_BUILD_ID:identity.buildId}});
assertCurrentIdentity(root,identity);
if(sha256(fs.readFileSync(executable))!==exeHash) throw Error('Executable changed after verification');
if(sha256(fs.readFileSync(installer))!==installerHash) throw Error('Installer changed after verification');
const smoke=JSON.parse(fs.readFileSync(path.join(output,'smoke.json'),'utf8'));
if(smoke.status!=='passed'||smoke.buildId!==identity.buildId||smoke.executableSha256!==payloadProof.payloadSha256) throw Error('Stale or failed packaged smoke result');
const proof={verifiedAt:stamp,buildId:identity.buildId,fingerprint:identity.fingerprint,mode,embedded,payloadEmbedded,application:{path:executable,sha256:exeHash,buildSha256:payloadProof.applicationSha256},payload:{path:payloadExes[0],sha256:payloadProof.payloadSha256,...payloadProof},installer:{path:path.join(dest,name),sha256:sha256(fs.readFileSync(installer))},updater,smoke};
for(const n of fs.readdirSync(stage)) {
  fs.copyFileSync(path.join(stage,n),path.join(dest,n));
  if(sha256(fs.readFileSync(path.join(stage,n)))!==sha256(fs.readFileSync(path.join(dest,n)))) throw Error(`Release copy mismatch: ${n}`);
}
verifyUpdaterArtifacts(dest,mode,name,conf);
fs.writeFileSync(path.join(dest,'verification.json'),JSON.stringify(proof,null,2)+'\n');
fs.writeFileSync(path.join(output,'installer-verification.json'),JSON.stringify(proof,null,2)+'\n');
fs.writeFileSync(path.join(dest,'BUILD.txt'),`builtAt=${stamp}\nmode=${mode}\nbuildId=${identity.buildId}\nsourceFingerprint=${identity.fingerprint}\npackagedSmoke=passed\n`);
console.log(`[txtnote] Verified release: ${path.join(dest,name)}`);
