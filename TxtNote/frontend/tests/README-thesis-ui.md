# Thesis ribbon browser smoke

With the frontend Vite server running, run from `TxtNote/frontend`:

```powershell
$env:PLAYWRIGHT_MODULE='C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright'
node tests/word-thesis.e2e.mjs http://127.0.0.1:5175
```

The smoke uses the real `ThesisEditor` fixture, checks ribbon keyboarding and formatting, configured table/link/footnote insertion, section navigation, persistence, responsive dark appearance, then downloads the actual PDF and DOCX exports. It measures the PDF's A4 page geometry and checks the DOCX package for the inserted structures and named formatting. Screenshots and export evidence are written to `TxtNote/output/word-thesis/` for review.

The editor keeps its existing continuous-layout fallback in browsers that do not support the paged CSS fragmentation features; this smoke runs in Edge, where the A4 page stack is available.
