// One-time, reviewable layout migration. Run prepare, move the manifest's entries,
// then run rewrite. Original validation results and binary sources are not edited.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const manifestPath = path.join(root, 'orchestration/relocation-map.json');
const posix = value => value.replaceAll('\\', '/');
const absolute = value => path.resolve(root, value);
const list = () => execFileSync('rg', ['--files', '--hidden', '-g', '!**/node_modules/**', '-g', '!**/target/**', '-g', '!**/dist/**', '-g', '!**/.git/**', '-g', '!**/public/**'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split(/\r?\n/).map(posix);

if (process.argv[2] === 'prepare') {
  if (fs.existsSync(manifestPath)) throw new Error('Migration already prepared');
  const files = list();
  const moves = [
    { from: 'engine', to: 'orchestration/engine-work', directory: true },
    { from: 'TxtNote/frontend/src/thesis', to: 'engine/src', directory: true },
    { from: 'bugs', to: 'orchestration/bugs', directory: true },
  ];
  const docs = new Set([...files.filter(f => f.endsWith('.md')), 'bugs.md']);
  for (const from of docs) {
    if (from.startsWith('orchestration/') || /^license/i.test(path.basename(from))) continue;
    if (from.startsWith('engine/') && from !== 'engine/MISSION.md') continue;
    let to;
    if (from === 'engine/MISSION.md') to = 'orchestration/MISSION.md';
    else if (from === 'MOTOR.md') to = 'orchestration/plans/MOTOR.md';
    else if (from === 'MCBU-acik-kararlar.md') to = 'orchestration/decisions/MCBU-acik-kararlar.md';
    else if (from === 'bugs.md') to = 'orchestration/bugs.md';
    else if (from.startsWith('TxtNote/frontend/src/thesis/')) to = 'orchestration/docs/engine/' + from.slice('TxtNote/frontend/src/thesis/'.length);
    else to = 'orchestration/docs/' + from;
    moves.push({ from, to, directory: false });
  }
  // All destinations must be new. Never merge, replace or delete user files.
  for (const { from, to } of moves) {
    if (!fs.existsSync(absolute(from))) throw new Error('Missing input: ' + from);
    if (fs.existsSync(absolute(to))) throw new Error('Destination exists: ' + to);
  }
  fs.writeFileSync(manifestPath, JSON.stringify({ date: '2026-10-13', moves, originalFiles: files }, null, 2) + '\n');
  console.log(JSON.stringify({ moves: moves.length, documentationFiles: moves.filter(m => !m.directory).length }));
  process.exit();
}
if (process.argv[2] !== 'rewrite') throw new Error('Use prepare or rewrite');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.status === 'VERIFIED') throw new Error('Layout migration is complete; refusing to rewrite it again');
const originalFiles = manifest.originalFiles || JSON.parse(fs.readFileSync(absolute(manifest.originalIndex), 'utf8')).originalFiles;
const moves = [...manifest.moves].sort((a, b) => b.from.length - a.from.length);
function relocated(value) {
  value = posix(value);
  for (const move of moves) {
    if (value === move.from || (move.directory && value.startsWith(move.from + '/'))) return move.to + value.slice(move.from.length);
  }
  return value;
}
function relativeTo(file, target) {
  let value = posix(path.relative(path.dirname(absolute(file)), absolute(target)));
  if (!value.startsWith('.')) value = './' + value;
  return value;
}
function existsRelocated(value) { return fs.existsSync(absolute(relocated(value))); }
function rewriteReference(value, oldFile, newFile) {
  const parts = value.match(/^([^?#]*)([?#].*)?$/);
  if (!parts) return value;
  let [, raw, suffix = ''] = parts;
  const trailing = raw.endsWith('/');
  const normalized = posix(raw);
  if (normalized.startsWith('/src/thesis/')) return '/engine/' + normalized.slice('/src/thesis/'.length) + suffix;
  // Relative module paths and file URLs are resolved against their original file.
  if (normalized.startsWith('.') && normalized !== '.' && normalized !== '..') {
    const target = posix(path.relative(root, path.resolve(path.dirname(absolute(oldFile)), normalized)));
    if (existsRelocated(target) && (oldFile !== newFile || relocated(target) !== target)) {
      return relativeTo(newFile, relocated(target)) + (trailing ? '/' : '') + suffix;
    }
  }
  return value;
}
// Historical output JSON/logs/exports retain their bytes, hashes and measured paths.
const sourceExt = /\.(?:[cm]?js|jsx|ts|tsx|py|ps1|sh|html|md|css)$/i;
const config = /^(?:orchestration\/(?:specs\/|manifest\.json|progress\.json)|engine\/mission01\/acceptance(?:-v\d+)?\.json$|Butun-Sablonlar\/.*\/metadata\.json$)/;
let updated = [];
for (const oldFile of new Set([...originalFiles, 'bugs.md'])) {
  if (oldFile === 'orchestration/tools/reorganize-layout.cjs') continue;
  if (!sourceExt.test(oldFile) && !config.test(oldFile)) continue;
  if (oldFile.includes('/parked/') || oldFile.includes('/snapshots/')) continue;
  const newFile = relocated(oldFile), full = absolute(newFile);
  if (!fs.existsSync(full) || fs.statSync(full).size > 2 * 1024 * 1024) continue;
  const before = fs.readFileSync(full, 'utf8');
  let after = before;
  // Quoted imports, URL constructors and file paths, including template strings.
  after = after.replace(/(["'`])([^"'`\r\n]{1,700})\1/g, (whole, quote, value) => quote + rewriteReference(value, oldFile, newFile) + quote);
  if (oldFile.endsWith('.md')) {
    after = after.replace(/\]\((<?)([^)\r\n]+?)(>?)\)/g, (whole, open, value, close) => {
      if (/^(?:https?:|mailto:|#)/.test(value)) return whole;
      let target = value, suffix = '';
      const hash = target.indexOf('#');
      if (hash >= 0) { suffix = target.slice(hash); target = target.slice(0, hash); }
      const decoded = target.replace(/%20/g, ' ');
      let resolved = posix(path.relative(root, path.resolve(path.dirname(absolute(oldFile)), decoded)));
      if (path.isAbsolute(decoded)) resolved = posix(path.relative(root, decoded));
      if (!existsRelocated(resolved) && existsRelocated(decoded)) resolved = decoded;
      if (!existsRelocated(resolved)) return whole;
      return '](' + open + relativeTo(newFile, relocated(resolved)) + suffix + close + ')';
    });
  }
  // Root-relative command arguments and prose. Replace old engine paths before
  // introducing the new engine/src paths, and avoid already-centralized paths.
  after = after.replace(/(?<![\w/\\-])(?:TxtNote[\\/]frontend[\\/]src[\\/]thesis[\\/]|engine[\\/])(?!src[\\/])/g, match => match.startsWith('TxtNote') ? 'engine/src/' : 'orchestration/engine-work/');
  after = after.replace(/(?<![\w/\\-])bugs[\\/]/g, 'orchestration/bugs/');
  // Documentation paths are exact mappings, after the directory substitutions.
  for (const move of moves.filter(m => !m.directory)) {
    const oldMapped = move.from.startsWith('engine/') ? 'orchestration/engine-work/' + move.from.slice(7)
      : move.from.startsWith('TxtNote/frontend/src/thesis/') ? 'engine/src/' + move.from.slice('TxtNote/frontend/src/thesis/'.length) : move.from;
    const escaped = oldMapped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    after = after.replace(new RegExp('(?<![\\w/\\\\.-])' + escaped + '(?![\\w.-])', 'g'), move.to);
  }
  if (after !== before) { fs.writeFileSync(full, after); updated.push(newFile); }
}
manifest.updatedFiles = updated;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ rewrittenFiles: updated.length }));
