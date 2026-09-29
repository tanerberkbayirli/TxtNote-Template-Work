# AKÜ-FBE equation font in the PDF — targeted PASS

## Requirement

The 2020 AKÜ-FBE guide explicitly requires equations and formulas to use **Cambria Math, 12 pt** (p. 9, §2.10; repository transcription: `orchestration/artifacts/aku-fbe/source/guide_text.txt`, line 357). This note reports the equation-font check only; it is not a PASS for the whole template.

## Implementation

- System PDF-font loading now extracts a selected face from a TrueType Collection (TTC) in memory and passes a standalone SFNT program to jsPDF. Standalone TTF loading is unchanged. Synthetic two-face TTC tests verify face selection, offset restoration, and invalid-index handling.
- The Tauri system-font allowlist maps `Cambria Math` to the installed Windows `cambria.ttc`; the browser/PDF configuration selects collection face 1 and verifies its name-table identity as `Cambria Math` / `CambriaMath`. No font bytes are bundled in the repository.
- Equation styles now participate in the generic system-font request and PDF drawing path. Cambria Math has one regular face, so requests for its bold/italic KaTeX tokens select that registered face instead of failing.
- KaTeX exposes `\mathbb{R}` as a plain text `R` inside a `.mathbb` span. The PDF path maps that semantic span to Unicode double-struck characters, preserving `ℝ` in the embedded Cambria Math output. Baseline placement continues to use the original browser font metrics while the selected Cambria face draws the glyph.

## Real-export evidence

Validation used the repository's `orchestration/tools/export.mjs` with installed Chrome, local-font permission, and the full deterministic AKÜ-FBE master fixture. Its equation was set to `x \in \mathbb{R} \Rightarrow \forall x` to exercise previously missing symbols; the resulting export used the editor's paged layout, reported 40 sheets, no template fallback, and no export errors (`orchestration/validation/aku-fbe/attempt-5-equation-repro/cambria-font-export/aku-fbe-master.layout.json`).

Inspection of the generated PDF found an embedded subset whose internal font identity is `Cambria Math` / `CambriaMath`, fsType `0x0008`, 96,300 bytes. PDF.js with system fonts disabled extracts the equation as `x ∈ ℝ ⇒ ∀x` from page 21, in a 12 pt text run. PDFium rendering confirms the `R` is visibly double-struck, rather than a plain `R`.

The equation baseline remains source-grid aligned after Cambria Math is selected: on page 21 the previous text baseline is 290.3585 pt, the equation baseline is 248.9562 pt, and the next text baseline is 207.5655 pt. The two measured gaps are **41.402 pt** and **41.391 pt**, both within the existing 41.4 ±0.2 pt check.

## Regression checks

- Real MCBÜ master export: 34 sheets, paged layout active, no fallback or errors; embedded Times New Roman faces remain present.
- Real DEMO A master export: 24 sheets, paged layout active, no fallback or errors; bundled Tinos faces remain present.
- Relevant Node tests and the frontend build are run in the current validation turn; Rust `cargo check` covers the Tauri system-font allowlist.

## Scope and limits

**PASS** is limited to the installed Cambria Math face, 12 pt size, text extraction/rendering of `∈`, `ℝ`, `⇒`, and `∀`, and the measured equation gaps in this real export. Broader math-glyph coverage and constructs rendered by KaTeX as SVG or overlays remain unverified. Export still depends on the licensed Cambria Math collection being installed and accessible on the user's system; the repository does not distribute it.
