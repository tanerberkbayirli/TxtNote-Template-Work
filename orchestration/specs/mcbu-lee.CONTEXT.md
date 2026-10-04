# mcbu-lee — context pack
## Identity
- Registry id(s): `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/mcbu.js` (exports: mcbuMaster, mcbuPhd)
- Spec: `orchestration/specs/mcbu-lee.json`; checks: `orchestration/specs/mcbu-lee.checks.json` (not yet); progress report: `orchestration/reports/mcbu-lee.md`
## Sources
- `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/MCBU_Lisansustu_Tez_Yazim_Kilavuzu.docx`
- Guide DOCX 2025-10-22 (sha256 e607f8f7..; locators G[n] = body paragraph index; the PDF counterpart is not in the repo, KAYNAK.md only).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Official example XML wins over prose (user rule): fix-2 resolved C1-C6 (chapter heading form, OZET/ABSTRACT spacing per example, cover gaps = empty-paragraph structure, cover centre 117.5 mm with 10 mm indent, Onsoz single, TOC sub-indents by typed spaces).
- fix-1 F8: template.source cites the DOCX; PDF not used.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins left/top (mm) | 40 mm / 25 mm | EXPLICIT | G[330] |
| Body font | Times New Roman | EXPLICIT | G[331] |
| Body line spacing | 1.5 lines | EXPLICIT | G[331] |
| Para indent / after | 12.5 / 6 | EXPLICIT | G[333] |
| H1 format | bold, 12 pt, justified, all capitals, new page, numbered '{1}.' | EXPLICIT | G[332], G[339] |
| H2 format | bold 12 pt, numbered '1.1.' | INFERRED | G[301]-G[308] |
| Page number position | bottom | MEASURED | word/footer1.xml |
| Front format | roman-upper | EXPLICIT | G[342] |
| TOC line spacing | single lines | TEMPLATE | G[288]-G[297] |
| Table caption | above the table, one line centred else justified; table single spaced, names and values centred | EXPLICIT | G[341] |
| Caption numbering | document-wide from 1 OR per chapter (author's choice, one method throughout) | EXPLICIT | G[344] |
## Open issues
- No independent validation; fix-1/fix-2 are self-reports (orchestration/validation/mcbu-lee/fix-2/FIX_REPORT.md); audit-2 exists. Resume note: untouched in session 2.
- UNKNOWN (14, U1-U14): TOC sub-row leaders/numbers, footnote pitch, table borders/padding, bibliography spacing/hanging, page-number font (template Calibri 11 vs export TNR 12), equations unnumbered, H2-H4 spacing (examples after=0 vs template 6 pt).
- CONFLICT: 7 (C1-C7) all resolved or recorded.
## Status
- IN_PROGRESS; validation PENDING (self only); commit 4b31444. Depends on engine-fix-4 (TOC row spacing).
## Next step
- Independent validation via checker after reconciling U1/U8/U10 against example XML.
## Commands
- `node orchestration/tools/check.mjs --target mcbu-lee` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide DOCX full text; orchestration/validation/mcbu-lee/{fix-1,fix-2,audit-2} dumps (lines-*.txt, docx, layout.json); orchestration/MCBU_LEE_AUDIT_TASK.md. Other targets' specs/validation folders.

- Footnote numbering (2026-10-04): engine default `footnotes.numbering: "document"` (one running sequence, = Word). MEASURED: official DOCX settings `w:footnotePr` has no `w:numRestart` → Word default continuous numbering.
