import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const edges = process.argv.includes('--edges');
const final = process.argv.includes('--final');
for (const id of final ? ['EDGE_STRUCTURE', 'EDGE_NOTES'] : edges ? ['EDGE01', 'EDGE02'] : ['SRC01', 'SRC03', 'SRC04', 'SRC05', 'SRC07', 'SRC08', 'SRC11']) {
  const record = join(root, 'orchestration/validation/mission01/source-references', id, 'record.json');
  if (existsSync(record)) {
    const r = JSON.parse(readFileSync(record, 'utf8'));
    if (r.status !== 'RENDERED') throw new Error(`Inspect failed reference before retry: ${id}`);
    console.log(`${id}: existing source reference preserved`);
    continue;
  }
  console.log(`${id}: Word source reference starting`);
  const child = spawn(process.execPath, [join(root, 'orchestration/engine-work/render_source_reference.mjs'), id,
    ...(final ? ['--manifest', 'orchestration/engine-work/mission01/inputs/native-inputs-final.json'] : edges ? ['--manifest', 'orchestration/engine-work/mission01/inputs/native-inputs.json'] : [])], { cwd: root, stdio: 'inherit', windowsHide: true });
  const code = await new Promise((res, rej) => { child.on('error', rej); child.on('close', res); });
  if (code !== 0) throw new Error(`${id}: source reference failed (${code})`);
}
