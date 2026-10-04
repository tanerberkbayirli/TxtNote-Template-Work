#!/usr/bin/env python3
"""Turn a docx-spec measurement into a ThesisTemplate draft (schema v1).

  python3 scripts/docx-spec-to-template.py output/docx-spec/X.spec.json \
      --university-id aku --university-name "Afyon Kocatepe Üniversitesi" \
      --institute-id fbe --institute-name "Fen Bilimleri Enstitüsü" --degree master \
      [--template-id aku-fbe-master-tr-v1] [--language tr] [--source-url URL]

Every value is copied from the measurement (MEASURED). Where the DOCX does
not establish a value the field is left out and listed in `unknown` with the
reason; a few derivations are marked INFERRED with their evidence. The draft is
never silently completed with invented defaults: a draft whose required fields
are unknown is written with `valid: false` and must be finished from the guide.

Output: output/template-drafts/<template-id>.draft.json containing
  { template, unknown[], inferred[], evidence{}, valid }
"""

from __future__ import annotations

import argparse
import collections
import json
import re
from datetime import date
from pathlib import Path

MM_PER_PT = 25.4 / 72
NUMBER_FORMATS = {"decimal": "arabic", "lowerRoman": "roman-lower", "upperRoman": "roman-upper"}
# Word's single line for common thesis fonts, measured as em of the type size (MCBÜ PDF: TNR 1.15).
SINGLE_LINE_EM = {"Times New Roman": 1.15, "Arial": 1.15, "Cambria": 1.17, "Calibri": 1.22}
KIND_PATTERNS = [
    ("mainContent", r"^(GİRİŞ|GIRIS|INTRODUCTION)$"),
    ("tableOfContents", r"^(İÇİNDEKİLER|ICINDEKILER|CONTENTS|TABLE OF CONTENTS)"),
    ("listOfFigures", r"^(ŞEKİLLER|SEKILLER|ŞEKİL LİSTESİ|LIST OF FIGURES|FIGURES)"),
    ("listOfTables", r"^(ÇİZELGELER|CIZELGELER|TABLOLAR|TABLO LİSTESİ|LIST OF TABLES)"),
    ("listOfAbbreviations", r"^(SİMGELER|SIMGELER|KISALTMALAR|SEMBOLLER|LIST OF (SYMBOLS|ABBREVIATIONS)|ABBREVIATIONS|SYMBOLS)"),
    ("abstract", r"^(ÖZET|OZET)$"),
    ("englishAbstract", r"^(ABSTRACT|SUMMARY)$"),
    ("acknowledgements", r"^(TEŞEKKÜR|TESEKKUR|ACKNOWLEDGEMENTS?)"),
    ("preface", r"^(ÖN ?SÖZ|ON ?SOZ|PREFACE)"),
    ("dedication", r"^(İTHAF|ITHAF|DEDICATION)"),
    ("declaration", r"^(BİLİMSEL ETİK|ETİK|BEYAN|TAAHHÜT|TAAHHUT|DECLARATION|ETHICAL)"),
    ("approval", r"^(TEZ ONAY|ONAY|KABUL VE ONAY|JÜRİ|JURI|APPROVAL)"),
    ("bibliography", r"^(KAYNAKLAR|KAYNAKÇA|KAYNAKCA|REFERENCES|BIBLIOGRAPHY)"),
    ("appendices", r"^(EKLER|EK[ -]?\d|APPENDI)"),
    ("curriculumVitae", r"^(ÖZGEÇMİŞ|OZGECMIS|CURRICULUM VITAE|CV)$"),
]
STANDARD_PLACEHOLDERS = {
    "UNIVERSITY_NAME": {"label": "Üniversite", "type": "text", "required": True},
    "INSTITUTE_NAME": {"label": "Enstitü", "type": "text"},
    "DEPARTMENT_NAME": {"label": "Anabilim dalı", "type": "text"},
    "PROGRAM_NAME": {"label": "Program", "type": "text"},
    "THESIS_TITLE": {"label": "Tez başlığı", "type": "text", "required": True},
    "THESIS_TITLE_EN": {"label": "İngilizce başlık", "type": "text"},
    "STUDENT_NAME": {"label": "Öğrenci", "type": "text", "required": True},
    "STUDENT_NUMBER": {"label": "Öğrenci numarası", "type": "text"},
    "ADVISOR_TITLE": {"label": "Danışman unvanı", "type": "text"},
    "ADVISOR_NAME": {"label": "Danışman", "type": "text"},
    "CO_ADVISOR_TITLE": {"label": "İkinci danışman unvanı", "type": "text"},
    "CO_ADVISOR_NAME": {"label": "İkinci danışman", "type": "text"},
    "DEGREE_TYPE": {"label": "Tez türü", "type": "text"},
    "CITY": {"label": "Şehir", "type": "text"},
    "YEAR": {"label": "Yıl", "type": "number"},
    "DATE": {"label": "Tarih", "type": "date"},
    "TOTAL_PAGES": {"label": "Sayfa sayısı", "type": "number", "derived": "totalPages"},
}


def tr_upper(value: str) -> str:
    return value.replace("i", "İ").replace("ı", "I").upper()


class Draft:
    def __init__(self, spec: dict, args):
        self.spec, self.args = spec, args
        self.unknown: list[dict] = []
        self.inferred: list[dict] = []
        self.evidence: dict = {}
        self.file = spec["file"]["name"]

    def unk(self, field: str, reason: str):
        self.unknown.append({"field": field, "reason": reason})

    def inf(self, field: str, value, reasoning: str):
        self.inferred.append({"field": field, "value": value, "reasoning": reasoning})

    def ev(self, field: str, value, where: str):
        self.evidence[field] = {"value": value, "source": f"{self.file} › {where}", "status": "MEASURED"}

    # --- page ------------------------------------------------------------------------------------
    def body_section(self) -> dict | None:
        sections = self.spec["sections"]
        if not sections:
            return None
        decimal = [s for s in sections if s["numbering"]["format"] == "decimal"]
        pool = decimal or sections
        return max(pool, key=lambda s: s["paragraphs"])

    def line_height(self, spacing: dict | None, size_pt: float | None, field: str) -> float | None:
        if not spacing:
            return None
        if "lines" in spacing:
            return spacing["lines"]
        if size_pt:
            value = round(spacing["pt"] / size_pt, 3)
            self.inf(field, value, f"Word '{spacing['rule']}' {spacing['pt']} pt satır aralığı, {size_pt} pt yazıya oranlandı")
            return value
        return None

    def page(self) -> dict:
        s = self.body_section()
        if s is None:
            self.unk("page", "Belgede sectPr yok")
            return {}
        where = f"sectPr#{s['index']} (gövde bölümü, {s['paragraphs']} paragraf)"
        m = s["marginsMm"]
        page = {
            "size": "A4" if abs((s["page"]["widthMm"] or 0) - 210) < 1 and abs((s["page"]["heightMm"] or 0) - 297) < 1 else "custom",
            "widthMm": round(s["page"]["widthMm"] or 0, 1), "heightMm": round(s["page"]["heightMm"] or 0, 1),
            "orientation": s["page"]["orientation"],
            "margins": {"topMm": m["top"], "bottomMm": m["bottom"], "leftMm": m["left"], "rightMm": m["right"]},
        }
        self.ev("page.margins", page["margins"], f"{where} › w:pgMar")
        self.ev("page.size", [page["widthMm"], page["heightMm"]], f"{where} › w:pgSz")
        if m.get("gutter"):
            self.unk("page.margins.gutter", f"Cilt payı {m['gutter']} mm ölçüldü; motor cilt payını ayrı tutmuyor (sol kenara eklenmedi)")
        # Page number: where the PAGE field sits.
        field, kind = None, None
        for name, refs in (("footer", s["footers"]), ("header", s["headers"])):
            hf = refs.get("default") or next(iter(refs.values()), None)
            if hf and hf.get("hasPageField"):
                field, kind = hf["pageField"], name
                break
        for name in ("header", "footer"):
            page[name] = {"heightMm": 0, "distanceMm": m[name] or 0, "content": "", "firstPage": "omit" if s["titlePage"] else "same"}
        if field:
            align = field["align"] if field["align"] in ("left", "center", "right") else "center"
            if field["align"] not in ("left", "center", "right"):
                self.inf("page.numbering.align", align, f"Sayfa numarası paragrafı '{field['align']}' hizalı; tek alan için merkez varsayıldı")
            page["numbering"] = {"enabled": True, "position": "bottom" if kind == "footer" else "top", "align": align, "format": NUMBER_FORMATS.get(s["numbering"]["format"], "arabic"), "startAt": s["numbering"]["start"] or 1, "restart": bool(s["numbering"]["start"])}
            self.ev("page.numbering", page["numbering"], f"{where} › {kind} PAGE alanı, w:pgNumType")
            distance = m["footer"] if kind == "footer" else m["header"]
            size = field.get("sizePt")
            if size:
                page[kind] = {"heightMm": round(size * 1.15 * MM_PER_PT, 2), "distanceMm": distance, "content": "", "firstPage": "omit" if s["titlePage"] else "same"}
                self.inf(f"page.{kind}.heightMm", page[kind]["heightMm"], f"Sayfa numarası yazısı {size} pt × 1,15 satır")
                self.ev(f"page.{kind}.distanceMm", distance, f"{where} › w:pgMar/@w:{kind}")
            else:
                page[kind] = {"heightMm": distance, "distanceMm": distance, "content": "", "firstPage": "omit" if s["titlePage"] else "same"}
                self.unk(f"page.{kind}.font", "Sayfa numarası yazı tipi/boyutu belgede açıkça ayarlanmamış (stil/varsayılan miras); kılavuzdan alınmalı")
        else:
            page["numbering"] = {"enabled": False, "position": "bottom", "align": "center", "format": NUMBER_FORMATS.get(s["numbering"]["format"], "arabic")}
            self.unk("page.numbering", "Gövde bölümünün üstbilgi/altbilgisinde PAGE alanı bulunamadı")
        return page

    # --- typography ------------------------------------------------------------------------------
    def style_by_name(self, name: str) -> dict | None:
        for style in self.spec["styles"].values():
            if (style.get("name") or "").lower() == name.lower():
                return style
        return None

    def body(self) -> tuple[dict, dict | None]:
        profile = self.spec["profile"].get("bodyProfile")
        normal = self.style_by_name("Normal")
        body, paragraph = {}, {}
        if profile:
            body = {"fontFamily": profile["font"], "fontSizePt": profile["sizePt"], "align": profile["align"]}
            spacing = next((p["lineSpacing"] for p in self.spec["profile"].get("headings", []) if False), None)
            # Line spacing from the profile key ("1.5 satır" / "18.0 pt (exact)").
            match = re.match(r"([\d.]+) satır", profile["lineSpacing"])
            if match:
                body["lineHeight"] = float(match.group(1))
            else:
                match = re.match(r"([\d.]+) pt", profile["lineSpacing"])
                if match and profile["sizePt"]:
                    body["lineHeight"] = self.line_height({"rule": "exact", "pt": float(match.group(1))}, profile["sizePt"], "typography.body.lineHeight")
            indent = profile.get("indent") or {}
            if indent.get("firstLineMm") is not None:
                paragraph["firstLineIndentMm"] = indent["firstLineMm"]
            if profile.get("spaceBeforePt") is not None:
                paragraph["spaceBeforePt"] = profile["spaceBeforePt"]
            if profile.get("spaceAfterPt") is not None:
                paragraph["spaceAfterPt"] = profile["spaceAfterPt"]
            self.ev("typography.body", body, f"gövde profili: {profile['basis']}, {profile['variants']} farklı biçim")
            if profile["variants"] > 1:
                self.inf("typography.body", body, f"Uzun paragrafların en sık biçimi alındı ({profile['basis']}); diğer {profile['variants'] - 1} varyant doğrudan biçimlendirme")
        elif normal:
            run, para = normal["effective"]["run"], normal["effective"]["paragraph"]
            font = (run.get("font") or {}).get("ascii") or (run.get("font") or {}).get("hAnsi")
            body = {"fontFamily": font, "fontSizePt": run.get("sizePt"), "align": para.get("align", "left")}
            body["lineHeight"] = self.line_height(para.get("lineSpacing"), run.get("sizePt"), "typography.body.lineHeight")
            self.ev("typography.body", body, "Normal stili (örnek metin yok)")
        if not body.get("fontFamily"):
            self.unk("typography.body.fontFamily", "Ne örnek gövde metni ne Normal stili yazı tipi belirtiyor")
        if not body.get("fontSizePt"):
            self.unk("typography.body.fontSizePt", "Yazı boyutu belgede açıkça ayarlanmamış")
        if body.get("lineHeight") is None:
            self.unk("typography.body.lineHeight", "Satır aralığı ne paragraf ne stil düzeyinde belirtilmiş (Word tek aralık varsayar; kılavuz teyidi gerekli)")
            body.pop("lineHeight", None)
        body = {k: v for k, v in body.items() if v is not None}
        return body, (paragraph or None)

    def chapter_level(self) -> int:
        """Word outline level that carries the numbered thesis chapters (1-based)."""
        if hasattr(self, "_chapter_level"):
            return self._chapter_level
        records = self.spec["profile"].get("headings", [])
        by_level = collections.defaultdict(list)
        for h in records:
            by_level[h["level"]].append(h)
        numbered = [level for level, items in sorted(by_level.items()) if sum(bool(re.match(r"^\d+\.?\s", i["text"])) for i in items) >= max(1, len(items) // 2)]
        intro = [h["level"] for h in records if re.search(r"^(\d+\.?\s*)?(GİRİŞ|GIRIS|INTRODUCTION)\b", tr_upper(h["text"]))]
        level = min(numbered) if numbered else (min(intro) if intro else 1)
        if level != 1:
            self.inf("headings.chapterLevel", level, f"Numaralı bölüm başlıkları Word'ün {level}. anahat düzeyinde; üst düzey ön sayfa başlıkları için kullanılmış")
        self._chapter_level = level
        return level

    def front_title_records(self) -> list[dict]:
        level = self.chapter_level()
        return [h for h in self.spec["profile"].get("headings", []) if h["level"] <= level and not re.match(r"^\d+\.?\s", h["text"]) and any(re.search(p, tr_upper(h["text"])) for _, p in KIND_PATTERNS)]

    def headings(self, body: dict) -> dict:
        out = {}
        by_level = collections.defaultdict(list)
        base = self.chapter_level()
        for h in self.spec["profile"].get("headings", []):
            if h["level"] >= base:
                by_level[h["level"] - base + 1].append(h)
        for level in (1, 2, 3, 4):
            style = self.style_by_name(f"heading {level + base - 1}")
            records = by_level.get(level, [])
            rule = {}
            if records:
                keys = collections.Counter((r["font"], r["sizePt"], bool(r["bold"]), r["align"], json.dumps(r["lineSpacing"]), r["spaceBeforePt"], r["spaceAfterPt"]) for r in records)
                (font, size, bold, align, spacing, before, after), count = keys.most_common(1)[0]
                rule = {"fontFamily": font, "fontSizePt": size, "fontWeight": 700 if bold else 400, "align": align}
                lh = self.line_height(json.loads(spacing), size, f"typography.headings.{level}.lineHeight")
                if lh:
                    rule["lineHeight"] = lh
                if before is not None:
                    rule["spaceBeforePt"] = before
                if after is not None:
                    rule["spaceAfterPt"] = after
                texts = [r["text"] for r in records]
                if all(t == tr_upper(t) for t in texts if re.search(r"[a-zçğıöşü]", t.lower())):
                    rule["textTransform"] = "uppercase"
                    self.inf(f"typography.headings.{level}.textTransform", "uppercase", f"{len(texts)} başlığın tamamı büyük harf")
                fmt = next((r.get("numberingFormat") for r in records if r.get("numberingFormat")), None)
                if fmt:
                    rule["numbering"] = {"enabled": True, "format": re.sub(r"%(\d)", r"{\1}", fmt)}
                    self.ev(f"typography.headings.{level}.numbering", rule["numbering"], "numbering.xml lvlText")
                elif all(re.match(r"^\d+(\.\d+)*\.?\s", t) for t in texts):
                    manual = re.match(r"^(\d+(?:\.\d+)*)(\.?)\s", texts[0])
                    rule["numbering"] = {"enabled": True, "format": ".".join("{%d}" % (i + 1) for i in range(manual.group(1).count(".") + 1)), "suffix": manual.group(2)}
                    self.inf(f"typography.headings.{level}.numbering", rule["numbering"], "Başlık metinleri elle numaralanmış (ör. “" + texts[0][:20] + "”)")
                self.ev(f"typography.headings.{level}", rule, f"{count}/{len(records)} başlık paragrafı")
            elif style:
                run, para = style["effective"]["run"], style["effective"]["paragraph"]
                font = (run.get("font") or {}).get("ascii") or (run.get("font") or {}).get("hAnsi") or body.get("fontFamily")
                rule = {"fontFamily": font, "fontSizePt": run.get("sizePt") or body.get("fontSizePt"), "fontWeight": 700 if run.get("bold") else 400, "align": para.get("align", "left")}
                lh = self.line_height(para.get("lineSpacing"), rule["fontSizePt"], f"typography.headings.{level}.lineHeight")
                if lh:
                    rule["lineHeight"] = lh
                for key, name in (("spaceBeforePt", "spaceBeforePt"), ("spaceAfterPt", "spaceAfterPt")):
                    if para.get(key) is not None:
                        rule[name] = para[key]
                if run.get("caps"):
                    rule["textTransform"] = "uppercase"
                self.ev(f"typography.headings.{level}", rule, f"stil {style['styleId']} (kullanım yok)")
            else:
                self.unk(f"typography.headings.{level}", f"Belgede {level}. düzey başlık stili veya örneği yok")
                continue
            rule["keepWithNext"] = True
            if para_keep := (style or {}).get("effective", {}).get("paragraph", {}).get("keepNext"):
                rule["keepWithNext"] = bool(para_keep)
            if not rule.get("fontFamily") or not rule.get("fontSizePt"):
                self.unk(f"typography.headings.{level}", "Yazı tipi/boyutu belirlenemedi")
                continue
            out[str(level)] = {k: v for k, v in rule.items() if v is not None}
        return out

    def captions(self, body: dict, kind: str) -> dict | None:
        records = [c for c in self.spec["profile"].get("captions", []) if (c["beforeTable"] or c["afterTable"]) == (kind == "tables") and (kind == "tables" or c["hasDrawing"] or not (c["beforeTable"] or c["afterTable"]))]
        if not records:
            self.unk(kind, f"Belgede örnek {'çizelge/tablo' if kind == 'tables' else 'şekil'} yazısı yok")
            return None
        labels = collections.Counter(re.match(r"^\s*(\S+)", c["text"]).group(1) for c in records)
        preferred = [l for l in labels if tr_upper(l) in ("ŞEKİL", "SEKIL", "FIGURE")] if kind == "figures" else [l for l in labels if tr_upper(l) in ("ÇİZELGE", "CIZELGE", "TABLO", "TABLE")]
        label = preferred[0] if preferred else labels.most_common(1)[0][0]
        if len(labels) > 1:
            self.unk(f"{kind}.extraLabels", f"Belgede birden çok etiket var: {dict(labels)}; motor şekil/tablo dışında ayrı dizin (ör. Resim) tutmuyor")
        records = [c for c in records if re.match(r"^\s*(\S+)", c["text"]).group(1) == label] or records
        keys = collections.Counter((c["font"], c["sizePt"], bool(c["bold"]), c["align"], json.dumps(c["lineSpacing"])) for c in records)
        (font, size, bold, align, spacing), count = keys.most_common(1)[0]
        position = "above" if kind == "tables" and sum(c["beforeTable"] for c in records) >= sum(c["afterTable"] for c in records) else "below"
        if kind == "tables":
            self.ev(f"{kind}.position", position, f"{sum(c['beforeTable'] for c in records)} üstte / {sum(c['afterTable'] for c in records)} altta")
        chapter = all(re.search(r"\d+\.\d+", c["text"][:20]) for c in records)
        rule = {"label": label, "position": position, "style": {"fontFamily": font or body.get("fontFamily"), "fontSizePt": size or body.get("fontSizePt"), "fontWeight": 700 if bold else 400, "align": align}, "numbering": {"scope": "chapter" if chapter else "document", "format": "{chapter}.{n}" if chapter else "{n}", "sequence": "arabic"}}
        lh = self.line_height(json.loads(spacing), rule["style"]["fontSizePt"], f"{kind}.style.lineHeight")
        if lh:
            rule["style"]["lineHeight"] = lh
        self.ev(kind, rule, f"{count}/{len(records)} yazı; etiket sayımı {dict(labels)}")
        if not rule["style"]["fontSizePt"]:
            self.unk(f"{kind}.style.fontSizePt", "Yazı boyutu belirlenemedi")
            return None
        return rule

    def footnotes(self, body: dict) -> dict | None:
        style = self.style_by_name("footnote text")
        if not style:
            return None
        run, para = style["effective"]["run"], style["effective"]["paragraph"]
        rule = {}
        font = (run.get("font") or {}).get("ascii")
        if font:
            rule["fontFamily"] = font
        if run.get("sizePt"):
            rule["fontSizePt"] = run["sizePt"]
        lh = self.line_height(para.get("lineSpacing"), run.get("sizePt") or body.get("fontSizePt"), "typography.footnotes.lineHeight")
        if lh:
            rule["lineHeight"] = lh
        if para.get("align"):
            rule["align"] = para["align"]
        settings = self.spec["settings"].get("footnotes") or {}
        rule["placement"] = "pageBottom" if settings.get("position", "pageBottom") == "pageBottom" else "sectionEnd"
        self.ev("typography.footnotes", rule, f"stil {style['styleId']} + settings.xml footnotePr")
        if not rule.get("fontSizePt"):
            self.unk("typography.footnotes.fontSizePt", "Dipnot yazı boyutu stilde belirtilmemiş")
        return rule

    # --- sections --------------------------------------------------------------------------------
    def sections(self, headings: dict) -> tuple[list[dict], dict]:
        spec_sections = self.spec["sections"]
        records = self.spec["profile"].get("headings", [])
        # Map each level-1 heading to a kind; keep document order; attach the physical section's numbering.
        found: list[dict] = []
        seen_kinds = set()
        base = self.chapter_level()
        # Outline headings plus unstyled all-caps titles (many templates format front titles by hand).
        candidates = [h for h in records if h["level"] <= base] + [{**t, "level": base} for t in self.spec["profile"].get("titleCandidates", [])]
        candidates.sort(key=lambda h: h["paragraph"])
        for h in candidates:
            numbered = bool(re.match(r"^\d+\.?\s", h["text"]))
            text = tr_upper(re.sub(r"^[\d.\s]+", "", h["text"]).strip())
            kind = None if numbered and h["level"] == base else next((k for k, pattern in KIND_PATTERNS if re.search(pattern, text)), None)
            if kind is None and numbered and h["level"] == base and "mainContent" not in seen_kinds:
                kind = "mainContent"
            if kind is None or kind in seen_kinds:
                continue
            seen_kinds.add(kind)
            found.append({"kind": kind, "title": re.sub(r"^[\d.\s]+", "", h["text"]).strip(), "paragraph": h["paragraph"], "align": h["align"], "bold": h["bold"], "sizePt": h["sizePt"]})
        # Physical section boundaries by cumulative paragraph counts → numbering per heading.
        bounds, total = [], 0
        for s in spec_sections:
            total += s["paragraphs"]
            bounds.append((total, s))

        restarted: set[int] = set()

        def numbering_for(paragraph_index: int) -> dict | None:
            for end, s in bounds:
                if paragraph_index < end:
                    fmt = NUMBER_FORMATS.get(s["numbering"]["format"])
                    if not fmt:
                        return None
                    rule = {"format": fmt}
                    # The restart belongs to the first thesis section inside that physical section only.
                    if s["numbering"]["start"] and s["index"] not in restarted:
                        restarted.add(s["index"])
                        rule.update({"startAt": s["numbering"]["start"], "restart": True})
                    return rule
            return None

        h1 = headings.get("1", {})

        titles = {f["kind"]: f["title"] for f in found}
        sections = [{"id": "cover", "type": "outerCover", "title": "Kapak", "status": "required", "group": "cover", "mode": "editable", "overrides": {"page": {"numbering": {"enabled": False}}, "body": {"align": "center", "firstLineIndentMm": 0}}}]
        self.unk("sections.cover.blocks", "Kapak/iç kapak düzeni belgeden otomatik çıkarılmadı (2. adım: resmî DOCX kapak sayfasının içe aktarımı)")
        generated = {"tableOfContents": "toc", "listOfFigures": "figures", "listOfTables": "tables"}
        groups = {"abstract": "front", "englishAbstract": "front", "acknowledgements": "front", "preface": "front", "dedication": "front", "declaration": "front", "approval": "front", "tableOfContents": "front", "listOfFigures": "front", "listOfTables": "front", "listOfAbbreviations": "front", "mainContent": "body", "bibliography": "back", "appendices": "back", "curriculumVitae": "back"}
        for f in found:
            kind = f["kind"]
            section = {"id": re.sub(r"(?<!^)(?=[A-Z])", "-", kind).lower(), "type": kind, "title": f["title"], "status": "required", "group": groups.get(kind, "front")}
            if kind in generated:
                section["mode"] = "generated"
                section["generatedIndex"] = {"kind": generated[kind], "title": f["title"], "includePageNumbers": True, "leader": "dots"}
                if generated[kind] == "toc":
                    section["generatedIndex"]["levels"] = [int(k) for k in headings]
            else:
                section["mode"] = "editable"
                section["showTitle"] = kind != "mainContent"
            if kind in ("appendices", "curriculumVitae", "dedication", "acknowledgements", "preface"):
                section["status"] = "optional"
            numbering = numbering_for(f["paragraph"])
            overrides = {}
            if numbering:
                overrides["page"] = {"numbering": numbering}
            # Front-matter titles rendered differently from chapter headings (e.g. centred) keep their own look.
            if kind != "mainContent" and h1:
                diff = {}
                if f.get("align") and f["align"] != h1.get("align"):
                    diff["align"] = f["align"]
                if f.get("sizePt") and f["sizePt"] != h1.get("fontSizePt"):
                    diff["fontSizePt"] = f["sizePt"]
                if diff:
                    overrides["headings"] = {"1": diff}
            if overrides:
                section["overrides"] = overrides
            sections.append(section)
        if "mainContent" not in seen_kinds:
            sections.append({"id": "main-content", "type": "mainContent", "title": "Ana metin", "status": "required", "group": "body", "mode": "editable", "showTitle": False})
            self.unk("sections.mainContent", "Gövde başlığı (GİRİŞ vb.) bulunamadı; ana metin bölümü varsayılan olarak eklendi")
        self.ev("sections", [s["type"] for s in sections], f"{len(found)} birinci düzey başlık, {len(spec_sections)} fiziksel bölüm")
        return sections, titles

    # --- assemble --------------------------------------------------------------------------------
    def build(self) -> dict:
        a = self.args
        page = self.page()
        body, paragraph = self.body()
        headings = self.headings(body)
        tables = self.captions(body, "tables")
        figures = self.captions(body, "figures")
        footnotes = self.footnotes(body)
        sections, titles = self.sections(headings)
        bibliography_style = None
        bib = self.style_by_name("Bibliography")
        if bib and bib["effective"]["paragraph"].get("indent", {}).get("hangingMm") is not None:
            bibliography_style = {"hangingIndentMm": bib["effective"]["paragraph"]["indent"]["hangingMm"]}
            self.ev("bibliography.hangingIndentMm", bibliography_style["hangingIndentMm"], f"stil {bib['styleId']}")
        else:
            self.unk("bibliography.hangingIndentMm", "Kaynakça girintisi belgede stil olarak tanımlı değil")
        template = {
            "schemaVersion": 1,
            "templateVersion": "0.1.0-draft",
            "id": a.template_id,
            "universityId": a.university_id,
            "universityName": a.university_name,
            "instituteId": a.institute_id,
            "instituteName": a.institute_name,
            "degreeType": a.degree,
            "language": a.language,
            "status": "official",
            "source": {"type": "official", "documentName": self.file, "url": a.source_url, "verifiedAt": date.today().isoformat(), "notes": [f"Taslak docx-spec-to-template.py ile üretildi; SHA-256 {self.spec['file']['sha256']}", "UNKNOWN alanlar kılavuzdan tamamlanmadan PASS sayılmaz"]},
            "page": page,
            "typography": {"body": body, **({"paragraph": paragraph} if paragraph else {}), "headings": headings, **({"footnotes": footnotes} if footnotes else {})},
            "placeholders": STANDARD_PLACEHOLDERS,
            "sections": sections,
            "tables": tables,
            "figures": figures,
            "bibliography": {"heading": titles.get("bibliography", "KAYNAKLAR"), "style": {**body, "align": "left"} if body else {}, **(bibliography_style or {})},
            "toc": {"heading": titles.get("tableOfContents", "İÇİNDEKİLER"), "levels": [int(k) for k in headings], "showPageNumbers": True},
        }
        if not a.source_url:
            template["source"].pop("url")
        em = SINGLE_LINE_EM.get(body.get("fontFamily", ""))
        if em and body.get("lineHeight"):
            template["typography"]["lineSpacing"] = {"mode": "word", "singleLineEm": em}
            self.inf("typography.lineSpacing", template["typography"]["lineSpacing"], f"Word 'n satır' aralığı; {body['fontFamily']} tek satırı {em} em (TNR değeri MCBÜ PDF'inde ölçüldü, diğerleri yazı tipi metriğinden)")
        if "bibliography" not in titles:
            self.unk("bibliography.heading", "Kaynakça başlığı belgede bulunamadı; 'KAYNAKLAR' yer tutucu")
        required_missing = [u["field"] for u in self.unknown if u["field"] in ("page", "typography.body.fontFamily", "typography.body.fontSizePt", "page.numbering") or u["field"] in ("tables", "figures") or u["field"].startswith("typography.headings.1")]
        return {"template": template, "unknown": self.unknown, "inferred": self.inferred, "evidence": self.evidence, "valid": not required_missing, "requiredMissing": required_missing}


def main() -> int:
    parser = argparse.ArgumentParser(description="docx-spec ölçümünden ThesisTemplate taslağı üret.")
    parser.add_argument("spec", type=Path)
    parser.add_argument("--university-id", required=True)
    parser.add_argument("--university-name", required=True)
    parser.add_argument("--institute-id", default="lee")
    parser.add_argument("--institute-name", default="Lisansüstü Eğitim Enstitüsü")
    parser.add_argument("--degree", default="master")
    parser.add_argument("--language", default="tr")
    parser.add_argument("--template-id")
    parser.add_argument("--source-url")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    args.template_id = args.template_id or f"{args.university_id}-{args.institute_id}-{args.degree}-{args.language}-v1"
    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    draft = Draft(spec, args).build()
    out = args.out or (Path(__file__).resolve().parent.parent / "output" / "template-drafts" / f"{args.template_id}.draft.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(draft, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{'GEÇERLİ' if draft['valid'] else 'EKSİK'} taslak → {out}")
    print(f"  bilinmeyen {len(draft['unknown'])}: " + "; ".join(u["field"] for u in draft["unknown"]))
    print(f"  çıkarım {len(draft['inferred'])}: " + "; ".join(i["field"] for i in draft["inferred"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
