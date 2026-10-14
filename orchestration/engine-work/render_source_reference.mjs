// Owned Word rendering via the existing tool; one source at a time, 120 s limit.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '../..');
const id = process.argv[2];
const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
const corpus = JSON.parse(readFileSync(resolve(root, arg('--manifest') || 'orchestration/engine-work/mission01/corpus.json'), 'utf8'));
const source = corpus.sources.find(x => x.id === id);
if (!source || !source.path.endsWith('.docx')) throw new Error('Pass a frozen DOCX source ID');
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const input = join(root, source.path);
if (sha(input) !== source.sha256) throw new Error('Source hash changed');
const out = join(resolve(root, arg('--output-root') || 'orchestration/validation/mission01/source-references'), id);
mkdirSync(out, { recursive: true });
const pdf = join(out, 'word.pdf'), info = join(out, 'word.render.json'), record = join(out, 'record.json');
if (existsSync(record) || existsSync(pdf)) {
  const previous = existsSync(record) ? JSON.parse(readFileSync(record, 'utf8')) : null;
  const accessRetry=process.argv.includes('--retry-access-denied') && /80070005/.test(previous?.stderr || '');
  const ownershipRetry=process.argv.includes('--retry-no-owned-process') && /Cannot establish one newly started Word process/.test(previous?.stderr || '');
  if ((!accessRetry && !ownershipRetry) || existsSync(pdf) || previous?.wordPid || previous?.status !== 'FAILED') {
    throw new Error('Reference exists; inspect it before any retry');
  }
  writeFileSync(join(out, accessRetry ? 'record.sandbox-access-denied.json' : 'record.no-owned-process.json'), JSON.stringify(previous, null, 2) + '\n');
}
const start = new Date();
const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
  join(root, 'orchestration/tools/word2pdf.ps1'), '-In', input, '-Out', pdf, '-RenderInfo', info],
  { cwd: root, windowsHide: true });
let stdout = '', stderr = '', wordPid = null, timedOut = false;
child.stdout.on('data', data => {
  stdout += data.toString();
  wordPid = Number(stdout.match(/WORDPID:(\d+)/)?.[1]) || null;
});
child.stderr.on('data', data => { stderr += data.toString(); });
const timer = setTimeout(() => {
  timedOut = true;
  if (wordPid) spawnSync('taskkill.exe', ['/PID', String(wordPid), '/F'], { windowsHide: true });
  child.kill();
}, 120_000);
const code = await new Promise((res, rej) => { child.on('error', rej); child.on('close', res); });
clearTimeout(timer);
const status = code === 0 && existsSync(pdf) && !timedOut ? 'RENDERED' : 'FAILED';
writeFileSync(record, JSON.stringify({ sourceId: id, source: source.path, sourceSha256: source.sha256,
  startedAt: start.toISOString(), finishedAt: new Date().toISOString(), wordPid, timedOut, code, status,
  pdf: pdf.replaceAll('\\', '/'), pdfSha256: existsSync(pdf) ? sha(pdf) : null,
  renderInfo: existsSync(info) ? JSON.parse(readFileSync(info, 'utf8').replace(/^\uFEFF/, '')) : null,
  stdout, stderr, acceptance: 'Source reference only; no import/export conformance claimed.' }, null, 2) + '\n');
console.log(JSON.stringify({ sourceId: id, status, wordPid, record }));
process.exitCode = status === 'RENDERED' ? 0 : 1;
