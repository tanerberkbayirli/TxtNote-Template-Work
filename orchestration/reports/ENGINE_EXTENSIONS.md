# Engine extensions (generic, opt-in, backward compatible)

Every capability below is required by at least one reviewed spec (target ids in brackets). Each is
generic data in `schema.d.ts`, interpreted by the engine/editor CSS (the layout PDF reads the
editor DOM, so it follows automatically) and by the DOCX writer. Templates that do not use a key
are unchanged; MCBÜ v1 and generic/demo templates keep their behaviour.

## Done
| id | capability | key | required by |
|---|---|---|---|
| F1 | genuine system fonts embedded for official templates | `model.systemFonts` (derived) | all |
| W1 | Word line placement (first baseline = top + lineGap + ascent) | `typography.lineSpacing.baseline: "word"` | all AKU (measured on guides) |
| W2 | Word-additive paragraph spacing | `typography.lineSpacing.paragraphSpacing: "additive"` | aku-sbe, aku-cografya-lisans |

## Batch A (typography / captions / pages)
| id | capability | key | required by |
|---|---|---|---|
| A1 | page-number typography | `page.numbering.style: { fontFamily, fontSizePt }` | fbe, mbg, cografya |
| A2 | caption label format, label style, hanging indent | `CaptionRule.labelFormat` (`"{label} {number}"`), `labelStyle`, `hangingIndent: "label" \| mm` | all |
| A3 | three-rule tables, header style | `tables.borders: { preset: "grid" \| "threeRule" \| "none", widthPt }` | fbe, mbg |
| A4 | numbered section title (bibliography as next chapter) | `section.titleNumbering: "continueH1"` | fbe, mbg, cografya |
| A5 | inline bold runs in special-page text | `**bold**` in text/metadata `value/prefix/suffix` when block `markup: "inline"` | fbe, sagbil, mbg |
| A6 | hanging indent in any TextStyle | `TextStyle.hangingIndentMm` | fbe, sagbil, sbe, mbg |
| A7 | bordered special-page group | `group.border: { style: "single" \| "double" \| "thickThin", widthPt, paddingMm }` | fbe |
| A8 | text colour | `TextStyle.color` (#rrggbb) | fbe |
| A9 | derived page counts | `derived: "frontLastLabel" \| "mainPageCount"` | fbe, mbg |
| A10 | tab stops for editable paragraphs | `TextStyle.tabStopMm` (CSS tab-size / DOCX tab) | cografya, fbe |
| A11 | generated index per-level styles, label style, hanging | `generatedIndex.levelStyles`, `labelStyle`, `hanging: "label"` | sbe, sagbil, fbe, mbg |
| A12 | first paragraph after a heading | `typography.paragraph.firstAfterHeading` | sagbil |
| A13 | special page vertical anchoring | `section.verticalAlign: "top" \| "bottom"` | sagbil |

## Batch B (structures)
| id | capability | key | required by |
|---|---|---|---|
| B1 | additional caption kinds with their own counter and list (e.g. Resim) | `captionKinds: { photo: CaptionRule }`, figure `data-caption-kind`, `generatedIndex.kind: "photo"` | sbe, fbe, mbg |
| B2 | continuation caption on split tables | `CaptionRule.continuation: { format: "{label} {number} (Devam) {title}" }` | fbe, cografya, mbg, sagbil |
| B3 | equation numbering | `equations: { numbering: { scope, format }, numberAlign: "right" }` | fbe, mbg |
| B4 | ordinal chapter label on its own line | `HeadingRule.numbering.sequence: "ordinal-tr-upper"`, `numbering.placement: "ownLine"` | sbe |
| B5 | continuous footnote numbering | `footnotes.numbering: "document"` | sbe |
| B6 | lists shown only with ≥ n items | `visibleWhen: { count: "tables", gte: 3 }` | sbe |
| B7 | named paragraph styles (table note, block quote) | `typography.paragraphStyles` | fbe, mbg, cografya, sbe |

## Not engine work (documented per target)
- Author choices (font 10–14 pt, table label) [sagbil]: implemented as the documented default; choice UI is a product feature, not a formatting rule.
- Landscape pages [fbe, cografya]: conditional rule ("if used"); TxtNote has no landscape page — documented limitation.
- Printing (duplex, spiral binding, paper weight, copies) [all]: physical production, recorded in `source.notes`.
- Case of H1/H2 with lower-case "ve/veya/ile": author-typed, `textTransform: "none"`.
