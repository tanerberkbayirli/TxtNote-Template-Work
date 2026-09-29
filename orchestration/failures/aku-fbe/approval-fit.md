# aku-fbe: approval page with a long title (LIMITATION / NOT_SPECIFIED, no code change)

Raised by the validator in attempts 2 and 3 (B6-approval-fit-realistic-title): with a title of about 89 characters or more the approval
sentence needs 6 lines and the frame ends at about 270 mm, below the 267 mm body margin (297 - 30).

## Requirement
- The guide's Tez Onay Sayfası and the template's own approval page fix the frame at a top of 189.0 mm and give every element a fixed
  height: title paragraph, approval sentence, advisor line, one 14.29 mm juror row per member, then the frame's closing lines. Nothing in
  the guide, the template file or the samples states a shorter pitch, fewer blank lines or a smaller font when the sentence needs more lines.
- The sentence quotes the whole thesis title, so its length is the student's content, not a template value. The guide's own example title is 3 lines.
- The template gives this section its own page margins (`aku-fbe.js`: `bottomMm: 12`, `numbering: { enabled: false }`), i.e. the approval page
  has no 267 mm bottom margin to violate: its frame may run down to 285 mm. The DOCX therefore keeps the frame on the page, and the editor/PDF do too.

## Evidence (real exports of `make-fixture.mjs` documents with only the title changed; text bottom = lowest glyph, frame = lowest drawn stroke)
| title chars | sentence lines | master text / frame bottom | PhD (default jury) text / frame bottom |
|---|---|---|---|
| 71 (default) | 5 | 258.73 / 262.82 mm | 258.00 / 262.09 mm |
| 88-89 | 6 | 266.03 / 270.12 mm | 265.30 / 269.39 mm |
| 97 | 6 | 266.03 / 270.12 mm | 265.30 / 269.39 mm |
| 150-151 | 6 | 266.03 / 270.12 mm | 265.30 / 269.39 mm |
The validator measured 269.99 / 269.26 mm (89 chars) with its own stroke-edge rule; text bottoms 266.03 / 265.30 mm agree. Every text baseline
stays above 267 mm (the section's own bottom margin is 12 mm); only the frame's bottom stroke and its bottom padding go beyond it. 7 jurors with 97-151 characters: 269.4 / 270.1 mm.

## Why no compaction
Any compaction (shorter juror pitch, dropped blank lines, smaller row height) would be an invented rule: the source shows no compacted variant, and
the same fixed layout in Word gives the same 270 mm frame. Changing measured spacing to hit a limit the section does not have would move the page
away from the guide for the 71-char case as well.

## Status
The validator's table must report this as NOT_SPECIFIED / LIMITATION, not PASS and not FAIL. It is recorded in the template's `source.notes`.
