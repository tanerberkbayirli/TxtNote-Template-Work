# aku-fbe: equation font in the PDF (LIMITATION, not PASS)

Requirement (guide p.9-10 §2.10, spec `equations.font`): equations in Cambria Math 12 pt.

What is done: the formula is 12 pt (KaTeX's 1.21 em scaling is switched off by `equations.style.fontSizePt`); the DOCX writes every equation
run and the equation number in "Cambria Math" 12 pt (`w:rFonts` ascii/hAnsi/cs/eastAsia).

What was tried for the PDF: Cambria Math ships only as part of `cambria.ttc` (TrueType collection) on Windows/macOS. The environment has no Cambria
(`fc-list` shows none), and the layout PDF embeds faces through jsPDF, which cannot embed a TTC; `systemPdfFontFamily` therefore knows only
Times New Roman and Arial (single TTF files, name-table verified). The font is licensed and must not be bundled.

Result: formula glyphs are drawn in the embedded Times New Roman (KaTeX's own faces are not embedded either); symbols that Times New Roman lacks
have look-alike aliases (U+22C5 -> U+2219, see `PDF_GLYPH_ALIASES`); the radical is drawn as the "√" glyph plus a rule and "≠" is printed as one
character. Symbols without a look-alike (∈ ⇒ ∀ ∃ ∇ ⊂ ∪ ∮ ∝) cannot be drawn. A machine with a single-file Cambria Math TTF or a jsPDF TTC path
would remove the limit; nothing in the template needs to change.
