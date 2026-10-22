import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const fileHash = path => sha256(readFileSync(path));
export function stableWordEnvironment(info) {
  if (!info) return null;
  const { pid, renderedAt, ...settings } = info;
  return settings;
}
export function sourceFingerprint(root, target) {
  const specification = join(root, 'orchestration/specs', `${target}.json`);
  if (!existsSync(specification)) return sha256(JSON.stringify({ target, authority: 'engine fixture',
    checks: fileHash(join(root, 'orchestration/specs', `${target}.checks.json`)) }));
  const spec = JSON.parse(readFileSync(specification, 'utf8'));
  const index = new Map();
  function visit(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else index.set(entry.name, [...(index.get(entry.name) || []), path]);
    }
  }
  visit(join(root, 'Butun-Sablonlar')); visit(join(root, 'orchestration/official-sources'));
  const sources = (spec.sources || []).map(source => {
    const declared = source.path || source.file;
    if (!declared) return { declared: null, status: 'UNKNOWN' };
    const exact = join(root, declared);
    const candidates = index.get(basename(declared)) || [];
    const actual = existsSync(exact) ? exact : candidates.length === 1 ? candidates[0] : null;
    return { declared, actual, sha256: actual ? fileHash(actual) : null, status: actual ? 'HASHED' : 'UNKNOWN' };
  });
  return sha256(JSON.stringify({ specification: fileHash(specification), sources }));
}
export function acceptanceFingerprint({ source, checks, fixture, code, renderer, environment }) {
  if ([source, checks, fixture, code, renderer, environment].some(value => !value)) {
    throw new Error('Incomplete acceptance fingerprint; missing inputs cannot validate cached results');
  }
  return sha256(JSON.stringify({ source, checks, fixture, code, renderer, environment }));
}
