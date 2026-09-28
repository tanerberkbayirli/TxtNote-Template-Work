/**
 * Manual decrypt check for a Desktop test export.
 *
 * Usage:
 *   node scripts/verify-encrypted-db.mjs
 *   node scripts/verify-encrypted-db.mjs "C:\Users\...\Desktop\txtnote-encrypted-db-....json"
 *   node scripts/verify-encrypted-db.mjs file.json --wrong-key
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generatePrivateKey } from "viem/accounts";
import {
  decryptDatabaseSnapshot,
  keyPairFromPrivateKey,
} from "../services/crypto/encryptedDb.js";

const args = process.argv.slice(2).filter((arg) => arg !== "--wrong-key");
const tryWrongKey = process.argv.includes("--wrong-key");

const desktopCandidates = () => {
  const home = os.homedir();
  return [
    path.join(home, "Desktop"),
    path.join(home, "OneDrive", "Desktop"),
    path.join(home, "OneDrive", "Masaüstü"),
    path.join(home, "Masaüstü"),
  ];
};

const findLatestDesktopExport = () => {
  const files = [];
  for (const desktop of desktopCandidates()) {
    if (!fs.existsSync(desktop)) continue;
    for (const name of fs.readdirSync(desktop)) {
      if (!/^txtnote-encrypted-db-.+\.json$/i.test(name)) continue;
      const full = path.join(desktop, name);
      files.push({ full, mtime: fs.statSync(full).mtimeMs });
    }
  }
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0]?.full ?? null;
};

const filePath = args[0] ? path.resolve(args[0]) : findLatestDesktopExport();
if (!filePath || !fs.existsSync(filePath)) {
  console.error(
    "Dosya bulunamadı. Masaüstüne export alın veya yolu verin:\n" +
      '  node scripts/verify-encrypted-db.mjs "C:\\\\Users\\\\...\\\\Desktop\\\\txtnote-encrypted-db-....json"',
  );
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
const embeddedKey = pkg?.headers?.testPrivateKey;

console.log("Dosya:", filePath);
console.log("kind:", pkg?.kind);
console.log("walletAddress:", pkg?.headers?.walletAddress ?? "(yok)");
console.log("publicKey:", pkg?.headers?.publicKey ? `${String(pkg.headers.publicKey).slice(0, 18)}…` : "(yok)");
console.log("testMode:", pkg?.headers?.testMode === true);
console.log("gömülü private key:", embeddedKey ? "var" : "YOK");

if (!embeddedKey) {
  console.error("Bu dosyada headers.testPrivateKey yok; test export değil.");
  process.exit(1);
}

const pair = keyPairFromPrivateKey(embeddedKey);
if (pair.walletAddress.toLowerCase() !== String(pkg.headers.walletAddress).toLowerCase()) {
  console.error("FAIL: gömülü private key, headers.walletAddress ile eşleşmiyor.");
  process.exit(1);
}
if (
  pkg.headers.publicKey &&
  pair.publicKey.toLowerCase() !== String(pkg.headers.publicKey).toLowerCase()
) {
  console.error("FAIL: gömülü private key, headers.publicKey ile eşleşmiyor.");
  process.exit(1);
}
console.log("OK: private key → public key / adres eşleşiyor");

const opened = await decryptDatabaseSnapshot(pkg, embeddedKey);
const noteCount = Object.keys(opened?.notes ?? {}).length;
const workspaceCount = Array.isArray(opened?.workspaces) ? opened.workspaces.length : 0;
const owner = opened?.dbOwner?.walletAddress ?? null;

console.log("OK: AES-256-GCM çözüldü");
console.log("  workspaces:", workspaceCount);
console.log("  notes:", noteCount);
console.log("  dbOwner.walletAddress:", owner ?? "(yok)");

if (tryWrongKey) {
  const wrong = generatePrivateKey();
  try {
    await decryptDatabaseSnapshot(pkg, wrong);
    console.error("FAIL: yanlış key ile de çözüldü (beklenmez).");
    process.exit(1);
  } catch (error) {
    console.log("OK: yanlış private key ile çözülemedi —", error.message);
  }
}

console.log("\nSonuç: Bu dosya gömülü private key ile çözülebiliyor.");
