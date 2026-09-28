/**
 * Write the PNG/ICO set Tauri's Windows bundler needs.
 * No extra npm packages — zlib only. `npx tauri icon` is optional (adds .icns).
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, "..", "src-tauri", "icons");

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePng(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paint(x, y, size) {
  const px = x / size;
  const py = y / size;

  const inRoundRect = (l, t, r, b, radius) => {
    const cx = Math.min(Math.max(px, l + radius), r - radius);
    const cy = Math.min(Math.max(py, t + radius), b - radius);
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  };

  if (!inRoundRect(0.12, 0.08, 0.88, 0.92, 0.08)) return [23, 23, 23, 255];
  if (inRoundRect(0.2, 0.16, 0.8, 0.84, 0.045)) {
    if (px > 0.62 && py < 0.3 && px - 0.62 + (0.3 - py) > 0.18) return [38, 38, 38, 255];
    for (const lineY of [0.42, 0.52, 0.62, 0.72]) {
      if (Math.abs(py - lineY) < 0.012 && px > 0.28 && px < 0.72) return [64, 64, 64, 255];
    }
    return [250, 250, 250, 255];
  }
  return [23, 23, 23, 255];
}

function makeIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

mkdirSync(iconsDir, { recursive: true });

const sizes = { 32: "32x32.png", 128: "128x128.png", 256: "128x128@2x.png", 1024: "icon.png" };
const pngs = {};
for (const [size, name] of Object.entries(sizes)) {
  const n = Number(size);
  const data = makePng(n, paint);
  pngs[n] = data;
  writeFileSync(join(iconsDir, name), data);
}

writeFileSync(
  join(iconsDir, "icon.ico"),
  makeIco([
    { size: 32, data: pngs[32] },
    { size: 256, data: pngs[256] },
  ]),
);

console.log(`wrote icons in ${iconsDir}`);

const cli = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tauri", "icon", join(iconsDir, "icon.png")],
  { cwd: join(here, ".."), stdio: "inherit", shell: true },
);
if (cli.status !== 0) {
  console.warn("optional `tauri icon` skipped (CLI not installed yet). PNG/ICO are enough for Windows.");
}
