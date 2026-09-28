/**
 * Creates a local updater signing key if missing, then copies the public half
 * into src-tauri/tauri.conf.json. The private key stays on disk and is never
 * printed.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const UPDATER_KEY_PATH = path.join(os.homedir(), ".tauri", "txtnote.key");
export const UPDATER_PUB_PATH = `${UPDATER_KEY_PATH}.pub`;
const CONF_PATH = path.join(root, "src-tauri", "tauri.conf.json");
const TAURI_JS = path.join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");

function generateKeyViaCli() {
  fs.mkdirSync(path.dirname(UPDATER_KEY_PATH), { recursive: true });
  return spawnSync(
    process.execPath,
    [TAURI_JS, "signer", "generate", "-w", UPDATER_KEY_PATH, "--ci", "--password", ""],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CI: "true" },
    },
  );
}

export function syncUpdaterPubkey() {
  if (!fs.existsSync(UPDATER_PUB_PATH)) {
    throw new Error("Updater public key file is missing.");
  }
  const pubkey = fs.readFileSync(UPDATER_PUB_PATH, "utf8").trim();
  const conf = JSON.parse(fs.readFileSync(CONF_PATH, "utf8"));
  if (!conf.plugins?.updater) {
    throw new Error("tauri.conf.json is missing plugins.updater.");
  }
  if (conf.plugins.updater.pubkey !== pubkey) {
    conf.plugins.updater.pubkey = pubkey;
    fs.writeFileSync(CONF_PATH, `${JSON.stringify(conf, null, 2)}\n`);
    console.log("[txtnote] Updater public key written to tauri.conf.json");
  }
}

export function ensureUpdaterKey() {
  if (!fs.existsSync(UPDATER_KEY_PATH) || !fs.existsSync(UPDATER_PUB_PATH)) {
    const result = generateKeyViaCli();
    if (result.status !== 0) {
      const err = (result.stderr || result.stdout || "unknown error").trim();
      // Never dump stdout: the CLI prints the private key there.
      console.error("[txtnote] Could not generate updater signing key.");
      if (result.stderr) console.error(result.stderr.trim());
      else if (err && !/untrusted comment|RWRS|RWQ/i.test(err)) {
        console.error(err);
      }
      process.exit(result.status || 1);
    }
    console.log(`[txtnote] Created updater signing key at ${UPDATER_KEY_PATH}`);
  }
  syncUpdaterPubkey();
}

export function signingEnv(env = process.env) {
  if (env.TAURI_SIGNING_PRIVATE_KEY) return { ...env };
  if (!fs.existsSync(UPDATER_KEY_PATH)) {
    throw new Error(`Missing updater private key: ${UPDATER_KEY_PATH}`);
  }
  return {
    ...env,
    TAURI_SIGNING_PRIVATE_KEY: fs.readFileSync(UPDATER_KEY_PATH, "utf8"),
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?? "",
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureUpdaterKey();
}
