#!/usr/bin/env python3
"""Measure the formatting of an official DOCX thesis template or guide.

Reads the package XML directly (no Word, no rendering) and writes a JSON spec
whose every value is MEASURED evidence with its part and path:

  python3 scripts/extract-docx-spec.py <file.docx> [--out spec.json] [--summary]

Sections (page size, margins, header/footer distance, numbering format/start,
page-number field position), document defaults, resolved styles (basedOn chain),
numbering definitions for headings, footnote settings, and a usage profile of
the document body: how paragraphs are really formatted once direct formatting
is applied, grouped by style, with sample text for traceability. Direct
formatting that contradicts the style is reported, never averaged away.

Units: twips -> mm (25.4/1440), half-points -> pt, Word line spacing "auto" ->
lines (value/240), "exact"/"atLeast" -> pt (value/20).
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CP = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
DC = "http://purl.org/dc/elements/1.1/"
DCTERMS = "http://purl.org/dc/terms/"
NS = {"w": W, "a": A, "r": R, "cp": CP, "dc": DC, "dcterms": DCTERMS}
MM_PER_TWIP = 25.4 / 1440
CAPTION_RE = re.compile(r"^\s*(Şekil|Sekil|Tablo|Çizelge|Cizelge|Resim|Grafik|Harita|Fotoğraf|Figure|Table|Chart|Picture)\s+(Ek\s*)?[A-Z]?\d+(\.\d+)*\s*[:.\-–]?\s", re.I)
HEADING_NAME_RE = re.compile(r"^heading (\d)$", re.I)


def w(tag: str) -> str:
    return f"{{{W}}}{tag}"


def attr(el, name: str, default=None):
    if el is None:
        return default
    value = el.get(w(name))
    return default if value is None else value


def to_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def twips_mm(value) -> float | None:
    number = to_int(value)
    return None if number is None else round(number * MM_PER_TWIP, 2)


def half_pt(value) -> float | None:
    number = to_int(value)
    return None if number is None else number / 2


def on_off(el) -> bool | None:
    """<w:b/>, <w:b w:val="0"/>, <w:b w:val="false"/> ..."""
    if el is None:
        return None
    value = el.get(w("val"))
    return value not in {"0", "false", "off"}


DRAWING_TAGS = {w("drawing"), w("pict"), w("object"), f"{{{W}}}txbxContent"}


def text_of(node) -> str:
    """Visible paragraph text: w:t runs that are not inside a drawing/text box."""
    if node is None:
        return ""
    parts = []
    for t in node.iter(w("t")):
        parent, inside = t.getparent(), False
        while parent is not None and parent is not node:
            if parent.tag in DRAWING_TAGS:
                inside = True
                break
            parent = parent.getparent()
        if not inside and t.text:
            parts.append(t.text)
    return "".join(parts)


class Package:
    def __init__(self, path: Path):
        self.path = path
        self.zip = zipfile.ZipFile(path)
        self.names = set(self.zip.namelist())
        self.theme_fonts = self.read_theme()

    def xml(self, name: str):
        if name not in self.names:
            return None
        return etree.fromstring(self.zip.read(name))

    def read_theme(self) -> dict:
        root = self.xml("word/theme/theme1.xml")
        fonts = {}
        if root is None:
            return fonts
        for kind in ("majorFont", "minorFont"):
            node = root.find(f".//a:{kind}/a:latin", NS)
            if node is not None:
                fonts[kind] = node.get("typeface")
        return fonts

    def rels(self, part: str) -> dict:
        folder, _, file = part.rpartition("/")
        rel_name = f"{folder}/_rels/{file}.rels"
        root = self.xml(rel_name)
        if root is None:
            return {}
        return {rel.get("Id"): (folder + "/" + rel.get("Target")).replace("//", "/") for rel in root}


# --- property readers -------------------------------------------------------------------------

def read_run_props(rpr, theme: dict) -> dict:
    out = {}
    if rpr is None:
        return out
    fonts = rpr.find("w:rFonts", NS)
    if fonts is not None:
        family = {}
        for key in ("ascii", "hAnsi", "cs", "eastAsia"):
            value = fonts.get(w(key))
            theme_key = fonts.get(w(key + "Theme"))
            if theme_key:
                base = "majorFont" if theme_key.startswith("major") else "minorFont"
                value = theme.get(base, value)
                family[key + "Theme"] = theme_key
            if value:
                family[key] = value
        if family:
            out["font"] = family
    size = rpr.find("w:sz", NS)
    if size is not None:
        out["sizePt"] = half_pt(size.get(w("val")))
    for tag, key in (("b", "bold"), ("i", "italic"), ("caps", "caps"), ("smallCaps", "smallCaps"), ("strike", "strike")):
        node = rpr.find(f"w:{tag}", NS)
        if node is not None:
            out[key] = on_off(node)
    underline = rpr.find("w:u", NS)
    if underline is not None:
        out["underline"] = underline.get(w("val"), "single")
    color = rpr.find("w:color", NS)
    if color is not None:
        out["color"] = color.get(w("val"))
    spacing = rpr.find("w:spacing", NS)
    if spacing is not None:
        out["characterSpacingPt"] = (to_int(spacing.get(w("val"))) or 0) / 20
    return out


def read_para_props(ppr) -> dict:
    out = {}
    if ppr is None:
        return out
    style = ppr.find("w:pStyle", NS)
    if style is not None:
        out["styleId"] = style.get(w("val"))
    jc = ppr.find("w:jc", NS)
    if jc is not None:
        out["align"] = {"both": "justify", "start": "left", "end": "right"}.get(jc.get(w("val")), jc.get(w("val")))
    spacing = ppr.find("w:spacing", NS)
    if spacing is not None:
        before, after = spacing.get(w("before")), spacing.get(w("after"))
        if before is not None:
            out["spaceBeforePt"] = (to_int(before) or 0) / 20
        if after is not None:
            out["spaceAfterPt"] = (to_int(after) or 0) / 20
        if spacing.get(w("beforeAutospacing")) in {"1", "true"}:
            out["spaceBeforeAuto"] = True
        if spacing.get(w("afterAutospacing")) in {"1", "true"}:
            out["spaceAfterAuto"] = True
        line = spacing.get(w("line"))
        if line is not None:
            rule = spacing.get(w("lineRule"), "auto")
            number = to_int(line) or 0
            out["lineSpacing"] = {"rule": rule, "lines": round(number / 240, 3)} if rule == "auto" else {"rule": rule, "pt": number / 20}
    ind = ppr.find("w:ind", NS)
    if ind is not None:
        indent = {}
        for key, name in (("left", "leftMm"), ("start", "leftMm"), ("right", "rightMm"), ("end", "rightMm"), ("firstLine", "firstLineMm"), ("hanging", "hangingMm")):
            if ind.get(w(key)) is not None:
                indent[name] = twips_mm(ind.get(w(key)))
        if indent:
            out["indent"] = indent
    for tag, key in (("keepNext", "keepNext"), ("keepLines", "keepLines"), ("pageBreakBefore", "pageBreakBefore"), ("widowControl", "widowControl")):
        node = ppr.find(f"w:{tag}", NS)
        if node is not None:
            out[key] = on_off(node)
    outline = ppr.find("w:outlineLvl", NS)
    if outline is not None:
        out["outlineLevel"] = to_int(outline.get(w("val")))
    num = ppr.find("w:numPr", NS)
    if num is not None:
        out["numbering"] = {"numId": attr(num.find("w:numId", NS), "val"), "level": to_int(attr(num.find("w:ilvl", NS), "val"), 0)}
    tabs = ppr.findall("w:tabs/w:tab", NS)
    if tabs:
        out["tabs"] = [{"align": tab.get(w("val")), "posMm": twips_mm(tab.get(w("pos"))), "leader": tab.get(w("leader"))} for tab in tabs]
    return out


def merge(base: dict, over: dict) -> dict:
    out = dict(base)
    for key, value in over.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = {**out[key], **value}
        else:
            out[key] = value
    return out


# --- styles -----------------------------------------------------------------------------------

def read_styles(pkg: Package) -> tuple[dict, dict]:
    root = pkg.xml("word/styles.xml")
    defaults = {"run": {}, "paragraph": {}}
    styles: dict[str, dict] = {}
    if root is None:
        return defaults, styles
    rpr_default = root.find("w:docDefaults/w:rPrDefault/w:rPr", NS)
    ppr_default = root.find("w:docDefaults/w:pPrDefault/w:pPr", NS)
    defaults = {"run": read_run_props(rpr_default, pkg.theme_fonts), "paragraph": read_para_props(ppr_default)}
    raw = {}
    for style in root.findall("w:style", NS):
        style_id = style.get(w("styleId"))
        raw[style_id] = {
            "styleId": style_id,
            "name": attr(style.find("w:name", NS), "val"),
            "type": style.get(w("type")),
            "basedOn": attr(style.find("w:basedOn", NS), "val"),
            "next": attr(style.find("w:next", NS), "val"),
            "default": style.get(w("default")) in {"1", "true"},
            "own": {"run": read_run_props(style.find("w:rPr", NS), pkg.theme_fonts), "paragraph": read_para_props(style.find("w:pPr", NS))},
        }

    def resolve(style_id, seen=()):
        entry = raw.get(style_id)
        if entry is None or style_id in seen:
            return {"run": {}, "paragraph": {}}
        if "resolved" in entry:
            return entry["resolved"]
        base = resolve(entry["basedOn"], seen + (style_id,)) if entry["basedOn"] else {"run": {}, "paragraph": {}}
        entry["resolved"] = {"run": merge(base["run"], entry["own"]["run"]), "paragraph": merge(base["paragraph"], entry["own"]["paragraph"])}
        return entry["resolved"]

    for style_id, entry in raw.items():
        resolved = resolve(style_id)
        styles[style_id] = {
            **{key: entry[key] for key in ("styleId", "name", "type", "basedOn", "next", "default")},
            "own": entry["own"],
            "effective": {"run": merge(defaults["run"], resolved["run"]), "paragraph": merge(defaults["paragraph"], resolved["paragraph"])},
            "evidence": {"part": "word/styles.xml", "path": f"w:style[@w:styleId='{style_id}']"},
        }
    return defaults, styles


def default_paragraph_style(styles: dict) -> str | None:
    for style_id, style in styles.items():
        if style["type"] == "paragraph" and style["default"]:
            return style_id
    return "Normal" if "Normal" in styles else None


# --- numbering --------------------------------------------------------------------------------

def read_numbering(pkg: Package) -> dict:
    root = pkg.xml("word/numbering.xml")
    if root is None:
        return {}
    abstract = {}
    for node in root.findall("w:abstractNum", NS):
        levels = {}
        for lvl in node.findall("w:lvl", NS):
            levels[to_int(lvl.get(w("ilvl")))] = {
                "format": attr(lvl.find("w:numFmt", NS), "val"),
                "text": attr(lvl.find("w:lvlText", NS), "val"),
                "start": to_int(attr(lvl.find("w:start", NS), "val")),
                "styleLink": attr(lvl.find("w:pStyle", NS), "val"),
                "align": attr(lvl.find("w:lvlJc", NS), "val"),
                "indent": read_para_props(lvl.find("w:pPr", NS)).get("indent"),
            }
        abstract[node.get(w("abstractNumId"))] = levels
    nums = {}
    for node in root.findall("w:num", NS):
        nums[node.get(w("numId"))] = attr(node.find("w:abstractNumId", NS), "val")
    return {"numId": {num_id: abstract.get(abstract_id, {}) for num_id, abstract_id in nums.items()}}


# --- sections and headers/footers -----------------------------------------------------------------

def read_header_footer(pkg: Package, part: str, styles: dict, defaults: dict) -> dict:
    root = pkg.xml(part)
    if root is None:
        return {"part": part, "missing": True}
    xml = etree.tostring(root, encoding="unicode")
    has_page = bool(re.search(r"\bPAGE\b", xml)) or any("PAGE" in (node.get(w("instr")) or "") for node in root.iter(w("fldSimple")))
    field = None
    for para in root.findall(".//w:p", NS):
        if re.search(r"\bPAGE\b", etree.tostring(para, encoding="unicode")):
            para_props, run_props, style_id, _ = effective_paragraph(para, styles, defaults, default_paragraph_style(styles))
            runs = [read_run_props(r.find("w:rPr", NS), pkg.theme_fonts) for r in para.findall(".//w:r", NS) if r.find("w:rPr", NS) is not None]
            direct = next((r for r in runs if r.get("sizePt") or r.get("font")), {})
            run_props = merge(run_props, direct)
            field = {"align": para_props.get("align", "left"), "style": styles.get(style_id, {}).get("name", style_id), "font": summarize_font(run_props), "sizePt": run_props.get("sizePt")}
            break
    text = re.sub(r"\s+", " ", text_of(root)).strip()
    return {"part": part, "hasPageField": has_page, "pageField": field, "pageFieldAlign": field["align"] if field else None, "text": text[:120]}


def read_sections(pkg: Package, body, rels: dict, styles: dict, defaults: dict) -> list[dict]:
    sections = []
    paragraphs_since = 0
    first_texts: list[str] = []
    for node in body.iter(w("p"), w("sectPr")):
        if node.tag == w("p"):
            paragraphs_since += 1
            if len(first_texts) < 3:
                text = re.sub(r"\s+", " ", text_of(node)).strip()
                if text:
                    first_texts.append(text[:80])
            inner = node.find("w:pPr/w:sectPr", NS)
            if inner is None:
                continue
            sect = inner
        else:
            if node.getparent() is not body:
                continue  # already handled through its paragraph
            sect = node
        pg_sz, pg_mar, pg_num = sect.find("w:pgSz", NS), sect.find("w:pgMar", NS), sect.find("w:pgNumType", NS)
        entry = {
            "index": len(sections),
            "type": attr(sect.find("w:type", NS), "val", "nextPage"),
            "page": {"widthMm": twips_mm(attr(pg_sz, "w")), "heightMm": twips_mm(attr(pg_sz, "h")), "orientation": attr(pg_sz, "orient", "portrait")},
            "marginsMm": {key: twips_mm(attr(pg_mar, key)) for key in ("top", "bottom", "left", "right", "header", "footer", "gutter")},
            "numbering": {"format": attr(pg_num, "fmt", "decimal" if pg_num is not None else None), "start": to_int(attr(pg_num, "start")), "chapterStyle": attr(pg_num, "chapStyle")},
            "titlePage": sect.find("w:titlePg", NS) is not None,
            "columns": to_int(attr(sect.find("w:cols", NS), "num"), 1),
            "paragraphs": paragraphs_since,
            "firstTexts": first_texts,
            "headers": {}, "footers": {},
            "evidence": {"part": "word/document.xml", "path": f"sectPr#{len(sections)}"},
        }
        for ref in sect.findall("w:headerReference", NS):
            entry["headers"][ref.get(w("type"))] = read_header_footer(pkg, rels.get(ref.get(f"{{{R}}}id"), ""), styles, defaults)
        for ref in sect.findall("w:footerReference", NS):
            entry["footers"][ref.get(w("type"))] = read_header_footer(pkg, rels.get(ref.get(f"{{{R}}}id"), ""), styles, defaults)
        sections.append(entry)
        paragraphs_since = 0
        first_texts = []
    return sections


# --- body usage profile ------------------------------------------------------------------------

def effective_paragraph(para, styles: dict, defaults: dict, default_style: str | None) -> tuple[dict, dict, str, bool]:
    ppr = para.find("w:pPr", NS)
    direct_p = read_para_props(ppr)
    style_id = direct_p.get("styleId") or default_style
    style = styles.get(style_id, {"effective": {"run": defaults["run"], "paragraph": defaults["paragraph"]}})
    para_props = merge(style["effective"]["paragraph"], {k: v for k, v in direct_p.items() if k != "styleId"})
    # Run properties: the paragraph mark's rPr is not text; take the runs' own formatting.
    run_props_list = []
    for run in para.findall("w:r", NS):
        if run.find("w:t", NS) is None:
            continue
        rpr = run.find("w:rPr", NS)
        char_style = attr(rpr.find("w:rStyle", NS), "val") if rpr is not None else None
        base = style["effective"]["run"]
        if char_style and char_style in styles:
            base = merge(base, styles[char_style]["effective"]["run"])
        run_props_list.append(merge(base, read_run_props(rpr, {})))
    run_props = run_props_list[0] if run_props_list else dict(style["effective"]["run"])
    direct = bool({k for k in direct_p if k != "styleId"}) or any(run.find("w:rPr", NS) is not None and len(read_run_props(run.find("w:rPr", NS), {})) for run in para.findall("w:r", NS))
    return para_props, run_props, style_id or "", direct


def summarize_font(run: dict) -> str:
    font = run.get("font") or {}
    return font.get("ascii") or font.get("hAnsi") or "?"


def line_key(para: dict) -> str:
    spacing = para.get("lineSpacing")
    if not spacing:
        return "default"
    return f"{spacing['lines']} satır" if "lines" in spacing else f"{spacing['pt']} pt ({spacing['rule']})"


def profile_body(pkg: Package, body, styles: dict, defaults: dict, numbering: dict) -> dict:
    default_style = default_paragraph_style(styles)
    per_style: dict[str, dict] = {}
    headings, captions, long_paragraphs = [], [], []
    paragraphs = body.findall(".//w:p", NS)
    for index, para in enumerate(paragraphs):
        text = re.sub(r"\s+", " ", text_of(para)).strip()
        if not text:
            continue
        para_props, run_props, style_id, direct = effective_paragraph(para, styles, defaults, default_style)
        style_name = styles.get(style_id, {}).get("name", style_id)
        bucket = per_style.setdefault(style_id, {"name": style_name, "count": 0, "directFormatting": 0, "fonts": collections.Counter(), "sizes": collections.Counter(), "lineSpacing": collections.Counter(), "align": collections.Counter(), "samples": []})
        bucket["count"] += 1
        bucket["directFormatting"] += int(direct)
        bucket["fonts"][summarize_font(run_props)] += 1
        bucket["sizes"][run_props.get("sizePt")] += 1
        bucket["lineSpacing"][line_key(para_props)] += 1
        bucket["align"][para_props.get("align", "left")] += 1
        if len(bucket["samples"]) < 3:
            bucket["samples"].append(text[:70])
        record = {"paragraph": index, "style": style_name, "text": text[:90], "font": summarize_font(run_props), "sizePt": run_props.get("sizePt"), "bold": run_props.get("bold"), "caps": run_props.get("caps"), "align": para_props.get("align", "left"), "lineSpacing": para_props.get("lineSpacing"), "spaceBeforePt": para_props.get("spaceBeforePt"), "spaceAfterPt": para_props.get("spaceAfterPt"), "indent": para_props.get("indent"), "directFormatting": direct}
        level = para_props.get("outlineLevel")
        if level is None and HEADING_NAME_RE.match(style_name or ""):
            level = int(HEADING_NAME_RE.match(style_name).group(1)) - 1
        if level is not None and level <= 3:
            number = para_props.get("numbering")
            record["level"] = level + 1
            record["numberingFormat"] = numbering.get("numId", {}).get(str(number["numId"]), {}).get(number["level"], {}).get("text") if number else None
            headings.append(record)
        elif CAPTION_RE.match(text) and not re.match(r"^(toc \d|table of figures)$", style_name or "", re.I):
            prev_node, next_node = para.getprevious(), para.getnext()
            record["afterTable"] = prev_node is not None and prev_node.tag == w("tbl")
            record["beforeTable"] = next_node is not None and next_node.tag == w("tbl")
            record["hasDrawing"] = para.find(".//w:drawing", NS) is not None or (prev_node is not None and prev_node.find(".//w:drawing", NS) is not None)
            captions.append(record)
        elif len(text) >= 200:
            long_paragraphs.append(record)

    def top(counter: collections.Counter):
        return [{"value": value, "count": count} for value, count in counter.most_common(4)]

    styles_used = {style_id: {**{k: v for k, v in bucket.items() if k not in {"fonts", "sizes", "lineSpacing", "align"}}, "fonts": top(bucket["fonts"]), "sizes": top(bucket["sizes"]), "lineSpacing": top(bucket["lineSpacing"]), "align": top(bucket["align"])} for style_id, bucket in sorted(per_style.items(), key=lambda item: -item[1]["count"])}
    body_profile = None
    if long_paragraphs:
        keys = collections.Counter((p["font"], p["sizePt"], line_key({"lineSpacing": p["lineSpacing"]}), p["align"], json.dumps(p["indent"], sort_keys=True), p["spaceBeforePt"], p["spaceAfterPt"]) for p in long_paragraphs)
        (font, size, line, align, indent, before, after), count = keys.most_common(1)[0]
        body_profile = {"basis": f"{count}/{len(long_paragraphs)} paragraf (≥200 karakter)", "font": font, "sizePt": size, "lineSpacing": line, "align": align, "indent": json.loads(indent), "spaceBeforePt": before, "spaceAfterPt": after, "variants": len(keys)}
    return {"paragraphs": len(paragraphs), "stylesUsed": styles_used, "bodyProfile": body_profile, "headings": headings[:60], "captions": captions[:40], "tables": len(body.findall(".//w:tbl", NS)), "drawings": len(body.findall(".//w:drawing", NS))}


# --- settings, footnotes, core -----------------------------------------------------------------

def read_settings(pkg: Package) -> dict:
    root = pkg.xml("word/settings.xml")
    if root is None:
        return {}
    footnote = root.find("w:footnotePr", NS)
    return {
        "mirrorMargins": root.find("w:mirrorMargins", NS) is not None,
        "evenAndOddHeaders": root.find("w:evenAndOddHeaders", NS) is not None,
        "defaultTabStopMm": twips_mm(attr(root.find("w:defaultTabStop", NS), "val")),
        "footnotes": None if footnote is None else {"position": attr(footnote.find("w:pos", NS), "val", "pageBottom"), "numberFormat": attr(footnote.find("w:numFmt", NS), "val", "decimal"), "restart": attr(footnote.find("w:numRestart", NS), "val", "continuous")},
        "compatibilityMode": next((to_int(s.get(w("val"))) for s in root.findall("w:compat/w:compatSetting", NS) if s.get(w("name")) == "compatibilityMode"), None),
    }


def read_core(pkg: Package) -> dict:
    root = pkg.xml("docProps/core.xml")
    app = pkg.xml("docProps/app.xml")
    out = {}
    if root is not None:
        for tag, key in (("dc:title", "title"), ("dcterms:created", "created"), ("dcterms:modified", "modified"), ("cp:revision", "revision")):
            node = root.find(tag, NS)
            if node is not None and node.text:
                out[key] = node.text
    if app is not None:
        for child in app:
            if child.tag.endswith("}Application") or child.tag.endswith("}Pages") or child.tag.endswith("}Words"):
                out[child.tag.rsplit("}", 1)[-1].lower()] = child.text
    return out


# --- main -------------------------------------------------------------------------------------

KEY_STYLE_NAMES = ("Normal", "Title", "heading 1", "heading 2", "heading 3", "heading 4", "caption", "toc 1", "toc 2", "toc 3", "table of figures", "footnote text", "footnote reference", "List Paragraph", "Body Text", "Body Text Indent", "Bibliography", "Quote", "header", "footer")


def extract(path: Path) -> dict:
    pkg = Package(path)
    document = pkg.xml("word/document.xml")
    if document is None:
        raise SystemExit("word/document.xml yok")
    body = document.find("w:body", NS)
    defaults, styles = read_styles(pkg)
    numbering = read_numbering(pkg)
    rels = pkg.rels("word/document.xml")
    profile = profile_body(pkg, body, styles, defaults, numbering)
    used_ids = set(profile["stylesUsed"])
    key_styles = {sid: s for sid, s in styles.items() if s["name"] in KEY_STYLE_NAMES or sid in used_ids}
    footnote_text = None
    footnotes_root = pkg.xml("word/footnotes.xml")
    if footnotes_root is not None:
        real = [note for note in footnotes_root.findall("w:footnote", NS) if note.get(w("type")) in (None, "normal")]
        footnote_text = {"count": len(real), "sample": re.sub(r"\s+", " ", text_of(real[0])).strip()[:90] if real else ""}
    return {
        "schema": "docx-spec/1",
        "file": {"name": path.name, "path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "sizeBytes": path.stat().st_size},
        "status": "MEASURED",
        "core": read_core(pkg),
        "settings": read_settings(pkg),
        "docDefaults": defaults,
        "sections": read_sections(pkg, body, rels, styles, defaults),
        "styles": key_styles,
        "numbering": numbering,
        "footnotes": footnote_text,
        "profile": profile,
    }


def summary(spec: dict) -> str:
    lines = [f"# {spec['file']['name']}", ""]
    core = spec["core"]
    lines.append(f"Uygulama: {core.get('application', '?')} · değiştirilme: {core.get('modified', '?')} · sayfa: {core.get('pages', '?')} · SHA-256 {spec['file']['sha256'][:12]}…")
    lines.append(f"Ayarlar: karşılıklı kenar boşluğu={spec['settings'].get('mirrorMargins')} · uyumluluk modu={spec['settings'].get('compatibilityMode')} · dipnot={spec['settings'].get('footnotes')}")
    lines += ["", "## Bölümler (sectPr)", "", "| # | Sayfa (mm) | Üst | Alt | Sol | Sağ | Üstbilgi | Altbilgi | Cilt payı | No biçimi | Başlangıç | İlk sayfa farklı | Sayfa no konumu | Paragraf | İlk metin |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for s in spec["sections"]:
        m = s["marginsMm"]
        pos = []
        for kind, refs in (("üst", s["headers"]), ("alt", s["footers"])):
            for which, hf in refs.items():
                if hf.get("hasPageField"):
                    f = hf.get("pageField") or {}
                    pos.append(f"{kind}/{which}/{f.get('align')} {f.get('font')} {f.get('sizePt')}pt")
        lines.append(f"| {s['index']} | {s['page']['widthMm']}×{s['page']['heightMm']} | {m['top']} | {m['bottom']} | {m['left']} | {m['right']} | {m['header']} | {m['footer']} | {m['gutter']} | {s['numbering']['format']} | {s['numbering']['start']} | {s['titlePage']} | {', '.join(pos) or '—'} | {s['paragraphs']} | {' / '.join(s['firstTexts'])[:60]} |")
    d = spec["docDefaults"]
    lines += ["", "## Belge varsayılanları", "", f"- Yazı tipi: {d['run'].get('font')} · {d['run'].get('sizePt')} pt · paragraf: {json.dumps(d['paragraph'], ensure_ascii=False)}"]
    lines += ["", "## Stiller (etkili değerler)", "", "| Stil | Ad | Yazı tipi | pt | Kalın | Büyük harf | Hizalama | Satır aralığı | Önce | Sonra | Girinti (mm) | Seviye | Kullanım |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    used = spec["profile"]["stylesUsed"]
    for sid, s in sorted(spec["styles"].items(), key=lambda item: -(used.get(item[0], {}).get("count", 0))):
        if s["type"] != "paragraph":
            continue
        r, p = s["effective"]["run"], s["effective"]["paragraph"]
        lines.append(f"| {sid} | {s['name']} | {summarize_font(r)} | {r.get('sizePt')} | {r.get('bold')} | {r.get('caps')} | {p.get('align')} | {line_key(p)} | {p.get('spaceBeforePt')} | {p.get('spaceAfterPt')} | {json.dumps(p.get('indent'), ensure_ascii=False) if p.get('indent') else ''} | {p.get('outlineLevel')} | {used.get(sid, {}).get('count', 0)}{' (doğrudan biçim ' + str(used[sid]['directFormatting']) + ')' if used.get(sid, {}).get('directFormatting') else ''} |")
    bp = spec["profile"]["bodyProfile"]
    lines += ["", "## Gövde metni profili (gerçek kullanım)", ""]
    lines.append(f"- {json.dumps(bp, ensure_ascii=False)}" if bp else "- 200 karakterden uzun paragraf yok (belge örnek metin içermiyor olabilir).")
    if spec["profile"]["headings"]:
        lines += ["", "## Başlıklar (ilk 12)", ""]
        for h in spec["profile"]["headings"][:12]:
            lines.append(f"- H{h['level']} [{h['style']}] {h['font']} {h['sizePt']} pt kalın={h['bold']} caps={h['caps']} {h['align']} {line_key({'lineSpacing': h['lineSpacing']})} önce={h['spaceBeforePt']} sonra={h['spaceAfterPt']} num={h.get('numberingFormat')}: “{h['text'][:50]}”")
    if spec["profile"]["captions"]:
        lines += ["", "## Şekil/tablo yazıları (ilk 8)", ""]
        for c in spec["profile"]["captions"][:8]:
            where = "tablo üstü" if c["beforeTable"] else ("tablo altı" if c["afterTable"] else ("şekil" if c["hasDrawing"] else "?"))
            lines.append(f"- [{c['style']}] {c['font']} {c['sizePt']} pt kalın={c['bold']} {c['align']} {where}: “{c['text'][:50]}”")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="DOCX tez şablonu/kılavuzunun biçim ölçümlerini çıkar.")
    parser.add_argument("docx", type=Path)
    parser.add_argument("--out", type=Path, help="JSON çıktı yolu (varsayılan: <docx>.spec.json yanına değil, output/docx-spec/ altına)")
    parser.add_argument("--summary", action="store_true", help="Markdown özeti stdout'a yaz")
    args = parser.parse_args()
    spec = extract(args.docx)
    out = args.out or (Path(__file__).resolve().parent.parent / "output" / "docx-spec" / (args.docx.stem + ".spec.json"))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding="utf-8")
    if args.summary:
        sys.stdout.write(summary(spec))
    else:
        print(f"{len(spec['sections'])} bölüm, {len(spec['styles'])} stil, {spec['profile']['paragraphs']} paragraf → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
