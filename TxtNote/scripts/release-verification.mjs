import fs from 'node:fs';
import path from 'node:path';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';
import { blake2b } from '@noble/hashes/blake2b';
import { blake3 } from '@noble/hashes/blake3';
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function filesBelow(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesBelow(path.join(dir,e.name)) : e.isFile() ? [path.join(dir,e.name)] : []).sort();
}
export function sourceIdentity(root) {
  const files = ['frontend/src','frontend/public','src-tauri/src','src-tauri/windows','src-tauri/icons','src-tauri/capabilities','scripts','services','types'].flatMap(d => filesBelow(path.join(root,d))).concat(
    ['package.json','package-lock.json','frontend/package.json','frontend/package-lock.json','frontend/index.html','frontend/vite.config.js','src-tauri/Cargo.toml','src-tauri/Cargo.lock','src-tauri/build.rs','src-tauri/tauri.conf.json'].map(f=>path.join(root,f))).sort();
  const sources = files.map(f=>({path:path.relative(root,f).replaceAll('\\','/'),sha256:sha256(fs.readFileSync(f))}));
  return {fingerprint:sha256(JSON.stringify(sources)), sources};
}
function distAssets(root) {
  const dir=path.join(root,'frontend/dist');
  return filesBelow(dir).filter(f=>path.basename(f)!=='build-identity.json').map(f=>({path:path.relative(dir,f).replaceAll('\\','/'),sha256:sha256(fs.readFileSync(f))}));
}
export function writeIdentity(root) {
  const source=sourceIdentity(root);
  const identity={buildId:`${Date.now()}-${source.fingerprint.slice(0,16)}`,...source,assets:distAssets(root)};
  fs.writeFileSync(path.join(root,'frontend/dist/build-identity.json'),JSON.stringify(identity,null,2)+'\n');
  return identity;
}
export function assertCurrentIdentity(root,identity) {
  if(sourceIdentity(root).fingerprint!==identity.fingerprint) throw Error('Source changed after frontend build');
  if(JSON.stringify(distAssets(root))!==JSON.stringify(identity.assets)) throw Error('Frontend dist asset mismatch');
}
const normalizeHtml=s=>s.replace(/<!doctype html>/gi,'<!doctype html>').replace(/ nonce="[^"]*"/g,'').replace(/ crossorigin(?:="")?(?=[\s>])/g,' crossorigin').replace(/\s*\/>/g,'>').replace(/>\s+</g,'><').trim();
export function verifyAssetBytes(exe,bytes,cached,asset) {
  let offset=exe.indexOf(bytes),embeddedHash=asset.sha256;
  const cacheKey=Buffer.from(blake3(bytes)).toString('hex');
  if(offset<0) for(const file of cached.filter(f=>asset.path.endsWith('.html')?f.endsWith('.html'):path.basename(f).startsWith(cacheKey))) {
    const encoded=fs.readFileSync(file);let decoded;
    try {decoded=brotliDecompressSync(encoded);} catch {decoded=encoded;}
    const equal=asset.path.endsWith('.html')?normalizeHtml(decoded.toString())===normalizeHtml(bytes.toString()):decoded.equals(bytes);
    const found=exe.indexOf(encoded);
    if(equal&&found>=0){offset=found;embeddedHash=sha256(decoded);break;}
  }
  if(offset<0) throw Error(`Embedded frontend mismatch: ${asset.path}`);
  return {...asset,embeddedHash,executableOffset:offset,bytes:bytes.length};
}
export function verifyEmbeddedAssets(root,target,executable,identity) {
  assertCurrentIdentity(root,identity);
  const exe=fs.readFileSync(executable),build=path.join(target,'release/build');
  const cached=fs.readdirSync(build).filter(n=>n.startsWith('txtnote-')).map(n=>path.join(build,n,'out/tauri-codegen-assets')).filter(fs.existsSync).flatMap(filesBelow);
  return [...identity.assets,{path:'build-identity.json',sha256:sha256(fs.readFileSync(path.join(root,'frontend/dist/build-identity.json')))}].map(asset=>{
    const bytes=fs.readFileSync(path.join(root,'frontend/dist',asset.path));
    return verifyAssetBytes(exe,bytes,cached,asset);
  });
}
export function verifyUpdater(installer,signatureText,publicKeyText) {
  const p=Buffer.from(publicKeyText.trim(),'base64').toString().trim().split(/\r?\n/),s=Buffer.from(signatureText.trim(),'base64').toString().trim().split(/\r?\n/);
  const pub=Buffer.from(p[1]||'','base64'),sig=Buffer.from(s[1]||'','base64');
  if(pub.length!==42||sig.length!==74||!pub.subarray(2,10).equals(sig.subarray(2,10))) throw Error('Updater key/signature mismatch');
  const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),pub.subarray(10)]),format:'der',type:'spki'});
  const data=fs.readFileSync(installer),algorithm=sig.subarray(0,2).toString();
  if(!['ED','Ed'].includes(algorithm)) throw Error('Unknown updater signature algorithm');
  const message=algorithm==='ED'?Buffer.from(blake2b(data,{dkLen:64})):data;
  if(!verify(null,message,key,sig.subarray(10))) throw Error('Invalid updater installer signature');
  const comment=s[2]?.replace(/^trusted comment: /,'');
  if(!comment||!verify(null,Buffer.concat([sig.subarray(10),Buffer.from(comment)]),key,Buffer.from(s[3]||'','base64'))) throw Error('Invalid updater global signature');
  return {algorithm,installerSignatureValid:true,globalSignatureValid:true};
}
export function verifyUpdaterArtifacts(dir,mode,name,conf) {
  const sigs=fs.readdirSync(dir).filter(n=>n.endsWith('.sig')),manifest=path.join(dir,'latest.json');
  if(mode==='unsigned') {
    if(sigs.length||fs.existsSync(manifest)) throw Error('Stale signature/manifest in unsigned release');
    return {mode,updaterArtifacts:false};
  }
  if(sigs.length!==1||sigs[0]!==`${name}.sig`) throw Error('Missing or stale updater signatures');
  const signature=fs.readFileSync(path.join(dir,sigs[0]),'utf8').trim(),latest=JSON.parse(fs.readFileSync(manifest,'utf8')),platform=latest.platforms?.['windows-x86_64'];
  if(latest.version!==conf.version||platform?.signature!==signature||!platform?.url.endsWith(`/updates/${name}`)) throw Error('Stale updater manifest');
  return {mode,...verifyUpdater(path.join(dir,name),signature,conf.plugins.updater.pubkey)};
}

/** Tauri's NSIS bundler temporarily replaces exactly this SDK marker and then
 * restores the unbundled executable. Compare every other payload byte exactly.
 * https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle.rs
 */
export function verifyNsisPayload(application,payload) {
  const unknown=Buffer.from('__TAURI_BUNDLE_TYPE_VAR_UNK'),nsis=Buffer.from('__TAURI_BUNDLE_TYPE_VAR_NSS');
  const expected=Buffer.from(application);
  const offset=expected.indexOf(unknown);
  if(offset>=0) {
    if(expected.indexOf(unknown,offset+unknown.length)>=0) throw Error('Ambiguous Tauri bundle marker');
    nsis.copy(expected,offset);
  } else if(expected.indexOf(nsis)<0) throw Error('Missing Tauri NSIS bundle marker');
  if(!expected.equals(payload)) throw Error('Installer payload executable mismatch');
  return {applicationSha256:sha256(application),expectedPayloadSha256:sha256(expected),payloadSha256:sha256(payload),bundleMarkerOffset:offset,allowedPatch:offset>=0?'__TAURI_BUNDLE_TYPE_VAR_UNK → __TAURI_BUNDLE_TYPE_VAR_NSS':'already NSIS'};
}
