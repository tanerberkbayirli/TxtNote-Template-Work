# Analyzer brief (source forensics → normalized spec)


You analyze the official thesis-format sources of **one target** and write a normalized,
evidence-backed spec. You never modify production code (`TxtNote/`) or sources
(`Butun-Sablonlar/`, read-only). You never open sources of other targets/universities.

## Inputs
- Your target's record in `orchestration/manifest.json` (`sourceFiles`, `supplementarySources`, `variants`, `flags`, `notes`).
- Engine context (read-only, to know what can be expressed and to name gaps):
  `TxtNote/frontend/src/thesis/schema.d.ts`, `TxtNote/frontend/src/thesis/README.md`,
  `TxtNote/frontend/src/thesis/templates/mcbu.js` (reference data module), `templates/generic.js`.
- Policy: `orchestration/README.md` (Active policy). Prefer the DOCX->spec analyzer / XML extraction for MEASURED values; produce official reference renders once and cache them under `artifacts/<id>/source/`.

## Outputs (only these paths)
- `orchestration/specs/<target-id>.json` — the normalized spec (schema below). Valid JSON.
- `orchestration/reports/<target-id>.md` — human report: summary, variant decision, source priority, conflicts, UNKNOWNs, engine gaps, open questions.
- `orchestration/artifacts/<target-id>/source/` — derived files only (soffice PDF conversions of DOCX/DOC, page renders, extracted XML, measurement dumps). Keep it small: no page renders over ~15 files; prefer JSON dumps.

## Forensic methods (use the strongest evidence available)
- **PDF** (PyMuPDF, `import pymupdf`): `page.rect`, `page.get_text("dict")` / `"rawdict"` for line/span bbox, baseline (`span["origin"]`), font name, size, flags; `page.get_images()`/`get_image_rects()` for logo geometry; `page.get_drawings()` for rules/boxes/table borders. Word-produced PDFs are geometrically exact: the guide's own **example pages** (cover, inner cover, approval, abstract, TOC samples…) are measured evidence of the required layout. Convert pt→mm with ×25.4/72.
- **DOCX** (unzip; `word/document.xml`, `word/styles.xml`, `word/settings.xml`, headers/footers): `w:sectPr` (`w:pgSz`, `w:pgMar` incl. `w:gutter`, `w:header`/`w:footer` distance, `w:titlePg`, `w:pgNumType`, `w:mirrorMargins` in settings, `w:evenAndOddHeaders`), paragraph `w:spacing` (`w:line` + `w:lineRule`: auto=240ths of a line, exact/atLeast=twips), `w:ind` (firstLine/hanging/left/right in twips), `w:jc`, `w:tabs`, run `w:rFonts`/`w:sz` (half-points)/`w:b`/`w:i`/`w:caps`, style inheritance (docDefaults → style basedOn chain → direct formatting), tables (`w:tblW`, `w:gridCol`, borders), drawings (`wp:anchor`/`wp:inline`, `wp:extent` in EMU = 1/36000 mm, `wp:positionH/V`), text boxes and frames (`w:framePr`). Also convert with `soffice --headless --convert-to pdf --outdir orchestration/artifacts/<id>/source <file>` and measure the rendered geometry (note: LibreOffice rendering is supporting evidence; XML values are primary).
- **DOC**: convert with soffice to DOCX and PDF in artifacts, then as above.
- Units: 1 twip = 1/1440 in = 0.017639 mm; 1 pt = 0.352778 mm; Word "single" line of Times New Roman / Arial ≈ 1.15 × font size; `w:line="360" lineRule="auto"` = 1.5 lines.
- Never infer a number from a screenshot when XML or PDF geometry exists. Distinguish a Word default / sample text accident from a requirement; say which.

## Spec schema (`orchestration/specs/<id>.json`)
```jsonc
{
  "id": "<target-id>", "schemaVersion": 2, "analyzedAt": "YYYY-MM-DD",
  "university": "...", "unit": "institute/faculty/program", "sources": [{ "path": "...", "role": "primary|supplementary", "type": "guide|template|...", "version": "...", "pages": 0 }],
  "sourcePriority": [{ "path": "...", "why": "newer / more specific / template vs guide" }],
  "variants": [{ "registryId": "...", "degreeType": "master|phd|undergraduate|specialization", "language": "tr|en", "confirmed": true, "evidence": "<path>#<locator>", "differences": ["what differs from the other variants"] }],
  "rules": [
    { "key": "page.margins.leftMm",               // dotted key; see key list below
      "value": 35, "unit": "mm",
      "confidence": "EXPLICIT|TEMPLATE|MEASURED|INFERRED|UNKNOWN",
      "appliesTo": ["*"] ,                           // or registryIds / "phd" / "en" / section ids
      "evidence": [{ "source": "<path>", "locator": "p.7 §2.1 | word/document.xml sectPr#3 w:pgMar | styles.xml style 'Heading1'", "quote": "Sol kenar boşluğu 3,5 cm" }],
      "notes": "" }
  ],
  "sections": [   // document structure in required order, per variant where different
    { "id": "outer-cover", "kind": "outerCover|innerCover|approval|declaration|ethicsDeclaration|dedication|preface|acknowledgements|abstract|englishAbstract|tableOfContents|listOfTables|listOfFigures|listOfSymbols|listOfAbbreviations|introduction|mainContent|conclusion|bibliography|appendices|curriculumVitae|custom",
      "title": "exact printed title (case as printed)", "required": "required|optional|conditional", "appliesTo": ["*"],
      "pageNumbering": { "counted": true, "visible": false, "format": "roman-lower|roman-upper|arabic|none", "startAt": null },
      "inToc": true, "startsNewPage": true,
      "layout": [ /* special pages only: ordered lines/blocks exactly as the example shows */
        { "kind": "text|metadata|image|spacer|rule|table|signatureRow", "text": "T.C. / {{STUDENT_NAME}} …", "font": "Times New Roman", "sizePt": 12, "bold": true, "italic": false, "caps": true, "align": "center",
          "yTopMm": 30.0, "baselineMm": 34.2, "xLeftMm": null, "xCenterMm": 105.0,   // measured on the official example page
          "spaceBeforePt": 0, "spaceAfterPt": 0, "lineSpacing": "single|1.5|exact 18pt", "evidence": [ ... ], "confidence": "..." } ],
      "evidence": [ ... ] }
  ],
  "placeholders": { "STUDENT_NAME": { "label": "...", "usedOn": ["inner-cover"], "format": "Ad SOYAD" } },
  "sourceGeometry": [   // raw measurements of official example pages, for the validator
    { "source": "<path>", "page": 12, "what": "Dış kapak örneği", "pageSizeMm": [210, 297],
      "lines": [{ "text": "...", "font": "TimesNewRomanPS-BoldMT", "sizePt": 12, "x0Mm": 0, "x1Mm": 0, "baselineMm": 0 }],
      "images": [{ "x0Mm": 0, "y0Mm": 0, "wMm": 0, "hMm": 0 }], "drawings": [ ] } ],
  "conflicts": [{ "topic": "...", "sources": [{ "path": "...", "locator": "...", "value": "..." }], "decision": "which wins and why (newer/more specific/template vs guide)", "needsConfirmation": false }],
  "unknowns": [{ "key": "...", "why": "sources silent / illegible" }],
  "engineGaps": [{ "requirement": "...", "evidence": "...", "whyEngineCannot": "cite schema.d.ts", "suggestedGenericCapability": "..." }],
  "measurableChecks": [   // what the validator must measure on the exported PDF/DOCX
    { "id": "margin-left", "appliesTo": ["*"], "what": "left edge of body text lines (x0 of left/justified lines without indent)", "expected": 35.0, "unit": "mm", "tolerance": 0.5, "sourceRule": "page.margins.leftMm" } ]
}
```

### Rule keys (use these where applicable; add more with the same style)
`page.size`, `page.widthMm`, `page.heightMm`, `page.orientation`, `page.margins.{top,bottom,left,right}Mm`, `page.gutterMm`, `page.mirrorMargins`, `page.header.distanceMm`, `page.footer.distanceMm`, `page.header.content`, `page.footer.content`, `pagination.front.format`, `pagination.front.startsAt(section)`, `pagination.main.format`, `pagination.main.startsAt(section)`, `pagination.position`, `pagination.align`, `pagination.distanceFromEdgeMm`, `pagination.font`, `pagination.appendix`, `pagination.firstPageOfChapterVisible`,
`typography.body.fontFamily`, `typography.body.fontSizePt`, `typography.body.lineSpacing` (Word semantics: "single", "1.5", "exact:18pt", "multiple:1.15"), `typography.body.align`, `typography.paragraph.firstLineIndentMm`, `typography.paragraph.spaceBeforePt`, `typography.paragraph.spaceAfterPt`, `typography.paragraph.blankLineBetween`,
`headings.h1.*` … `headings.h4.*` (fontSizePt, bold, italic, caps, align, spaceBeforePt, spaceAfterPt, lineSpacing, numbering format e.g. "1.", "1.1.", "BİRİNCİ BÖLÜM", pageBreakBefore, indentMm), `headings.levels`,
`captions.table.*` / `captions.figure.*` (label, position above/below, numbering "1.1" vs "1", separator after number e.g. "." / ":", fontSizePt, bold for label, align, spacing), `tables.fontSizePt`, `tables.lineSpacing`, `figures.*`, `equations.numbering`, `equations.align`,
`footnotes.fontSizePt`, `footnotes.lineSpacing`, `footnotes.separator`, `citations.style`, `bibliography.title`, `bibliography.fontSizePt`, `bibliography.lineSpacing`, `bibliography.hangingIndentMm`, `bibliography.spaceAfterPt`, `bibliography.order`,
`toc.title`, `toc.levels`, `toc.leader`, `toc.pageNumberHeading`, `toc.lineSpacing`, `toc.indentPerLevelMm`, `lists.figures.*`, `lists.tables.*`, `abstract.maxWords`, `abstract.keywords.count`, `abstract.lineSpacing`, `appendices.*`, `binding.*`, `printing.duplex`, `paper.weight`, `cover.color` etc.

## What a good analysis does
- Reads **all** pages of every assigned source (guide text, example pages, appendices/forms). Lists every example page with its page number.
- For each special page example, measures every line: text, font, size, bold, baseline y (mm from top), x0/x1 (mm), and image boxes. Writes them to `sourceGeometry` and turns them into `sections[].layout` with values. Where the guide states a distance ("üstten 3 cm", "4 satır boşluk"), record both the statement (EXPLICIT) and the measurement (MEASURED) and note if they disagree.
- Checks whether the guide's own body pages follow its own rules (margins/line pitch) — useful corroboration, never a replacement for explicit text.
- Separates degree (YL/Doktora) and language (TR/EN) differences precisely; confirms or rejects each manifest variant with evidence. Undergraduate targets use `degreeType: "undergraduate"`.
- Records conflicts (guide vs template, old vs new) with a decision rule: newer and more specific wins; an official DOCX template's XML beats a guide sentence only where the guide is silent or the template is newer and specific — otherwise report as conflict with `needsConfirmation`.
- Lists engine gaps concretely against `schema.d.ts` (e.g. mirrored margins, exact-pt line spacing, framed cover, letter-numbered appendices, tab-aligned approval tables, page number distance from edge).
- Produces `measurableChecks` covering: page size, all four margins, body font/size/line pitch/indent/paragraph spacing/alignment, heading styles & spacing & numbering for H1–H4, page-number position/format per part, every special page element position, caption format/position, TOC format, bibliography hanging indent, footnote size.

Return a short summary (≤ 20 lines): counts of rules by confidence, variants confirmed/rejected, top conflicts, engine gaps, and anything the integrator must decide.
