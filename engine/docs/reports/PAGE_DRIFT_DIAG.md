# PAGE_DRIFT_DIAG — PDF-vs-Word pagination divergence map

Method: PyMuPDF (`pymupdf`) line/span extraction over `orchestration/validation/<id>/run/<variant>.pdf`
vs `<variant>.word.pdf`; page texts normalized (whitespace-stripped) and aligned per page, TOC
dot-leader/label lines excluded for flow alignment; DOCX XML (`word/document.xml`, `footnotes.xml`)
read for the break-boundary element properties. mm = pt × 0.3528. Page indices below are 0-based
physical pages ("p.N" = 1-based).

## SHARED ROOT CAUSE (all 5 +1-page drifts)

Every drift is a **single break decision at a multi-page table**, never cumulative pitch drift.
The engine's DOCX writer emits the table caption paragraph with `<w:keepNext/><w:keepLines/>` and
(all 46 rows) `<w:cantSplit/>`, with `<w:keepNext/>` on **all 184 cell paragraphs** (4/row) —
caption→header row→every data row is one unbreakable keep-with-next chain. Word resolves the
overflowing chain by starting the table body on the page *after* the caption, leaving the caption
alone on its `pageBreakBefore` page. Our layout (Chromium-based, see `layout.json`) keeps caption +
header + 18 rows on that page. Word thereby wastes exactly one page at the table start = the +1
drift. Secondary effects inside the table (constant one-row offset, 11.8 mm) and after it
(word-wrap wobble) never grow. **Fix locus: drop `keepNext` from data-row cell paragraphs (keep the
caption→first-row bond only).**

## 1. mcbu-tip-uzmanlik (pdf 30 / word 31) — break p.16 (idx 15)

- Pages 0–14 identical (baselines within 0.1 pt). Pre-break tail both: "…çğıöşü karakterleri
  doğru görünmelidir."
- Boundary: caption "Tablo 2 Ölçek maddelerine ilişkin betimsel istatistikler (çok sayfalı tablo)"
  at y=85.4/85.5 in BOTH. Our page continues "Değişken | Grup | f | %" (y=115.9) + "Madde 1…18";
  Word's page = caption + footer "12" only (2 lines); "Değişken … Madde 1…" starts Word p.17.
- Nature: **single break**. Content then constant +1 shift; body pages resume exact shifted
  equality at idx 26,27,28,29 (only footer labels differ on idx 28: "25" vs "26").
- Deltas: row pitch 33.4 pt (11.79 mm) in both; same rows sit one pitch (11.8 mm) apart across the
  shift; matched rows per page ours 18/19/8 vs Word 19/19/7 (Word's table page 1 has no caption
  overhead → +1 row); post-table paragraph baselines agree to 0.2 pt (0.07 mm).
- Hypothesis: keepNext-chain on the whole table (XML verified for this target) → Word isolates the
  caption. TOC field numbers already differ at idx 3 ("…IX. KAYNAKLAR 26" vs "27") — a derived
  artifact of Word updating fields to its own pagination, not an early body divergence.

## 2. aku-isg-tezsiz-proje (pdf 33 / word 34) — break p.22 (idx 21)

- Same signature: caption "Çizelge 2. Ölçek maddelerine ilişkin betimsel istatistikler (çok
  sayfalı tablo)" at y=85.5 both; ours flows "Değişken | Grup | f | %" + "Madde 1…" on the same
  page, Word leaves caption + footer "11" alone, table starts next page ("Değişken … Madde 1").
- Rows: ours 18/19/8 vs Word 19/19/7 over 3 pages each; one-row (≈11.8 mm) constant offset inside
  the table; **single break**, constant +1 afterwards (pages idx 29–32 body-identical modulo
  footer "19/20/21/22" vs "20/21/22/23").
- Boundary row baselines: ours first row y=149.3 vs Word y=125.7 on its table page (Δ8.3 mm =
  the caption line Word's page doesn't carry). Nature/hypothesis: as shared root cause.

## 3. aku-felsefe-lisans (pdf 30 / word 31) — break p.17 (idx 16)

- Caption "Tablo 2. Ölçek maddelerine ilişkin betimsel istatistikler (çok sayfalı tablo)" y=85.5
  both; ours → "Değişken | Grup | f | %" + "Madde 1…"; Word page = caption + footer "15" only.
- **Single break**, constant +1 shift; rows ours 18/19/8 vs Word 19/19/7. Post-shift line deltas:
  median −23.5→−41.3 pt inside the table region (one-row-pitch offset plus header row), ≈0.2 pt
  after it.
- Extra parity noise on this fixture: footnote-ref marks (see §7) — "(Karasar, 2020, s. 45)¹…⁵" in
  our PDF vs "²…⁶" in Word on the same five passages.
- Hypothesis: shared keepNext-chain root cause (same caption/row XML shape).

## 4. aku-felsefe-seminer (pdf 27 / word 28) — break p.14 (idx 13)

- Caption "Tablo 2. Ölçek maddelerine ilişkin betimsel istatistikler (çok sayfalı tablo)" y=85.5
  both; ours flows rows (Madde 1–18) on the same page; Word page = caption + footer "13" only,
  "Değişken … Madde 1" on its p.15.
- **Single break**, constant +1 afterwards; rows ours 18/19/8 vs Word 19/19/7; exact body equality
  resumes near the end (idx 25 body-identical modulo footer "22" vs "23").
- Same footnote-ref ±1 noise ("45)⁵" ours vs "45)⁶" Word). Hypothesis: shared root cause.

## 5. afsu-lee default (pdf 37 / word 38) — break p.25 (idx 24)

- Caption "Tablo 4.1. Ölçek maddelerine ilişkin betimsel istatistikler (çok sayfalı tablo)"
  y=71.4/71.3 both; Word page = caption + footer "13" only (2 lines); ours flows "Değişken | Grup |
  f | %" + "Madde 1…27" on the same page. Word rows: 27 + 18 on the next two pages (identical split
  and pitch to ours — only the caption page is wasted).
- **Single break**; constant +1 after (idx 33–35 body-identical modulo footers "22/23/24" vs
  "23/24/25"). Residual: end-page wrap wobble ("İletişim (Telefon / e-posta) : 0 555 …" vs Word's
  earlier break "İletişim (Telefon / e-posta)"), and the cover title run wraps in Word as
  "…Dijital / İ" + "ncelenmesi…" (cosmetic).
- Hypothesis: shared root cause.

## 6. afsu-lee phd (38/38, label sequences diverge) — two compensating one-page effects

Labels (footer spans): ours `1`(p.1), none p.2–6, `i..vii` p.7–13, `1..25` p.14–38; Word `1`(p.1),
none p.2–5, `i..vii` p.6–12, `1..26` p.13–38. **First divergence p.6 (idx 5):** Word prints `i`
(ÖZET already on that page) while ours prints nothing (that page is TEŞEKKÜR, label omitted).
Label RULES agree everywhere (same hidden blocks — cover shows "1", TEŞEKKÜR/KABUL spill unlabeled,
ÖZET starts `i`); the sequences differ only because content↔page mapping shifts:

- Effect A (ours +1 page in front matter, idx 3–4): on "KABUL VE ONAY" our engine wraps the quoted
  thesis title run one line wider than Word — our block = 6 lines vs Word's 5 ("…Öğretim
  Programında dokt" / "olarak kabul edilmiştir." vs Word's single line "…doktora tezi olarak
  kabul edilmişti"). The extra line (20.7 pt = 7.3 mm) pushes the block's last line "Enstitü
  Müdürü" ALONE onto idx 4 (1-line page at y=71.4); Word keeps "Prof. Dr. Ahmet YILDIZ" +
  "Enstitü Müdürü" (y=720/740) on one page. Everything after is one page earlier in Word.
- Effect B (Word +1 page in body, idx 24): the shared multi-page-table break — Word idx 24 =
  caption "Tablo 2.1. Katılımcıların demografik özellikleri…(çok sayfalı tablo)" + label `13`
  only; table rows (27 + 18) land on idx 25–26 in BOTH renders. This cancels Effect A ⇒ equal 38
  pages, different labels.
- Consequence: same post-table content on the same physical pages prints label one lower in ours
  (e.g. p.38: `25` vs `26`). **Not** an `omitOnChapterStart`/`indexLabelWhenHidden` logic bug.
- Hypothesis: Effect B = shared keepNext-chain; Effect A = our text measurement of the quoted
  (likely differently-styled) title run is wider than Word's → one extra wrapped line + a
  keep-together/spill decision on "Enstitü Müdürü".

## 7. Secondary finding: footnote-ref numbering (aku-felsefe-lisans, -seminer; any fn fixture)

DOCX has one footnote stream (ids 1..6: "Giriş dipnotu." + "Açıklama dipnotu 1..5"). Word numbers
all refs sequentially: marks 1..6 (superscript 8.04 pt). Our PDF prints 1 at the giriş footnote and
then **restarts** at 1 for the açıklama series: marks 1,1,2,3,4,5 (superscript 9.0 pt), and the
footnote-area markers shift too (ours "2" on p.12 vs Word's "3"). Not a page-count cause (single
digits only) but a real PDF↔DOCX parity divergence on every footnote-bearing target.

## Classification summary

| case | first divergent page | nature | delta at break |
|---|---|---|---|
| mcbu-tip-uzmanlik | p.16 (table caption) | single break | 1 empty caption page (Word) ≈ 715 pt (252 mm) wasted |
| aku-isg-tezsiz-proje | p.22 (table caption) | single break | same |
| aku-felsefe-lisans | p.17 (table caption) | single break | same (+ fn-ref ±1 noise) |
| aku-felsefe-seminer | p.14 (table caption) | single break | same (+ fn-ref ±1 noise) |
| afsu-lee default | p.25 (table caption) | single break | same |
| afsu-lee phd | p.6 labels (origins p.4 + p.25) | 2× single break (compensating) | 7.3 mm extra line (KABUL) + 1 caption page (table) |

No case shows cumulative per-page pitch drift: pre-break baselines match to ≤0.1 pt (0.03 mm),
table row pitch is 33.4 pt (11.79 mm) in both renders, and after the shift, aligned lines match to
≤0.2 pt (0.07 mm); all residual mismatches are word-wrap wobble at line ends (e.g. "…kara /
doğru görünmelidir." vs "…kara / görünmelidir.") and the footnote-ref digits.
