# TxtNote Workbench

A local-first desktop note-taking app plus the thesis-template engine that powers it.

This repository contains two main parts:

- **[`TxtNote/`](TxtNote/)** — the desktop application. A local-first note-taking app built on **Tauri 2** with a **React 19 + Vite** frontend. Notes live in SQLite (desktop) or IndexedDB (browser); no remote server, no telemetry. See [TxtNote/README.md](TxtNote/README.md) for setup and commands.
- **[`engine/`](engine/)** — the document template engine. Generates structured thesis/project documents (DOCX, PDF-ready layouts) from JSON template specs covering dozens of Turkish universities (graduate, doctoral and specialization templates), with APA-7 citation handling and conformance checks.
- **[`Butun-Sablonlar/`](Butun-Sablonlar/)** — collected template source material per university.
- **[`orchestration/`](orchestration/)** — build and workflow notes.

## Requirements

- Node.js 20+
- [Rust](https://rustup.rs/) and WebView2 (Windows) for the desktop app

## Quick start (app)

```bash
cd TxtNote
npm install
cd frontend && npm install
cd ..

npm run dev          # browser only, http://localhost:5173
npm run desktop      # Tauri window + Vite dev server
npm run desktop:build  # production build + Windows installer (NSIS)
npm test
```

## License

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file.
