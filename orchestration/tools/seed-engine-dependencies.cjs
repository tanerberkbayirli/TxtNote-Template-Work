// Offline bootstrap for an existing checkout. Copies only the exact locked
// versions already installed by the frontend; never changes application files.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'engine/package-lock.json'), 'utf8'));
let copied = 0, skipped = 0;
for (const [key, entry] of Object.entries(lock.packages)) {
  if (!key) continue;
  const source = path.resolve(root, 'TxtNote/frontend', key);
  const destination = path.resolve(root, 'engine', key);
  if (!source.startsWith(path.join(root, 'TxtNote/frontend/node_modules') + path.sep) ||
      !destination.startsWith(path.join(root, 'engine/node_modules') + path.sep)) throw new Error('Outside dependency tree');
  const packageFile = path.join(source, 'package.json');
  if (!fs.existsSync(packageFile)) {
    if (entry.optional) { skipped++; continue; }
    throw new Error('Run npm ci --prefix engine; frontend package is missing: ' + key);
  }
  const installed = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (installed.version !== entry.version) throw new Error('Version mismatch: ' + key);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, dereference: false });
  copied++;
}
console.log(JSON.stringify({ copiedLockedPackages: copied, skippedOptionalPackages: skipped }));
