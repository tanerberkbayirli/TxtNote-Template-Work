# Thesis ribbon browser smoke

With the frontend Vite server running, run from `TxtNote/frontend`:

```powershell
$env:PLAYWRIGHT_MODULE='C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright'
node tests/word-thesis.e2e.mjs http://127.0.0.1:5175
```

The smoke uses the real `ThesisEditor` fixture and checks all six ribbon tabs, keyboard navigation, scrolling access to every ribbon group, control clipping, text selection retention, palette hex and automatic colors, highlight removal, decimal font size commit/cancel, and static-target disabled states. It also exercises table/link/footnote/frame insertion, layout undo/redo, section navigation, persistence after reload, and the responsive dark appearance. It downloads PDF and DOCX through the editor's real export buttons, checks PDF page geometry plus text/font-size evidence, and checks DOCX XML for inserted content and the selected text/highlight colors and size. Screenshots and export evidence are written to `TxtNote/output/word-thesis/` for review.

Invalid or dangerous link schemes and malformed addresses must remain disabled; normalized HTTP(S) and `mailto:` addresses are supported.

The editor keeps its existing continuous-layout fallback in browsers that do not support the paged CSS fragmentation features; this smoke runs in Edge, where the A4 page stack is available.

For a targeted rerun after the ribbon reachability sweep has passed, set `RIBBON_SKIP_REACHABILITY=1`; the default run always checks both representative widths.
