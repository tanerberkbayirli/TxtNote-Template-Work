# aku-matematik-lisans selfcheck-fix (integrator)
FAIL fixed: table note -> next heading baseline, expected 14.09 mm (official.pdf p13: note baseline 132.61 -> heading "3.3" 146.70; re-measured from official PDF), was 14.60 mm.
Root cause (engine): blockGap.js gave every block after a note one 12 pt body paragraph pitch (41.4 pt baseline-to-baseline). The note is a 10 pt single line
(sample w:after=120) followed by one empty 12 pt 1.5 line, so the real pitch = 2.164 (note descent) + 6 + 20.7 + 11.2 (heading ascent) = 40.06 pt = 14.13 mm.
Fix: generic opt-in `lineSpacing.noteExitGap: "spacing"` (note space-after + body space-after + next space-before; default "pitch" unchanged); template sets it and tableNote spaceAfterPt 6 (= sample w:after=120).
Measured after fix (real editor PDF, render/mat.pdf, 35 pages): 14.13 mm (delta 0.04 mm), selfcheck_ed 34/34 PASS (render/selfcheck_ed.out.txt).
DOCX XML (render/mat.docx): note w:after=120; next heading w:before=534 (26.7 pt; Word max(6, 26.7)) -> same 14.13 mm by Word model. Word-rendered PDF NOT regenerated here (no Word render in this run) - validator should re-render.
Other FAILs in report: none (only this one). npm test 654/654, build OK.
