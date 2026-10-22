# One-off: update orchestration/specs/aku-cografya-lisans.json with TEMPLATE evidence (2026-10-02).
import json
P = "orchestration/specs/aku-cografya-lisans.json"
raw = open(P, encoding="utf-8").read()
OLD = "Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf"
FOLDER = "Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/"
G = FOLDER + "AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf"
T = FOLDER + "AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx"
d = json.loads(raw.replace(OLD, G))
d["schemaVersion"] = 4
d["updatedAt"] = "2026-10-02"
d["updateNote"] = "2026-10-02: the official Word template (AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx, core.xml 2024-03-31) was supplied; its sectPr/styles/paragraph XML resolves former special-page UNKNOWNs (confidence TEMPLATE). Guide-vs-template conflicts are recorded in `conflicts`. Template body paragraph indices (#n) are the n-th child of w:body in word/document.xml (artifacts/aku-cografya-lisans/source/docx/dump.txt)."
ev = lambda loc, quote="": [{"source": T, "locator": loc, "quote": quote}]
gev = lambda loc, quote="": [{"source": G, "locator": loc, "quote": quote}]
rules = {r["key"]: r for r in d["rules"]}


def setrule(key, value, conf, evidence, notes="", unit=None, appliesTo=None):
    r = rules.get(key)
    if r is None:
        r = {"key": key, "appliesTo": appliesTo or ["*"], "canonicalKey": key, "category": "template", "check": "measure", "rejectionRisk": "medium", "tolerance": {"value": None, "unit": "exact", "targetValue": None}}
        d["rules"].append(r)
        rules[key] = r
    prev = r.get("value"), r.get("confidence")
    r["value"] = value
    r["confidence"] = conf
    if unit:
        r["unit"] = unit
    r["evidence"] = evidence + [e for e in r.get("evidence", []) if e.get("source") != T]
    r["notes"] = (notes + " " if notes else "") + (r.get("notes") or "")
    r["updatedFrom"] = {"value": prev[0], "confidence": prev[1]}


# ---- sources
d["sources"] = [
    {"path": G, "role": "primary", "type": "guide", "version": "2024 (cover AFYONKARAHISAR 2024; Last-Modified 2024-03-11, sha256 6d010f61...)", "pages": 23,
     "notes": "Rules text; no example special pages. Pages 14-22 are reference-format tables inserted from the AKU SBE guide."},
    {"path": T, "role": "primary", "type": "template", "version": "core.xml modified 2024-03-31T17:03Z (Last-Modified 31 Mar 2024), sha256 63882661...", "pages": None,
     "notes": "Word template: cover/inner cover, approval, ethics, OZET, ABSTRACT, TESEKKUR, TOC and lists, sample body with H1 headings, captions, tables, bibliography. Direct formatting dominates (Normal = TNR 12; headings carry no heading style). Red annotation lines ((*) notes, '(Bir bosluk)') are instructions, not content. The cached TOC, CIZELGELER/RESIMLER/OZGECMIS rows and page numbers are stale."}]
d["sourcePriority"] = [
    {"path": G, "why": "Unambiguous prose requirements (measurable values stated in words) win."},
    {"path": T, "why": "Newer by 20 days and the document the guide delegates the page layouts to (4.2.2); fills what the prose leaves open or words ambiguously (sectPr distances, special pages, TOC/lists, table borders)."},
    {"path": G, "why": "Guide self-formatting (Word pitch only) is corroboration, not a target."}]
d["variantNotes"] = "Single variant. The template's English abstract is the only English page (Graduation Thesis)."

# ---- resolved UNKNOWNs / TEMPLATE values
setrule("page.header.distanceMm", 12.5, "TEMPLATE", ev("word/document.xml sectPr#1-#5 w:pgMar w:header", "header=709 / 708 twips (12.49-12.51 mm)"), "Guide silent.", "mm")
setrule("page.footer.distanceMm", 12.5, "TEMPLATE", ev("word/document.xml sectPr#1-#5 w:pgMar w:footer", "footer=709 / 708 twips"), "Guide silent.", "mm")
setrule("pagination.distanceFromEdgeMm", 12.5, "TEMPLATE", ev("sectPr w:footer=708/709"), "Page number sits in the footer area 12.5 mm above the bottom edge.", "mm")
setrule("page.margins.topMm", 25, "EXPLICIT", gev("p.2 2.3", "alt ve ust 2,5 cm") + ev("sectPr#1 w:pgMar w:top=1418", "1418 twips = 25.01 mm (all portrait sections, cover too)"), "Template agrees.", "mm")
setrule("typography.paragraph.firstLineIndentMm", 12.5, "TEMPLATE", ev("body paragraphs #238,#258,#285-#296,#310-#314 w:ind w:firstLine=708/709", "15 of 16 sample body paragraphs are indented 708/709 twips (12.49-12.51 mm)") + gev("p.2-3 2.4 (CONFLICT)", "paragraf baslari sayfanin sol cerceve kenarindan ve bosluk birakilmadan baslamalidir"), "CONFLICT (see conflicts[0]): guide prose reads as 0 mm; template and the guide's own Word body (12.45 mm) use 12.5 mm. Implemented 12.5 mm (single constant PARA_INDENT_MM).", "mm")
setrule("typography.paragraph.blankLineBetween", False, "TEMPLATE", ev("body paragraphs #285-#296, #310-#314", "consecutive body paragraphs separated by spacing before=120 after=120, no empty paragraphs"))
setrule("typography.paragraph.spaceBeforePt", 6, "TEMPLATE", ev("body paragraphs #237-#239,#285-#296 w:spacing w:before=120 w:after=120 w:line=360", "6/6 pt, 1.5 lines") + gev("p.2 2.2", "oncesi-sonrasi 6 nk"), "Guide and template agree.", "pt")
setrule("headings.h3.caps", "Title Case (Bas Harfleri Buyuk); conjunctions lower-case", "INFERRED", ev("TOC cache #137-#139,#143-#147 (placeholders Ucuncu Dereceden Baslik)", "2.2.1 Ucuncu Dereceden Baslik") + gev("guide own H3", "H3 headings of the guide itself are Title Case"), "Guide prescribes H1/H2 only.")
setrule("headings.h4.caps", "Title Case (Bas Harfleri Buyuk); conjunctions lower-case", "INFERRED", ev("TOC cache #140-#141 (placeholder Dorduncu Dereceden Baslik)", "2.3.1.1 Dorduncu Dereceden Baslik"), "Guide prescribes H1/H2 only.")
setrule("headings.h1.numbering", "{n}. (e.g. '1. GIRIS')", "TEMPLATE", ev("body #237,#257,#284,#299,#309,#317", "1. GIRIS, 2. LITERATUR BILGILERI, 3. MATERYAL ve METOT, 4. BULGULAR, 5. TARTISMA ve SONUC, 6. KAYNAKLAR"))
setrule("headings.h2.numbering", "{1}.{2} (no trailing period)", "TEMPLATE", ev("TOC cache #135", "2.1 Ikinci Dereceden Baslik"))
setrule("headings.h3.numbering", "{1}.{2}.{3}", "TEMPLATE", ev("TOC cache #137", "2.2.1 Ucuncu Dereceden Baslik"))
setrule("headings.h4.numbering", "{1}.{2}.{3}.{4}", "TEMPLATE", ev("TOC cache #140", "2.3.1.1 Dorduncu Dereceden Baslik"))
setrule("headings.h1.spaceTemplate", {"spaceBeforePt": 6, "spaceAfterPt": 6, "lineSpacing": "1.5"}, "TEMPLATE", ev("body #237,#257,#284,#299,#309,#317 w:spacing before=120 after=120 line=360", "H1 samples carry only 6/6 pt"), "CONFLICT with guide 2.4/2.6 'bir satir bosluk (1,5 araliklı)': guide prose implemented (see conflicts).")
setrule("headings.frontMatterTitles", {"OZET": "ÖZET", "ABSTRACT": "ABSTRACT", "TESEKKUR": "TEŞEKKÜR", "toc": "İÇİNDEKİLER DİZİNİ", "symbols": "SİMGELER ve KISALTMALAR DİZİNİ", "figures": "ŞEKİLLER DİZİNİ", "tables": "TABLOLAR DİZİNİ", "style": "bold, centred, single-spaced, 12 pt (OZET run sz=22 is a slip)"}, "TEMPLATE", ev("body #55,#94,#113,#123,#169,#215,#229", "ÖZET / ABSTRACT / TEŞEKKÜR / İÇİNDEKİLER DİZİNİ / SİMGELER VE KISALTMALAR DİZİNİ / ŞEKİLLER DİZİNİ / TABLOLAR DİZİNİ"), "Symbols page title is typed 'VE' in capitals on the page but 've' in the cached TOC (lower-case 've' kept per guide 2.8).")
setrule("captions.figure.spaceBeforePt", 0, "TEMPLATE", ev("body #240-#241,#245-#246 (image paragraph then caption, no spacing before)", "caption w:spacing absent / after=120"), unit="pt")
setrule("captions.figure.spaceAfterPt", 6, "TEMPLATE", ev("body #276,#281 w:spacing after=120", "6 pt after figure captions"), unit="pt")
setrule("captions.table.spaceAfterPt", 0, "TEMPLATE", ev("body #270,#297 (ResimYazs) w:spacing after=0", "table caption directly on the table"), "Guide example p.8 measured 6 pt (kept in sourceGeometry); template 0 pt used.", "pt")
setrule("captions.figure.hangingIndentMm", "label (continuation lines under the caption text)", "TEMPLATE", ev("body #276,#281 w:ind left=851 hanging=851; #307 left=992 hanging=992", "15.0 / 17.5 mm hanging") + gev("p.8 3.3", "ilk satirdan sonraki satirlar ilk satira gore hizali (asili)"), "CONFLICT with the guide's own p.8 example (0 mm hanging); prose and template agree -> hanging under the text.")
setrule("captions.table.hangingIndentMm", "label (continuation lines under the caption text)", "INFERRED", gev("p.8 3.3", "ilk satirdan sonraki satirlar ... (asili)"), "Template table caption samples are single-line.")
setrule("captions.figure.numbering", "{chapter}.{n}", "EXPLICIT", gev("p.7 3.2", "Sekil 1.1, Sekil 2.1") + ev("body #241,#243,#276,#281,#307 (CONFLICT)", "Sekil 1., Sekil 7., Sekil 8., Sekil 9 - document-wide, mostly with a period"), "CONFLICT: template samples number document-wide with a period (and inconsistently); guide prose (chapter-based, no period) implemented.")
setrule("tables.lineSpacing", "single", "TEMPLATE", ev("tables#1,#2 cell paragraphs: no w:spacing (Normal = single)", "single, no spacing"))
setrule("tables.cellFontSizePt", 11, "TEMPLATE", ev("tables#1,#2 w:sz=22", "all cells 11 pt, header row bold, vAlign center") + gev("p.2 2.2", "12 punto ... genis veya uzun tablolarda en kucuk 8 punto"), "CONFLICT (soft): guide default 12 pt with reduction to 8 pt allowed; template samples 11 pt. 12 pt implemented as default.", "pt")
setrule("tables.borders", {"style": "single grid", "widthPt": 0.5, "scope": "all outer and inner borders", "align": "center"}, "TEMPLATE", ev("tables#1,#2 w:tblBorders top/left/bottom/right/insideH/insideV single sz=4; w:jc center", "0.5 pt full grid, centred"))
setrule("tables.notes", {"position": "below table", "fontSizePt": 11, "lineSpacing": "single", "align": "justify", "spaceBeforePt": 6, "spaceAfterPt": 6}, "EXPLICIT", gev("p.8 3.3", "tablonun altinda, 11 punto buyuklugunde ve 1 satir araliklı") + ev("body #272 red note, w:spacing before=120 after=120", "'Tablo altindaki aciklamalar 10 punto ve 1 satir araligiyla yazilmalidir' (CONFLICT 10 pt)"), "Size: guide 11 pt vs template instruction 10 pt (conflict); spacing 6/6 from the template paragraph.")
setrule("pagination.font", {"fontFamily": "Times New Roman", "fontSizePt": 10}, "EXPLICIT", gev("p.3 2.7", "(Times New Roman olarak 10 Punto)") + ev("footer2.xml (PAGE field, style AltBilgi basedOn Normal)", "no run size -> inherited 12 pt (CONFLICT)"), "Guide's explicit 10 pt implemented; the template footer renders 12 pt.")
setrule("pagination.front.startsAt(section)", {"section": "abstract (OZET)", "value": 1}, "INFERRED", gev("p.3 2.7", "Ozet, Abstract, ... kucuk Romen rakamlari ile") + ev("sectPr#2 w:pgNumType lowerRoman start=2 (CONFLICT)", "section 2 (ethics ... lists) restarts at roman 2; cached TOC shows OZET = i"), "CONFLICT: sectPr numbering would print ethics 'ii' and OZET 'iii'; guide (ethics unnumbered, OZET first roman page) and the template's cached TOC implemented: OZET = i.")
setrule("pagination.main.startsAt(section)", {"section": "main (1. GIRIS)", "value": 1}, "EXPLICIT", gev("p.3 2.7", "Giris bolumuyle baslayan tez metni sayfalari ... 1, 2, 3") + ev("sectPr#3 w:pgNumType w:start=1 (decimal)", "section 3 (1. GIRIS) restarts at 1"))
setrule("toc.title", "İÇİNDEKİLER DİZİNİ", "TEMPLATE", ev("body #123", "İÇİNDEKİLER DİZİNİ (bold, centred)") + gev("p.2 2.6 / p.9 4.1", "Icindekiler Dizini"))
setrule("toc.leader", "dots (right tab 8494 twips = 149.8 mm)", "TEMPLATE", ev("styles.xml T1-T5 w:tab right leader=dot pos=8494", "dot leader to the right edge"))
setrule("toc.indentPerLevelMm", {"unnumbered titles": 0, "H1": 0, "H2": 5.0, "H3": 10.0, "H4": 15.0}, "TEMPLATE", ev("styles.xml T2 (0), T3 w:ind left=284, T4 left=567, T5 left=851", "0 / 5.01 / 10.0 / 15.01 mm"), unit="mm")
setrule("toc.lineSpacing", {"lineSpacing": "1.5", "spaceAfterPt": 0, "fontSizePt": 12, "bold": False}, "TEMPLATE", ev("body #125-#165 w:spacing after=0 line=360", "TOC rows 1.5 lines, 0 pt after, regular"))
setrule("toc.frontMatterEntries", ["ÖZET", "ABSTRACT", "TEŞEKKÜR", "İÇİNDEKİLER DİZİNİ", "SİMGELER ve KISALTMALAR DİZİNİ", "ŞEKİLLER DİZİNİ", "TABLOLAR DİZİNİ"], "TEMPLATE", ev("body #125-#132 (T1 rows with roman page numbers i-ix)", "front-matter titles are listed incl. the TOC itself"), "Cached TOC also lists CIZELGELER DIZINI, RESIMLER DIZINI, OZGECMIS, EKLER (stale, see conflicts).")
setrule("lists.figures.pageNumberHeading", {"text": "Sayfa", "bold": True, "align": "right"}, "TEMPLATE", ev("body #216", "'Sayfa' bold right under ŞEKİLLER DİZİNİ"))
setrule("lists.tables.title", "TABLOLAR DİZİNİ", "TEMPLATE", ev("body #229", "TABLOLAR DİZİNİ (bold, centred) + 'Sayfa'") + gev("p.2 2.6, p.9 4.1 (vs p.11 4.2.10 CIZELGELER)", "Tablolar Dizini"), "Supersedes the earlier review decision 'ÇİZELGELER DİZİNİ' (guide 4.2.10 and the cached TOC row are the only places that print it; caption label is 'Tablo').")
setrule("lists.symbols.title", "SİMGELER ve KISALTMALAR DİZİNİ", "TEMPLATE", ev("body #169 (page: 'SİMGELER VE KISALTMALAR DİZİNİ'), TOC cache #129 ('SİMGELER ve KISALTMALAR DİZİNİ')"), "Lower-case 've' per guide 2.8 and the cached TOC; bold, centred, single.")
setrule("lists.symbols.tabStopMm", 24.98, "INFERRED", ev("body #184,#203-#205,#211 w:ind left=1416 hanging=1416", "four entries hang 24.98 mm; the other 40 entries are run-in 'Simge:  tanim' without tab") + gev("p.5 2.10", "sekme tusu ile ayarlanarak blok halinde"), "Guide wants aligned definitions; template mostly run-in (conflict). 24.98 mm = the template's only hanging value.", "mm")
setrule("lists.symbols.style", {"lineSpacing": "single", "spacing": "0/0 pt", "align": "justify", "symbolBold": True}, "TEMPLATE", ev("body #170-#213", "entries single-spaced, justified, symbol bold"))
setrule("lists.rows", {"lineSpacing": "single", "spaceAfterPt": 10, "leader": "dots", "label": "Sekil n. / Tablo n."}, "TEMPLATE", ev("styles.xml ekillerTablosu w:spacing after=200; body #217-#220,#232-#235 w:spacing line=240", "list rows single, 10 pt after (style) - first Tablo row 1.5 / 0 pt"))
setrule("abstract.tr.thesisType", "Bitirme Tezi", "TEMPLATE", ev("body #56", "Bitirme Tezi (below ÖZET, regular, centred)"))
setrule("abstract.tr.header", ["ÖZET", "Bitirme Tezi", "", "<TÜRKÇE BAŞLIK>", "", "Öğrencinin Adı SOYADI", "Afyon Kocatepe Üniversitesi", "Fen Edebiyat Fakültesi", "Coğrafya Bölümü", "Danışman: Ünvanı Adı SOYADI"], "TEMPLATE", ev("body #55-#65", "ÖZET bold; title single-spaced regular; Danışman bold; two empty 1.5 lines before the text (#66-#67)"))
setrule("abstract.en.header", ["ABSTRACT", "", "Graduation Thesis", "", "TITLE OF GRADUATION THESIS", "", "Student Name SURNAME", "Afyon Kocatepe University", "Faculty of Science and Arts", "Department of Geography", "Supervisor: Title Name SURNAME"], "TEMPLATE", ev("body #94-#106", "English page; one empty line before the text (#106)"))
setrule("abstract.keywords.hangingMm", {"tr": 37.52, "en": 22.0}, "TEMPLATE", ev("body #72 w:ind left=2127 hanging=2127; #111 left=1247 hanging=1247", "Anahtar Kelimeler: / Keywords: bold label, hanging 37.52 / 22.0 mm"), unit="mm")
setrule("abstract.yearPages", {"format": "<yil>, <son romen sayfa> + <GIRIS'ten sonraki sayfa> sayfa  (EN: pages)", "bold": True, "note": "(*) counts the pages after the introduction including appendices"}, "TEMPLATE", ev("body #70,#109,#64", "'2023, ix + 16(*) sayfa' / '2023, ix + 16(*) pages'; red note 'Giris bolumunden sonraki sayfalari (ekler dahil) kapsar'"), "Order text -> keywords -> year/pages per guide 4.2.5; the template prints year/pages BEFORE the keywords (conflict).")
setrule("bibliography.numbered", "continues the chapter numbers ('6. KAYNAKLAR')", "TEMPLATE", ev("body #317, TOC cache #163", "6. KAYNAKLAR (T2 row)") + gev("p.9 4", "6. KAYNAKLAR"), "Supersedes INFERRED.")
setrule("bibliography.template", {"fontSizePt": 11, "hangingMm": 5.0, "spacing": "0/0", "lineSpacing": "single"}, "TEMPLATE", ev("body #318-#343 w:ind left=284 hanging=284, w:sz=22, no spacing", "sample entries 11 pt, 5 mm hanging, no spacing"), "CONFLICT with guide 4.3.6 (12 pt, 12.5 mm hanging, 6/0 pt): guide implemented.")
setrule("bibliography.internetSources.heading", {"text": "İnternet Kaynakları", "bold": True, "spaceBeforePt": 6, "numberedList": True, "fontSizePt": 11}, "TEMPLATE", ev("body #344-#347", "bold subheading + numbered list items"))
setrule("innerCover.layout", "see sections[inner-cover]", "TEMPLATE", ev("body #0-#25", "two seals (right-aligned run), AKÜ / FEN EDEBİYAT FAKÜLTESİ / COĞRAFYA BÖLÜMÜ, 4 empty lines, BİTİRME TEZİ, 3 empty, title, 2 empty, name, 2 empty, Danışman / Ünvanı Adı SOYADI, 5 empty, Yıl - all 14 pt bold, 1.5 lines, centred"))
setrule("innerCover.sealsMm", {"aku": 26.19, "fef": 26.25, "run": "space + seal + 77 spaces + seal, right aligned"}, "TEMPLATE", ev("body #0 wp:extent 943000/945000 EMU; media/image1.jpeg, image2.png", "26.19 / 26.25 mm inline pictures"), unit="mm")
setrule("approval.layout", "see sections[approval]", "TEMPLATE", ev("body #26-#37", "14 pt bold caps single lines (AFYON KOCATEPE ÜNİVERSİTESİ / FEN EDEBİYAT FAKÜLTESİ), 3 empty single lines, BİTİRME TEZİ ONAY SAYFASI, 3 empty, acceptance sentence 12 pt 1.5 justified (BİTİRME TEZİ bold), 2 empty, bold 'Bitirme Tezi Danışmanı: Ünvanı Adı SOYADI ... İMZA'"))
setrule("ethicsDeclaration.layout", "see sections[ethics-declaration]", "TEMPLATE", ev("body #38-#53", "title bold, bold intro with 12.5 mm first-line, six bullet items (7.5 mm hanging), 'beyan ederim.', right date, grey İmza at 167.4 mm, right name"))
for k in ("outerCover.layout", "binding.type", "pagination.unnumbered.counted", "pagination.appendix", "tables.fontSizePt", "equations.numbering", "footnotes.fontSizePt", "abstract.maxWords"):
    if k in rules:
        rules[k]["notes"] = (rules[k].get("notes") or "") + " [2026-10-02 template check: still not established by the template.]"
rules["tables.fontSizePt"]["notes"] += " Template cells are 11 pt (see tables.cellFontSizePt)."
rules["footnotes.fontSizePt"]["notes"] += " word/footnotes.xml holds only separators; Normal style gives TNR 12 pt: engine uses the guide's global 12 pt (INFERRED)."


# ---- conflicts
def conflict(topic, srcs, decision, needs):
    d["conflicts"].append({"topic": topic, "sources": srcs, "decision": decision, "needsConfirmation": needs})


s_ = lambda path, loc, val: {"path": path, "locator": loc, "value": val}
d["conflicts"][0] = {"topic": "Body paragraph first-line indent", "sources": [s_(G, "p.2-3 2.4", "0 (paragraf baslari ... bosluk birakilmadan; ambiguous)"), s_(T, "body paragraphs #238,#258,#285-#296,#310-#314 w:ind firstLine", "708/709 twips = 12.5 mm on 15 of 16 paragraphs (#259 none)"), s_(G, "guide body geometry p.2-23", "12.45 mm")], "decision": "DECIDED (template integration): 12.5 mm. The prose is ambiguous (can also mean 'no empty lines'), while the template and the guide's own Word body agree. Single constant PARA_INDENT_MM in templates/aku-cografya.js.", "needsConfirmation": True}
conflict("Spacing around headings", [s_(G, "p.3 2.4, 2.6", "1 satir bosluk (1,5 araliklı) before and after (stated twice)"), s_(T, "body H1 samples #237,#257,#284,#299,#309,#317", "spacing before=120 after=120 line=360 (6/6 pt), no empty paragraph"), s_(G, "guide body", "6 pt")], "Guide prose implemented: one empty 1.5 line (20.7 pt) between a heading and the text next to it = 14.7 pt heading space + 6 pt paragraph space (Word additive). H1 at a page top: no space before. INFERRED reading; the template's H1 samples have only 6/6.", True)
conflict("Caption numbering and period", [s_(G, "p.7 3.2; p.8 examples", "Sekil 2.1 / Tablo 3.1 (chapter.n, no period)"), s_(T, "body #241,#243,#276,#281,#307,#270,#297", "Sekil 1. / 7. / 8. / 9 and Tablo 1 - document-wide, mostly with a period; inconsistent")], "Guide prose implemented (chapter-based, space only).", False)
conflict("Table note size", [s_(G, "p.8 3.3", "11 pt, single"), s_(T, "body #272 red note", "'10 punto ve 1 satir araligiyla'")], "Guide 11 pt implemented (normative text); template instruction says 10 pt.", True)
conflict("Table cell font size", [s_(G, "p.2 2.2", "12 pt; down to 8 pt in wide/long tables"), s_(T, "tables#1,#2 w:sz=22", "11 pt")], "12 pt default implemented; 11 pt lies in the permitted 8-12 pt range.", False)
conflict("Page-number font size", [s_(G, "p.3 2.7", "Times New Roman 10 pt"), s_(T, "footer2.xml / styles.xml AltBilgi->Normal", "no size -> 12 pt")], "Guide 10 pt implemented (explicit); the template footer is an unformatted default.", False)
conflict("Roman page numbering start", [s_(G, "p.3 2.7", "Dis kapak, ic kapak, onay, etik unnumbered; Ozet ... i, ii, iii"), s_(T, "sectPr#2 pgNumType lowerRoman start=2 (ethics ... lists)", "ethics would print ii, OZET iii"), s_(T, "cached TOC #125-#132", "OZET i, ABSTRACT ii, ... RESIMLER ix")], "Guide + cached TOC implemented: OZET = i (template sectPr start=2 treated as a leftover).", True)
conflict("Abstract order of keywords and year/pages", [s_(G, "p.10 4.2.5", "text, 1 line, Anahtar Kelimeler, 1 line, year + page count"), s_(T, "body #68-#72, #107-#111", "text, year + pages, keywords")], "Guide order implemented.", True)
conflict("List of tables title (template integration)", [s_(G, "p.11 4.2.10; template cached TOC #131", "CIZELGELER DIZINI"), s_(G, "p.2 2.6, p.9 4.1", "Tablolar Dizini"), s_(T, "body #229 (the page itself)", "TABLOLAR DİZİNİ")], "TABLOLAR DİZİNİ (the template page, two guide mentions and the caption label 'Tablo'); supersedes the earlier review decision.", False)
conflict("Symbols list layout", [s_(G, "p.5 2.10", "symbols at the left edge; definitions aligned on a tab stop"), s_(T, "body #170-#213", "run-in 'Simge:  tanim' (bold symbol) in 40 of 44 entries; 4 entries hang 24.98 mm")], "Tab stop / hanging 24.98 mm (guide text, template's hanging value); title centred bold single (template).", False)
conflict("Each main title on a new page", [s_(G, "p.3 2.6", "ana baslik iceren bolumler daima yeni sayfadan"), s_(T, "body #214-#215", "SEKILLER DIZINI follows the symbols list on the same page (no break); #228 page break before TABLOLAR")], "Guide implemented (every list on its own page).", False)
conflict("Stale items in the template's cached TOC", [s_(T, "body #131-#132,#164", "CIZELGELER DIZINI, RESIMLER DIZINI, OZGECMIS rows"), s_(G, "p.9 4.1", "section order has none of RESIMLER, OZGECMIS; every map/photo/graph is 'Sekil' (p.6 3)")], "Not generated: no sample page exists in the template and 4.1 does not list them. EKLER is kept as an optional section (guide: 'Ekler (varsa)').", False)
conflict("Bibliography formatting (template integration)", [s_(G, "p.12-13 4.3.6 + screenshot", "12 pt, single, 12.5 mm hanging, 6 pt before / 0 after"), s_(T, "body #318-#343", "11 pt, 5 mm hanging, no spacing")], "Guide implemented.", False)
conflict("OZET title size", [s_(G, "p.2 2.2", "12 pt everywhere except the inner cover"), s_(T, "body #55 w:sz=22", "OZET 11 pt (other titles 12 pt)")], "12 pt implemented (template run looks like a slip).", False)
conflict("Caption label weight", [s_(G, "p.8 examples (MEASURED)", "label bold, text regular"), s_(T, "body #241 (label bold, text regular), #297 (ResimYazs style, not bold)", "mixed")], "Label bold, text regular (guide + 3 of 4 template captions).", False)
for c in d["conflicts"][1:12]:
    if c["topic"] == "List of tables title":
        c["superseded"] = "by the 2026-10-02 entry 'List of tables title (template integration)' (TABLOLAR)"
    if c["topic"] == "Bibliography heading text and numbering":
        c["decision"] += " [2026-10-02: template confirms 'KAYNAKLAR' numbered '6. KAYNAKLAR' (TEMPLATE).]"
    if c["topic"].startswith("“Sayfa” column heading"):
        c["decision"] += " [2026-10-02: template #216 has 'Sayfa' on ŞEKİLLER DİZİNİ -> confirmed.]"
    if c["topic"] == "Caption continuation-line alignment":
        c["decision"] = "Hanging under the caption text (guide prose 3.3 and template hanging 15-17.5 mm); the guide's own p.8 example (0 mm) is the odd one out. [2026-10-02]"

# ---- unknowns
resolved = {"page.header.distanceMm", "page.footer.distanceMm", "pagination.distanceFromEdgeMm", "typography.paragraph.blankLineBetween", "headings.h3.caps", "headings.h4.caps", "headings.frontMatterTitles", "captions.figure.spaceBeforePt", "tables.lineSpacing", "toc.leader", "toc.indentPerLevelMm", "toc.lineSpacing", "toc.frontMatterEntries", "lists.figures.pageNumberHeading", "lists.symbols.title", "lists.symbols.tabStopMm", "abstract.tr.thesisType", "innerCover.layout", "approval.layout", "ethicsDeclaration.layout"}
d["unknowns"] = [u for u in d["unknowns"] if u["key"] not in resolved]
d["unknowns"] += [
    {"key": "outerCover.layout", "why": "Guide: only 'ciltletilmelidir'. The template's first page is the inner cover (14 pt bold with two seals); no separate outer-cover sample."},
    {"key": "footnotes", "why": "No footnote text in guide or template (footnotes.xml has only separators). Engine: TNR 12 pt (global rule, INFERRED), rest engine default."},
    {"key": "equations", "why": "Neither source mentions equations."},
    {"key": "appendices.heading", "why": "EKLER has no sample page; heading typography UNKNOWN."},
    {"key": "pagination.unnumbered.counted (template)", "why": "Template S1 (cover + approval) numbering and S2 start=2 contradict each other; the guide is silent whether unnumbered pages are counted. OZET = i is used."},
    {"key": "landscape figure page", "why": "The template shows a single landscape page (Sekil 6, sectPr#4, 16840x11904 twips, pgNumType start=5) with portrait page-number chrome; the engine cannot place a single landscape page inside the main editable flow."}]


# ---- sections (special pages from the template)
def nlay(kind, text, **kw):
    return dict({"kind": kind, "text": text, "confidence": "TEMPLATE"}, **kw)


def sec(id_):
    return next(s for s in d["sections"] if s["id"] == id_)


nonum = {"counted": "UNKNOWN", "visible": False, "format": "none", "startAt": None}
ic = sec("inner-cover"); ic["pageNumbering"] = dict(nonum)
ic["layout"] = [
    nlay("image", "AKÜ seal 26.19 mm + Fen-Edebiyat Fakültesi seal 26.25 mm in one right-aligned run (' ' + seal + 77 spaces + seal)", sizePt=14, bold=True, align="right"),
    nlay("text", "AFYON KOCATEPE ÜNİVERSİTESİ", sizePt=14, bold=True, align="center", lineSpacing="1.5"),
    nlay("text", "FEN EDEBİYAT FAKÜLTESİ / COĞRAFYA BÖLÜMÜ (line break)", sizePt=14, bold=True, align="center", lineSpacing="1.5"),
    nlay("spacer", "4 empty 14 pt 1.5 lines"), nlay("text", "BİTİRME TEZİ", sizePt=14, bold=True, align="center"), nlay("spacer", "3 empty lines"),
    nlay("metadata", "{{THESIS_TITLE}} ('BİTİRME TEZİ BAŞLIĞI'; a second single-spaced placeholder line '(Devam)' is not generated)", sizePt=14, bold=True, align="center"), nlay("spacer", "2 empty lines"),
    nlay("metadata", "Öğrencinin Adı SOYADI", sizePt=14, bold=True, align="center"), nlay("spacer", "2 empty lines"),
    nlay("text", "Danışman / Ünvanı Adı SOYADI", sizePt=14, bold=True, align="center"), nlay("spacer", "5 empty lines"), nlay("metadata", "Yıl", sizePt=14, bold=True, align="center")]
ic["evidence"] += ev("body #0-#25; sectPr#1", "page margins 25.01/30.0 mm, footer empty (footer1.xml)")
ap = sec("approval"); ap["title"] = "BİTİRME TEZİ ONAY SAYFASI"; ap["pageNumbering"] = dict(nonum)
ap["layout"] = [
    nlay("text", "AFYON KOCATEPE ÜNİVERSİTESİ / FEN EDEBİYAT FAKÜLTESİ", sizePt=14, bold=True, caps=True, align="center", lineSpacing="single"), nlay("spacer", "3 empty 12 pt single lines"),
    nlay("text", "BİTİRME TEZİ ONAY SAYFASI", sizePt=14, bold=True, caps=True, align="center", lineSpacing="single"), nlay("spacer", "3 empty 12 pt single lines"),
    nlay("text", "…….. tarafından hazırlanan ……….. başlıklı tez çalışması ../../…. tarihinde Afyon Kocatepe Üniversitesi Fen Edebiyat Fakültesi Coğrafya Bölümü’nde lisans BİTİRME TEZİ olarak kabul edilmiştir.", sizePt=12, align="justify", lineSpacing="1.5", note="'BİTİRME TEZİ' bold"),
    nlay("spacer", "2 empty 1.5 lines"), nlay("signatureRow", "Bitirme Tezi Danışmanı: Ünvanı Adı SOYADI ........ İMZA", sizePt=12, bold=True, align="justify", lineSpacing="1.5")]
ap["evidence"] += ev("body #26-#37; styles Metinler-Bilgi-niversite / Metinler-Bilgi-TezBal", "14 pt bold caps centred")
eth = sec("ethics-declaration"); eth["title"] = "BİLİMSEL ETİK BİLDİRİM SAYFASI"; eth["pageNumbering"] = dict(nonum)
eth["layout"] = [
    nlay("text", "BİLİMSEL ETİK BİLDİRİM SAYFASI / Afyon Kocatepe Üniversitesi", sizePt=12, bold=True, align="center", lineSpacing="1.5"), nlay("spacer", "1 empty line"),
    nlay("text", "Coğrafya Bölümü, bitirme tezi yazım kurallarına uygun olarak hazırladığım bu bitirme tezi çalışmasında;", sizePt=12, bold=True, align="justify", firstLineMm=12.5),
    nlay("text", "6 bullet items (hanging 7.5 mm): bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi, ... sunmadığımı", sizePt=12, align="justify"),
    nlay("text", "beyan ederim.", sizePt=12, bold=True), nlay("spacer", "1 empty line"), nlay("metadata", "GG / AA / YYYY", bold=True, align="right"), nlay("spacer", "1 empty line"),
    nlay("text", "İmza (grey BFBFBF, bold, x = 30 + 137.37 mm)", bold=True), nlay("metadata", "Öğrencinin Adı SOYADI (right, bold, single)", bold=True, align="right")]
eth["evidence"] += ev("body #38-#53", "ethics page")
ab = sec("abstract"); ab["title"] = "ÖZET"; ab["pageNumbering"] = {"counted": True, "visible": True, "format": "roman-lower", "startAt": 1}
ab["layout"] = [
    nlay("text", "ÖZET / Bitirme Tezi / (empty) / TÜRKÇE BAŞLIK (single) / (empty) / Öğrencinin Adı SOYADI / Afyon Kocatepe Üniversitesi / Fen Edebiyat Fakültesi / Coğrafya Bölümü / **Danışman:** Ünvanı Adı SOYADI / 2 empty", sizePt=12, align="center"),
    nlay("text", "abstract text (unindented, 1.5, justified)", sizePt=12, align="justify"), nlay("text", "**Anahtar Kelimeler:** ... (hanging 37.52 mm)", sizePt=12, align="justify"), nlay("text", "<yıl>, <son romen> + <n> sayfa (bold)", sizePt=12, bold=True)]
ab["evidence"] += ev("body #55-#73", "ÖZET page")
ae = sec("abstract-en"); ae["title"] = "ABSTRACT"; ae["pageNumbering"] = {"counted": True, "visible": True, "format": "roman-lower", "startAt": None}
ae["layout"] = [
    nlay("text", "ABSTRACT / (empty single) / Graduation Thesis / (empty) / TITLE (single) / (empty) / Student Name SURNAME / Afyon Kocatepe University / Faculty of Science and Arts / Department of Geography / **Supervisor:** Title Name SURNAME / 1 empty", sizePt=12, align="center"),
    nlay("text", "abstract text", align="justify"), nlay("text", "**Keywords:** ... (hanging 22.0 mm)", align="justify"), nlay("text", "<year>, <roman> + <n> pages (bold)", bold=True)]
ae["evidence"] += ev("body #94-#111", "ABSTRACT page")
ack = sec("acknowledgements"); ack["pageNumbering"] = {"counted": True, "visible": True, "format": "roman-lower", "startAt": None}
ack["layout"] = [nlay("text", "TEŞEKKÜR (bold, centred, single) + 1 empty 1.5 line + unindented justified 1.5 paragraphs separated by an empty line + 2 empty lines + right-aligned 'Öğrencinin Adı SOYADI' and 'Afyonkarahisar <yıl>'", sizePt=12)]
ack["evidence"] += ev("body #113-#121")
toc = sec("toc"); toc["title"] = "İÇİNDEKİLER DİZİNİ"; toc["pageNumbering"] = {"counted": True, "visible": True, "format": "roman-lower", "startAt": None}
toc["layout"] = [nlay("text", "İÇİNDEKİLER DİZİNİ (bold, centred, single)"), nlay("text", "Sayfa (bold, right, 1.5)"), nlay("text", "rows 12 pt regular, 1.5, 0 pt after, dot leader at 149.8 mm; indents 0/0/5/10/15 mm; front-matter titles with roman numbers")]
toc["evidence"] += ev("body #123-#165; styles T1-T5")
for sid, title in (("symbols", "SİMGELER ve KISALTMALAR DİZİNİ"), ("list-of-figures", "ŞEKİLLER DİZİNİ"), ("list-of-tables", "TABLOLAR DİZİNİ")):
    s = sec(sid); s["title"] = title; s["pageNumbering"] = {"counted": True, "visible": True, "format": "roman-lower", "startAt": None}; s["evidence"] += ev("body #169-#235")
sec("bibliography")["title"] = "KAYNAKLAR"
sec("bibliography")["evidence"] += ev("body #317-#348", "6. KAYNAKLAR (numbered as the next chapter), İnternet Kaynakları numbered list")


# ---- measurable checks
def mc(id_, what, expected, unit, tol, rule):
    return {"id": id_, "appliesTo": ["*"], "what": what, "expected": expected, "unit": unit, "tolerance": tol, "sourceRule": rule}


d["measurableChecks"] = [c for c in d["measurableChecks"] if c["id"] not in ("lot-title", "body-indent", "heading-spacing", "pn-font")] + [
    mc("lot-title", "list-of-tables title text", "TABLOLAR DİZİNİ", "text", 0, "lists.tables.title"),
    mc("body-indent", "x of the first line of a body paragraph", 42.5, "mm", 0.3, "typography.paragraph.firstLineIndentMm"),
    mc("heading-gap", "baseline gap heading -> next text line", 14.6, "mm", 0.3, "headings (one empty 1.5 line + 6 pt)"),
    mc("pn-font", "page number font size", 10, "pt", 0.05, "pagination.font"),
    mc("pn-distance", "page number baseline", 283.5, "mm", 0.6, "pagination.distanceFromEdgeMm"),
    mc("cover-size", "inner-cover text size and weight", [14, True], "pt/bold", 0.05, "innerCover.typography"),
    mc("cover-seals", "inner-cover seals", [2, 26.19], "count/mm", 0.1, "innerCover.sealsMm"),
    mc("cover-top", "inner-cover seal top", 25.0, "mm", 0.1, "page.margins.topMm"),
    mc("docx-margins", "DOCX body pgMar", [1417, 1701, 1417, 1701, 709, 709], "twips", 0, "page.margins")]
d["review"]["openItems"] = [
    "Body paragraph first-line indent: 12.5 mm (template, guide's own body) vs 0 (ambiguous 2.4 prose). One constant.",
    "Heading spacing: guide's empty 1.5 line (implemented as 14.7 pt + 6 pt) vs template H1 6/6 pt.",
    "Table note 11 pt (guide) vs 10 pt (template note); table cells 12 pt (guide) vs 11 pt (template).",
    "Roman numbering: OZET = i (guide, cached TOC) vs template sectPr start=2 (ethics ii).",
    "Abstract order: keywords before year/pages (guide) vs reversed (template).",
    "Department confirmation for TABLOLAR (page) vs CIZELGELER (4.2.10, cached TOC) and for the symbols-list tab stop.",
    "Dış Kapak: no sample anywhere (UNKNOWN, not generated). Footnote and equation typography UNKNOWN. Single landscape page: engine gap."]
d["engineGaps"] += [
    {"requirement": "Section-title -> first paragraph spacing: Word adds the title's space-after to the first paragraph's space-before (GİRİŞ, KAYNAKLAR); the editor/PDF collapse them across the section wrapper.", "evidence": "self-1 measurement: '1. GİRİŞ' -> first line 12.49 mm (14.7 pt) instead of 14.6 mm before the workaround; DOCX heading after=294 + paragraph before=120.", "whyEngineCannot": "engine.js additive rule only applies to adjacent blocks inside .thesis-body, not across the section wrapper.", "suggestedGenericCapability": "Apply the additive sum across the title and the first block of the same section. Workaround in the template: title space-after 20.7 pt (PDF exact, Word file 6 pt more)."},
    {"requirement": "Generated lists with leaderFlow 'inline' (page number on the last line, like Word's right tab) cannot keep wrapped entry lines at the left margin (template list rows are not hanging).", "evidence": "engine.js: leaderFlow inline forces .thesis-index-text flex with label column.", "whyEngineCannot": "no switch to disable the label hang.", "suggestedGenericCapability": "generatedIndex.hanging: 'none'."},
    {"requirement": "Single landscape figure/table page inside the editable flow (template Şekil 6 page, sectPr#4 landscape, page number stays portrait-oriented).", "evidence": "template sectPr#4 w:pgSz 16840x11904 orient=landscape; guide p.7 3.1", "whyEngineCannot": "orientation is per template section (PageOverride), not per user content.", "suggestedGenericCapability": "landscape block/section break in editable content."}]
json.dump(d, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(str(r["confidence"]).split(" ")[0] for r in d["rules"]), len(d["rules"]), len(d["conflicts"]), len(d["unknowns"]))
