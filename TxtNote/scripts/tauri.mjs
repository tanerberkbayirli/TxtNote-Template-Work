import {spawn} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const build=['build','bundle'].includes(args[0])&&!args.includes('--help');
// `tauri dev` polls the local update server (scripts/serve-updates.mjs) over HTTP; release builds never do (HE-GV-03).
const cliArgs=args[0]==='dev'&&!args.includes('--config')?[...args,'--config',path.join(root,'src-tauri/tauri.dev.conf.json')]:args;
const child=spawn(process.execPath,build?[path.join(root,'scripts/release.mjs'),...args.slice(1)]:[path.join(root,'node_modules/@tauri-apps/cli/tauri.js'),...cliArgs],{cwd:root,stdio:'inherit',env:{...process.env,CARGO_TARGET_DIR:process.env.CARGO_TARGET_DIR||path.join(root,'.cargo-target-build')}});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('exit',code=>process.exit(code??1));
