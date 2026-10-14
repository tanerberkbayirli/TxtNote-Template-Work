# ChartEx save/reopen closure — 12 October 2026

The active native drawing writer restores `mc:AlternateContent/mc:Choice Requires="cx1"` around each ChartEx drawing. The old parked failure files predate that wrapper. No chart was deleted or rasterized; unavailable source-machine workbook links remain disconnected, and the original imported package remains preserved.

Fresh current-engine exports:
- `chartex-current.json`: SmartArt + ChartEx + OMML, real Word edit/SaveAs/reopen PASS; owned Word PID7660 closed.
- `native-current.json`: six native drawings, real Word edit/SaveAs/reopen PASS; five floating shapes/two inline objects/one equation retained; owned PID7532 closed.
- `chartex-current.schema.json`, `native-current.schema.json`: generated output Office2016 SDK0 errors.
- `chartex-preservation.json`: source → emitted DOCX → Word SaveAs/reopen retains all15category+15numeric cached points and both clusteredColumn/paretoLine layouts, including the mixed drawing fixture.

`word-chartex-edit.ps1` separately inspected the ChartEx through Word COM: ChartType122(Pareto), one data series and original title readable. Both ChartTitle.Text and TextFrame2 setters return E_FAIL on this Word installation (`chartex-chart-edited.json`). This is not a proof that chart data is editable through Word COM; no such claim is made. Document text/SmartArt editing with ChartEx present and native-chart preservation are the passing scope.

Word's own SaveAs output reintroduces three Office2016 SDK issues in `native-current-reopened.schema.json`: obsolete VML gfxdata, a compatibility-setting enumeration, and a legacy-chart leaderLines extension. The generated engine output is SDK0; the Word-saved output is not reported as SDK0. No acceptance threshold or source package was modified.

Payload persistence: `prepareThesisNote` now rebuilds its process-local projection cache from authoritative model nodes after JSON hydration. Unchanged SVG attribute casing, empty text leaves and native IDs therefore do not get rewritten by compatibility-HTML parsing. SRC09's53MB payload comparison goes from31structural differences to0 (`payload-diff.json`); native content properties and real edits are covered by the new regression. Targeted content-model/native-drawing tests29/29PASS. Final browser/20-input/general acceptance belongs to the root serial run.

Specification: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/8a963284-245d-4c2a-935d-cc6aef448b09 describes ChartEx cached data and optional external/embedded spreadsheet data. Cached data retention does not manufacture the unavailable original workbook.
