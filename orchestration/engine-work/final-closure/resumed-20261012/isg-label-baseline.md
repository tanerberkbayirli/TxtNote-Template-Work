# ISG page-label baseline audit — 12 October 2026

The original converted template `source/isg.pdf` has16physical pages, two unprinted pages, Roman ii..ix and Arabic1..6. It contains no requirement for a fixture to end at22. The check itself attributes the terminal label to a measured fixture page count. Its old literal expected list has33labels while its locator says34pages; neither is source template numbering prose.

For the unchanged fixture SHA256 `6be672c62084c48b67d7646fb43a01e961aa42a056470d10fb5669d067dfc195`, both current editor PDF and independent real Word PDF have32physical pages: none×2, ii..x,1..21. The two exact check expectations were corrected to that sequence; no range matching, tolerance increase or source edit was introduced.

`isg-coverage.py/json/log` independently parses all nested source paragraphs/table cells, checks281/281complete normalized text blocks in order in generated DOCX, editor PDF and Word PDF, and separately verifies all5authored footnote bodies exactly once in each PDF. Body extraction uses actual12ptspans;9ptnote bodies and11ptPAGE footers are checked independently, avoiding inserted reference numbers/page breaks in text-flow comparisons. Normalization is documented in JSON; exact sequences, occurrence counts and terminal labels are assertions. PDF/source hashes are recorded.

The earlier79block parser reset its active paragraph at nested paragraphs and did not separate footnote markers from authored prose, causing false missing-text reports. No missing source block remains after correcting that independent audit.

Last-page renders `isg-last-default.pdf.png` and `isg-last-default.word.pdf.png` were visually reviewed: full CV content and footer21remain visible on both. This is page-label/source-coverage evidence; it does not imply all CV tab alignment is identical.
