# Paused flow investigation — 12 October 2026

User requested a break because the usage limit was low. No new research, browser/Word run or tests will be started. This is an unresolved diagnosis, not a final acceptance PASS. Production source in this work consists only of the proved payload hydration cache fix and its regression; ISG's two exact page-label expectations were corrected with independent source/text evidence. No AFSÜ production change was made.

Confirmed AFSÜ evidence (`afsu-row-audit.py/json`, existing final-2026-10-12b/all-word/afsu-lee outputs):
- Editor36physical pages / real Word37. Generic table row pitch24.2344pt vsWord24.24pt; page25firstrow baseline111.176vs111.26. Generic row spacing is substantially equal; changing font/line-height would be unjustified.
- The long table begins on physical page24, Madde1 baseline426.703editor vs468.19Word: Word is already41.487pt(two body lines) behind before the table starts. Caption baselines383.79vs425.21 show the same preceding-flow difference.
- First divergent paragraph decision isolated on physical page22: headings/body starts agree within0.12pt; editor renders first two lines of `3.1 2.` at689.684/710.38, whereas Word moves that entire paragraph to page23. Subsequent H3 begins185.590editor vs226.94Word.
- Footnote body ink baselines agree within~0.09pt: first738.973vs739.060, second752.766vs752.856, last766.56vs766.66. The mark itself is7.5pteditor/6.48ptWord; that difference is not evidence of taller note-body lines.
- `footnotes.js` already subtracts terminal-leading allowance: noteHeight=contentHeight-trailingLeading and note-page limit=noteHeight-allocation.height. `placeSpacer` manually cuts with a float; physical full-line-box/page-end paragraph spacing remains a potential threshold issue, not a proved fix.
- Generated cell XML:10pt, auto240line spacing,6pttop/bottompadding, atLeast230twips. keepNext is true only for header/first data and closing pair; ordinary rows explicitly haveval0.

Retracted hypotheses:
- Counting keepNext elements without readingval0 falsely suggested every row was chained. There is no such global chain bug in this output.
- The first footnote SUP baseline was briefly mistaken for the body baseline, suggesting0.86ptnote line-height drift. Actual body baselines match; that hypothesis is withdrawn.
- Default Word footnote separator paragraph(auto240, inherited12pt) differs from browser9.5ptspace+rule. Diagnostic copiedDOCX with separator exact9.5pt still yields37pages, paragraph on23, Madde1at468.19 (`afsu-separator95.*`). Separator height alone is not the root cause.

Last already-running diagnostic completed before pause: copiedDOCX changes only target paragraph `3.1 2.` space-after6pt→0; results in `afsu-after0-observation.json` and `afsu-after0.word.pdf`. This is diagnostic only, not an authorized production spacing change or accepted output.

SRC09 related evidence from long-document agent: Word starts `Bilimsel araştırmalar bu sorulara yanıt ararken` on45; editor includes its last two lines on44. Current nodepdocx-5946, section18. SourceWordPDF orchestration/engine-work/mission01/references/SRC09/word.pdf. Imported footer reservation yields physical bottom759.74pt and terminal-leading+6.9pt; long agent is checking whether full paragraph boxes incorrectly use that allowance. A shared AFSÜ/SRC09 cause is not yet demonstrated.

Processes: completed Word diagnostics ownedPID20632(separator) and35784(after0) no longer exist, confirmedGetProcess on pause. All ChartEx Word PIDs completed earlier. This agent has no running Vite, browser or test process. No unrelated process was touched. Parent owns final acceptance and other agents' runtime cleanup.
