# afsu-lee-proposal — context pack
## Identity
- Registry id(s): `afsu-lee-proposal-master-tr-v1`, `afsu-lee-proposal-phd-tr-v1`
- Template module: `engine/src/templates/afsu-lee-proposal.js` (exports: afsuLeeProposalMaster, afsuLeeProposalPhd)
- Spec: `orchestration/specs/afsu-lee-proposal.json`; checks: `orchestration/specs/afsu-lee-proposal.checks.json` (not yet); progress report: `orchestration/reports/afsu-lee-proposal.md`
## Sources
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf`
- Guide PDF 2025 (Tez Onerisi Hazirlama Kilavuzu) only; most formatting rules are EXPLICIT-by-reference to the AFSU LEE guide (p.3 s1.1/s1.2) and are copied from orchestration/specs/afsu-lee.json by the spec itself.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Reference-carrier rules follow the proposal guide's own pointer to the LEE guide (self-2 replaced carriers by by-reference values) - the guide's explicit instruction, not cross-university reuse.
- Cover margins symmetric 25 mm to keep page-centred sample: UNKNOWN. Master cover parenthetical '(Yuksek Lisans Tez Onerisi)' INFERRED.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins | top/bottom/right 25, left 40 mm | EXPLICIT-by-reference | guide p.3 s1.1/1.2 -> afsu-lee.json |
| Body | TNR 12, 1.5, justified, indent 0, 6 pt before/after | EXPLICIT-by-reference | same |
| Headings | H1 upper bold 14 centred own page; H2 bold 14 left; H3 bold 12; H4 bold italic 12 unnumbered | EXPLICIT-by-reference | same |
| Page numbering position | bottom right | EXPLICIT-by-reference | same |
| Page numbering start | Arabic from first body page, cover unnumbered | INFERRED | spec rules[] |
| Footnotes / references | TNR 10 / 10 pt single, 6 pt between entries | EXPLICIT-by-reference | same |
| Captions | 12 pt; figure below centred, table above left; content 10 pt | EXPLICIT-by-reference | same |
| Cover sizes | 12 bold; title 14 bold; year 12 regular | EXPLICIT | guide p.5 Sekil 1 annotations |
| Cover vertical gaps | 28.7/33.4/33.4/66.8 mm | MEASURED | guide p.5 (scaled /0.975) |
| Citations | APA | EXPLICIT | guide p.3 s1.1 |
## Open issues
- No validation beyond self-1/self-2; no FAIL recorded.
- Engine gap: static table block for the p.9 landscape work-calendar grid. UNKNOWN: cover margins. Spec schema differs (target/source/rules/engineGaps; no conflicts/unknowns arrays).
## Status
- IN_PROGRESS; validation PENDING (self real exports); commits 7f7481b, b038b86. Untouched in session 2.
## Next step
- First independent validation via checker; confirm by-reference values against the LEE guide.
## Commands
- `node orchestration/tools/check.mjs --target afsu-lee-proposal` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF; orchestration/validation/afsu-lee-proposal/self-*; orchestration/artifacts/afsu-lee-proposal/. Other targets' specs/validation folders.

- Footnote numbering (2026-10-04): engine default `footnotes.numbering: "document"` (one running sequence, = Word). UNKNOWN: sources do not state a footnote numbering/restart rule.
