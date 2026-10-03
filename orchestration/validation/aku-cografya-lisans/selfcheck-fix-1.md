# Self-check fix-1 - aku-cografya-lisans-tr-v1 (integrator; not a validation PASS)

Method: real export (export.mjs, Chrome, dev server 5173, make-fixture + overrides2.json) -> render/fix1.pdf/.docx; PyMuPDF baselines (mm). Word COM own instance (PID 6192, Quit in finally) opened fix1.docx without error and exported fix1-word.pdf.

| Check | Expected (Word render of template) | Before | After |
|---|---|---|---|
| para-gap | 9.40 | 11.53 | 9.42 (Word render of our DOCX 9.43) |
| heading->first para | 9.40 | 14.60 | 9.42 |
| cover top block | 58.94/67.44/75.95/118.59 | 55.86/64.38/72.90/115.50 | 58.93/67.45/75.97/118.57 |
| cover fit (<=2-line title) | 1 page, Yil 269.11 | Yil 268.85 | 1 page, Yil 268.85 |
| cover 3-line title | UNKNOWN (source silent) | overflow | unchanged, documented UNKNOWN in spec |
| ethics marker | minus (Symbol U+F02D), text x 37.5 | bullet | U+2212 minus, text x 37.50 |
| ethics date/sign/name | 154.92/169.53/176.85 | 153.07/167.67/174.96 | 154.98/169.58/176.87 |
| Ozet name gap | 14.61 | 12.17 | 14.61 (title->name 52.88->67.49) |
| page numbers | ethics ii, Ozet iii, 12 pt, baseline 278.81 | none / i, 10 pt, 283.53 | ii / iii, 12 pt, 278.68 |
| Ozet title | 11 pt | 12 | 11.0 |
| bibliography | 11 pt, hanging 5 mm, no gap | 12 pt, 12.5 | 11.0, x 35.0 (5.0 mm hang) |
| symbols list | run-in, no tab block | tab block 25 mm | run-in (tab/hanging removed) |

Engine: no change needed. Existing generic `lineSpacing.paragraphSpacing: "collapse"` reproduces Word's max(before, after); the DOCX writer already emitted Word semantics. Template-only changes + template tests updated.
Tests: npm test 655/655 pass; npm run build OK.
Residuals: ethics item pitch uses the measured +0.32 mm per item as extra space after (Word gets it from the Symbol glyph's taller line); the DOCX front matter (cover/ethics) is not pixel-compared to the Word render of the template (not in scope of the listed FAILs); TOC/list pages and other PASS items not re-measured except as listed (body pages, numbering, bibliography spot-checked).
