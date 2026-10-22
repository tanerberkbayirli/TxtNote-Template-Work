# aku-felsefe-lisans (Lisans Bitirme Tezi) — self-check report 2026-10-02
Registry: aku-felsefe-lisans-tr-v1 (instituteId fef-felsefe, undergraduate). Module templates/aku-felsefe.js, test src/lib/thesisAkuFelsefe.test.js, spec orchestration/specs/aku-felsefe-lisans.json.
Source: 2019 official DOCX guide. It contains labeled VML thesis-cover examples at paragraph 130 and a TOC example at paragraph 131, in addition to prose rules and detailed citation examples. These examples are source evidence; their geometry/hierarchy must be measured and transcribed before implementation. The guide's sectPr/styles outside those labeled examples describe the guide document, not automatically the thesis.

## Measured real export (orchestration/validation/aku-felsefe-lisans/self-1/fel.pdf|docx, Word render checked)
| check | expected (EXPLICIT) | measured | result |
|---|---|---|---|
| page A4 | 210x297 | 210x297 | PASS |
| left margin | 35 mm | 35.0 mm (Word render 35.0) | PASS |
| right margin | 20 mm | 190.0 mm text edge (PDF), docx pgMar right 1134 tw | PASS |
| top / bottom | 30 / 30 mm | top first line 30.18 mm; pgMar 1701 tw | PASS |
| body font/size | Times New Roman 12 | TimesNewRomanPSMT 12.0 (docx TNR) | PASS |
| line pitch | 1.5 lines | 20.7 pt (Word and PDF) | PASS |
| paragraph spacing 6+6 | 6 pt before and after; collapse behavior per source/Word semantics | earlier export measured 26.7 pt paragraph pitch; independent DOCX inspection found exported before/after spacing 12/6 pt under additive compensation | FAIL (source-backed collapse semantics not yet implemented) |
| page number | bottom centre, no sign | centre of text block, plain digits, 12 pt | PASS (size UNKNOWN) |

## Source/spec delta from independent audit (2026-10-03)
Official XML review is recorded in `orchestration/validation/aku-felsefe-independent-2/REPORT.md`. Body spacing remains explicit 6 pt before + 6 pt after; additive compensation was not compliant with literal DOCX properties. The template now uses the engine's `collapse` spacing model to emit 6/6 directly. The labeled TOC example (guide para 131) demonstrates at least four levels, so the spec/template use levels 1–4; maximum depth and consistent chapter numbering remain UNKNOWN/CONFLICT. The required sequence at para 40 includes “Simgeler veya Kısaltmalar” without a condition, so that section is required; empty-list placeholder behavior remains UNKNOWN.

The labeled cover example (para 130) provides centered row order and measured bold Times 14 pt institution/purpose rows plus 18 pt sample work title. The author/advisor/city-year run sizes are unspecified; VML placement is character/line anchored to the guide, so output-page geometry and border requirement remain UNKNOWN. Required cover pages are not yet implemented; the overall status remains FAIL/WIP pending cover representation and real-export revalidation. Citation examples remain independently documented in the audit. Caption/footnote/page-number/reference/appendix requirements remain UNKNOWN.
## Conflicts
Margins: guide text vs guide sectPr (30/30/30/25 mm); text followed.
## Engine gaps
No guide-defined block-quote first-line indent (generic body fallback is 12.5 mm). The current optional-rule audit supersedes the former numbered-heading test-gap note; see below.
Status: INTERIM FAIL. The earlier self-check missed official labeled examples and treated additive paragraph spacing as compliant. Existing cover/TOC implementation and source mapping require revalidation; the independent source audit is authoritative for the next corrections.

## Optional-rule audit (2026-10-02)
Current audit and real-export artifacts: [optional-rule audit report](../validation/aku-optional-audit/REPORT.md). The prior optional audit's characterization of the guide as prose-only and its blanket source-UNKNOWN statements are superseded: official cover and TOC examples exist and require measured extraction. No exact-conformance PASS is claimed pending those corrections and the source-backed paragraph-spacing fix.
