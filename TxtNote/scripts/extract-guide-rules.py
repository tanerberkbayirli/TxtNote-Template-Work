#!/usr/bin/env python3
"""Pull EXPLICIT formatting rules out of an official thesis-writing guide (PDF or DOCX).

  python3 scripts/extract-guide-rules.py <guide.pdf|guide.docx> [--out rules.json] [--summary]

The guide is read sentence by sentence; every sentence that states a measurable rule is
recorded with the value, its unit, the scope it applies to (body, caption, heading, footnote,
page number, bibliography, abstract, cover) and its evidence (page or paragraph, the sentence).
Nothing is interpreted beyond the sentence: when two sentences give different values for the
same rule the rule is reported as a CONFLICT with both pieces of evidence, never averaged.

Output: { "rules": {key: {value, unit, status: EXPLICIT|CONFLICT, evidence: [...]}}, "statements": [...] }
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

NUMBER = r"(\d+(?:[.,]\d+)?)"
UNIT_LEN = r"\s*(cm|mm)\b"
FONT_NAMES = ["Times New Roman", "Arial", "Calibri", "Cambria", "Garamond", "Verdana", "Tahoma", "Helvetica", "Georgia", "Book Antiqua", "Palatino", "Courier New"]
SIDE_WORDS = {"top": r"üst(?:ten|te|en)?|top", "bottom": r"alt(?:tan|ta)?|bottom", "left": r"sol(?:dan|da)?|left|cilt(?:leme)?\s*(?:payı|tarafı)|inner|inside|binding\s+side|iç\s+kenar", "right": r"sağ(?:dan|da)?|right|outside|outer|dış\s+kenar"}
ALL_SIDES = r"(her|tüm|bütün|dört)\s+(kenar|yan|taraf)|all\s+(four\s+)?(sides|margins)|sayfa(nın)?\s+(her|tüm|dört)?\s*kenar(lar)?[ıi]?n?dan|kenarlar(ın)?dan"
LIMIT_WORDS = r"en\s+(küçük|az|fazla|büyük)|minimum|maksimum|en\s+çok|aşmamalı|kadar\s+küçül"
CLAUSE_SPLIT = r"[;:]|,\s|\sise\s|\(|\)"
SCOPE_PATTERNS = [
    ("pageSpecific", r"sadece bu sayfa|yalnız(ca)? bu sayfa|bu sayfada"),
    ("landscape", r"\byatay\b|landscape|enine"),
    ("note", r"\bnot(lar|u|ları)?\b|açıklama|kaynak gösterimi"),
    ("equation", r"denklem|formül|equation"),
    ("footnote", r"dipnot|footnote"),
    ("abbreviations", r"simgeler|kısaltmalar|dizin"),
    ("acknowledgements", r"teşekkür|tesekkur|ön ?söz|on ?soz|preface"),
    ("caption", r"(şekil|sekil|çizelge|cizelge|tablo|resim|grafik|figure|table)(?!d[ei]\b|iyle\b|inde\b)\w*\s+(başlı|basli|yazı|yazi|açıklama|aciklama|caption|altyaz)|caption|altyazı|görsel künye|künyesi|(şekil|çizelge|tablo|resim)\s+(ve|,)\s*(çizelge|tablo|resim|şekil)"),
    ("heading", r"başlı[kğ]|baslik|heading|bölüm adı"),
    ("pageNumber", r"sayfa\s+numara|page\s+number|numaraland"),
    ("bibliography", r"kaynak(ça|lar)|references|bibliograph"),
    ("abstract", r"özet|abstract|summary"),
    ("cover", r"kapak|cover|tezin adı|tez başlığı|thesis title|tezi hazırlayan|sunulan yıl|sunulduğu yıl|enstitü(sü)? adı|üniversite(si|nin)? adı|logo|amblem"),
    ("toc", r"içindekiler|contents"),
    ("quote", r"alıntı|quotation"),
    ("table", r"\b(tablo|çizelge|cizelge|table)\w*"),
]
LINE_SPACING_WORDS = [(r"tek\s+satır|single\s+(line\s+)?spac|1[.,]0\s*satır|\b1\s*satır\s*aralı", 1.0), (r"1[.,]5\s*(tam\s+)?(satır|line)|bir\s+buçuk\s+satır|one\s+and\s+a\s+half", 1.5), (r"\b2\s*satır|çift\s+satır|double\s+(line\s+)?spac|2[.,]0\s*satır", 2.0), (r"1[.,]15\s*(satır|line)", 1.15), (r"1[.,]25\s*(satır|line)", 1.25)]


def to_float(value: str) -> float:
    return float(value.replace(",", "."))


def sentences_from_text(text: str) -> list[str]:
    text = re.sub(r"-\n(?=[a-zçğıöşü])", "", text)  # hyphenated line breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    # PDF lines are not sentences: join a line to the next unless it ends a sentence or the next starts a list item/heading number.
    text = re.sub(r"(?<![.;:!?])\n(?!\s*(?:[•\-–]|\d+[.)]\s|\d+(?:\.\d+)+\s|[A-ZÇĞİÖŞÜ]{3,}\b))", " ", text)
    parts = re.split(r"(?<=[.;!?])\s+(?=[A-ZÇĞİÖŞÜ0-9“\"(])|\n", text)
    merged: list[str] = []
    for part in parts:
        # "Sayfa numaraları; 10 punto ile …": a short label before ";" is the subject of what follows, not a sentence.
        if merged and merged[-1].endswith(";") and len(merged[-1].split()) <= 5:
            merged[-1] = merged[-1] + " " + part
        else:
            merged.append(part)
    return [re.sub(r"\s+", " ", p).strip() for p in merged if len(p.strip()) > 8]


def read_document(path: Path) -> list[dict]:
    """[{location, text}] — PDF pages or DOCX paragraphs/table cells."""
    units = []
    if path.suffix.lower() == ".pdf":
        import fitz  # PyMuPDF
        doc = fitz.open(path)
        for index, page in enumerate(doc):
            units.append({"location": f"sayfa {index + 1}", "text": page.get_text()})
        return units
    if path.suffix.lower() in {".docx", ".docm", ".dotx"}:
        import docx  # python-docx
        document = docx.Document(str(path))
        body = document.element.body
        W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        # Every paragraph in document order, including those inside tables and content controls (w:sdt).
        for index, para in enumerate(body.iter(f"{W}p"), 1):
            text = "".join(t.text or "" for t in para.iter(f"{W}t"))
            if text.strip():
                units.append({"location": f"paragraf {index}", "text": text})
        return units
    raise SystemExit(f"Desteklenmeyen dosya türü: {path.suffix}")


def scope_of(sentence: str) -> str:
    low = sentence.lower()
    # "“İç Kapak” hariç tezin tamamında …": a scope named as the exception does not set the scope.
    low = re.sub(r"[“\"(]?[^,.;“”\"()]{0,25}?(kapak|dipnot|başlık|özet|kaynak\w*)[”\")]?\s+(hariç|dışında|except)", " ", low)
    for scope, pattern in SCOPE_PATTERNS:
        if re.search(pattern, low):
            return scope
    return "body"


def clause_around(sentence: str, position: int) -> str:
    """The clause of `sentence` that contains character `position` (split at ; : , ise and brackets)."""
    start = 0
    for m in re.finditer(CLAUSE_SPLIT, sentence):
        if m.start() >= position:
            return sentence[start:m.start()]
        start = m.end()
    return sentence[start:]


def scope_at(sentence: str, position: int) -> str:
    """Scope of the clause around a match; then the sentence up to the match (its subject); then the sentence."""
    clause = clause_around(sentence, position)
    scope = scope_of(clause)
    if scope != "body":
        return scope
    scope = scope_of(sentence[:position])
    return scope if scope != "body" else scope_of(sentence)


class Rules:
    def __init__(self):
        self.rules: dict[str, dict] = {}
        self.statements: list[dict] = []

    def add_label(self, key: str, value: str, sentence: str, location: str):
        """Caption labels accumulate (a guide may use Şekil and Resim side by side); never a conflict."""
        rule = self.rules.setdefault(key, {"value": [], "unit": "", "status": "EXPLICIT", "evidence": []})
        if value not in rule["value"]:
            rule["value"].append(value)
            rule["evidence"].append({"value": value, "location": location, "sentence": sentence[:300]})

    def add(self, key: str, value, unit: str, sentence: str, location: str, scope: str):
        self.statements.append({"key": key, "value": value, "unit": unit, "scope": scope, "location": location, "sentence": sentence[:300]})
        rule = self.rules.setdefault(key, {"value": value, "unit": unit, "status": "EXPLICIT", "evidence": []})
        if not any(e["sentence"] == sentence[:300] and e["value"] == value for e in rule["evidence"]):
            rule["evidence"].append({"value": value, "location": location, "sentence": sentence[:300]})
        if rule["value"] != value:
            rule.setdefault("values", [rule["value"]])
            if value not in rule["values"]:
                rule["values"].append(value)
            self.resolve(rule)

    @staticmethod
    def resolve(rule: dict):
        """Several sentences, several values: the value stated at least twice and more often than any
        other wins as EXPLICIT (majority); the minority evidence stays listed. Otherwise CONFLICT."""
        counts = {}
        for e in rule["evidence"]:
            counts[e["value"]] = counts.get(e["value"], 0) + 1
        ranked = sorted(counts.items(), key=lambda item: -item[1])
        # Tie-break: a sentence that speaks for the whole thesis ("tüm metinde", "tezin tamamında") outranks a local one.
        if len(ranked) > 1 and ranked[0][1] == ranked[1][1]:
            global_values = {e["value"] for e in rule["evidence"] if re.search(r"tüm|bütün|genel|tezin tamam|tez metni|ana metin|throughout|entire|all text", e["sentence"].lower())}
            # Second tie-break: a sentence that states a rule ("olmalıdır", "yazılmalıdır", "must") outranks an example's label.
            rule_values = {e["value"] for e in rule["evidence"] if re.search(r"malı|meli|must|should|shall|olacak|gerek", e["sentence"].lower()) and "/" not in e["sentence"]}
            for winner, how in ((next(iter(global_values)), "genel ifade") if len(global_values) == 1 else (None, None), (next(iter(rule_values)), "kural cümlesi") if len(rule_values) == 1 else (None, None)):
                if winner is None:
                    continue
                ranked.sort(key=lambda item: (item[0] != winner, -item[1]))
                rule["value"] = winner
                rule["status"] = "EXPLICIT"
                rule["majority"] = {"value": winner, "count": counts[winner], "minority": {str(v): c for v, c in ranked[1:]}, "tieBreak": how}
                return
        if len(ranked) > 1 and ranked[0][1] >= 2 and ranked[0][1] > ranked[1][1]:
            rule["value"] = ranked[0][0]
            rule["status"] = "EXPLICIT"
            rule["majority"] = {"value": ranked[0][0], "count": ranked[0][1], "minority": {str(v): c for v, c in ranked[1:]}}
        else:
            rule["status"] = "CONFLICT"
            rule.pop("majority", None)


def extract(units: list[dict]) -> Rules:
    rules = Rules()
    last_margin_sides: set[str] = set()
    for unit in units:
        for sentence in sentences_from_text(unit["text"]):
            low = sentence.lower()
            scope = scope_of(sentence)
            loc = unit["location"]
            # --- margins ---------------------------------------------------------------------------
            # Margins: only portrait body pages; landscape and single-page remarks are other scopes.
            # Page margins: a margin sentence, not an indent/quotation/reference/cover/binding-gutter one.
            margin_sentence = re.search(r"kenar\s*boşlu|kenar\s*bosluk|margin|sayfa\s+(düzeni|yapısı|kullanım)|kenar\w*\s*[-:–]?\s*(?:[^.]|\.(?=\d)){0,40}?(boşluk|cm|mm)", low) and not re.search(r"alıntı|kaynakça|kaynağın|kaynak listesi|dipnot|cilt payı|quot|karşı sayfa|arka yüz|çift yönlü|çift taraflı|double-sided|logo", low)
            # Clause-level exclusions: a number that belongs to a heading offset, indent or tab is not a page margin.
            not_margin_clause = lambda position: re.search(r"girinti|içeriden|içerden|indent|tab\b|paragraf|satır|aşağı", clause_around(low, position)) or re.search(r"başlı\w*[^.,;]{0,30}$", low[max(0, position - 40):position])
            # "Diğer üç kenarda 2,5 cm" alone: the sides the previous margin sentence did not name.
            other_only = re.search(rf"^(diğer|öteki|geri kalan|other|remaining)\s+(üç|three|3)?\s*(kenar|yan|taraf|side|margin)\w*[^\d\n]{{0,25}}?{NUMBER}{UNIT_LEN}", low)
            if other_only and last_margin_sides and scope not in ("landscape", "cover"):
                mm = to_float(other_only.group(4)) * (10 if other_only.group(5) == "cm" else 1)
                for side in {"top", "bottom", "left", "right"} - last_margin_sides:
                    rules.add(f"page.margins.{side}", mm, "mm", sentence, loc, "page")
                last_margin_sides = set()
            elif margin_sentence and re.search(NUMBER + UNIT_LEN, low) and scope_at(low, re.search(NUMBER + UNIT_LEN, low).start()) not in ("landscape", "pageSpecific", "note", "table", "caption", "footnote", "cover", "bibliography", "quote", "heading", "equation"):
                named = {side for side, words in SIDE_WORDS.items() if re.search(rf"\b(?:{words})\b", low)}
                if re.search(ALL_SIDES, low) and not named and not not_margin_clause(re.search(NUMBER + UNIT_LEN, low).start()):
                    m = re.search(NUMBER + UNIT_LEN, low)
                    mm = to_float(m.group(1)) * (10 if m.group(2) == "cm" else 1)
                    for side in ("top", "bottom", "left", "right"):
                        rules.add(f"page.margins.{side}", mm, "mm", sentence, loc, "page")
                else:
                    assigned = set()
                    # "sol kenardan 4 cm, diğer kenarlardan 2,5 cm": the rest share the second value.
                    other = re.search(rf"(diğer|öteki|geri kalan|other|remaining)\s+(üç|three|3)?\s*(kenar|yan|taraf|side|margin)\w*[^\d\n]{{0,25}}?{NUMBER}{UNIT_LEN}", low)
                    for side, words in SIDE_WORDS.items():
                        # "sol kenardan 3,5 cm", "soldan 3.5 cm", "sol: 3,5 cm", "üst ve alt kenarlardan 2,5 cm", "left margin 3.5 cm"
                        for m in re.finditer(rf"(?:{words})\b[^\d\n]{{0,45}}?{NUMBER}{UNIT_LEN}", low):
                            if not_margin_clause(m.start()):
                                continue
                            mm = to_float(m.group(1)) * (10 if m.group(2) == "cm" else 1)
                            rules.add(f"page.margins.{side}", mm, "mm", sentence, loc, "page")
                            assigned.add(side)
                            # "üst ve alt ile sağ kenar boşlukları için 2,5 cm": every side chained before the number shares it.
                            chain = re.search(r"((?:(?:üst|alt|sol|sağ|top|bottom|left|right)\w*\s*(?:ve|ile|,|and)\s*)+)$", low[max(0, m.start() - 60):m.start()])
                            chained = low[m.start():m.start(1)] + " " + (chain.group(1) if chain else "")
                            for other_side, other_words in SIDE_WORDS.items():
                                if other_side != side and re.search(rf"\b(?:{other_words})\b", chained):
                                    rules.add(f"page.margins.{other_side}", mm, "mm", sentence, loc, "page")
                                    assigned.add(other_side)
                        # "3 cm'lik sol boşluk": only the explicit adjectival form; "3.5 cm Sağ kenar" in a list is the next item, not this side.
                        for m in re.finditer(rf"{NUMBER}{UNIT_LEN}\s*'?l[ıi]k\s+(?:{words})\b", low):
                            if not_margin_clause(m.start()):
                                continue
                            mm = to_float(m.group(1)) * (10 if m.group(2) == "cm" else 1)
                            rules.add(f"page.margins.{side}", mm, "mm", sentence, loc, "page")
                            assigned.add(side)
                    if other and assigned:
                        mm = to_float(other.group(4)) * (10 if other.group(5) == "cm" else 1)
                        for side in {"top", "bottom", "left", "right"} - assigned:
                            rules.add(f"page.margins.{side}", mm, "mm", sentence, loc, "page")
                            assigned.add(side)
                    last_margin_sides = set(assigned)
            # --- font family -----------------------------------------------------------------------
            if re.fullmatch(r"\(.*\)", sentence.strip()):
                continue  # "(20 punto/ regular/ garamond)": an example's label, not a rule sentence
            for font in FONT_NAMES:
                at = low.find(font.lower())
                if at >= 0 and re.search(r"yazı|font|karakter|punto|tip|type", low) and not re.search(r"punto\s*/", clause_around(low, at)):
                    rules.add(f"{scope_at(low, at)}.fontFamily", font, "", sentence, loc, scope_at(low, at))
            # --- point sizes -----------------------------------------------------------------------
            for m in re.finditer(r"(\d{1,2}(?:[.,]5)?)\s*(?:punto|pt\b|point)", low):
                size = to_float(m.group(1))
                clause = clause_around(low, m.start())
                # "TEZ KONU BAŞLIĞI (14 Punto)": a size alone in parentheses annotates an example line, it states no rule.
                annotation = re.match(r"\s*\)", low[m.end():]) and re.search(r"\(\s*$", low[:m.start()])
                if 6 <= size <= 30 and not re.search(LIMIT_WORDS, clause) and not re.search(r"punto\s*/", clause) and not annotation:
                    s_scope = scope_at(low, m.start())
                    rules.add(f"{s_scope}.fontSizePt", size, "pt", sentence, loc, s_scope)
            # --- line spacing ----------------------------------------------------------------------
            if re.search(r"satır\s+aralı|line\s+spac|aralık", low):
                found_spacing = False
                for pattern, value in LINE_SPACING_WORDS:
                    for m in re.finditer(pattern, low):
                        found_spacing = True
                        clause = clause_around(low, m.start())
                        # "1 satır boşluk (1,5 aralıklı)" is a blank line, not the line spacing.
                        # "1 satır aralığı (1,5 aralıklı) bırakılarak": a blank line, not the line spacing.
                        if value == 1.0 and (re.search(r"boşluk|blank|bırak", clause) or re.search(r"1[.,]5\s*(satır|aralık)|bırakıl", low)):
                            continue
                        s_scope = scope_at(low, m.start())
                        rules.add(f"{s_scope}.lineHeight", value, "lines", sentence, loc, s_scope)
                # "Ana metinde satır aralıkları 1,5 olmalıdır": the bare number after the words, not a length or a blank line.
                bare = None if found_spacing else re.search(r"satır\s+aralı\w*\s+(?:[^\d\n]{0,20}?)(1[.,]5|1[.,]15|1[.,]25|2[.,]0|1[.,]0|2|1)\b(?!\s*(?:cm|mm|punto|pt|nk|satır))", low)
                if bare and not re.search(r"boşluk|blank|bırak", clause_around(low, bare.start(1))):
                    s_scope = scope_at(low, bare.start())
                    rules.add(f"{s_scope}.lineHeight", to_float(bare.group(1)), "lines", sentence, loc, s_scope)
            # --- paragraph indent / spacing --------------------------------------------------------
            if re.search(r"paragraf|paragraph", low):
                m = re.search(rf"(girinti|içeriden|içerden|indent|paragraf başı|ilk satır)[^\d\n]{{0,40}}?{NUMBER}{UNIT_LEN}", low) or re.search(rf"{NUMBER}{UNIT_LEN}[^\d\n]{{0,30}}?(girinti|içeriden|içerden|indent)", low)
                if m:
                    num, unit_name = (m.group(2), m.group(3)) if m.re.pattern.startswith("(girinti") else (m.group(1), m.group(2))
                    rules.add(f"{scope}.firstLineIndentMm", to_float(num) * (10 if unit_name == "cm" else 1), "mm", sentence, loc, scope)
                if re.search(r"girinti\s+(yapılmaz|verilmez|bırakılmaz|kullanılmaz)|içeriden\s+başlanmaz|boşluk\s+bırakılmadan\s+başla|no\s+indent", low):
                    rules.add(f"{scope}.firstLineIndentMm", 0.0, "mm", sentence, loc, scope)
                for m in re.finditer(r"(önce|önceki|sonra|sonraki|before|after)[^\d\n]{0,25}?(\d{1,2})\s*(nk|pt|punto)", low):
                    key = "spaceBeforePt" if m.group(1).startswith(("önce", "before")) else "spaceAfterPt"
                    rules.add(f"{scope}.{key}", float(m.group(2)), "pt", sentence, loc, scope)
                m = re.search(r"paragraflar\s+aras[ıi]n?d?a?[^\d\n]{0,40}?(\d{1,2})\s*(nk|pt|punto)", low)
                if m:
                    rules.add(f"{scope}.spaceAfterPt", float(m.group(1)), "pt", sentence, loc, scope)
                if re.search(r"paragraflar\s+aras[ıi]n?d?a?[^.\n]{0,30}?(bir|1)\s+satır\s+boşluk", low):
                    rules.add(f"{scope}.blankLineBetweenParagraphs", True, "", sentence, loc, scope)
            # --- alignment -------------------------------------------------------------------------
            if re.search(r"iki yana yasl|her iki yana|justif", low):
                rules.add(f"{scope}.align", "justify", "", sentence, loc, scope)
            # --- captions: position and labels ----------------------------------------------------
            for kind, words in (("figures", r"şekil|sekil|resim|grafik|figure"), ("tables", r"çizelge|cizelge|tablo|table")):
                for m in re.finditer(rf"\b({words})(?!d[ei]\b|iyle\b|inde\b)\w*\s+(ve\s+\w+\s+)?(başlı|basli|yazı|yazi|caption|adı|numara|açıklama|altına|altında|altlarına|üstüne|üstünde|üstlerine|üzerine|üzerinde|above|below)", low):
                    clause = clause_around(low, m.start())
                    # Position needs the caption itself in the clause: a title/number line, not a note under the table.
                    if not re.search(r"başlı|basli|yazı|yazi|caption|adı|numara", clause):
                        continue
                    if re.search(r"ile ilgili açıklama|açıklama yapılması|bilgi not|dipnot", clause):
                        continue
                    if re.search(r"\balt(ın|ında|ına|ta|tan|larına|larında)?\b|below|beneath|under", clause) and not re.search(r"üst(ün|ünde|üne|lerine)?\b|üzer(ine|inde)\b|above", clause):
                        rules.add(f"{kind}.position", "below", "", sentence, loc, "caption")
                    elif re.search(r"üst(ün|ünde|üne|lerine)?\b|üzer(ine|inde)\b|above", clause) and not re.search(r"\balt(ın|ında|ına|larına)?\b|below", clause):
                        rules.add(f"{kind}.position", "above", "", sentence, loc, "caption")
                    canonical = {"sekil": "Şekil", "şekil": "Şekil", "resim": "Resim", "grafik": "Grafik", "cizelge": "Çizelge", "çizelge": "Çizelge", "tablo": "Tablo", "figure": "Figure", "table": "Table"}
                    for label in re.finditer(rf"\b({words})\b", clause):
                        rules.add_label(f"{kind}.labels", canonical[label.group(1)], sentence, loc)
            # --- page numbering --------------------------------------------------------------------
            if re.search(r"sayfa\s+numara|page\s+number", low):
                if re.search(r"\balt(ın|ında|ına|a|ta)?\b|bottom|footer|altbilgi", low) and not re.search(r"üst(ün|ünde|üne|e)?\b|top|header", low):
                    rules.add("page.numbering.position", "bottom", "", sentence, loc, "pageNumber")
                elif re.search(r"üst(ün|ünde|üne|e)?\b|top|header|üstbilgi", low) and not re.search(r"\balt(ın|ında|ına|a)?\b|bottom", low):
                    rules.add("page.numbering.position", "top", "", sentence, loc, "pageNumber")
                if re.search(r"orta(sın|sında|ya|lan|lı)?\b|cent(er|re)", low):
                    rules.add("page.numbering.align", "center", "", sentence, loc, "pageNumber")
                elif re.search(r"sağ(ın|ında|ına|a)?\b|right", low):
                    rules.add("page.numbering.align", "right", "", sentence, loc, "pageNumber")
                if re.search(r"romen|roman", low):
                    rules.add("page.numbering.frontMatterRoman", True, "", sentence, loc, "pageNumber")
                if re.search(r"küçük\s+romen|lower\s*case\s+roman|\(i,\s*ii", low):
                    rules.add("page.numbering.frontMatterFormat", "roman-lower", "", sentence, loc, "pageNumber")
                elif re.search(r"büyük\s+romen|upper\s*case\s+roman|\(I,\s*II", sentence, re.I) and not re.search(r"küçük", low):
                    rules.add("page.numbering.frontMatterFormat", "roman-upper", "", sentence, loc, "pageNumber")
            # --- headings: case / weight -----------------------------------------------------------
            if scope == "heading":
                level = None
                m = re.search(r"(birinci|ikinci|üçüncü|dördüncü|1\.|2\.|3\.|4\.|first|second|third|fourth)\s*(derece|düzey|seviye|level|dereceden)", low)
                if m:
                    level = {"birinci": 1, "ikinci": 2, "üçüncü": 3, "dördüncü": 4, "1.": 1, "2.": 2, "3.": 3, "4.": 4, "first": 1, "second": 2, "third": 3, "fourth": 4}[m.group(1)]
                elif re.search(r"ana\s+bölüm|bölüm\s+başlı|chapter", low):
                    level = 1
                elif re.search(r"alt\s+bölüm|alt\s+başlık|sub-?heading", low):
                    level = 2
                if level:
                    if re.search(r"büyük\s+harf|capital|upper\s*case", low) and not re.search(r"ilk\s+harf|baş\s+harf", low):
                        rules.add(f"headings.{level}.textTransform", "uppercase", "", sentence, loc, "heading")
                    if re.search(r"koyu|kalın|bold", low):
                        rules.add(f"headings.{level}.fontWeight", 700, "", sentence, loc, "heading")
                    m2 = re.search(r"(\d{1,2})\s*punto", low)
                    if m2:
                        rules.add(f"headings.{level}.fontSizePt", float(m2.group(1)), "pt", sentence, loc, "heading")
            # --- bibliography hanging indent ------------------------------------------------------
            if scope == "bibliography":
                m = re.search(rf"(asılı|asili|hanging)[^\d\n]{{0,30}}?{NUMBER}{UNIT_LEN}", low)
                if m:
                    rules.add("bibliography.hangingIndentMm", to_float(m.group(2)) * (10 if m.group(3) == "cm" else 1), "mm", sentence, loc, "bibliography")
            # --- paper ----------------------------------------------------------------------------
            if re.search(r"\ba4\b", low) and re.search(r"kâğıt|kağıt|paper|sayfa", low):
                rules.add("page.size", "A4", "", sentence, loc, "page")
    return rules


def main() -> int:
    parser = argparse.ArgumentParser(description="Kılavuz metninden açık biçim kurallarını çıkar.")
    parser.add_argument("guide", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()
    units = read_document(args.guide)
    rules = extract(units)
    out = args.out or (Path(__file__).resolve().parent.parent / "output" / "guide-rules" / (args.guide.stem + ".rules.json"))
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"file": {"name": args.guide.name, "path": str(args.guide)}, "units": len(units), "rules": rules.rules, "statements": rules.statements}
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    conflicts = [k for k, r in rules.rules.items() if r["status"] == "CONFLICT"]
    if args.summary:
        print(f"# {args.guide.name}: {len(rules.rules)} kural, {len(conflicts)} çelişki, {len(rules.statements)} cümle\n")
        for key, rule in sorted(rules.rules.items()):
            values = rule.get("values", [rule["value"]])
            print(f"- {key}: {' | '.join(str(v) for v in values)} {rule['unit']} [{rule['status']}] — {rule['evidence'][0]['location']}: “{rule['evidence'][0]['sentence'][:110]}”")
    else:
        print(f"{len(rules.rules)} kural ({len(conflicts)} çelişki) → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
