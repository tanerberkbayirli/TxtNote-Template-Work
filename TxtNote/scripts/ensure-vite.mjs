import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 5173;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canConnect(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

function keepAlive() {
  setInterval(() => {}, 1 << 30);
}

if ((await canConnect("127.0.0.1")) || (await canConnect("::1"))) {
  console.log(`[txtnote] Vite already running on ${PORT}, reusing it.`);
  keepAlive();
} else {
  const child = spawn("npm", ["run", "dev", "--prefix", "frontend"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}
