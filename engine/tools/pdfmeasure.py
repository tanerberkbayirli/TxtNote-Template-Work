"""Shared measurement helpers for source forensics and validation.

All lengths returned are millimetres measured from the page's top-left corner,
font sizes are points. Nothing here knows about a university.

PDF lines: TxtNote's layout PDF draws text word by word, so PyMuPDF's own line
grouping is not trusted. `visual_lines` re-groups spans by baseline (and size)
into the visual lines a reader sees.

Usage (python3):
    import sys; sys.path.insert(0, "engine/tools")
    from pdfmeasure import *
    doc = open_pdf("x.pdf")
    for ln in visual_lines(doc[0]): print(ln["baseline"], ln["x0"], ln["text"])
"""
from __future__ import annotations

import io
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

_local_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'measurement-packages')
if os.path.isdir(_local_packages):
    sys.path.insert(0, _local_packages)
import pymupdf

PT2MM = 25.4 / 72
MM2PT = 72 / 25.4
TWIP2MM = 25.4 / 1440
EMU2MM = 1 / 36000

__all__ = [
    "PT2MM", "MM2PT", "TWIP2MM", "EMU2MM", "open_pdf", "spans", "visual_lines", "page_size_mm",
    "text_bounds", "embedded_fonts", "font_usage", "page_number", "baseline_pitches", "images_mm",
    "drawings_mm", "docx_xml", "docx_sections", "docx_styles", "docx_paragraphs", "find_line",
]


def open_pdf(path):
    return pymupdf.open(path)


def page_size_mm(page):
    return round(page.rect.width * PT2MM, 3), round(page.rect.height * PT2MM, 3)


def spans(page):
    """Non-blank spans; geometry covers visible characters, not trailing PDF spaces."""
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for s in line["spans"]:
                text = ''.join(char['c'] for char in s['chars'])
                visible = [char for char in s['chars'] if char['c'].strip()]
                if not visible:
                    continue
                x0 = min(char['bbox'][0] for char in visible)
                y0 = min(char['bbox'][1] for char in visible)
                x1 = max(char['bbox'][2] for char in visible)
                y1 = max(char['bbox'][3] for char in visible)
                out.append({
                    "text": text, "font": s["font"], "size": round(s["size"], 3),
                    "bold": bool(s["flags"] & 16) or "Bold" in s["font"],
                    "italic": bool(s["flags"] & 2) or "Italic" in s["font"] or "Oblique" in s["font"],
                    "x0": x0 * PT2MM, "x1": x1 * PT2MM, "top": y0 * PT2MM, "bottom": y1 * PT2MM,
                    "baseline": s["origin"][1] * PT2MM, "color": s.get("color"),
                })
    return out


def visual_lines(page, tol_mm=0.35):
    """Spans grouped into visual lines by baseline; each line sorted left to right."""
    items = sorted(spans(page), key=lambda s: (round(s["baseline"], 1), s["x0"]))
    lines = []
    for s in items:
        for ln in lines:
            if abs(ln["baseline"] - s["baseline"]) <= tol_mm and abs(ln["size"] - s["size"]) < 0.6:
                ln["spans"].append(s)
                break
        else:
            lines.append({"baseline": s["baseline"], "size": s["size"], "spans": [s]})
    # Word may omit an encoded space at a font/style boundary and position the
    # next run by its advance instead. Calibri's real space is only .226 em:
    # a fixed .25 em threshold loses that word boundary. Read the embedded font
    # program rather than guessing from the nominal point size.
    space_em = {}
    for xref, _, _, basefont, *_ in page.get_fonts(full=True):
        try:
            font = pymupdf.Font(fontbuffer=page.parent.extract_font(xref)[3])
            space_em[basefont.split('+')[-1]] = font.text_length(' ', fontsize=1)
        except Exception:
            pass
    result = []
    for ln in lines:
        sp = sorted(ln["spans"], key=lambda s: s["x0"])
        text = ""
        prev = None
        for s in sp:
            threshold = 0.25
            if prev is not None and prev['font'] != s['font']:
                threshold = min(threshold, .9 * space_em.get(s['font'].split('+')[-1], threshold / .9))
            if prev is not None and s["x0"] - prev["x1"] > threshold * s["size"] * PT2MM and not text.endswith(" ") and not s['text'].startswith(' '):
                text += " "
            text += s["text"]
            prev = s
        fonts = sorted({s["font"] for s in sp})
        result.append({
            "text": re.sub(r"\s+", " ", text).strip(), "baseline": round(sum(s["baseline"] for s in sp) / len(sp), 3),
            "x0": round(min(s["x0"] for s in sp), 3), "x1": round(max(s["x1"] for s in sp), 3),
            "top": round(min(s["top"] for s in sp), 3), "bottom": round(max(s["bottom"] for s in sp), 3),
            "size": max(s["size"] for s in sp), "fonts": fonts, "bold": all(s["bold"] for s in sp),
            "italic": all(s["italic"] for s in sp), "spans": sp,
        })
    result.sort(key=lambda l: (l["baseline"], l["x0"]))
    return result


def find_line(lines, pattern, flags=re.I):
    rx = re.compile(pattern, flags)
    return [l for l in lines if rx.search(l["text"])]


def text_bounds(lines):
    if not lines:
        return None
    return {"x0": min(l["x0"] for l in lines), "x1": max(l["x1"] for l in lines),
            "top": min(l["top"] for l in lines), "bottom": max(l["bottom"] for l in lines),
            "firstBaseline": min(l["baseline"] for l in lines), "lastBaseline": max(l["baseline"] for l in lines)}


def baseline_pitches(lines):
    b = sorted(l["baseline"] for l in lines)
    return [round((b[i + 1] - b[i]) * MM2PT, 3) for i in range(len(b) - 1)]


def page_number(page, zone="bottom", zone_mm=30):
    """Short numeric/roman text lines in the top or bottom zone of the page."""
    h = page.rect.height * PT2MM
    rx = re.compile(r"^(?:[ivxlcdm]+|[IVXLCDM]+|\d+|-\s*\d+\s*-)$")
    lines = visual_lines(page)
    zone_lines = [l for l in lines if (l["baseline"] > h - zone_mm if zone == "bottom" else l["baseline"] < zone_mm)]
    cand = [l for l in zone_lines if rx.match(l["text"].strip())]
    return cand[-1] if zone == "bottom" and cand else (cand[0] if cand else None)


def images_mm(page):
    out = []
    for img in page.get_images(full=True):
        for r in page.get_image_rects(img[0]):
            out.append({"xref": img[0], "x0": r.x0 * PT2MM, "top": r.y0 * PT2MM, "x1": r.x1 * PT2MM, "bottom": r.y1 * PT2MM,
                        "w": r.width * PT2MM, "h": r.height * PT2MM})
    return out


def drawings_mm(page):
    out = []
    for d in page.get_drawings():
        r = d["rect"]
        out.append({"type": d.get("type"), "x0": r.x0 * PT2MM, "top": r.y0 * PT2MM, "x1": r.x1 * PT2MM, "bottom": r.y1 * PT2MM,
                    "width": d.get("width"), "fill": d.get("fill"), "color": d.get("color")})
    return out


def _font_identity(buf):
    try:
        from fontTools.ttLib import TTFont
        f = TTFont(io.BytesIO(buf), lazy=True, fontNumber=0)
        name = f["name"]
        fam = name.getDebugName(1)
        sub = name.getDebugName(2)
        ps = name.getDebugName(6)
        return {"family": fam, "subfamily": sub, "postscript": ps}
    except Exception as exc:  # CFF / Type1 / damaged
        return {"family": None, "error": str(exc)[:80]}


def embedded_fonts(doc):
    """Fonts actually referenced by pages, with embedded program identity (name table)."""
    seen = {}
    for page in doc:
        for xref, ext, ftype, basefont, name, enc, *_ in page.get_fonts(full=True):
            if xref in seen:
                continue
            info = {"xref": xref, "basefont": basefont, "type": ftype, "ext": ext, "embedded": ext not in ("n/a", "")}
            if info["embedded"]:
                try:
                    _, _, _, content = doc.extract_font(xref)
                    info.update(_font_identity(content))
                    info["bytes"] = len(content)
                except Exception as exc:
                    info["error"] = str(exc)[:80]
            seen[xref] = info
    return list(seen.values())


def font_usage(doc):
    """Characters drawn per (font, size) over the whole document."""
    usage = {}
    for page in doc:
        for s in spans(page):
            key = (s["font"], round(s["size"], 2))
            usage[key] = usage.get(key, 0) + len(s["text"])
    return usage


# ---------------------------------------------------------------- DOCX helpers
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def docx_xml(path, part="word/document.xml"):
    with zipfile.ZipFile(path) as z:
        return ET.fromstring(z.read(part))


def _attr(el, name):
    return None if el is None else el.get(W + name)


def docx_sections(path):
    """Every w:sectPr in document order: page size/margins (mm), numbering, titlePg, header/footer refs."""
    root = docx_xml(path)
    out = []
    for sp in root.iter(W + "sectPr"):
        sz, mar, num = sp.find(W + "pgSz"), sp.find(W + "pgMar"), sp.find(W + "pgNumType")
        mm = lambda v: None if v is None else round(int(v) * TWIP2MM, 3)
        out.append({
            "widthMm": mm(_attr(sz, "w")), "heightMm": mm(_attr(sz, "h")), "orient": _attr(sz, "orient"),
            "margins": {k: mm(_attr(mar, k)) for k in ("top", "bottom", "left", "right", "header", "footer", "gutter")} if mar is not None else None,
            "pgNumType": {k: _attr(num, k) for k in ("fmt", "start")} if num is not None else None,
            "titlePg": sp.find(W + "titlePg") is not None,
            "type": _attr(sp.find(W + "type"), "val"),
            "headers": [(_attr(h, "type")) for h in sp.findall(W + "headerReference")],
            "footers": [(_attr(h, "type")) for h in sp.findall(W + "footerReference")],
        })
    return out


def _ppr(ppr):
    if ppr is None:
        return {}
    d = {}
    sp, ind, jc = ppr.find(W + "spacing"), ppr.find(W + "ind"), ppr.find(W + "jc")
    if sp is not None:
        d["spacing"] = {k: _attr(sp, k) for k in ("before", "after", "line", "lineRule", "beforeLines", "afterLines", "beforeAutospacing", "afterAutospacing") if _attr(sp, k) is not None}
    if ind is not None:
        d["ind"] = {k: _attr(ind, k) for k in ("left", "right", "firstLine", "hanging", "start", "end") if _attr(ind, k) is not None}
    if jc is not None:
        d["jc"] = _attr(jc, "val")
    for flag in ("keepNext", "keepLines", "pageBreakBefore", "contextualSpacing"):
        el = ppr.find(W + flag)
        if el is not None:
            d[flag] = _attr(el, "val") or "true"
    ol = ppr.find(W + "outlineLvl")
    if ol is not None:
        d["outlineLvl"] = _attr(ol, "val")
    tabs = ppr.find(W + "tabs")
    if tabs is not None:
        d["tabs"] = [{k: _attr(t, k) for k in ("val", "pos", "leader")} for t in tabs.findall(W + "tab")]
    return d


def _rpr(rpr):
    if rpr is None:
        return {}
    d = {}
    f = rpr.find(W + "rFonts")
    if f is not None:
        d["rFonts"] = {k: _attr(f, k) for k in ("ascii", "hAnsi", "cs", "eastAsia", "asciiTheme", "hAnsiTheme") if _attr(f, k) is not None}
    for tag in ("sz", "szCs"):
        el = rpr.find(W + tag)
        if el is not None:
            d[tag] = int(_attr(el, "val")) / 2
    for flag in ("b", "i", "caps", "smallCaps", "u"):
        el = rpr.find(W + flag)
        if el is not None:
            d[flag] = _attr(el, "val") or "true"
    return d


def docx_styles(path):
    """docDefaults + every paragraph/character style with basedOn, pPr, rPr (raw Word units)."""
    root = docx_xml(path, "word/styles.xml")
    out = {"docDefaults": {}}
    dd = root.find(W + "docDefaults")
    if dd is not None:
        out["docDefaults"] = {"pPr": _ppr(dd.find(f"{W}pPrDefault/{W}pPr")), "rPr": _rpr(dd.find(f"{W}rPrDefault/{W}rPr"))}
    for st in root.findall(W + "style"):
        sid = st.get(W + "styleId")
        out[sid] = {"type": st.get(W + "type"), "name": _attr(st.find(W + "name"), "val"), "basedOn": _attr(st.find(W + "basedOn"), "val"),
                    "pPr": _ppr(st.find(W + "pPr")), "rPr": _rpr(st.find(W + "rPr"))}
    return out


def docx_paragraphs(path, part="word/document.xml"):
    """Paragraphs in order: style, direct pPr/rPr of first run, text."""
    root = docx_xml(path, part)
    out = []
    for p in root.iter(W + "p"):
        ppr = p.find(W + "pPr")
        style = _attr(ppr.find(W + "pStyle"), "val") if ppr is not None else None
        runs = p.findall(f".//{W}r")
        text = "".join(t.text or "" for t in p.iter(W + "t"))
        out.append({"style": style, "pPr": _ppr(ppr), "rPr": _rpr(runs[0].find(W + "rPr")) if runs else {}, "text": text,
                    "sectPr": ppr is not None and ppr.find(W + "sectPr") is not None})
    return out
