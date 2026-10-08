import json, sys
sys.stdout.reconfigure(encoding="utf-8")
I = []


def add(id, req, status, exp, act, evi, comp="", src=""):
    I.append(dict(id=id, requirement=req, status=status, expected=exp, actual=act, evidence=evi, likely_component=comp, source_class=src))


# ---------------- PASS
add("P01", "Paper A4 210x297 mm", "PASS", "210x297 mm", "PDF every page 210.00x297.00 mm; DOCX pgSz 11906x16838 twips", "Guide s.5.1 p.10; PyMuPDF page.rect; document.xml sectPr", "", "EXPLICIT")
add("P02", "Margins top/bottom 25, left/right 30 mm", "PASS", "25/25/30/30 mm", "PDF body text extents x 30.00..180.12, y 25.16..271.99 (all body pages, both variants); DOCX pgMar 1417/1701 twips = 24.99/30.00 mm", "Guide s.5.1 p.10", "", "EXPLICIT")
add("P03", "Font Times New Roman, genuine (also page numbers)", "PASS", "TNR", "All text spans TimesNewRomanPSMT/-BoldMT/-ItalicMT/-BoldItalicMT; embedded font programs read with fontTools: name ID1/4 'Times New Roman', v7.12 Monotype (not Tinos/Liberation). DOCX: all rFonts Times New Roman. (Helvetica/Courier/Symbol are jsPDF resources declared but used by no text span.)", "Guide s.5.2 p.11, checklist item 3; page.get_fonts + extract_font", "", "EXPLICIT")
add("P04", "Body 12 pt, line spacing 1.5", "PASS", "12 pt; 1.5 lines (Word TNR: 12*1.15*1.5 = 20.70 pt)", "12.0 pt; pitch 7.30 mm = 20.69 pt (196 samples); DOCX line=360 auto", "Guide s.5.2; master.dump.txt p15-18", "", "EXPLICIT")
add("P05", "Paragraph first-line indent 1.25 cm, justified", "PASS", "12.5 mm, justify", "x0=42.49 vs 30.00 = 12.49 mm; right edge 179.98-180.00; DOCX firstLine=709 twips (12.51 mm), jc=both", "Guide s.5.2", "", "EXPLICIT")
add("P06", "Heading levels H2..H5 form (ondalik sistem)", "PASS", "1. BOLD CAPS; 1.1. CAPS regular; 1.1.1. Title Case bold; 1.1.1.1. Title Case regular; left; single; numbers restart per chapter", "Bold/regular per level verified in body and TOC; 'N. ' with space after dot; left aligned; DOCX Heading2..5 bold/regular as required; spacing 120/120 twips, line 240", "Guide s.2.6 iv, s.5.5.2; dump p16,19", "", "EXPLICIT")
add("P07", "Heading text spacing 6/6 pt (heading -> text)", "PASS", "Word additive 2.6+6+6+11.2 pt = 25.8 pt", "H2->text baseline 9.10 mm = 25.8 pt (official Word sample 9.40 mm: 0.3 mm, within 0.5)", "Guide s.5.5.2 i-iii; dump p16,19", "", "EXPLICIT/MEASURED")
add("P08", "Chapter heading 'BIRINCI BOLUM' own line + title, bold caps centred, ordinal words, new page", "PASS", "centred bold caps, title on next line, each chapter on a new page", "Centred (x-centre 105.0), bold, new page for all 4 chapters (y=33.18); DOCX Heading1 pageBreakBefore, spacing 240/240", "Guide s.2.6 iii/iv, s.5.5.1; dump p16", "", "EXPLICIT")
add("P09", "GIRIS / TARTISMA, SONUC VE ONERILER / KAYNAKCA / EKLER titles bold caps centred", "PASS", "bold, caps, centred", "all centred bold caps (GIRIS x 99.00-110.99)", "Guide s.3.1 Not, s.3.3 Not, s.4.1 Not, EK 5-7", "", "EXPLICIT")
add("P10", "Page numbering", "PASS", "Front matter lower-roman, ic kapak = i unprinted, etik beyan = ii, GIRIS restarts 1 arabic; bottom centre TNR 12, no dot/dash", "Labels measured: ii,iii,iv..xii then 1..24; footer baseline 283.55 mm centred, TNR 12; no punctuation; DOCX sections: pgNumType lowerRoman start=1 at inner cover, decimal start=1 at GIRIS, PAGE fields in footers, outer/inner cover footers empty", "Guide s.5.3 p.11; sectPr", "", "EXPLICIT")
add("P11", "Front matter order", "PASS", "Baslik, Etik, Enstitu Onayi, Ozet, Abstract, On Soz, Icindekiler, Tablolar, Sekiller, Resimler, Simgeler, GIRIS", "Same order in both variants (p3..p14)", "Guide s.2 p.3/4", "", "EXPLICIT")
add("P12", "Captions: above, 11 pt, centred, only 'Tablo N.' bold, single 0/0; '(Devam)' continuation with repeated header row", "PASS", "as listed", "Captions above, 11 pt, centred (x centre 105.02), label bold + title regular; continuation 'Tablo 1. (Devam) ...' + header row repeated; DOCX caption spacing 0/0 line 240", "Guide s.6.5.3 pp.29-31; dump p21,22,26,30", "", "EXPLICIT")
add("P13", "Source line under table/figure/picture: centred, 10/11 pt, 'Kaynak:' bold only", "PASS", "centred, 11 pt (10 or 11 allowed)", "centred 85.92..124.07, 11 pt, bold label + regular text", "Guide s.6.5.3", "", "EXPLICIT")
add("P14", "Tables: single spacing 0/0, cell text 11 pt (>=9), rules <= 1 pt, inside text area", "PASS", "", "cell text 11 pt; rule width 0.75 pt; table x 29.91..179.87; DOCX cell paragraphs spacing 0/0 line 240, border sz=6 (0.75 pt)", "Guide s.6.5.3 + checklist 19/20", "", "EXPLICIT")
add("P15", "Bibliography: single, 0/0, no numbers, 2nd+ lines 0.5 cm in", "PASS", "5.0 mm hang", "hang 35.00-30.00 = 5.00 mm (DOCX hanging=283 twips), pitch 4.87 mm (13.8 pt), no gaps", "Guide s.4.1 p.8", "", "EXPLICIT")
add("P16", "Table of contents form", "PASS", "ICINDEKILER bold; 'Sayfa' right, underlined, below; rows single 0/0; dot leaders; numbers flush right; chapter rows centred no number; roman/arabic", "TOC p9-10 as required; row pitch 4.86 mm; leaders end x=180.00; every TOC page number equals the measured page label of the heading (ii..xii, 1..24); wrapped rows hang under the title like EK 8", "Guide s.2.6 + EK 8", "", "EXPLICIT/MEASURED")
add("P17", "Lists (Tablolar/Sekiller/Resimler) generated only if >=3 entries, TOC form, 'Sayfa'", "PASS", "", "3 entries -> 3 lists; second export with 2 tables/2 figures/2 pictures -> 0 lists (aku-sbe-master-lt3.pdf)", "Guide s.2.7-2.9, EK 9", "", "EXPLICIT")
add("P18", "Ozet / Abstract / On Soz", "PASS", "single spaced, no indent, header block bold centred, 'Anahtar Kelimeler:' bold label, signature at right edge", "as required (one page each; keyword continuation hangs under label; on soz name ends x=180.02)", "Guide s.2.4/2.5, EK 5-7, checklist 10", "", "EXPLICIT")
add("P19", "Block quotation (>10 lines): 10 pt, single, 2 cm in both sides, quoted", "PASS", "10 pt; 50.0..160.0 mm", "x 49.99..159.99, 10 pt, pitch 4.05 mm", "Guide s.6.3.1 xiv", "", "EXPLICIT")
add("P20", "Footnote separator ~4 cm from left edge of text area", "PASS", "~40 mm", "line 30.0..70.0 mm (0.75 pt)", "Guide s.6.3.2", "", "EXPLICIT (approx.)")
add("P21", "PhD variant strings", "PASS", "DOKTORA TEZI / Doktora Tezi / 'Doktora tezi olarak' + second advisor", "diff master vs phd shows only these (plus jury rows)", "phd.dump.txt diff", "", "EXPLICIT")
add("P22", "Etik beyan: 12 pt, bold quoted title, date/Imza/name block at right", "PASS", "EK 3 layout", "bold quoted title, date-Imza-name stacked right (x 147.9..174.5); one page 'ii'", "Guide EK 3 p.39", "", "EXPLICIT/MEASURED")
# ---------------- FAIL
add("F01", "All text black (incl. page numbers)", "FAIL", "RGB 0,0,0 (checklist item 2: no text colour other than black)", "PDF: 3129 text spans colour #111111; plus 11 spans #BFBFBF grey on the Enstitu Onayi placeholder page (p5). DOCX runs have no colour (auto) except one BFBFBF run.", "Tez_Kontrol_Listesi_2023.docx item 2; span colour 1118481 / 12566463", "PDF export text colour token / approval placeholder style", "EXPLICIT (official checklist)")
add("F02", "KAYNAKCA title to first entry = one blank single line", "FAIL", "27.6 pt = 9.74 mm baseline-to-baseline (official Word sample KAYNAKCA page: 28.96 -> 38.70 = 9.74 mm)", "9.10 mm (25.8 pt); same 12 pt gap for GIRIS/TARTISMA/EKLER DIZINI titles", "Guide s.4.1 p.8; master p36 base 33.18 -> 42.28; sample ornek_metin p.25", "template mainTitle spacing 12/12 (INFERRED); should be one blank 13.8 pt line", "EXPLICIT + MEASURED (diff 0.64 mm > 0.5)")
add("F03", "Second and later lines of body headings (H2-H5) start at the number's dot (hanging)", "FAIL", "hanging continuation (checklist items 18, 22; EK 8 continuation ~37.5 mm for '1.3.')", "Continuation lines flush left: x0=30.00 mm (master p19 'ORNEGI COK UZUN BIR BASLIK METNI'); DOCX ind left=0 hanging=0. TOC rows do hang. Official sample itself is inconsistent (one heading hangs at 37.56, others flush).", "Tez_Kontrol_Listesi_2023 items 18/22; master.dump.txt p19", "engine heading paragraph style (no hanging option for headings)", "EXPLICIT (official checklist)")
add("F04", "Table cell alignment: numbers centred, header centred, text left", "FAIL", "guide table example p.31: 'rakamsa ortali, yazi ise sola dayali'; header cells '(ortali)'", "all cells (headers and numbers) left aligned: header 'f' x0=82.99 in column 80.04..129.95 (centre 105.0); numbers 82.99/132.90", "Guide p.31 sample table; master p21 dump", "engine table cell alignment (cellStyle align left only)", "EXPLICIT (guide example annotations)")
add("F05", "Ekler Dizini: appendices listed with page numbers in Tablolar Listesi format", "FAIL", "page with 'Sayfa', dot leaders, start page numbers (Guide s.4.2, EK 11)", "plain typed list 'Ek 1: Anket Formu' without leaders / page numbers / 'Sayfa' (master p37); engine has no appendix-list generator (template notes admit the limitation)", "Guide s.4.2 p.8; master p37", "engine capability gap (policy: gap is not a terminal PASS)", "EXPLICIT")
add("F06", "DOCX TOC chapter row consistent with PDF / EK 8", "FAIL", "one block, 12 pt before and after, single (as the PDF export)", "DOCX: 'BIRINCI BOLUM' and chapter title are two paragraphs each 12/12 = 24 pt between them in Word; PDF has 0 pt between them (4.86 mm apart)", "Guide EK 8 p.44; document.xml paragraphs 94/95; master p9", "DOCX exporter TOC chapter-row builder", "EXPLICIT")
# ---------------- CONFLICT
add("C01", "Paragraph spacing 'once 6nk sonra 6nk'", "CONFLICT", "Guide s.5.2: before 6 / after 6 (Word additive = 12 pt between paragraphs) vs official Word-made sample Ornek_Tez_Metni_2026.pdf: 47 of 50 paragraph starts 9.4 mm apart = 20.7 + 6.0 pt", "Implementation additive 12 pt (11.5 mm gap)", "template notes already record the conflict; human decision needed", "")
add("C02", "Inner cover sizes/margins", "CONFLICT", "Guide text: 12 pt blocks, 16 pt title, margins 25/25/30/30; official Ic_Kapak_*.docx forms: 14 pt everywhere, margins 25 mm all sides; official Ornek_Tez_Kapagi PDF: 12/16/12 pt but jury block 14 pt", "Implementation 12/16/12 pt, jury 12 pt, 30 mm sides", "decide jury block 12 vs 14 pt and side margin 30 vs 25 mm", "docx pgMar 1417 all sides, sz=28; kapak sample p2 jury sz=14.0")
add("C03", "Right margin of official sample text", "CONFLICT", "Guide: 3 cm. Official Ornek_Tez_Metni_2026.pdf body text ends at x=181.0-181.1 mm (right margin ~29 mm)", "Implementation 30 mm (explicit text wins)", "note only", "")
add("C04", "Chapter heading block spacing / line spacing / top-of-page offset", "CONFLICT", "Guide: 12 pt before/after; EK 8 says 'tek satir'; official sample: title lines 1.5 apart (7.32 mm), 'BIRINCI BOLUM'->title 11.52 mm (separate paragraphs), first baseline at 28.96 (no 12 pt before at page top)", "Implementation: one paragraph 'BIRINCI BOLUM' + line break + title, 1.5 lines (7.31 mm), 12/12, first baseline 33.18 (12 pt applied at page top)", "exact values", "")
add("C05", "Heading alignment", "CONFLICT", "Guide s.2.6 Not / s.5.5.2: 'iki yana yasli' and 'sola dayali, girintisiz' in the same sentence", "Implementation ragged right; official sample also ragged right", "clarify", "")
add("C06", "Position of 'Sayfa' under TOC heading", "CONFLICT", "Guide text 'iki satir araligi asagiya'; official Kapak sample 14.66 mm (3 pitches); official Metin sample 9.40 mm; guide EK 8 ~7 mm at 11 pt", "Implementation 9.74 mm", "low impact", "")
# ---------------- UNKNOWN
add("U01", "Footnote font size / spacing / numbering", "UNKNOWN", "Guide gives no size (only separator ~4 cm); official samples contain no footnotes", "Implementation 9 pt single (template comment cites a non-existent guide '6.4'); DOCX FootnoteText style 10 pt but runs 9 pt", "source silent", "")
add("U02", "Equation size/numbering/spacing", "UNKNOWN", "source silent", "italic ~14.5 pt, centred, number '(1)' not rendered although data-eq-numbered=true", "master p23", "")
add("U03", "Page-number distance from bottom edge", "UNKNOWN", "source says only 'alt orta'", "baseline 283.55 mm (13.4 mm), DOCX footer 12.5 mm", "", "")
add("U04", "Outer cover (Tez tanitim) window geometry/size", "UNKNOWN", "EK 1 is 11 pt on a guide page; window not specified", "12 pt, top-anchored at 228.34 mm; with a 190-char/9-line title it overflows to a 2nd physical page (date + city spill, p2); with a guide-length 125-char title it fits one page (lt3 export)", "master p1-2; lt3 p1", "")
add("U05", "H5 spacing, GIRIS/KAYNAKCA title spacing, Kaynak/blockquote paragraph spacing", "UNKNOWN", "source silent (implementer marked INFERRED)", "6/6 or 12/12", "", "")
add("U06", "Wrapped caption lines", "UNKNOWN", "checklist item 18 wants wrapped caption lines to start at the number's dot, guide says centred", "not exercised (captions short); no hanging option exists", "", "")
OBS = [
    "Source line ('Kaynak: ...') of Table 2 is orphaned at the top of the next page (p25/26 both variants; p22 lt3): not source-defined.",
    "Table 1 caption carries pageBreakBefore in the DOCX and starts a new page in the PDF, leaving page 20 with 2 text lines.",
    "Implementer fixtures (orchestration/artifacts/aku-sbe/export/*.fixture.json) have values.THESIS_TITLE = 'Prof. Dr.'; my fixtures use a real long title.",
    "Guide cover reads 2023; file/page label says 2026.",
]
cnt = {}
for i in I:
    cnt[i["status"]] = cnt.get(i["status"], 0) + 1
json.dump(dict(target="aku-sbe", variants=["aku-sbe-master-tr-v1", "aku-sbe-phd-tr-v1"], verdict="FAIL", counts=cnt, items=I, observations=OBS), open("independent-1.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
md = ["# AKU SBE (master + PhD, TR) - independent validation 1", "",
      "Exports: own fixtures (build_fixture.py, build_lt3.py) through the real editor export (orchestration/tools/export.mjs, Edge, local fonts). Measurements: PyMuPDF (dump.py), fontTools, raw DOCX XML. attempt-1 scripts/results not used.", "",
      f"**Overall verdict: FAIL** (counts: {cnt})", "",
      "Sources used directly: Kilavuz (53 p.), Ornek_Tez_Metni_2026.pdf, Ornek_Tez_Kapagi_ve_Icindekiler_2026.pdf, Ic_Kapak/Etik/Onay DOCX forms, Tez_Kontrol_Listesi_2023.docx.", "",
      "| id | status | requirement | expected | actual | evidence | component |", "|---|---|---|---|---|---|---|"]
for i in I:
    md.append("| " + " | ".join(str(i[k]).replace("|", "/") for k in ("id", "status", "requirement", "expected", "actual", "evidence", "likely_component")) + " |")
md += ["", "## Observations"] + ["- " + o for o in OBS]
open("independent-1.md", "w", encoding="utf-8").write("\n".join(md))
print(cnt)
