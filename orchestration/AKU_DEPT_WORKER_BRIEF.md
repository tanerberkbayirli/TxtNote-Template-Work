# AKÜ department/program template worker brief (2026-10-02)


> Also used for other universities' remaining units (e.g. MCBÜ Tıp Fakültesi). Read "AKÜ" as the
> university named in your task, and your source folder as the one given in your task. Never take
> values from that university's other units (e.g. MCBÜ LEE `templates/mcbu.js`) — engineering reference only.

You turn ONE Afyon Kocatepe Üniversitesi (AKÜ) source folder into a usable TxtNote thesis template:
SOURCE → spec → template module → registry entry → REAL export → measured self-check → report.
Read `orchestration/specs/<target>.CONTEXT.md` if present (not the full AGENTS.md; it overrides this brief where they conflict). Key points:

- `Butun-Sablonlar/` is read-only. Only your own folder `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/<YourFolder>/` is your source. Never take a formatting value from another AKÜ unit (FBE/SBE/Sağlık templates are engineering references only, NOT value sources) or another university.
- Every value needs evidence: EXPLICIT (guide text), TEMPLATE (official DOCX/DOC XML), MEASURED (PDF/DOCX geometry), INFERRED (with reasoning) or UNKNOWN. Never invent a value to "complete" the template. Guide vs template conflicts: record both, pick only if recency/specificity clearly resolves it, otherwise mark CONFLICT and report.
- Fonts are strict (genuine Times New Roman etc.; no Tinos substitution claimed as PASS).

## Environment (Windows, Git Bash + PowerShell)
- Vite dev server is ALREADY running at http://127.0.0.1:5175 (do not start/stop another one).
- Python has PyMuPDF (`import pymupdf`) and python-docx. LibreOffice: `"/c/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf|docx --outdir <dir> <file>` (use for .doc → .docx/.pdf of sources; output only under `orchestration/artifacts/<target-id>/source/`).
- On this Windows host export.mjs needs: `export PLAYWRIGHT_MODULE="C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright" THESIS_BROWSER_EXECUTABLE="C:/Program Files/Google/Chrome/Application/chrome.exe"`. LibreOffice may fail to render some DOCX files; then use the XML as primary evidence and say the render is missing.
- Real export: `node orchestration/tools/make-fixture.mjs <registryId> <fixture.json> [overrides.json]` then `node orchestration/tools/export.mjs <fixture.json> <outPrefix>` (drives the real editor's PDF/Word buttons). Measure with the conformance checker (or `orchestration/tools/pdfmeasure.py` until it exists); no new ad-hoc scripts. Put outputs under `orchestration/validation/<target-id>/self-1/` (keep it small; no huge dumps).
- Tests: `cd TxtNote/frontend && npm test` must stay green (currently 542 pass).

## How to build the template (reuse, don't reinvent)
- Engine/schema: `TxtNote/frontend/src/thesis/schema.d.ts`, `validation.js`, `README.md`, `orchestration/reports/ENGINE_EXTENSIONS.md`, `orchestration/reports/KURAL_SOZLUGU.md`.
- Structural examples: `TxtNote/frontend/src/thesis/templates/aku-sbe.js` (validated PASS) and its test `src/lib/thesisAkuSbe.test.js`. Copy the STRUCTURE/patterns, never the values.
- Your files: `templates/<module>.js`, `src/lib/thesis<Name>.test.js` (template loads + validates, key source values asserted), `orchestration/specs/<target-id>.json` (schema in `orchestration/ANALYZER_BRIEF.md`), `orchestration/reports/<target-id>.md`.
- Registry: add your entries to `TxtNote/frontend/src/thesis/registry.js` with ONE small Edit (another worker may edit the same file concurrently: re-read it right before editing, insert only your lines after the last `aku-` entry, never rewrite the file). Use `universityId: "aku"`, a distinct `instituteId` (e.g. `"fef-cografya"`), `degreeType: "undergraduate"` (or what the source says), `status: "official"`, a `displayName` like `Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Coğrafya Bölümü · Bitirme Tezi`.
- Only sections the source actually defines. Special pages (covers etc.) only with source evidence; an undefined page layout is UNKNOWN (omit it or keep it minimal and say so in the report — do not design one).

## Hard limits
- Do NOT modify shared engine/editor code (`thesis/*.js` other than your template + one registry Edit, `features/**`) or other templates/tests. If the source needs a capability the engine lacks, STOP that item, document it as an engine gap (requirement, evidence, why existing keys cannot express it) and continue with the rest. The orchestrator decides engine changes.
- Do NOT edit `orchestration/progress.json`, `manifest.json`, other targets' files, or git (no commit/stash/checkout/reset). The orchestrator commits.
- Context discipline: read only your sources and the files above; never other units' files, other briefs or whole engine files (grep / line ranges). Batch small fixes in one run.

## Final report (your last message, ≤ 15 lines; details go in your report .md)
Registry ids added; files written; rule counts by confidence; the most important measured export values vs source (margins, body font/size/line pitch, headings, page numbers) with PASS/FAIL per check; conflicts; UNKNOWNs that matter; engine gaps; test count. Status: PASS (self-check) / FAIL / BLOCKED with evidence. Never claim PASS without real-export measurement.
