# Independent validation 1 - aku-cografya-lisans-tr-v1

Verdict: FAIL. Counts: {'PASS': 26, 'FAIL': 7, 'CONFLICT': 5, 'INFO': 2}

Method: fresh real export (export.mjs, Chrome; fixture2 + default fixture run1); official template rendered with Word COM (src-word.pdf); guide read directly.

## FAIL
- **para-gap**: expected 9.40 mm; actual 11.53 mm (pitch + 12 pt additive). delta +2.13 mm per paragraph boundary, cumulative. Spec assumed additive (INFERRED); Word render of official template shows 6pt. Component: engine paragraph-spacing model / spec
- **cover-top-block**: expected 58.94/67.44/75.95/118.59; actual 55.86/64.38/72.90/115.50. delta -3.08 mm (title line1 -3.06); name/Danisman/Yil within 0.26. Component: template cover spacer/first-line offset
- **cover-fit**: expected 1 page; actual 1 page with <=2-line title (Yil 268.85). With 3-line title (run1) cover overflows: stray page 2 with only the year. Fixed spacers cannot absorb a longer title; source behaviour with longer titles UNKNOWN. Component: template/engine
- **ethics-bullet**: expected minus glyph, text x 37.5; actual bullet U+2022, text x 37.50. marker glyph differs; Word adds +0.32 mm per marker item, cumulative -1.85 mm. Component: template/engine list marker
- **ethics-tail**: expected 154.92/169.53/176.85; actual 153.07/167.67/174.96. delta -1.9 mm (cumulative, see ethics-bullet)
- **abstract-block**: expected gap 14.61 mm; actual 12.17 mm; following lines -2.05 mm. delta -2.4 mm. Component: template abstract header spacing
- **docx-opens-in-word**: expected opens; actual Word COM Open fails for cog.docx/cog2.docx (earlier self-1 export opens). document.xml has invalid <undefined> element x2 around TOC field runs. Strip-test inconclusive (Word hung). export component (DOCX TOC field writer, commit d5abcfd)

## CONFLICT / INFO
- heading-gap-h1 [CONFLICT]: template p12/p20 9.40; guide 2.6 prose "1 satir bosluk (1,5)" | Sources disagree; spec chose prose (INFERRED). Escalate.
- page-number-vs-template [CONFLICT]: template sectPr start=2 | Guide EXPLICIT vs template; spec chose guide. Policy 2026-10-03 item1 lets template structure take priority when specified: needs orchestrator ruling.
- ozet-title-size [CONFLICT]: guide 2.8 (12pt) vs template 11.04 | recorded conflict, guide chosen
- lot-title [CONFLICT]: guide 4.2.10 CIZELGELER DIZINI vs template page TABLOLAR DIZINI | recorded conflict
- symbols-layout [CONFLICT]: guide 2.10 vs template | guide implemented
- table-cell-size [INFO]: guide 2.2 (8-12 allowed); template 11 | not strictly specified
- docx-para-vs-pdf [INFO]: real export | unverified

## PASS
page-size, margin-left, margin-right, margin-top, margin-bottom, font-face, body-size, line-pitch, first-line-indent, h1-format, h2-format, page-number-pos, page-number-format, cover-seals, approval-page, ethics-header, tesekkur, toc, lists-layout, caption-size, caption-position, continued-caption, figure-table-centre, bib-format, bib-title, docx-sections

Note: several WINWORD processes remain after failed Open attempts; PIDs were not individually recorded.
