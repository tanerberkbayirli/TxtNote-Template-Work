import json
from collections import Counter
G = "Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx"


def r(key, value, unit, conf, loc, quote="", notes=""):
    return {"key": key, "value": value, "unit": unit, "confidence": conf, "appliesTo": ["*"],
            "evidence": [{"source": G, "locator": loc, "quote": quote}], "notes": notes}


T = "'Tezin genel biçimi' (word/document.xml paragraphs 28-37)"
rules = [
    r("page.size", "A4", "", "UNKNOWN", "guide silent", "", "Not stated; A4 is the engine default, not a source value."),
    r("page.margins.topMm", 45, "mm", "EXPLICIT", T, "üst: 4.5 cm"),
    r("page.margins.bottomMm", 45, "mm", "EXPLICIT", T, "alt: 4.5 cm"),
    r("page.margins.leftMm", 45, "mm", "EXPLICIT", T, "sol: 4.5 cm"),
    r("page.margins.rightMm", 30, "mm", "EXPLICIT", T, "sağ: 3 cm", "The guide's own sectPr (25 mm all round) describes the guide document, not the thesis."),
    r("typography.body.fontFamily", "Times New Roman", "", "EXPLICIT", T, "Times New Roman fontunda"),
    r("typography.body.fontSizePt", 12, "pt", "EXPLICIT", T, "12 puntoda"),
    r("typography.body.lineSpacing", "1.5", "", "EXPLICIT", T, "1,5 satır aralığında"),
    r("typography.paragraph.firstLineIndentMm", 12.5, "mm", "EXPLICIT", T, "1,25 cm içeriden başlayan paragraf başı"),
    r("typography.paragraph.spaceBeforePt", 6, "pt", "EXPLICIT", T, "önceki 6nk"),
    r("typography.paragraph.spaceAfterPt", 6, "pt", "EXPLICIT", T, "sonraki 6nk"),
    r("typography.body.align", "justify", "", "EXPLICIT", T, "Her iki yana hizalanmış metin"),
    r("typography.blockQuote", "11 pt, single, 10 mm left+right", "", "EXPLICIT", T + " para 37", "11 punto ve 1 satır aralığı ile sağdan ve solda 1 cm daraltılmış", "Quotes over three lines or 40 words."),
    r("tables.fontSizePt", "smaller allowed, no number", "", "EXPLICIT", T + " para 37", "daha küçük punto ve satır aralığı kullanılabilir", "Value UNKNOWN; template keeps 12 pt."),
    r("pagination.position", "bottom", "", "EXPLICIT", "para 55", "altında ve ortasında"),
    r("pagination.align", "center", "", "EXPLICIT", "para 55", "altında ve ortasında"),
    r("pagination.front.format", "roman-lower", "", "EXPLICIT", "para 55", "küçük Romen rakamlarıyla (i, ii, iii, …)", "Up to Giriş (Ön Bölüm: Önsöz ... Simgeler)."),
    r("pagination.main.format", "arabic", "", "EXPLICIT", "para 55", "1'den başlayarak Arap rakamlarıyla", "Ana ve arka bölüm."),
    r("pagination.font", "Times New Roman 12 pt", "", "INFERRED", "para 29-31", "metnin tamamı", "Page-number font not stated; general text rule."),
    r("pagination.cover", "covers not numbered", "", "INFERRED", "numbering.xml numId 4 vs 6", "Dış Kapak / İç Kapak form a list group separate from Ön Bölüm"),
    r("pagination.distanceFromEdgeMm", None, "mm", "UNKNOWN", "guide silent"),
    r("page.header.content", None, "", "UNKNOWN", "guide silent"),
    r("citations.style", "author-year (Soyad, yıl: sayfa)", "", "EXPLICIT", "para 59-60 + examples 1-10", "(Sezer, 1990: 35)"),
    r("bibliography.order", "alphabetical by surname", "", "EXPLICIT", "para 59", "eser yazarının soyadına göre alfabetik"),
    r("bibliography.title", "Kaynakça", "", "EXPLICIT", "para 53/59", "Kaynakça başlığı altında"),
    r("bibliography.fontSizePt", 12, "pt", "INFERRED", "para 29-31", "metnin tamamı"),
    r("bibliography.hangingIndentMm", None, "mm", "UNKNOWN", "guide examples show content only"),
    r("footnotes.fontSizePt", 12, "pt", "INFERRED", "para 59", "dip not kullanılabilir", "Only permission is stated; size by general rule."),
    r("headings.h1", "'{ordinal} BÖLÜM' own line + title, centred bold", "", "INFERRED", "Ek-3 (pict 3) jc=center + b", "BİRİNCİ BÖLÜM / KENTLEŞME", "No heading typography in the guide; hierarchy only in the İçindekiler example."),
    r("headings.h2", "'1.' capitals, regular", "", "INFERRED", "Ek-3", "1. ORTA BAŞLIK 1"),
    r("headings.h3", "'1.1.' capitals, regular", "", "INFERRED", "Ek-3", "1.1. YAN BAŞLIK 1"),
    r("headings.h4", "'1.1.1.' Title Case bold", "", "INFERRED", "Ek-3", "2.1.1. Alt Başlık 1"),
    r("headings.spacing", None, "", "UNKNOWN", "guide silent"),
    r("headings.pageBreakBefore", None, "", "UNKNOWN", "guide silent"),
    r("captions.table.position", None, "", "UNKNOWN", "guide silent"),
    r("captions.numbering", "document-wide 'Tablo 1.' / 'Şekil 1.'", "", "MEASURED", "Ek-4/Ek-5 list rows", "Tablo 1. ... Tablo 10.; Şekil 1. ... Şekil 4."),
    r("toc.title", "İÇİNDEKİLER", "", "MEASURED", "Ek-3"),
    r("lists.tables.title", "TABLOLAR LİSTESİ", "", "MEASURED", "Ek-3 and para 45; Ek-4 says TABLOLAR DİZİNİ", "TABLOLAR LİSTESİ", "CONFLICT recorded."),
    r("lists.figures.title", "ŞEKİLLER LİSTESİ", "", "MEASURED", "Ek-3, Ek-5 and para 46"),
    r("lists.abbreviations.title", "KISALTMALAR DİZİNİ", "", "MEASURED", "Ek-3, Ek-6", "KISALTMALAR DİZİNİ", "Prose says Simgeler ve Kısaltmalar; example pages win (user decision)."),
    r("lists.rows.fontSizePt", 11.5, "pt", "MEASURED", "Ek-4/Ek-5 runs sz=23", "", "Conflicts with '12 puntoda' prose; example page applied."),
    r("lists.rows.weight", "bold", "", "MEASURED", "Ek-4/Ek-5 runs <w:b/>"),
    r("lists.rows.lineSpacing", "single, 0 pt", "", "MEASURED", "style 'Stil 12 nk...' after=0 line=240; Word render pitch 4.7 mm"),
    r("abbreviations.entries", "11.5 pt regular, 1.5 lines, firstLine 902 tw (15.9 mm), 0 pt after", "", "MEASURED", "Ek-6 pPr line=360 ind firstLine=902"),
    r("cover.outer", "14 pt header x4 (after 6), 2 empty, 18 pt title, 12 pt blocks, 1.5 lines, unset after = 10 pt", "", "MEASURED", "Ek-1 pict 1 txbxContent; Word render baselines"),
    r("cover.inner", "T.C. + 4 lines 12 pt (after 6), 2 empty 14 pt, 14 pt title, öğrenci no, 1.5 lines", "", "MEASURED", "Ek-2 pict 2"),
    r("abstract", "not defined", "", "UNKNOWN", "guide has no Özet/Abstract/approval/declaration"),
]


def c(topic, a, b, decision, confirm):
    return {"topic": topic, "sources": [{"path": G, "locator": a[0], "value": a[1]}, {"path": G, "locator": b[0], "value": b[1]}], "decision": decision, "needsConfirmation": confirm}


sec = [("outer-cover", "DIŞ KAPAK", "required"), ("inner-cover", "İÇ KAPAK", "required"), ("preface", "ÖNSÖZ", "optional"),
       ("toc", "İÇİNDEKİLER", "required"), ("list-tables", "TABLOLAR LİSTESİ", "conditional"), ("list-figures", "ŞEKİLLER LİSTESİ", "conditional"),
       ("symbols", "KISALTMALAR DİZİNİ", "optional"), ("introduction", "GİRİŞ", "required"), ("main", "Bölümler", "required"),
       ("conclusion", "SONUÇ VE ÖNERİLER", "required"), ("bibliography", "KAYNAKÇA", "required"), ("appendices", "EKLER", "optional")]
spec = {
    "id": "aku-sosyoloji-lisans", "schemaVersion": 2, "analyzedAt": "2026-10-02", "university": "Afyon Kocatepe Üniversitesi",
    "unit": "Fen Edebiyat Fakültesi · Sosyoloji Bölümü · Lisans Bitirme Tezi",
    "sources": [{"path": G, "role": "primary", "type": "guide (Word-made DOCX)", "version": "Last-Modified 2022-04-05; core.xml 2014-11/2015-06", "pages": 11}],
    "sourcePriority": [{"path": G, "why": "only source; prose EXPLICIT; example pages Ek-1..Ek-6 MEASURED and win over prose on conflict (user decision); the guide's own sectPr/styles describe the guide, not the thesis"}],
    "variants": [{"registryId": "aku-sosyoloji-lisans-tr-v1", "degreeType": "undergraduate", "language": "tr", "confirmed": True, "evidence": G + "#p.1-2", "differences": []}],
    "rules": rules,
    "sections": [{"id": i, "title": t, "required": q} for i, t, q in sec],
    "placeholders": {k: {"usedOn": u} for k, u in {"THESIS_TITLE": ["outer-cover", "inner-cover"], "STUDENT_NAME": ["outer-cover", "inner-cover"], "STUDENT_NUMBER": ["inner-cover"], "ADVISOR_TITLE": ["outer-cover", "inner-cover"], "ADVISOR_NAME": ["outer-cover", "inner-cover"], "SUBMISSION_YEAR": ["outer-cover", "inner-cover"]}.items()},
    "sourceGeometry": [],
    "conflicts": [
        c("Prose 12 pt vs list examples 11.5 pt", ("para 31", "12 puntoda"), ("Ek-4/5/6 runs sz=23", "11.5 pt"), "example pages applied (user decision)", True),
        c("Guide's own body vs its text rule", ("paras 21-24 pPr", "1.15 lines, firstLine 567 tw, after 10 pt"), ("paras 31-35", "1.5 lines, 1.25 cm, 6/6 pt"), "text rule (guide body is not an example page)", False),
        c("Tablolar list title", ("para 45, Ek-3", "TABLOLAR LİSTESİ"), ("Ek-4", "TABLOLAR DİZİNİ"), "LİSTESİ (2 of 3)", True),
        c("Simgeler ve Kısaltmalar title", ("para 47", "Simgeler ve Kısaltmalar"), ("Ek-3, Ek-6", "KISALTMALAR DİZİNİ"), "example pages", False),
        c("Sayfa alignment in lists", ("Ek-4", "center"), ("Ek-5", "right"), "right", False),
        c("Cover font name", ("Ek-2 rFonts", "Times"), ("para 30", "Times New Roman"), "Times New Roman", False),
        c("Example pages inconsistent among themselves", ("Ek-3", "page numbers vi/v swapped; '3.1 YANBAŞLIK1' no dot"), ("Ek-4/5/6", "1/2/2 leading empty paragraphs; hand-shifted rows"), "typos/hand shifts not reproduced", False),
    ],
    "unknowns": [{"key": k, "why": "guide silent"} for k in ["page-number font/distance", "header", "heading spacing/page breaks", "caption position/size", "table borders", "equations", "footnote format", "bibliography indent/spacing", "Önsöz format", "appendix pages", "abstract/approval/declaration pages (not in guide)", "page size"]],
    "engineGaps": [],
    "measurableChecks": [
        {"id": "margin-left", "expected": 45.0, "unit": "mm", "tolerance": 0.5, "sourceRule": "page.margins.leftMm"},
        {"id": "margin-right", "expected": 180.0, "unit": "mm (max x1)", "tolerance": 0.5, "sourceRule": "page.margins.rightMm"},
        {"id": "margin-top", "expected": 45.0, "unit": "mm", "tolerance": 0.5, "sourceRule": "page.margins.topMm"},
        {"id": "body-bottom", "expected": 252.0, "unit": "mm (max y1)", "tolerance": 0.5, "sourceRule": "page.margins.bottomMm"},
        {"id": "line-pitch", "expected": 20.7, "unit": "pt", "tolerance": 0.3, "sourceRule": "12pt x1.15 x1.5"},
    ],
}
json.dump(spec, open("C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/specs/aku-sosyoloji-lisans.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(rules), dict(Counter(x["confidence"] for x in rules)))
