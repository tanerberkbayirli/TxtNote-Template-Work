# Official DOCX extraction (Phase 4.1)

Run from the repository root:

```sh
python orchestration/tools/docx2spec.py --docx <official.docx> --target <id> --out orchestration/specs/<id>.extracted.json
python -m unittest discover -s orchestration/tools -p test_docx2spec.py
```

The source must be the official template/example, not an app-generated DOCX.
Legacy `.doc` input fails explicitly; convert it once into the target source cache
with LibreOffice, preserving the original and its provenance, before extraction.

The version 1 output has status `EXTRACTED_XML_ONLY`, source/part SHA256,
one-based XML paths (`part#/w:document[1]/.../@w:left`) and measured section
dimensions in mm. Style font sizes use pt. Original attributes retain Word units
and explicit false/zero values. `policy.evidence` applies to extracted XML facts;
this does not make an extracted style a normative body-text requirement.

`sections` includes current paragraph/final section properties, excluding historical
`sectPrChange` sections. It preserves `pgNumType`, `titlePg`, header/footer distances
and relationship IDs. `styles` preserves names, IDs, basedOn, docDefaults, fonts,
spacing, numbering, keep flags and conditional table styles. `numbering`, `settings`,
table/grid/row/cell properties and borders/margins remain available as property trees.
`pageFields` finds PAGE fields (simple, split-run and nested), their paragraph
alignment/style references and the actual header/footer part via package relationships.

`properties` trees retain unrecognized attributes/elements with their exact XML
locators for later engine mapping. Inspect selected section/style IDs rather than
loading the full extracted document into an agent prompt. No source prose is copied.

Missing properties remain UNKNOWN. Effective style inheritance, theme-font resolution,
inherited section headers/footers and Word default semantics still need a mapper;
raw measurements must not silently become defaults or body styles. A missing explicit
PAGE alignment is not measured centering. Cache provenance and Word-render fixed-page
geometry remain pending, as do guide conflicts, generation and Tier 1 validation.

The first real-source extraction uses ADÜ Sağlık Bilimleri 2026. This is an extraction
checkpoint, not a generated template or completed Phase 4 pilot. No editor/export
engine behavior changes in this step.
