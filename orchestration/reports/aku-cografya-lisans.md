# aku-cografya-lisans: report (template integration, 2026-10-02)

**Target:** Afyon Kocatepe Üniversitesi, Fen Edebiyat Fakültesi, Coğrafya Bölümü, lisans bitirme tezi.
**Registry id:** `aku-cografya-lisans-tr-v1` (instituteId `fef-cografya`, degreeType `undergraduate`, status `official`).
**Sources (only):** `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/`: guide PDF 2024 (23 pp., 2024-03-11) and Word template DOCX 2024 (core.xml 2024-03-31).
**Status: PASS (self-check).** 39/39 measured checks PASS on the real export; 8 guide-vs-template conflicts still need department confirmation (section 3).

## 1. Files

| file | purpose |
|---|---|
| `TxtNote/frontend/src/thesis/templates/aku-cografya.js` | template module (`akuCografyaLisans`) |
| `TxtNote/frontend/src/thesis/registry.js` | one new line (after the `aku-mbg-lisans` entry) |
| `TxtNote/frontend/src/lib/thesisAkuCografya.test.js` | 7 tests (load/validate/registry, page/body/heading values, captions, sections and numbering, lists, special pages, DOCX XML) |
| `orchestration/specs/aku-cografya-lisans.json` | spec updated with template evidence (206 rules: 126 EXPLICIT, 41 TEMPLATE, 12 MEASURED, 20 INFERRED, 7 UNKNOWN; 26 conflicts) |
| `orchestration/validation/aku-cografya-lisans/self-1/` | fixture, overrides, `cog.pdf`/`cog.docx`/`cog.layout.json`, `selfcheck.py`, `selfcheck.out.txt` |
| `orchestration/artifacts/aku-cografya-lisans/source/docx/` | `dump.txt` (every body child of the template with style, spacing, indents, sectPr), `dump.py`, `full.py`; `source/patch_spec.py` (one-off spec update) |

The two seals of the template (`word/media/image1.jpeg`, `image2.png`) are byte-identical (md5) to the files already in `templates/assets/akuMbgLogos.js`, so that module is imported (assets reused, no formatting values taken from the MBG unit).

## 2. What the template resolved (former UNKNOWN to TEMPLATE)

- **Geometry:** margins 25/30 mm are the same on every portrait section including the cover (sectPr 1418/1701 twips). Header/footer distance **12.5 mm** (708/709 twips), previously UNKNOWN. A single landscape sample page exists (sectPr 4).
- **İç Kapak = the template's first page** (there is no separate outer cover): 14 pt bold, 1.5 lines, centred; right-aligned run with the AKÜ seal (26.19 mm) and the Fen-Edebiyat seal (26.25 mm); lines AKÜ / FEN EDEBİYAT FAKÜLTESİ / COĞRAFYA BÖLÜMÜ; 4 empty lines; BİTİRME TEZİ; 3; title; 2; name; 2; Danışman / Ünvanı Adı SOYADI; 5; Yıl. Implemented as blocks.
- **Onay sayfası, Etik bildirim, ÖZET, ABSTRACT ("Graduation Thesis", "Department of Geography"), TEŞEKKÜR:** implemented line by line from the template paragraphs (14 pt bold single heading lines on the approval page, bullets with 7.5 mm hanging, grey İmza at 167.37 mm, keywords hanging 37.52 / 22.0 mm, year/pages line).
- **TOC and lists:** titles İÇİNDEKİLER DİZİNİ, SİMGELER ve KISALTMALAR DİZİNİ, ŞEKİLLER DİZİNİ, TABLOLAR DİZİNİ (centred, bold, single), "Sayfa" bold right (also on the figures list), dot leader at 149.8 mm, TOC rows 1.5 lines / 0 pt after, indents 0/0/5/10/15 mm (styles toc 1-5), list rows single with 10 pt after, front-matter titles listed with roman numbers.
- **Tables:** centred, full 0.5 pt grid, single-spaced cells. **Bibliography:** "6. KAYNAKLAR" is numbered as the next chapter; "İnternet Kaynakları" is a bold subheading with a numbered list.
- **Heading case:** H3/H4 placeholders are Title Case (INFERRED, the guide prescribes H1/H2 only).

## 3. Conflicts (all recorded in the spec; implemented value first)

1. **Paragraph first-line indent:** 12.5 mm implemented. Template: 15 of 16 sample paragraphs (708/709 twips) and the guide's own body (12.45 mm). Guide §2.4 "boşluk bırakılmadan" can be read as 0. One constant `PARA_INDENT_MM`. **Needs confirmation.**
2. **Heading spacing:** guide prose "1 satır boşluk (1,5 aralıklı)" before and after (twice) is implemented as 14.7 pt + 6 pt paragraph spacing = 20.7 pt. The template's H1 samples have only 6/6 pt. **Needs confirmation.**
3. **Table note size:** guide 11 pt implemented; the template's red note says 10 pt. **Needs confirmation.** Table cells: guide 12 pt (8 pt allowed) implemented; template 11 pt.
4. **Roman numbering:** ÖZET = i (guide and the template's cached TOC) implemented; template sectPr 2 has `start=2` (ethics would print ii, ÖZET iii). **Needs confirmation.**
5. **Abstract order:** guide order (text, keywords, year/pages) implemented; the template prints year/pages first. **Needs confirmation.**
6. **Page-number size:** guide TNR 10 pt implemented; the template footer inherits 12 pt.
7. **Caption numbering:** guide "Şekil 2.1" (chapter, no period) implemented; the template samples number document-wide with a period and are inconsistent. Label bold, text regular; continuation lines hang under the text (guide prose and template 15-17.5 mm; the guide's own p.8 example is not hanging).
8. **List of tables title:** TABLOLAR DİZİNİ (template page, §2.6, §4.1, label "Tablo") replaces the earlier review decision ÇİZELGELER DİZİNİ (only §4.2.10 and the template's stale cached TOC row). Also: symbols list tab stop vs the template's run-in entries; each list on a new page (template flows two on one page); bibliography 12 pt / 12.5 mm hanging / 6-0 pt (guide) vs template 11 pt / 5 mm / 0-0; ÖZET title 11 pt in the template (12 pt used).

## 4. Real-export measurement (`self-1/cog.pdf`, 33 pages, Chrome 154 export, embedded Times New Roman)

All values PASS (`selfcheck.out.txt`). Key rows:

| check | expected (source) | measured |
|---|---|---|
| page size | A4 210x297 mm (guide §2.1) | 210 x 297 |
| left / right text edge | 30 / 180 mm (guide §2.3) | 29.77 (glyph side bearing) / 179.995 |
| first baseline | 28.95 mm (25 mm top + 0.9335 em, Word model) | 28.951 |
| body line pitch | 20.69 pt (1.5 x 12 pt) | 20.696 |
| paragraph to paragraph | 32.69 pt (pitch + 6 + 6) | 11.534 mm = 32.70 pt |
| first-line indent | 42.5 mm (template) | 42.495 |
| H1 12 pt bold at x 30 | guide §2.8 | 12.0 bold, x0 29.997 |
| H1 / H2 to next line | 14.60 mm (empty 1.5 line + 6 pt) | 14.602 / 14.601 |
| page number | TNR 10 pt, centred, baseline 283.5 mm (footer 12.5 mm) | 10.0, 104.995, 283.534 |
| labels | pp.1-3 blank; i-viii; 1-22 | exactly |
| cover | 14 pt bold centred, 2 seals 26.19 mm, top 25.0, right edge 180.0 | 14.0 bold, 2 x 26.19, 24.999, 179.999 |
| captions | 11 pt, label bold; "Tablo 4.1 (Devamı)" on the continuation page | 11.0 bold, found on page 25 |
| bibliography | hanging 42.5 mm; entry pitch 19.79 pt | 42.495; 19.791 |
| fonts | genuine Times New Roman only | TimesNewRomanPSMT / -BoldMT / -ItalicMT, embedded family "Times New Roman" |
| DOCX | pgMar 1417/1701/1417/1701, header/footer 709; fonts TNR; footer 10 pt | exactly |

Not measured: the template was not rendered (LibreOffice produces no PDF from this DOCX), so cover and special-page y positions are checked against the template's XML structure (line counts, spacings) and not against a Word render.

## 5. UNKNOWN / not generated

- **Dış Kapak:** no sample in either source (the template's first page is the inner cover); not generated.
- Footnote typography (TNR 12 pt from the global rule is INFERRED, line height is the engine default), equation numbering/style (engine default), EKLER heading typography, binding type, abstract word limit.
- ÖZGEÇMİŞ and RESİMLER DİZİNİ (only in the template's stale cached TOC and not in guide §4.1): not generated.
- Whether the unnumbered pages count in the numbering.

## 6. Engine gaps (no engine code was changed)

1. **Section title to first paragraph spacing:** Word adds title space-after and paragraph space-before; the editor/PDF collapse them across the section wrapper (GİRİŞ, KAYNAKLAR). Workaround: the title's space-after is 20.7 pt, so the PDF gap is exact (14.60 mm) and the Word file gets 6 pt more for these two headings.
2. **List rows with `leaderFlow: "inline"`** always hang under the title; the template's rows wrap to the margin.
3. **A single landscape figure/table page** (template sectPr 4) cannot be placed inside the editable flow.
4. The earlier gaps (conjunction exceptions, page-number style, caption label style, continued-table caption, paragraph spacing model, tab stops) are now covered by existing engine capabilities and used: `textTransformExceptions`, `numbering.style`, `labelStyle`, `continuation`, `paragraphSpacing: "additive"`, `tabStopMm`. Still without a construct: the separate numbered "İnternet Kaynakları" group.

## 7. Tests

`cd TxtNote/frontend && npm test`: 556 pass, 0 fail (includes the 7 new tests).
