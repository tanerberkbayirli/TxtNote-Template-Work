# engine-fix-3 status
DONE: (1) DOCX paragraph spacing, (2) table caption keep-with-next, (3) optional engine-default rules. npm test 610/610 green.
Verified by Word COM probe (spacing_probe.py, kn3/, mat/): Word gap = max(after, before) in compat 12/14/15; contextualSpacing zeroes same-style gaps only. Mat stranding reproduced (mat/v0_asis: "(Devam)" on p22 bottom) and fixed by shortening the row keep-chain (v1/v2 variants: caption moves to p23).
Regression (editor PDF line dumps, dumplines.py): identical for mbg, mat, fel, lee(master), tip, sos, kimya vs existing PDFs; cog and sbe differ from their OLD PDFs only because those PDFs pre-date commit 5be77ad; re-export with HEAD code (before/) vs new code (after/) is IDENTICAL for cog, sbe, mat, sos.
PENDING: Word before/after DOCX renders on 2-3 templates (not run: budget); aku-isg regression export; mcbu-lee phd/tip DOCX Word render.
