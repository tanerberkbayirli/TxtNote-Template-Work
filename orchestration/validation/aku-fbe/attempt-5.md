# AKÜ-FBE — independent validation attempt 5

**Overall result: FAIL.** The ordinary master and doctoral PDFs pass the rechecked geometry and equation/font requirements, but both exported DOCX files fail the source-backed universal section-margin requirement. Both 89-character adversarial fixtures also fail PDF pagination: the cover date is stranded on its own page and the approval page's final line is stranded on another page. The title-length/capacity rule remains **UNKNOWN**; no character limit or compaction rule was found in the official sources or on the current FBE site.

## Scope and method

- Repository checkpoint: `86c258b` (`thesis(aku-fbe): align page bounds and native math exports`), branch `codex-work`.
- No production files were edited. Fresh fixtures for `aku-fbe-master-tr-v1` and `aku-fbe-phd-tr-v1` were exported through `orchestration/tools/export.mjs`, which seeds the actual TxtNote thesis editor and invokes its PDF and Word export buttons. The outputs are in the task-local temporary folder `C:\Users\CASPER\AppData\Local\Temp\aku-fbe-attempt5`.
- PDF positions were independently extracted from the real PDFs with `pdfjs-dist`; representative normal and long-title pages (covers, approval, equation/body, and footnote) were rendered to PNG and visually inspected. DOCX section properties and equation markup were inspected from the ZIP/XML. The PDF results below are from generated output, not the editor preview.
- The official evidence was compared with `orchestration/specs/aku-fbe.json`, the guide PDF, and the 2025 template DOCX/XML. Source template `sectPr#1..#4` has 1701 twips on all four sides in every section. The guide specifies 30 mm page-edge margins (p.5 §2.3), 12 pt Cambria Math for equations (p.9 §2.10), and the outer-cover print area x=55–155 mm, y=210–275 mm (p.32).
- The official FBE site still lists the thesis guide and Word template; its thesis-completion page emphasizes checking the approval-page format, but the official material found gives no long-title length, scaling, or line-break rule: [FBE thesis resources](https://fenbil.aku.edu.tr/hizmet-standardi-tablolari/), [FBE thesis completion process](https://fenbil.aku.edu.tr/tez-bitirme-asamasinda-yapilmasi-gereken-islemler/), [2020 thesis guide PDF](https://fenbil.aku.edu.tr/wp-content/uploads/sites/115/2019/12/FBE-Tez-Yaz%C4%B1m-Kilavuzu-2020_WEB_i%C3%A7in-2-1.pdf).

## Ordinary fixtures

| Variant | PDF | DOCX | PDF pages | Result |
|---|---|---|---:|---|
| Master | PASS on checks below | FAIL: section margins | 39 | Overall FAIL |
| PhD | PASS on checks below | FAIL: section margins | 39 | Overall FAIL |

Normal PDF evidence:

- Page size is 210.000 × 297.000 mm. Four front pages are unnumbered, then Roman i–ix and Arabic 1–26. Normal abstract, English abstract, acknowledgement, contents, symbols, figure/table/photo lists, body, references and appendices appear in the expected sequence.
- The measured outer-cover text box is x=56.832–153.112 mm and y=211.290–272.016 mm for both variants. This is within the explicit 55–155 × 210–275 mm print area.
- The first body baseline is y=33.949 mm; body text begins at x=29.997 mm. Long body lines end at approximately x=180 mm. Measured body type is 12 pt Times New Roman; body baseline pitch is 20.665–20.721 pt, against the source's 20.7 pt 1.5-line pitch.
- The four heading levels in the deterministic fixture are 12 pt and begin at the 30 mm text edge. Figure and table caption labels render at 11 pt, as specified. Captions, multi-page table content, footnotes, bibliography and appendix text are present in the real exports. The generated footnotes measure 10 pt; the approved spec marks the source requirement UNKNOWN, so this is reported as a measurement only.
- Normal approval content stays on physical page 3; its lowest text extent is y=257.812 mm (master) / 257.084 mm (PhD), below the 266.996 mm limit implied by A4 minus the official 30.004 mm bottom margin. Ethics is on physical page 4.
- PDF page-number baselines are at 283.534 mm, centered; the normal number sequence and starts match the source examples.
- PDF font resources include embedded `TimesNewRomanPSMT`, bold, italic and bold-italic programs. The equation resources include an embedded `/FontName /CambriaMath` with a `/FontFile2` reference. DOCX XML contains `m:oMath`/`m:oMathPara`; its equation run uses Cambria Math and `w:sz=24` (12 pt).
- The normal numbered equation on PDF p.20 has 41.402 pt before and 41.389 pt after (required 41.4 ±0.2 pt). Independent 26-chapter position sweeps for each variant contain 78 equations on 65 pages; 146 adjacent equation/body pairs were measurable per PDF. Both sweeps range from 41.389 to 41.403 pt, with zero out-of-tolerance pairs.

### DOCX section margins — FAIL

The 2025 source template and approved universal spec require 1701 twips = 30.004 mm for top, right, bottom and left. Fresh normal and long-title DOCX exports each have 22 section properties. Their first four differ as follows; the remaining 18 sections all use 1701 twips on every side.

| Output section | Top / right / bottom / left (twips) | Converted mm | Delta from source (mm) | Result |
|---:|---|---|---|---|
| 1 | 11995 / 3118 / 1247 / 3118 | 211.578 / 54.998 / 21.996 / 54.998 | +181.575 / +24.994 / −8.008 / +24.994 | FAIL |
| 2 | 1701 / 1701 / 1701 / 1701 | 30.004 / 30.004 / 30.004 / 30.004 | 0 / 0 / 0 / 0 | PASS |
| 3 | 1701 / 1763 / 1701 / 1549 | 30.004 / 31.097 / 30.004 / 27.323 | 0 / +1.094 / 0 / −2.681 | FAIL |
| 4 | 1701 / 1701 / 1701 / 1701 | 30.004 / 30.004 / 30.004 / 30.004 | 0 / 0 / 0 / 0 | PASS |

The smallest responsible path is template page-margin overrides being serialized directly into each Word `sectPr`: `aku-fbe.js` sets the outer-cover and approval frame margins; `export.js` writes `section.rules.page.margins` into DOCX section properties. The guide's cover print box and the template's approval frame position do not state that page margins may change, and the official DOCX keeps 30 mm margins while positioning those elements. PDF cover/frame placement therefore does not waive the DOCX structure failure.

## 89-character title fixtures

The exact title tested in both variants is `Dijital Okuryazarlık Düzeylerinin Çevrimiçi Öğrenme Ortamlarına Etkisinin İncelenmesi ile` (89 characters).

| Variant | PDF pages | Unnumbered pages before Roman i | Failure |
|---|---:|---:|---|
| Master long89 | 41 | 6 (expected 4) | FAIL |
| PhD long89 | 41 | 6 (expected 4) | FAIL |

Physical-page evidence is the same for both degree variants:

1. The outer cover begins on page 1. Its date `Ocak 2026` is moved to page 2, which contains only that line (x=95.767 mm, baseline y=215.524 mm). The cover block is split across two physical pages.
2. The inner cover is page 3 and the approval page is page 4. The last approval label, `Enstitü Müdürü`, is the only text on page 5 (baseline y=33.949 mm). Ethics moves to page 6, and Roman i begins on page 7.
3. The title and date glyphs that remain on page 1 individually fall within the 55–155 × 210–275 mm cover box; the failure is the split and stranded date, not an invented character-count limit. The approval text on page 4 ends at y=263.409 mm, within the 266.996 mm text-area limit, but the final label has flowed to page 5. The resulting extra unnumbered sheets are a measured pagination failure.

The official guide (including p.32 cover example and p.34 approval example), the official 2025 DOCX structure, and the official FBE pages reviewed do not state a maximum title length, prescribed wrapping, reduced font, or compact approval option. Therefore permitted title capacity and any corrective title-size rule are **UNKNOWN**. This does not change the FAIL for the actual export.

## Repeat determinism and regression

- The repeated PhD export has the same 39 pages and identical page-by-page extracted text, item order and text transforms as its first export. The raw PDF files have 62 differing bytes in five ranges; the first difference is the `/CreationDate` metadata value. DOCX package entries are byte-identical except `docProps/core.xml` timestamps. Rendered content and geometry are deterministic; byte-for-byte files are not, due to timestamps.
- Real editor regression exports: MCBÜ master 34 pages (embedded Times New Roman); MCBÜ PhD 35 pages (embedded Times New Roman); demo university A master 24 pages (embedded Tinos). They match recorded expected page counts and completed without editor/export errors.
- `npm test` and `npm run build` both exited 0 on the current checkout. The build reports a non-fatal large-chunk warning.
- Word/LibreOffice did not independently repaginate the DOCX files; DOCX results here are structural OOXML checks, while pagination findings come from the real editor PDF exports.

## Verdict and smallest failures

- **Master, ordinary fixture: FAIL** — generated DOCX sections 1 and 3 violate the explicit 30 mm all-sides page-margin rule. Its PDF checks above pass.
- **PhD, ordinary fixture: FAIL** — same DOCX section-margin deviations. Its PDF checks above pass.
- **Master, long89: FAIL** — outer-cover date spills to a separate page and the approval's final line is orphaned on another page; DOCX has the same section-margin failures.
- **PhD, long89: FAIL** — same output failures as master long89.

No progress gate is set to PASS. No commit was created.
