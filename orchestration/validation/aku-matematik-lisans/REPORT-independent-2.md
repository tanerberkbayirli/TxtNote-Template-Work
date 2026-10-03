# Independent validation 2 - aku-matematik-lisans (aku-matematik-lisans-tr-v1)
Verdict: **FAIL** (2 FAIL groups). Fresh export at ca8b929 (tree HEAD 51e8a33), real editor PDF+DOCX, own Word instance (PID 14472 / 6836, Quit in finally); official docx also Word-rendered. Data: independent-2.json; renders: render/indep2/.

Independent-1 FAILs resolved: TC fields (Word order and page numbers correct), full-page capacity (32 slots to 260.28), list entry gap (6.98).

## FAILs
| id | expected | actual | delta | locator | component |
|---|---|---|---|---|---|
| lists.entry.spacing | template XML line=360, after=0: 7.30 mm per line incl. wrapped lines (user precedence XML > prose) | single + 6 pt after: entry gap 6.98, wrapped-line pitch 4.87 | -2.43 mm on continuation lines (-0.32 entry gap) | mat.pdf p7 Sekil 3.1; official.word.pdf p7-8; spec conflict "Sekil/Cizelge/Resim listesi paragraf ayari" ruled for prose | template lists paragraph spec |
| symbols.table | official table: text x0 31.97, 3 bottom rules (header cells, last row), blank row between Simgeler/Kisaltmalar | x0 30.00, no rules, no gap | -1.97 mm; rules missing | mat.pdf/mat.word.pdf p6; official.word.pdf p6 | template/engine listOfAbbreviations (template comment: deliberately omitted) |

## Other
PASS: page size, genuine TNR + Cambria Math, margins, pitch 7.30, gaps 14.6, covers (0.05 mm), acknowledgement, TOC (35/35 labels), headings, tables incl. multi-page (Devam) + header repeat, bibliography, DOCX sections/numbering, Word render order/labels. Page number baseline 283.53 vs 283.8 (-0.27, tight).
INFO/UNKNOWN (non-blocking): multi-line title spacing, table row height/cell size, footnote size, appendices/CV, H2-H4 caps, list hanging for Cizelge/Resim (official 21 mm vs label width).
Blocking CONFLICT: list paragraph conflict was ruled opposite to the user's XML-over-prose precedence.
