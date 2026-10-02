# AKÜ-FBE Word-render audit (PARTIAL — stopped early on orchestrator budget order)

## Done
- Official template (AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx) rendered with Word COM to PDF:
  `orchestration/artifacts/aku-fbe/source/word-render/official.pdf` (copy: `official.docx`). Word reports **33 pages**. Word COM works on this host (command took >120 s once; run in background).

## NOT done (remaining)
- (a) PyMuPDF geometry measurement of cover/inner cover/approval/ÖZET/TOC/body/captions/page numbers and Δ table vs spec: NOT measured. No findings table can be claimed; all verdicts below are UNKNOWN.
- (b) Long-title (89 char) + 2 extra juror rows experiment in a DOCX copy: NOT run. Template's natural behaviour is therefore still UNKNOWN.

| Item | Spec | Word render | Δ | Verdict |
|---|---|---|---|---|
| Page count of official template | n/a | 33 | n/a | MEASURED (count only) |
| All geometry items | see spec | not measured | - | UNKNOWN |
| Long-title cover date / approval overflow | export FAIL (41 pages) | not run | - | UNKNOWN |

## Recommended next steps / resolution under the user's rule
1. Measure official.pdf with PyMuPDF (page-level text bboxes, fonts, footer number baseline) and diff against spec `measurableChecks`; list Δ > 0.25 mm.
2. Copy official.docx, set title to the 89-char fixture title, add 2 juror rows per the template callout, render with Word, record page count and whether the cover date / director block moves to a new page.
3. Resolution rule: whatever Word does with the official template (natural flow, no compression) becomes the expected behaviour; the editor/export should reproduce that flow (including a date or director block spilling to the next page if Word does so), and the BLOCKED status should be re-evaluated as FAIL/PASS against that Word-derived evidence rather than UNKNOWN.
