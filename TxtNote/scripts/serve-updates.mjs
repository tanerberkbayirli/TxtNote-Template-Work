/**
 * Serves signed installer artifacts so the desktop updater (and a browser)
 * can download them from http://localhost:3000/updates/...
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = path.join(root, "dist-installer");
const port = Number(process.env.TXTNOTE_UPDATE_PORT || 3000);
const host = process.env.TXTNOTE_UPDATE_HOST || "127.0.0.1";

const MIME = {
  ".json": "application/json; charset=utf-8",
  ".exe": "application/octet-stream",
  ".sig": "application/octet-stream",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? Buffer.from(body) : body;
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Length": payload.length,
    ...headers,
  });
  res.end(payload);
}

function resolveArtifact(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/updates\/?/, "");
  if (!relative || relative.includes("\0") || relative.includes("..")) return null;
  const full = path.resolve(artifactDir, relative);
  const base = path.resolve(artifactDir);
  if (full !== base && !full.startsWith(`${base}${path.sep}`)) return null;
  return full;
}

function listArtifacts() {
  if (!fs.existsSync(artifactDir)) return [];
  return fs
    .readdirSync(artifactDir)
    .filter((name) => /\.(exe|sig|json|txt)$/i.test(name))
    .sort();
}

const server = http.createServer((req, res) => {
  const method = req.method ?? "GET";
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    res.end();
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    send(res, 405, "Method not allowed\n", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  let pathname = "/";
  try {
    pathname = new URL(req.url ?? "/", `http://${host}:${port}`).pathname;
  } catch {
    send(res, 400, "Bad request\n", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (pathname === "/" || pathname === "/updates" || pathname === "/updates/") {
    const files = listArtifacts();
    const lines = [
      "TxtNote update files",
      "",
      ...files.map((name) => `http://${host}:${port}/updates/${name}`),
      "",
    ];
    send(res, 200, lines.join("\n"), { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (!pathname.startsWith("/updates/")) {
    send(res, 404, "Not found\n", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const filePath = resolveArtifact(pathname);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, "Not found\n", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  };
  if (ext === ".exe") {
    headers["Content-Disposition"] = `attachment; filename="${name}"`;
  }

  if (method === "HEAD") {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[txtnote] Port ${port} is already in use.`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, host, () => {
  const files = listArtifacts();
  console.log(`[txtnote] Update server http://${host}:${port}/updates/`);
  if (files.length === 0) {
    console.warn("[txtnote] dist-installer is empty. Run npm run desktop:build first.");
    return;
  }
  for (const name of files) {
    console.log(`[txtnote]   /updates/${name}`);
  }
});
