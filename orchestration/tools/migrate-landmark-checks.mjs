// Preserve source-derived expectations; migrate only equivalent measurement paths.
import { readFile, writeFile, readdir } from 'node:fs/promises';
const dir = 'orchestration/specs';
let count = 0;
for (const file of (await readdir(dir)).filter(file => file.endsWith('.checks.json') && !file.startsWith('engine-'))) {
  const path = `${dir}/${file}`, data = JSON.parse(await readFile(path, 'utf8'));
  const checks = Array.isArray(data) ? data : data.checks;
  let changed = 0;
  for (const check of checks) {
    const params = check.params ||= {};
    if (params.source === 'word' || params.source === 'layout') continue;
    if (['line_pitch', 'line_gap', 'pitch_series'].includes(check.kind)
        || (['line_attr', 'line_baselines'].includes(check.kind) && ['baseline', 'x0', 'x1', 'cx', 'size'].includes(params.attr || 'baseline'))
        || (check.kind === 'page_number_attr' && ['baseline', 'x0', 'cx', 'size'].includes(params.attr))) {
      params.source = 'layout'; changed++; count++;
    }
  }
  if (changed) await writeFile(path, JSON.stringify(data, null, 1) + '\n');
  console.log(`${file}: ${changed} geometry checks migrated (source expectations unchanged)`);
}
console.log(`total: ${count}`);
