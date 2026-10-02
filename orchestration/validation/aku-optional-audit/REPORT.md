# AKÜ optional-rule source audit

Date: 2026-10-02
Scope: optional heading/numbering, caption, bibliography, and header/footer rules in `aku-isg.js`, `aku-felsefe.js` (thesis and seminar), and `aku-sosyoloji.js`. Localized edits were made to the four target templates, their specs and prior reports, plus `engineDefaults.js` and focused tests for a generic missing-position default. No registry or unrelated template files were edited.

## Findings and template decisions

### Felsefe lisans thesis and seminar

Sources: the official 2019 guides `AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx` and `AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx` in `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/`. Correction: these are not prose-only. The thesis guide contains labeled VML cover examples at paragraph 130 and a TOC example at paragraph 131; the seminar guide contains a labeled VML cover example at paragraph 124. Both include detailed citation examples. Paragraphs 63–64 of the thesis guide and 56–57 of the seminar guide state APA in-text citation and alphabetic `KAYNAKÇA`. Independent extraction of cover content/geometry, TOC hierarchy, and citation examples is pending; prior blanket UNKNOWN claims are superseded until evidence is measured.

- Removed the decimal heading configuration. Heading typography and numbering remain UNKNOWN; engine defaults now supply generic heading styles.
- Removed university-level table/figure rules. Caption wording, position, style, and numbering remain UNKNOWN; engine defaults supply their generic behavior.
- Kept `KAYNAKÇA` heading and author-year citation metadata, while omitting bibliography typography.
- Replaced header/footer heights and distances with empty objects. Generated DOCX uses generic engine distances (12.51 mm after twip conversion); this is UNKNOWN/unscored, not an AKÜ requirement.
- The schema currently uses `[1, 2, 3]`; its depth is not source-verified. A labeled TOC example exists at thesis-guide paragraph 131, so depth must remain unasserted pending independent measurement rather than being characterized as unspecified by the guide.

Explicit page-number location/format and APA author-year/alphabetical `KAYNAKÇA` remain supported and retained. The official cover/TOC and detailed citation examples need measured source extraction; caption/footnote typography, page-number size, reference-list typography/indents, and appendix layout remain UNKNOWN unless separately specified.

These Felsefe source corrections reopen the earlier self-check PASS framing. The existing thesis/seminar exports fail source-backed paragraph-spacing semantics (the implemented additive compensation emits before/after 12/6 pt where the guide's 6/6 pt settings are subject to Word's collapse behavior); and the official cover/TOC examples were omitted from the earlier extraction. This report does not certify the Felsefe targets as compliant.

### FBE İş Güvenliği tezsiz dönem projesi

Source: AKÜ’s official 2022 `.doc` template, `AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc`, plus its existing Word-converted source XML and PDF under `orchestration/artifacts/aku-isg-tezsiz-proje/source/`.

- Retained measured H1–H3 headings and numbering from the actual body examples; the H1 body/style conflict and inferred H4 instruction-plan rule remain documented in the source notes.
- Kept the inferred labels `Çizelge` / `Şekil` from `ÇİZELGELER DİZİNİ` / `ŞEKİLLER DİZİNİ`. Removed caption style and numbering overrides. The template omits caption positions; `withEngineDefaults()` now fills the reusable generic above/below behavior for partial rules. The source has no caption paragraphs, so position/style/numbering remain UNKNOWN.
- Retained the measured bibliography format and author-year citations from the source entries.
- Removed unsupported header/footer heights. Header distance remains 12.5 mm from sectPr (709 twips). Footer distance remains 17.4 mm as the prior measured baseline model, which includes the trailing empty footer paragraph. The source sectPr itself says 12.5 mm; this structure-vs-effective-baseline mapping remains an INFERRED/CONFLICT item for the separate Word-render owner to confirm. Footer height is UNKNOWN.

### Sosyoloji lisans thesis

Source: the official AKÜ 2022 DOCX `AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx` in `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/`; its formatted examples are embedded drawing/text-box content.

- Retained source-supported heading hierarchy/numbering evidence from Ek-3, with the existing note that body heading styling is inferred from TOC rows and spacing is unknown.
- Resolved the table-list title as `TABLOLAR DİZİNİ` for the generated list page: Ek-4’s actual dedicated list page says this. Counter-evidence remains: prose paragraph 45 and the Ek-3 TOC row say `TABLOLAR LİSTESİ`. The generated export also uses the section title in the TOC row; separating those two labels is not supported by the current template mechanism. The conflict and specificity rationale are in the template source notes.
- Kept caption labels `Tablo` / `Şekil` and the default number pattern as INFERRED from Ek-4/Ek-5 list rows (`Tablo 1.` / `Şekil 1.`); no caption paragraphs were found. Removed caption alignment, weight, size, spacing, table cell styling, and custom numbering configuration. Caption position is now omitted in the template and supplied by the generic engine default; caption typography/position remain UNKNOWN as university rules.
- Kept the explicit `KAYNAKÇA` and author-year metadata; removed bibliography-specific typography. Source examples establish alphabetic author-year references but not list-entry typography.
- Replaced the guide document’s own header/footer measurements with empty objects. Thesis header/footer geometry is UNKNOWN; output reflects generic engine defaults and is unscored.

## Generic capability and export-readiness investigation

A partial caption rule may now omit `position`; the generic defaults fill tables=`above` and figures=`below`. Explicit invalid values (for example `top`) remain invalid, and complete rules retain object identity. Focused tests cover all three behaviors. ISG and Sosyoloji now omit these unsupported position keys.

A comparison against the original audit export was confounded: its saved layout was produced at 18:50:37 local, while the current Sosyoloji template file was written at 19:03:33. Therefore the original-vs-new PDF differences cannot be attributed to the generic caption-position default. For the exact current fixture and template, `withEngineDefaults()` deep-equals the explicit tables=`above` / figures=`below` variant, and `compileThesisDocument()` produces deep-equal models (12 sections, no warnings/errors).

Two real editor exports of that same current fixture (`aku-sosyoloji-default-position.{pdf,docx}` and `aku-sosyoloji-default-position-rerun.{pdf,docx}`) exposed an export-readiness/cache race. Both layout snapshots report 35 pages, `pagedLayout: true`, no template notice, warnings, or errors. The first DOCX has 33/33 cached `PAGEREF` result texts blank; the rerun has 0/33 blank. The paired browser PDFs omit versus populate TOC/list page labels. Thus stable snapshot equality alone does not establish generated-index readiness. Two separate 12-second probes found fonts loaded (including Times New Roman) and identical body-text geometry signatures (`9c1652d16b6e10276bf6280c0d0da08faa0d3e98d5b9d87a2af3ad2f10dc8316`), ruling out a detected font/body-flow change as the cause.

The three DOCX files were opened read-only in Word, repaginated, had fields updated twice, and were exported as PDFs: `aku-sosyoloji-word-refresh.pdf`, `aku-sosyoloji-default-position-word-refresh.pdf`, and `aku-sosyoloji-default-position-rerun-word-refresh.pdf`. All three Word PDFs are 38 pages and identical in measured content: 1,131 normalized meaningful text items matched per page, 0 moved, maximum x/y drift 0.000 mm, and all 36 detected page-number labels match. The dedicated list title on page 6 has bbox x0=93.151 mm, x1=131.873 mm, center=112.512 mm, top=48.934 mm in all three. This confirms Word field refresh resolves the differing browser caches and that old/new/rerun Word-rendered geometry matches; it does not validate UNKNOWN university-specific geometry.

The defect was that the editor fixed-point loop considered signature equality settled before proving that React had committed the matching index/footnote state. The generic fix now ties readiness to an invalidation epoch, verifies the committed state and actual rendered page-number spans against the measured map on two later frames, and gates PDF, DOCX, and print capture. Visible generated-index targets must have a map entry; intentionally blank labels remain valid when expected, and targets with page-number display disabled are excluded. Source/model, zoom, font/load, and settled-flow changes invalidate readiness; the existing iteration cap presents an actionable warning and blocks output. Non-paged engines retain the fallback path. The real-export harness waits on editor readiness and checks target coverage plus rendered labels instead of relying on timed snapshot stability.

## Current repeat exports after readiness fix

The exact saved fixture `aku-sosyoloji.fixture.json` was exported twice through the real editor pipeline to `aku-sosyoloji-readiness-1.{pdf,docx}` and `aku-sosyoloji-readiness-rerun.{pdf,docx}`. Both reported `pagedLayout: true`, 35 sheets, 33 visible generated-index page targets, no missing targets, no label mismatches, and no warnings/errors. The layout JSON preserves top-level `pagedLayout` and `sheets` fields and adds the pagination readiness evidence.

Structural verification in `verify-readiness-exports.py` found 33 `PAGEREF` fields in each DOCX, zero blank cached values, and a cached-label multiset matching the 33 measured target labels; both DOCX files had 12 section-property records with matching page/margin structures. The two PDFs each contain 35 A4 pages; all page dimensions and all 4,162 extracted text/position/font-size records match exactly between runs, and extracted page text is identical. This repeat establishes reproducibility for this fixture and confirms populated export-time field caches. It does not claim actual Word rendering or university compliance for UNKNOWN formatting.

## Real export and structural checks

The real TxtNote editor export harness (`make-fixture.mjs` → `export.mjs`) produced PDF and DOCX files for all four template IDs. Each initial export layout reports `pagedLayout: true`, no template fallback, no validation warnings, and no runtime errors. Word field refresh was performed on the three Sosyoloji export variants described above; the current repeat export also confirms browser-side generated-index readiness and populated cached labels.

- Felsefe lisans: `orchestration/validation/aku-optional-audit/aku-felsefe-lisans.pdf` / `.docx`; 31 PDF pages.
- Felsefe seminar: `orchestration/validation/aku-optional-audit/aku-felsefe-seminer.pdf` / `.docx`; 29 PDF pages.
- ISG project: `orchestration/validation/aku-optional-audit/aku-isg.pdf` / `.docx`; 34 PDF pages.
- Sosyoloji thesis: `orchestration/validation/aku-optional-audit/aku-sosyoloji.pdf` / `.docx`; 35 PDF pages. The engine-default re-export is `aku-sosyoloji-default-position.pdf` / `.docx` in the same directory.

All generated PDFs measure 210 × 297 mm. PDF text-resource inspection reports `TimesNewRomanPSMT` and `TimesNewRomanPS-BoldMT` on Felsefe thesis/seminar and ISG exports; the Sosyoloji dedicated-list title uses `TimesNewRomanPS-BoldMT` (first-page resource sample). Generated DOCX section XML measures A4 throughout. Sample section margins, ordered top/bottom/left/right, are: Felsefe thesis 30/30/35/20 mm; Felsefe seminar 30/30/30/20 mm; ISG cover 30/30/40/25 mm, front 25/25/30/30 mm, body 30/30/30/30 mm; Sosyoloji 45/45/45/30 mm. Generic/unknown header/footer geometry is not scored as source compliance.

Sosyoloji’s PDF shows `TABLOLAR DİZİNİ` on the dedicated table-list page (page 6, 12 pt; bbox x0=93.307, x1=131.684, center=112.496 mm, top=48.952 mm). Its generated list rows remain 11.5 pt as configured by the source-backed Ek-4 example. Felsefe and ISG caption locations visible in the exported PDFs are engine behavior only and are not scored against university requirements.

## Validation

- Targeted tests: 14 passed, 0 failed (`thesisEngineDefaults.test.js` plus the three AKÜ template suites).
- Earlier full frontend suite after the generic caption default: 612 passed, 0 failed (`npm test`).
- Real exports: all four produced PDF + DOCX; no fallback or export errors.
- Status: source-backed template cleanup and automated tests PASS for this audit stage; the generic export-readiness fix passes focused/full tests and two identical real Sosyoloji exports with complete measured page-map targets and populated DOCX fields. The Word-refreshed Sosyoloji comparison also remains identical across old/new/rerun DOCX outputs. UNKNOWN fields remain unscored; no exact-conformance PASS is claimed for them. ISG independent verification subsequently confirmed footer structure and cover-pagination FAILs in `orchestration/validation/aku-isg-independent-2/REPORT.md`; source fixes remain pending. The Felsefe targets are explicitly INTERIM FAIL: independent source extraction is now available in `orchestration/validation/aku-felsefe-independent-2/REPORT.md`; source-backed implementation corrections and Word revalidation remain pending outside this readiness stage.
- Full frontend suite after readiness changes: 615 passed, 0 failed (`npm test`); production Vite build succeeded with the existing module externalization/chunk-size warnings.

## Artifacts

Everything is under `orchestration/validation/aku-optional-audit/`: `REPORT.md`; original audit fixtures/layouts and four original PDF/DOCX pairs; the current/rerun `aku-sosyoloji-default-position` PDF/DOCX/layout exports; three `*-word-refresh.pdf` files; the two post-fix `aku-sosyoloji-readiness-*` PDF/DOCX/layout export sets; and `verify-readiness-exports.py`. Updated specs and prior reports align with the DİZİNİ page-specific decision while preserving the para 45/Ek-3 LİSTESİ counter-evidence. The audit marks the Sosyoloji index-row caption pattern INFERRED because no caption paragraphs were found.
