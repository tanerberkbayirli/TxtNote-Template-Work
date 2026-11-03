# TxtNote

A local-first desktop note-taking app with template-based document export.

TxtNote runs as a native desktop app built on **Tauri 2**, with a **React 19 + Vite** frontend. Your notes are stored **locally** — in a SQLite database on the desktop or IndexedDB in the browser — with no remote server involved. You can organize notes into templates and export them to formatted documents (DOCX) via a built-in document engine.

## Highlights

- 🖥️ **Native desktop app** — Tauri 2 shell, small footprint, Windows installer included
- 🔒 **Local-first** — notes live in SQLite / IndexedDB on your own machine; no cloud, no telemetry
- 📄 **Template-based export** — turn notes into structured DOCX documents
- 🔐 **Encrypted storage** — optional encryption for your note database

## Requirements

- Node.js 20+
- [Rust](https://rustup.rs/) (for desktop development) and WebView2 on Windows

## Getting started

```bash
npm install
cd frontend && npm install
cd ..

npm run dev        # browser only, http://localhost:5173
npm run desktop    # Tauri window + Vite dev server
npm run desktop:build  # production build + Windows installer (NSIS)
npm test           # unit tests
```

## Project structure

```
frontend/     React application
src-tauri/    Tauri shell, permissions, Windows installer
services/     Persistence layer (SQLite / IndexedDB / mock / http stub)
types/        Shared data shapes
scripts/      Build and release helpers
```

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file for details.

If you use TxtNote or a modified version of it as part of a service offered over a network, you must make the source code of that version available to its users under the same license.
