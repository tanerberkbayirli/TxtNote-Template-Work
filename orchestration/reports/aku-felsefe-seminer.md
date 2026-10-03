# aku-felsefe-seminer (Seminer) — self-check report 2026-10-02
Registry: aku-felsefe-seminer-tr-v1 (instituteId fef-felsefe-seminer, undergraduate). Module templates/aku-felsefe.js, test src/lib/thesisAkuFelsefe.test.js, spec orchestration/specs/aku-felsefe-seminer.json.
Source: 2019 official DOCX guide. It contains a labeled VML seminar-cover example at paragraph 124 and detailed prose/citation examples. The cover example is source evidence; its content and geometry must be measured before implementation. The guide's sectPr/styles outside that labeled example describe the guide document, not automatically the seminar.

## Measured real export (orchestration/validation/aku-felsefe-seminer/self-1/fel.pdf|docx, Word render checked)
| check | expected (EXPLICIT) | measured | result |
|---|---|---|---|
| page A4 | 210x297 | 210x297 | PASS |
| left margin | 30 mm | 30.0 mm (Word render 30.0) | PASS |
| right margin | 20 mm | 190.0 mm text edge (PDF), docx pgMar right 1134 tw | PASS |
| top / bottom | 30 / 30 mm | top first line 30.18 mm; pgMar 1701 tw | PASS |
| body font/size | Times New Roman 12 | TimesNewRomanPSMT 12.0 (docx TNR) | PASS |
| line pitch | 1.5 lines | 20.7 pt (Word and PDF) | PASS |
| paragraph spacing 6+6 | 6 pt before and after; collapse behavior per source/Word semantics | earlier export measured 26.7 pt paragraph pitch; independent DOCX inspection found exported before/after spacing 12/6 pt under additive compensation | FAIL (source-backed collapse semantics not yet implemented) |
| page number | bottom centre, no sign | centre of text block, plain digits, 12 pt | PASS (size UNKNOWN) |

## Source/spec delta from independent audit (2026-10-03)
Official XML review is recorded in `orchestration/validation/aku-felsefe-independent-2/REPORT.md`. Body spacing is explicitly 6 pt before + 6 pt after; additive compensation was not compliant with literal DOCX properties. The template now uses the engine's `collapse` spacing model to emit 6/6 directly. The seminar guide's cover example (para 124) provides centered row order and measured bold Times 14 pt institution/purpose rows plus 18 pt sample work title. The author/advisor/city-year run sizes are unspecified; VML placement is character/line anchored to the guide, so output-page geometry and border requirement remain UNKNOWN. Required cover is not yet implemented; the overall status remains FAIL/WIP pending cover representation and real-export revalidation. The guide does not establish a TOC depth; its contents section is optional when the advisor requests it. Citation examples remain independently documented. Caption/footnote/page-number/reference/appendix requirements remain UNKNOWN.
## Conflicts
Margins: guide text vs guide sectPr (30/30/30/25 mm); text followed.
## Engine gaps
No guide-defined block-quote first-line indent (generic body fallback is 12.5 mm). The current optional-rule audit supersedes the former numbered-heading test-gap note; see below.
Status: INTERIM FAIL. The earlier self-check missed the official labeled cover example and treated additive paragraph spacing as compliant. Existing cover/TOC implementation and source mapping require revalidation; the independent source audit is authoritative for the next corrections.

## Optional-rule audit (2026-10-02)
Current audit and real-export artifacts: [optional-rule audit report](../validation/aku-optional-audit/REPORT.md). The prior optional audit's characterization of the guide as prose-only and its blanket source-UNKNOWN statements are superseded: an official cover example exists and requires measured extraction. No exact-conformance PASS is claimed pending those corrections and the source-backed paragraph-spacing fix.
