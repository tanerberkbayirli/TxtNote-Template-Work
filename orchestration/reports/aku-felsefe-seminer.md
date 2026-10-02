# aku-felsefe-seminer (Seminer) — self-check report 2026-10-02
Registry: aku-felsefe-seminer-tr-v1 (instituteId fef-felsefe-seminer, undergraduate). Module templates/aku-felsefe.js, test src/lib/thesisAkuFelsefe.test.js, spec orchestration/specs/aku-felsefe-seminer.json.
Source: prose-only 2019 DOCX guide (no template, no thesis example pages). Guide sectPr/styles/cover describe the guide document, not the thesis.

## Measured real export (orchestration/validation/aku-felsefe-seminer/self-1/fel.pdf|docx, Word render checked)
| check | expected (EXPLICIT) | measured | result |
|---|---|---|---|
| page A4 | 210x297 | 210x297 | PASS |
| left margin | 30 mm | 30.0 mm (Word render 30.0) | PASS |
| right margin | 20 mm | 190.0 mm text edge (PDF), docx pgMar right 1134 tw | PASS |
| top / bottom | 30 / 30 mm | top first line 30.18 mm; pgMar 1701 tw | PASS |
| body font/size | Times New Roman 12 | TimesNewRomanPSMT 12.0 (docx TNR) | PASS |
| line pitch | 1.5 lines | 20.7 pt (Word and PDF) | PASS |
| paragraph spacing 6+6 | additive in editor | 26.7 pt pitch between paragraphs in PDF and Word render | PASS (engine sums; source ambiguous under Word collapse) |
| page number | bottom centre, no sign | centre of text block, plain digits, 12 pt | PASS (size UNKNOWN) |

## UNKNOWN (not generated)
Dış/İç Kapak layout, heading typography (only body font/size inherited; decimal numbering is an engine-required default, not a source rule), caption format/position, footnote format, page-number size, reference-list indents, appendix layout.
## Conflicts
Margins: guide text vs guide sectPr (30/30/30/25 mm); text followed.
## Engine gaps
Shared test thesisEngine.test.js requires numbered headings for every template. No guide-defined block-quote first-line indent (inherits body 12.5 mm).
Status: PASS (self-check, for the defined values only; cover/headings UNKNOWN).
