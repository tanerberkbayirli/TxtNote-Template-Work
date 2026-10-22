// Windows fallback when LibreOffice is unavailable. Never overwrite official input.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [input, output] = process.argv.slice(2);
if (!input || !output || !/\.doc$/i.test(input) || !/\.docx$/i.test(output)) throw new Error('usage: convert-official-doc.mjs original.doc cached.docx');
const source = resolve(input), converted = resolve(output);
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const sourceSha256 = hash(source), manifestPath = converted + '.conversion.json';
if (existsSync(manifestPath)) {
  const old = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (old.sourceSha256 === sourceSha256 && existsSync(converted) && old.convertedSha256 === hash(converted)) { console.log('Reused verified official DOC conversion cache'); process.exit(0); }
}
mkdirSync(dirname(converted), { recursive: true });
const started = performance.now(), startedAt = new Date().toISOString();
const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(dirname(fileURLToPath(import.meta.url)), 'legacy-doc2docx.ps1'), '-In', source, '-Out', converted], { windowsHide: true });
let log = '', wordPid;
const code = await new Promise((resolveResult, reject) => {
  const timer = setTimeout(() => {
    if (wordPid) spawnSync('taskkill', ['/PID', wordPid, '/F'], { windowsHide: true });
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
    reject(new Error('Official DOC conversion exceeded 120 seconds'));
  }, 120000);
  child.stdout.on('data', data => { log += data; wordPid = log.match(/WORDPID:(\d+)/)?.[1]; });
  child.stderr.on('data', data => { log += data; });
  child.on('error', error => { clearTimeout(timer); reject(error); });
  child.on('close', value => { clearTimeout(timer); resolveResult(value); });
});
if (code || !wordPid || !/\bOK\b/.test(log) || !existsSync(converted) || hash(source) !== sourceSha256) throw new Error('Official DOC conversion failed: ' + log);
const result = { source, sourceSha256, converted, convertedSha256: hash(converted), method: 'Owned Microsoft Word SaveAs2 format 16; LibreOffice unavailable on this host', wordPid: Number(wordPid), startedAt, completedAt: new Date().toISOString(), wallSeconds: +((performance.now() - started) / 1000).toFixed(3), status: 'PASS' };
writeFileSync(manifestPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', manifest: manifestPath, wallSeconds: result.wallSeconds }));
