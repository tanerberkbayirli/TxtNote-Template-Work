// Render an official source with one owned Word process; preserve hashes/provenance.
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const args = process.argv.slice(2);
const source = resolve(args[0] || '');
const out = resolve(args[1] || '');
if (args.length !== 2 || !source.toLowerCase().endsWith('.docx')) throw new Error('usage: cache-official-source.mjs official.docx cache-directory');
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const startedAt = new Date().toISOString(), started = performance.now(), originalHash = hash(source);
mkdirSync(out, { recursive: true });
const docx = join(out, 'official.docx'), pdf = join(out, 'official-word.pdf'), info = join(out, 'official-word.render.json');
if (source !== docx) copyFileSync(source, docx);
const here = dirname(fileURLToPath(import.meta.url));
const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(here, 'word2pdf.ps1'), '-In', docx, '-Out', pdf, '-RenderInfo', info], { windowsHide: true });
let log = '', wordPid;
const result = await new Promise((resolveResult, reject) => {
  const timeout = setTimeout(() => {
    if (wordPid) spawnSync('taskkill', ['/PID', wordPid, '/F'], { windowsHide: true });
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
    reject(new Error('Official Word source render exceeded 120 seconds'));
  }, 120000);
  child.stdout.on('data', data => { log += data; wordPid = log.match(/WORDPID:(\d+)/)?.[1]; });
  child.stderr.on('data', data => { log += data; });
  child.on('error', error => { clearTimeout(timeout); reject(error); });
  child.on('close', code => { clearTimeout(timeout); resolveResult(code); });
});
if (result !== 0 || !/\bOK\b/.test(log) || !wordPid || !existsSync(pdf)) throw new Error(log);
if (hash(source) !== originalHash || hash(docx) !== originalHash) throw new Error('Official source changed during render');
const manifest = { schemaVersion: 1, source, sourceSha256: originalHash, docx, docxSha256: hash(docx), pdf, pdfSha256: hash(pdf), renderInfo: JSON.parse(readFileSync(info, 'utf8').replace(/^\uFEFF/, '')), startedAt, completedAt: new Date().toISOString(), wallSeconds: +((performance.now() - started) / 1000).toFixed(3), wordPid: Number(wordPid), status: 'PASS' };
writeFileSync(join(out, 'render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', wordPid, wallSeconds: manifest.wallSeconds, manifest: join(out, 'render-manifest.json') }));
