# selfcheck-fix-2 - aku-matematik-lisans (after independent-1 FAIL)

Real export: orchestration/validation/aku-matematik-lisans/self-2/mat.{pdf,docx,word.pdf} (dev server 5173, Chrome; Word COM own instance PID 4880, Quit in finally).

| check | before | after | status |
|---|---|---|---|
| docx.order (Word) | page 1 = "EK 1", covers at 29-34 | page 1 = cover, 34 pages, order correct | PASS |
| wordrender.pagenums | none on 33/34 pages | cover blank, i..vii, 1..25 present | PASS |
| lists.fig.entrygap (PDF) | 4.87 mm | 7.0 mm (expected 6.99; single + 6 pt after; sample-XML 7.30 conflict kept, official red text followed as in template) | PASS |
| pdf.pagination.capacity (p20) | 245.7 mm, 30 lines | 260.3 mm, 32 lines; sheets 35 -> 34 (= Word's 34) | PASS |

Root causes / fixes
- A: `w:fldSimple TC` -> Word mis-ordered sections/dropped numbers. tocSpecialField (export.js) now emits a complex field (begin/instrText/separate/end runs) inside the paragraph. Test added in thesisEngine.test.js ("emits TC index fields only as complex-field runs...").
- B: engine.js generatedIndex: per-row spaceBefore/After from index.style was applied once to the list box; now applied to every li (list box margin zeroed in that case).
- C: footnotes.js cutTarget: the contenteditable container holds zero-width-space loose text nodes; `.trim()` kept them so the whole body got a footnote "reserve" padding repeated on every page (-58.9 px = 2 lines). Zero-width chars now ignored.
Tests: npm test 658/658 pass; npm run build OK. Not re-validated: other templates' exports (index-row spacing change affects any template whose generatedIndex.style has spaceBefore/After and no levelStyles).
