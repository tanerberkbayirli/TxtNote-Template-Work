# MCBÜ LEE independent audit task (2026-10-02) — FIND AND RECORD ONLY, FIX NOTHING


Target: `mcbu-lee` (registry `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`; module
`TxtNote/frontend/src/thesis/templates/mcbu.js`).
Only source: `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/`
(`MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` + KAYNAK.md). Read `orchestration/specs/mcbu-lee.CONTEXT.md` (not the full AGENTS.md; it still governs).

You are an auditor. You do NOT edit `TxtNote/`, `Butun-Sablonlar/`, git, progress.json or manifest.json.
A separate fixer will act on your findings, so they must be precise and self-contained.

## Method
1. Take the guide's requirement values from the cached extraction/render under `orchestration/artifacts/mcbu-lee/source/` (produce it once with the DOCX XML analyzer / `soffice --headless --convert-to pdf` if missing; XML is primary, render is supporting). Do not re-render per attempt.
2. Run the conformance checker for BOTH variants (registry ids above; dev server at http://127.0.0.1:5175 already runs, do not start another) with a fixture exercising headings 1-4, multi-page paragraphs, tables, figures, captions, footnotes, bibliography, appendices and every special page/numbering transition the guide defines. Outputs in `orchestration/validation/mcbu-lee/audit-2/`. No new ad-hoc measurement scripts; extend the shared tool if a landmark is missing.
3. Interpret only failing/conflicting checker rows against the guide locator (genuine embedded Times New Roman, margins, pitch, spacing, headings, page numbers, captions).
4. Compare guide → template (`mcbu.js`) → actual export. Also check things the template omits entirely
   (sections/pages the guide requires that are missing) and texts/labels that differ from the guide.
5. Only after your own audit, read `orchestration/reports/mcbu-lee-audit-2026-10-02.md` (earlier static
   audit) and say for each of its MISMATCH/UNKNOWN rows whether it still holds.

## Output: `orchestration/validation/mcbu-lee/audit-2/FINDINGS.md`
Numbered findings, most severe first; the final message to the orchestrator is at most 15 lines. Each finding:
- ID (F1, F2…), severity (HIGH = violates an explicit requirement / visibly wrong; MED; LOW)
- Requirement + evidence (file, paragraph/style/XML locator or guide quote)
- Expected value vs actual measured value (with unit) and the difference
- Where it happens (variant, section, page)
- Likely responsible component (template value in mcbu.js line N / engine / export) — say "unknown" if unsure
- Suggested fix in one line (do not implement)
Also list: checks that PASSED (compact table), CONFLICTs in the source, UNKNOWNs.
Final message ≤ 25 lines: counts by severity, top findings, path of FINDINGS.md.
