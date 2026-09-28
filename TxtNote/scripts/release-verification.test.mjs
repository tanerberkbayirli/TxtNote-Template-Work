import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {blake2b} from '@noble/hashes/blake2b';
import {blake3} from '@noble/hashes/blake3';
import {brotliCompressSync} from 'node:zlib';
import {verifyNsisPayload,verifyAssetBytes,sha256,verifyUpdaterArtifacts,verifyUpdater,sourceIdentity,assertCurrentIdentity} from './release-verification.mjs';
const root=path.resolve(import.meta.dirname,'..');
test('payload may differ only by the SDK NSIS marker; stale or changed executable bytes fail',()=>{
  const application=Buffer.from('EXE:__TAURI_BUNDLE_TYPE_VAR_UNK:embedded-current-assets');
  const payload=Buffer.from('EXE:__TAURI_BUNDLE_TYPE_VAR_NSS:embedded-current-assets');
  assert.equal(verifyNsisPayload(application,payload).payloadSha256,sha256(payload));
  assert.equal(verifyNsisPayload(payload,payload).allowedPatch,'already NSIS');
  assert.throws(()=>verifyNsisPayload(application,Buffer.from('EXE:__TAURI_BUNDLE_TYPE_VAR_NSS:embedded-stale-assets')),/payload executable mismatch/);
  assert.throws(()=>verifyNsisPayload(application,Buffer.from('EXE:__TAURI_BUNDLE_TYPE_VAR_UNK:embedded-current-assets')),/payload executable mismatch/);
});
test('embedded checks reject stale binaries and require current compressed assets inside the executable',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txtnote-release-'));
  try {
    const bytes=Buffer.from('export const build = "current frontend";'),encoded=brotliCompressSync(bytes),cache=path.join(dir,Buffer.from(blake3(bytes)).toString('hex')+'.js');
    fs.writeFileSync(cache,encoded);
    const asset={path:'assets/current.js',sha256:sha256(bytes)};
    assert.equal(verifyAssetBytes(Buffer.concat([Buffer.from('EXE'),encoded]),bytes,[cache],asset).executableOffset,3);
    assert.throws(()=>verifyAssetBytes(Buffer.from('stale executable'),bytes,[cache],asset),/Embedded frontend mismatch/);
    assert.throws(()=>verifyAssetBytes(Buffer.concat([Buffer.from('EXE'),encoded]),Buffer.from('changed frontend'),[cache],asset),/Embedded frontend mismatch/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('Tauri HTML serialization and nonce are allowed but changed HTML is rejected',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txtnote-release-'));
  try {
    const source=Buffer.from('<!doctype html>\n<html><head><meta charset="utf-8" /><style id="trusted">body{color:red}</style><link crossorigin href="/current.js"></head><body></body></html>');
    const transformed=Buffer.from('<!DOCTYPE html><html><head><meta charset="utf-8"><style id="trusted" nonce="__TAURI_STYLE_NONCE__">body{color:red}</style><link crossorigin="" href="/current.js"></head><body></body></html>');
    const encoded=brotliCompressSync(transformed),cache=path.join(dir,'cached.html');fs.writeFileSync(cache,encoded);
    assert.ok(verifyAssetBytes(encoded,source,[cache],{path:'index.html',sha256:sha256(source)}));
    assert.throws(()=>verifyAssetBytes(encoded,Buffer.from(source.toString().replace('/current.js','/stale.js')),[cache],{path:'index.html'}),/Embedded frontend mismatch/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('source/build fingerprint rejects stale sources and changed frontend assets',()=>{
  const identity=sourceIdentity(root);
  assert.match(identity.fingerprint,/^[a-f0-9]{64}$/);
  assert.throws(()=>assertCurrentIdentity(root,{fingerprint:'stale',assets:[]}),/Source changed/);
  assert.throws(()=>assertCurrentIdentity(root,{...identity,assets:[]}),/asset mismatch/);
});
test('unsigned mode rejects stale signatures and manifests',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txtnote-release-'));
  try {
    assert.deepEqual(verifyUpdaterArtifacts(dir,'unsigned','setup.exe',{}),{mode:'unsigned',updaterArtifacts:false});
    fs.writeFileSync(path.join(dir,'old.sig'),'old');
    assert.throws(()=>verifyUpdaterArtifacts(dir,'unsigned','setup.exe',{}),/Stale signature/);
    fs.unlinkSync(path.join(dir,'old.sig'));fs.writeFileSync(path.join(dir,'latest.json'),'{}');
    assert.throws(()=>verifyUpdaterArtifacts(dir,'unsigned','setup.exe',{}),/Stale signature/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('signed mode rejects missing, extra and stale updater artifacts',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txtnote-release-'));
  try {
    assert.throws(()=>verifyUpdaterArtifacts(dir,'signed','setup.exe',{}),/Missing or stale/);
    fs.writeFileSync(path.join(dir,'setup.exe.sig'),'sig');fs.writeFileSync(path.join(dir,'old.sig'),'old');
    assert.throws(()=>verifyUpdaterArtifacts(dir,'signed','setup.exe',{}),/Missing or stale/);
    fs.unlinkSync(path.join(dir,'old.sig'));fs.writeFileSync(path.join(dir,'latest.json'),JSON.stringify({version:'old'}));
    assert.throws(()=>verifyUpdaterArtifacts(dir,'signed','setup.exe',{version:'new'}),/Stale updater manifest/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('minisign verification accepts a valid installer and rejects altered payload/signature',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txtnote-release-'));
  try {
    const {publicKey,privateKey}=generateKeyPairSync('ed25519'),id=Buffer.from('0102030405060708','hex');
    const pub=Buffer.concat([Buffer.from('Ed'),id,publicKey.export({format:'der',type:'spki'}).subarray(-32)]);
    const data=Buffer.from('fresh installer'),file=path.join(dir,'setup.exe');fs.writeFileSync(file,data);
    const raw=sign(null,Buffer.from(blake2b(data,{dkLen:64})),privateKey),comment='timestamp:123';
    const packet=Buffer.concat([Buffer.from('ED'),id,raw]),global=sign(null,Buffer.concat([raw,Buffer.from(comment)]),privateKey);
    const p=Buffer.from(`untrusted comment: test\n${pub.toString('base64')}\n`).toString('base64');
    const s=Buffer.from(`untrusted comment: test\n${packet.toString('base64')}\ntrusted comment: ${comment}\n${global.toString('base64')}\n`).toString('base64');
    assert.equal(verifyUpdater(file,s,p).installerSignatureValid,true);
    fs.writeFileSync(file,'stale installer');assert.throws(()=>verifyUpdater(file,s,p),/Invalid updater installer signature/);
    assert.throws(()=>verifyUpdater(file,'invalid',p),/key\/signature mismatch/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
