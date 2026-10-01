"""aku-sbe validation: measures a real TxtNote export (PDF + DOCX) against orchestration/specs/aku-sbe.json measurableChecks.

usage: python orchestration/validation/aku-sbe/validate.py <registryId> <pdf> <docx> <out.json>

Independent of the template data: expected values are the source/spec values (guide §5.1-5.5, EK 1-12), not read from aku-sbe.js.
PDF lines are rebuilt from per-character origins (PyMuPDF's span origin is the origin of a *synthetic* leading space for words that follow
a footnote label, which reports a baseline 0.8 mm too high).
"""
import json, re, sys, zipfile
from xml.etree import ElementTree as ET
import pymupdf

PT = 25.4 / 72
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
registry_id, pdf_path, docx_path, out_path = sys.argv[1:5]
doc = pymupdf.open(pdf_path)
results = []


def chk(cid, status, expected, actual, evidence, note=""):
    results.append({"id": cid, "status": status, "expected": expected, "actual": actual, "evidence": evidence, **({"note": note} if note else {})})


def within(value, target, tol):
    return value is not None and abs(value - target) <= tol


def verdict(ok):
    return "PASS" if ok else "FAIL"


# ---------------------------------------------------------------- PDF line model
def page_lines(page):
    chars = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for ch in span["chars"]:
                    if ch["c"].strip():
                        chars.append({"c": ch["c"], "x0": ch["bbox"][0] * PT, "x1": ch["bbox"][2] * PT, "y": ch["origin"][1] * PT,
                                      "size": round(span["size"], 2), "font": span["font"]})
    chars.sort(key=lambda c: (round(c["y"], 1), c["x0"]))
    lines = []
    for c in chars:
        for ln in lines:
            if abs(ln["baseline"] - c["y"]) < 0.25 and abs(ln["size"] - c["size"]) < 0.01 or (abs(ln["baseline"] - c["y"]) < 0.25 and ln["label"] is None and c["size"] > ln["size"]):
                ln["chars"].append(c)
                break
        else:
            lines.append({"baseline": c["y"], "size": c["size"], "chars": [c], "label": None})
    out = []
    for ln in lines:
        cs = sorted(ln["chars"], key=lambda c: c["x0"])
        text = ""
        last = None
        for c in cs:
            if last is not None and c["x0"] - last["x1"] > 0.6:
                text += " "
            text += c["c"]
            last = c
        fonts = sorted({c["font"] for c in cs})
        out.append({"baseline": ln["baseline"], "x0": cs[0]["x0"], "x1": cs[-1]["x1"], "size": max(c["size"] for c in cs), "text": text,
                    "fonts": fonts, "bold": all("Bold" in c["font"] for c in cs), "firstBold": "Bold" in cs[0]["font"], "chars": cs})
    # merge label (small sup) lines with their text line is not needed: keep separate
    out.sort(key=lambda l: (round(l["baseline"], 1), l["x0"]))
    return out


pages = [page_lines(p) for p in doc]
N = len(pages)
sizes_mm = [(round(p.rect.width * PT, 2), round(p.rect.height * PT, 2)) for p in doc]


def label_of(i):
    """Printed page label of PDF page i (bottom zone, roman or arabic, centred)."""
    cand = [l for l in pages[i] if l["baseline"] > 272 and re.fullmatch(r"[ivxlc]+|\d+", l["text"])]
    return cand[-1] if cand else None


def find(pattern, start=0, end=None, flags=0):
    rx = re.compile(pattern, flags)
    for i in range(start, end or N):
        for l in pages[i]:
            if rx.search(l["text"]):
                return i, l
    return None, None


def body_lines(i):
    return [l for l in pages[i] if l["baseline"] < 272 and l["baseline"] > 20]


# ---------------------------------------------------------------- anchors
i_outer = 0
i_inner, _ = find(r"^T\.C\.$")
i_ethics, _ = find(r"^ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI$", 1)
i_onay, _ = find(r"^ENSTİTÜ ONAYI$", 1)
i_ozet, _ = find(r"^ÖZET$", 1)
i_abs, _ = find(r"^ABSTRACT$", 1)
i_preface, _ = find(r"^ÖN SÖZ$", 1)
i_toc, _ = find(r"^İÇİNDEKİLER$", 1)
i_lot, _ = find(r"^TABLOLAR LİSTESİ$", i_toc + 1)
i_lof, _ = find(r"^ŞEKİLLER LİSTESİ$", i_toc + 1)
i_lop, _ = find(r"^RESİMLER LİSTESİ$", i_toc + 1)
i_sym, _ = find(r"^SİMGELER VE KISALTMALAR DİZİNİ$", i_toc + 1)
i_giris, _ = find(r"^GİRİŞ$", (i_sym or i_toc) + 1)
i_concl, _ = find(r"^TARTIŞMA, SONUÇ VE ÖNERİLER$", i_giris + 1)
i_bib, _ = find(r"^KAYNAKÇA$", i_giris + 1)
i_ekidx, _ = find(r"^EKLER DİZİNİ$", i_bib + 1)
i_ekler, _ = find(r"^EKLER$", i_bib + 1)

order = [("outer-cover", 0), ("inner-cover", i_inner), ("ethics", i_ethics), ("approval", i_onay), ("ÖZET", i_ozet), ("ABSTRACT", i_abs), ("ÖN SÖZ", i_preface), ("İÇİNDEKİLER", i_toc),
         ("TABLOLAR LİSTESİ", i_lot), ("ŞEKİLLER LİSTESİ", i_lof), ("RESİMLER LİSTESİ", i_lop), ("SİMGELER", i_sym), ("GİRİŞ", i_giris), ("TARTIŞMA", i_concl), ("KAYNAKÇA", i_bib), ("EKLER DİZİNİ", i_ekidx), ("EKLER", i_ekler)]
present = [(n, i) for n, i in order if i is not None]
chk("section-order", verdict(len(present) == len(order) and [i for _, i in present] == sorted(i for _, i in present)), [n for n, _ in order],
    [f"{n}@p{i + 1}" for n, i in present], "guide §2 (order list), EK 1-11; page anchors found in the real PDF")

# ---------------------------------------------------------------- page-size
chk("page-size", verdict(all(within(w, 210, 0.5) and within(h, 297, 0.5) for w, h in sizes_mm)), "210 x 297 mm", sorted(set(sizes_mm)), "guide §5.1 (A4); PDF mediabox of all %d pages" % N)

# ---------------------------------------------------------------- fonts
drawn = {}
for p in pages:
    for l in p:
        for c in l["chars"]:
            drawn[c["font"]] = drawn.get(c["font"], 0) + 1
allowed = {"TimesNewRomanPSMT", "TimesNewRomanPS-BoldMT", "TimesNewRomanPS-ItalicMT", "TimesNewRomanPS-BoldItalicMT"}
embedded = {}
for xref in {f[0] for p in doc for f in p.get_fonts(full=True)}:
    try:
        name, ext, ftype, buf = doc.extract_font(xref)
    except Exception:
        continue
    if buf:
        ps = None
        try:
            f = pymupdf.Font(fontbuffer=buf)
            ps = f.name
        except Exception:
            pass
        embedded[name] = {"ext": ext, "bytes": len(buf), "program": ps}
chk("body-font", verdict(set(drawn) <= allowed and "TimesNewRomanPSMT" in drawn and all(any(a in n for a in ("TimesNewRoman",)) for n in embedded if n in drawn)), "genuine Times New Roman (TimesNewRomanPSMT) embedded; no substitute drawn",
    {"drawnFonts": drawn, "embeddedPrograms": {k: v for k, v in embedded.items() if "TimesNewRoman" in k}},
    "guide §5.2 'Times New Roman ve 12 punto'; font programs extracted from the PDF (name table)")

# ---------------------------------------------------------------- DOCX model
zf = zipfile.ZipFile(docx_path)
dx = ET.fromstring(zf.read("word/document.xml"))
dstyles = ET.fromstring(zf.read("word/styles.xml"))


def paragraphs(root):
    out = []
    for p in root.iter(W + "p"):
        ppr = p.find(W + "pPr")
        info = {"text": "".join(t.text or "" for t in p.iter(W + "t")), "style": None, "jc": None, "before": None, "after": None, "line": None, "rule": None, "left": None, "first": None, "hanging": None, "pbb": False, "runs": [], "br": any(True for _ in p.iter(W + "br"))}
        if ppr is not None:
            ps = ppr.find(W + "pStyle"); info["style"] = ps.get(W + "val") if ps is not None else None
            jc = ppr.find(W + "jc"); info["jc"] = jc.get(W + "val") if jc is not None else None
            sp = ppr.find(W + "spacing")
            if sp is not None:
                info["before"], info["after"], info["line"], info["rule"] = sp.get(W + "before"), sp.get(W + "after"), sp.get(W + "line"), sp.get(W + "lineRule")
            ind = ppr.find(W + "ind")
            if ind is not None:
                info["left"], info["first"], info["hanging"] = ind.get(W + "left"), ind.get(W + "firstLine"), ind.get(W + "hanging")
            info["pbb"] = ppr.find(W + "pageBreakBefore") is not None
        for r in p.iter(W + "r"):
            rpr = r.find(W + "rPr")
            txt = "".join(t.text or "" for t in r.iter(W + "t"))
            if not txt:
                continue
            run = {"t": txt, "b": False, "sz": None, "font": None, "caps": False}
            if rpr is not None:
                b = rpr.find(W + "b"); run["b"] = b is not None and b.get(W + "val") not in ("false", "0")
                sz = rpr.find(W + "sz"); run["sz"] = int(sz.get(W + "val")) / 2 if sz is not None else None
                rf = rpr.find(W + "rFonts"); run["font"] = rf.get(W + "ascii") if rf is not None else None
                run["caps"] = rpr.find(W + "caps") is not None
            info["runs"].append(run)
        out.append(info)
    return out


dparas = paragraphs(dx)
sects = []
for sp in dx.iter(W + "sectPr"):
    mar = sp.find(W + "pgMar"); pn = sp.find(W + "pgNumType"); sz = sp.find(W + "pgSz")
    sects.append({"top": int(mar.get(W + "top")), "bottom": int(mar.get(W + "bottom")), "left": int(mar.get(W + "left")), "right": int(mar.get(W + "right")), "footer": int(mar.get(W + "footer")),
                  "fmt": pn.get(W + "fmt") if pn is not None else None, "start": pn.get(W + "start") if pn is not None else None, "w": int(sz.get(W + "w")), "h": int(sz.get(W + "h"))})
tw = lambda mm: mm * 1440 / 25.4

# ---------------------------------------------------------------- margins (PDF)
long_body = []   # (page, line) of full-width paragraph lines in the main matter
for i in range(i_giris, i_concl):
    for l in body_lines(i):
        if l["size"] == 12.0 and not l["bold"] and (l["x1"] - l["x0"]) > 120 and l["x0"] < 45:
            long_body.append((i, l))
xs0 = [l["x0"] for _, l in long_body]
xs1 = [l["x1"] for _, l in long_body]
chk("margin-left", verdict(within(min(xs0), 30.0, 0.25) and within(sorted(xs0)[len(xs0) // 2], 30.0, 0.25) or within(min(xs0), 30.0, 0.25)), "30.0 mm (<= 0.25)", {"min": round(min(xs0), 3), "lines": len(xs0)}, "guide §5.1 Sol 3 cm; x0 of full-width body lines, pages %d-%d" % (i_giris + 1, i_concl))
chk("margin-right", verdict(within(max(xs1), 180.0, 0.25)), "180.0 mm (<= 0.25)", {"max": round(max(xs1), 3), "justified lines at 180 +-0.5": sum(1 for v in xs1 if within(v, 180.0, 0.5)), "lines": len(xs1)}, "guide §5.1 Sağ 3 cm")
# continuation pages: first baseline of a page that begins with a body line
tops = []
for i in range(i_giris + 1, i_concl):
    bl = body_lines(i)
    if bl and bl[0]["size"] == 12.0 and bl[0]["text"][:1].islower() and not bl[0]["bold"]:
        tops.append((i + 1, round(bl[0]["baseline"], 3)))
chk("margin-top", verdict(len(tops) >= 3 and all(within(b, 28.95, 0.25) for _, b in tops)), "28.95 mm = 25.0 + 0.9336 em (+-0.25)", tops[:12], "guide §5.1 Üst 2,5 cm + wordModel.firstBaselineOffsetEm (MEASURED, spec); first baseline of continuation pages")
# bottom: text area ends at 272 mm; line box bottom = baseline + (box - 0.9336 em)
viol = []
for i in range(N):
    for l in pages[i]:
        if l["baseline"] > 272 or l["baseline"] < 20:
            continue
        em = l["size"] * PT
        box = (1.7246 if (l["size"] == 12.0 and (l["x1"] - l["x0"]) > 100 and not l["bold"]) else 1.1497) * em
        if l["baseline"] + box - 0.9336 * em > 272.25:
            viol.append((i + 1, l["text"][:30], round(l["baseline"] + box - 0.9336 * em, 2)))
chk("margin-bottom", verdict(not viol), "no line box below 272.0 mm (+0.25)", viol[:6] or "max line-box bottom <= 272.25", "guide §5.1 Alt 2,5 cm")

# ---------------------------------------------------------------- body size, pitch, indent, gaps, justification
body_pairs = []
indents = []
paragap = []
pitches = []
nonlast_x1 = []
for i in range(i_giris, i_concl):
    ls = [l for l in body_lines(i) if l["size"] == 12.0 and not l["bold"] and l["fonts"] == ["TimesNewRomanPSMT"] and (l["x0"] < 45) and (l["x1"] - l["x0"]) > 3]
    ls = [l for l in ls if abs(l["x0"] - 30.0) < 0.3 or abs(l["x0"] - 42.5) < 0.3]
    for a, b in zip(ls, ls[1:]):
        d = (b["baseline"] - a["baseline"]) / PT
        if abs(d - 20.7) < 0.5 and abs(b["x0"] - 30.0) < 0.3:   # next line of the same paragraph
            pitches.append(round(d, 3))
            if (a["x1"] - a["x0"]) > 100:
                nonlast_x1.append(round(a["x1"], 3))
        elif abs(d - 32.7) < 0.5 and abs(b["x0"] - 42.5) < 0.3:  # next paragraph's first line
            paragap.append(round(d, 3)); indents.append(round(b["x0"] - 30.0, 3))
sizes = sorted({l["size"] for i in range(i_giris, i_concl) for l in pages[i] if l["fonts"] == ["TimesNewRomanPSMT"] and (l["x1"] - l["x0"]) > 100 and l["baseline"] < 272 and l["size"] >= 11.5})
chk("body-size", verdict(sizes == [12.0]), "12.0 pt (+-0.1)", sizes, "guide §5.2 Times New Roman ve 12 punto")
chk("body-pitch", verdict(len(pitches) > 100 and all(within(p, 20.7, 0.2) for p in pitches)), "20.7 pt (1.5 x 13.8) +-0.2", {"n": len(pitches), "min": min(pitches), "max": max(pitches)}, "guide §5.2 1,5 satır; Word line = 1.15 em x 1.5")
chk("body-indent", verdict(len(indents) > 20 and all(within(v, 12.5, 0.25) for v in indents)), "12.5 mm (+-0.25)", {"n": len(indents), "min": min(indents), "max": max(indents)}, "guide §5.2 'soldan 1,25 cm içeriden'")
chk("body-para-gap", verdict(len(paragap) > 20 and all(within(v - 20.7, 12.0, 0.2) for v in paragap)), "12.0 pt extra (6 after + 6 before, Word-additive) +-0.2", {"n": len(paragap), "gap-min": round(min(paragap) - 20.7, 3), "gap-max": round(max(paragap) - 20.7, 3)}, "guide §5.2 önce 6nk sonra 6nk; AKU_DECISIONS (Word-additive)")
chk("body-align", verdict(len(nonlast_x1) > 100 and sum(1 for v in nonlast_x1 if within(v, 180.0, 0.5)) / len(nonlast_x1) > 0.97), "justified: non-final lines end at 180.0 mm (+-0.5)", {"lines": len(nonlast_x1), "at 180": sum(1 for v in nonlast_x1 if within(v, 180.0, 0.5))}, "guide §5.2 İki yana yaslanmış")

# ---------------------------------------------------------------- page numbers
labels = []
for i in range(N):
    l = label_of(i)
    labels.append(l["text"] if l else None)
rom = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"]
exp_labels = [None, None] + rom[1:(i_giris - 1) + 1 - 1 + 1][: i_giris - 2]
exp_labels = [None, None] + rom[1: i_giris - 1] + [str(k) for k in range(1, N - i_giris + 1)]
chk("pagenum-front", verdict(labels[: i_giris] == exp_labels[: i_giris] and all(labels[i] is not None for i in range(2, i_giris))), "roman lower from the ethics page (ii), none on the sheets before", labels[:i_giris], "guide §5.3")
chk("pagenum-main", verdict(labels[i_giris:] == exp_labels[i_giris:]), "1 on GİRİŞ, arabic through bibliography and appendices", labels[i_giris:], "guide §5.3; pdf bottom-zone labels")
chk("pagenum-inner-cover", verdict(labels[i_inner] is None and labels[i_ethics] == "ii"), "inner cover counted as i (no number); ethics = ii", {"inner": labels[i_inner], "ethics": labels[i_ethics]}, "guide §5.3")
chk("pagenum-outer-cover", verdict(labels[0] is None and labels[i_inner] is None and labels[i_ethics] == "ii"), "tanıtım sheet not counted: ethics is ii although it is the 3rd sheet", {"sheet1": labels[0], "ethicsLabel": labels[i_ethics], "ethicsPhysical": i_ethics + 1}, "spec pagination.outerCover (INFERRED); AKU_DECISIONS")
chk("pagenum-approval", verdict(labels[i_onay] == "iii"), "iii", labels[i_onay], "guide §5.3, EK 4 (counted placeholder)")
pn = [label_of(i) for i in range(2, N)]
centres = [round((l["x0"] + l["x1"]) / 2, 3) for l in pn if l]
chk("pagenum-pos", verdict(all(within(c, 105.0, 0.5) for c in centres)), "centre 105.0 mm (+-0.5)", {"min": min(centres), "max": max(centres), "n": len(centres)}, "guide §5.3 alt orta")
chk("pagenum-bottom", verdict(all(l["baseline"] > 272 for l in pn if l)), "baseline inside the bottom margin (> 272 mm)", sorted({round(l["baseline"], 2) for l in pn if l}), "guide §5.3 alt orta; distance from the edge itself is UNKNOWN (12.5 mm non-source choice)")
chk("pagenum-font", verdict(all(l["size"] == 12.0 and l["fonts"] == ["TimesNewRomanPSMT"] for l in pn if l) and all(re.fullmatch(r"[ivxlc]+|\d+", l["text"]) for l in pn if l)), "Times New Roman 12 pt regular, no marks", sorted({(l["size"], tuple(l["fonts"])) for l in pn if l}), "guide §5.3 (12 punto, işaret yok)")
chk("pagenum-not-bold", verdict(all(not l["bold"] for l in pn if l)), "regular (INFERRED)", "regular", "spec pagination.font bold=false INFERRED")

# ---------------------------------------------------------------- headings
chapter_re = re.compile(r"^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI) BÖLÜM$")
chapters = []
for i in range(i_giris, i_concl):
    for k, l in enumerate(pages[i]):
        if chapter_re.match(l["text"]):
            nxt = [m for m in pages[i] if m["baseline"] > l["baseline"] + 1][:2]
            chapters.append((i, l, nxt))
ord_first = [round(l["baseline"], 3) for _, l, _ in chapters]
chk("h1-break", verdict(len(chapters) == 5 and all(l is pages[i][0] or (pages[i][0]["baseline"] > 20 and pages[i][0] is l) for i, l, _ in chapters)), "5 chapters, each the first line of a new page", [(i + 1, l["text"]) for i, l, _ in chapters], "guide §3.2 / §5.5.1 'Her yeni bölüm yeni bir sayfadan başlar'")
chk("h1-format", verdict(all(l["bold"] and nxt and nxt[0]["bold"] and nxt[0]["text"].upper() == nxt[0]["text"] for _, l, nxt in chapters)), "'BİRİNCİ BÖLÜM' line + uppercase bold title line", [(l["text"], nxt[0]["text"][:30]) for _, l, nxt in chapters[:3]], "guide §5.5.1 / §2.6 iii")
chk("h1-center", verdict(all(within((l["x0"] + l["x1"]) / 2, 105.0, 0.5) and within((nxt[0]["x0"] + nxt[0]["x1"]) / 2, 105.0, 0.5) for _, l, nxt in chapters)), "both lines centred on 105.0 mm (+-0.5)", [round((l["x0"] + l["x1"]) / 2, 2) for _, l, _ in chapters], "guide §5.5.1")
chk("h1-size", verdict(all(l["size"] == 12.0 and nxt[0]["size"] == 12.0 for _, l, nxt in chapters)), "12.0 pt (+-0.1; INFERRED from the general rule)", sorted({l["size"] for _, l, _ in chapters}), "guide §5.2 (heading size not stated)", "size is INFERRED in the spec")
chk("h1-pitch", verdict(all(within((nxt[0]["baseline"] - l["baseline"]) / PT, 20.7, 0.2) for _, l, nxt in chapters)), "20.7 pt between 'BİRİNCİ BÖLÜM' and the title (1.5 lines)", [round((nxt[0]["baseline"] - l["baseline"]) / PT, 3) for _, l, nxt in chapters], "guide §5.5.1 '1,5 satır'")
# space before 12: first baseline = 25 + 12 pt + 0.9336 em
chk("h1-spacing", verdict(all(within(l["baseline"], 25.0 + 12 * PT + 0.9336 * 12 * PT, 0.25) for _, l, _ in chapters)), "first baseline 33.18 mm = 25.0 + 12 pt before + 0.9336 em (+-0.25)", ord_first, "guide §5.2 Bölüm Başlıkları önce 12nk ve sonra 12nk")
gaps = []
for i, l, nxt in chapters:
    title = nxt[0]
    following = [m for m in pages[i] if m["baseline"] > title["baseline"] + 1 and m["size"] == 12.0 and not m["bold"]]
    if following:
        gaps.append(round((following[0]["baseline"] - title["baseline"]) / PT, 3))
chk("h1-spacing-after", verdict(all(within(g, 20.7 - 11.2 + 12 + 6 + 11.2 - 0.0, 0.3) for g in gaps) and len(gaps) == 5), "title baseline -> first body baseline = (20.7-11.2)+12 after+6 before+11.2 = 38.7 pt", gaps, "guide §5.2 (12 after) + paragraph 6 before (Word-additive)")

# sub headings
h = {2: re.compile(r"^\d+\. [A-ZÇĞİÖŞÜ]"), 3: re.compile(r"^\d+\.\d+\. [A-ZÇĞİÖŞÜ]"), 4: re.compile(r"^\d+\.\d+\.\d+\. [A-ZÇĞİÖŞÜ]"), 5: re.compile(r"^\d+\.\d+\.\d+\.\d+\. [A-ZÇĞİÖŞÜ]")}
found = {k: [] for k in h}
for i in range(i_giris, i_concl):
    for l in pages[i]:
        if l["baseline"] > 272 or l["size"] != 12.0:
            continue
        for k in (5, 4, 3, 2):
            if h[k].match(l["text"]) and l["x0"] < 31 and (k in (3, 5) or l["bold"]):
                found[k].append((i, l)); break
f2, f3, f4, f5 = found[2], found[3], found[4], found[5]
chk("h2-style", verdict(len(f2) >= 5 and all(l["bold"] and within(l["x0"], 30.0, 0.5) and l["text"].upper() == l["text"] for _, l in f2)), "'1. TITLE' bold uppercase x0 = 30.0", {"n": len(f2), "sample": f2[0][1]["text"], "x0": sorted({round(l['x0'], 2) for _, l in f2})}, "guide §2.6 iv, §5.5.2 i")
chk("h3-style", verdict(len(f3) >= 3 and all((not l["bold"]) and within(l["x0"], 30.0, 0.5) and l["text"].upper() == l["text"] for _, l in f3)), "'1.1. TITLE' regular uppercase x0 = 30.0", {"n": len(f3), "sample": f3[0][1]["text"]}, "guide §2.6 iv, §5.5.2 ii")
chk("h4-style", verdict(len(f4) >= 3 and all(l["bold"] and within(l["x0"], 30.0, 0.5) for _, l in f4)), "'1.1.1. Title' bold, title case, x0 = 30.0", {"n": len(f4), "sample": f4[0][1]["text"]}, "guide §2.6 iv, §5.5.2 iii")
chk("h5-style", verdict(len(f5) >= 2 and all((not l["bold"]) and within(l["x0"], 30.0, 0.5) for _, l in f5)), "'1.1.1.1. Title' regular, title case, x0 = 30.0", {"n": len(f5), "sample": f5[0][1]["text"]}, "guide §2.6 iv")
nums = []
for i in range(i_giris, i_concl):
    cur = []
    for l in pages[i]:
        m = re.match(r"^(\d+)\. [A-ZÇĞİÖŞÜ]", l["text"]) if l["size"] == 12.0 and l["bold"] else None
        if m: cur.append(int(m.group(1)))
    nums.append((i, cur))
first_per_chapter = []
for k, (i, l, _) in enumerate(chapters):
    end = chapters[k + 1][0] if k + 1 < len(chapters) else i_concl
    seq = [int(re.match(r"^(\d+)\.", x["text"]).group(1)) for j in range(i, end) for x in pages[j] if x["size"] == 12.0 and x["bold"] and re.match(r"^\d+\. [A-ZÇĞİÖŞÜ]", x["text"]) and x["x0"] < 31]
    first_per_chapter.append(seq)
chk("h2-numbering", verdict(all(s and s[0] == 1 and s == list(range(1, len(s) + 1)) for s in first_per_chapter)), "first sub-heading of every chapter is '1.' and runs 1,2,3 (no chapter prefix)", first_per_chapter, "guide §2.6 iv / §5.5.2")
# wrapped heading pitch 13.8 and spacing
wrapped = []
for i in range(i_giris, i_concl):
    ls = pages[i]
    for a, b in zip(ls, ls[1:]):
        if a["size"] == 12.0 and b["size"] == 12.0 and a["bold"] == b["bold"] and within(b["x0"], 30.0, 0.5) and h[2].match(a["text"]) and a["bold"] and 0 < (b["baseline"] - a["baseline"]) / PT < 16 and a["x1"] - a["x0"] > 100:
            wrapped.append((i + 1, a["text"][:30], round((b["baseline"] - a["baseline"]) / PT, 3)))
chk("h2-h5-pitch", verdict(len(wrapped) >= 1 and all(within(w[2], 13.8, 0.2) for w in wrapped)), "13.8 pt wrapped heading pitch (single)", wrapped[:4] or "no wrapped heading in fixture", "guide §2.6 Not (tek satır aralığı)")
sp_after = []
sp_before = []
for i in range(i_giris, i_concl):
    ls = pages[i]
    for k, a in enumerate(ls[:-1]):
        b = ls[k + 1]
        if any(h[n].match(a["text"]) and a["size"] == 12.0 for n in (2, 3, 4, 5)) and a["x1"] - a["x0"] < 100 and b["size"] == 12.0 and not b["bold"] and within(b["x0"], 42.5, 0.5):
            sp_after.append(round((b["baseline"] - a["baseline"]) / PT - 13.8, 3))   # distance minus (heading line box 13.8) = extra space + (asc offset diff)
        if k > 0 and any(h[n].match(b["text"]) and b["size"] == 12.0 for n in (2, 3, 4, 5)) and b["x0"] < 31 and a["size"] == 12.0 and not a["bold"] and a["x0"] < 31 and a["x1"] - a["x0"] < 135 and b["x1"] - b["x0"] < 100:
            sp_before.append(round((b["baseline"] - a["baseline"]) / PT, 3))
# heading baseline -> next body baseline = (13.8 - 11.2) below + 6 after + 6 before + 11.2 asc = 25.8 ; extra over a heading line box = 12.0
chk("h2-body-gap", verdict(len(sp_after) >= 3 and all(within(v, 12.0, 0.25) for v in sp_after)), "extra space between a sub-heading and its first paragraph line = 12.0 pt (6 after + 6 before, additive)", {"n": len(sp_after), "values": sorted(set(sp_after))[:5]}, "guide §5.5.2 (Üst: 6nk, Alt: 6nk)")
chk("h2-h5-spacing", verdict(len(sp_after) >= 3 and len(sp_before) >= 3 and all(within(v, 32.7, 0.4) for v in sp_before)), "6 before / 6 after (+ neighbours' 6): paragraph->heading baseline 32.7 pt; heading->paragraph 25.8 pt", {"before": sorted(set(sp_before))[:5], "after": sorted(set(v + 13.8 for v in sp_after))[:5]}, "guide §5.5.2; H5 6/6 INFERRED")

# unnumbered main-part titles
parts = []
for name, idx in (("GİRİŞ", i_giris), ("TARTIŞMA, SONUÇ VE ÖNERİLER", i_concl), ("KAYNAKÇA", i_bib), ("EKLER DİZİNİ", i_ekidx), ("EKLER", i_ekler)):
    l = next(x for x in pages[idx] if x["text"] == name)
    parts.append({"title": name, "page": idx + 1, "bold": l["bold"], "size": l["size"], "centre": round((l["x0"] + l["x1"]) / 2, 2), "first": pages[idx][0] is l, "baseline": round(l["baseline"], 2)})
chk("main-part-titles", verdict(all(p["bold"] and p["size"] == 12.0 and within(p["centre"], 105.0, 0.5) and p["first"] for p in parts)), "bold caps 12 pt centred on 105.0, no number, first line of a new page", parts, "guide §3.1 Not, §3.3 Not, §4.1 Not, §4.2")

# ---------------------------------------------------------------- captions, tables, sources
cap_t = []; cap_f = []; cap_p = []; src = []
for i in range(i_giris, i_concl):
    for l in pages[i]:
        m = re.match(r"^(Tablo|Şekil|Resim) (\d+)\.", l["text"])
        if m and l["size"] == 11.0 and l["firstBold"]:
            first_bold = "".join(c["c"] for c in l["chars"] if "Bold" in c["font"])
            ok_style = first_bold.startswith(f"{m.group(1)}{m.group(2)}.") and not l["bold"]
            rec = {"p": i + 1, "text": l["text"][:44], "no": int(m.group(2)), "label": m.group(1), "size": l["size"], "centre": round((l["x0"] + l["x1"]) / 2, 2), "labelBoldTitleRegular": ok_style, "multi": (l["x1"] - l["x0"]) > 120}
            {"Tablo": cap_t, "Şekil": cap_f, "Resim": cap_p}[m.group(1)].append(rec)
        if l["text"].startswith("Kaynak:") and l["size"] == 11.0:
            src.append({"p": i + 1, "text": l["text"], "size": l["size"], "centre": round((l["x0"] + l["x1"]) / 2, 2), "labelBold": l["firstBold"], "restRegular": not l["bold"]})
def numbered_seq(lst):
    return [c["no"] for c in lst if not "(Devam)" in c["text"]]
for cid, lst, nm in (("caption-table", cap_t, "Tablo"), ("caption-figure", cap_f, "Şekil"), ("caption-picture", cap_p, "Resim")):
    seq = numbered_seq(lst)
    ok = lst and seq == list(range(1, len(seq) + 1)) and all(c["size"] == 11.0 and c["labelBoldTitleRegular"] for c in lst) and all(within(c["centre"], 105.0, 0.5) for c in lst if not c["multi"])
    chk(cid, verdict(ok), f"'{nm} N.' bold + regular title, 11 pt, centred, document-wide numbering 1..n, caption above", {"numbers": seq, "samples": lst[:2]}, "guide §6.5.3 (Tablo/Şekil/Resim örnekleri, p.30-31)")
# caption above: the caption baseline is above the element it belongs to (table rows / images)
above_ok = True; above_ev = []
for lst in (cap_t, cap_f, cap_p):
    for c in lst[:2]:
        i = c["p"] - 1
        cap_l = next(l for l in pages[i] if l["text"].startswith(c["text"][:20]))
        imgs = [r for img in doc[i].get_images(full=True) for r in doc[i].get_image_rects(img[0])]
        nxt_y = min([r.y0 * PT for r in imgs if r.y0 * PT > cap_l["baseline"]] + [l["baseline"] for l in pages[i] if l["baseline"] > cap_l["baseline"] + 2])
        above_ev.append((c["label"], c["p"], round(nxt_y - cap_l["baseline"], 2)))
chk("caption-position", verdict(all(v[2] > 0 for v in above_ev)), "caption above table/figure/picture", above_ev, "guide §6.5.3")
chk("caption-source-line", verdict(len(src) >= 2 and all(within(s["centre"], 105.0, 0.5) and s["labelBold"] and s["restRegular"] for s in src)), "'Kaynak:' below, centred, 11 pt (10 or 11), label bold, rest regular", src[:3], "guide §6.5.3 (Kaynak (koyu) ...)")
cell = []
for i in range(i_giris, i_concl):
    for l in pages[i]:
        if l["text"].startswith(("Kadın ", "Erkek ", "Değişken ")):
            cell.append(l["size"])
chk("table-cells", verdict(cell and set(cell) == {11.0}), "table text 11 pt (+-0.1)", sorted(set(cell)), "guide §6.5.3 Not (tablolarda 11 punto)")
wrapped_cell = []
for i in range(i_giris, i_concl):
    ls = [l for l in pages[i] if l["size"] == 11.0 and 30 < l["x0"] < 60 and not l["text"].startswith(("Tablo", "Şekil", "Resim", "Kaynak"))]
    for a, b in zip(ls, ls[1:]):
        d = (b["baseline"] - a["baseline"]) / PT
        if abs(a["x0"] - b["x0"]) < 0.3 and 10 < d < 14.5:
            wrapped_cell.append(round(d, 3))
chk("table-cell-pitch", verdict(bool(wrapped_cell) and all(within(v, 12.65, 0.2) for v in wrapped_cell)), "12.65 pt (11 x 1.15, single)", wrapped_cell or "no wrapped cell in the fixture", "guide §6.5.3 (tablo içi tek satır, 0/0)")

# tables: continued caption
cont = [l for i in range(i_giris, i_concl) for l in pages[i] if "(Devam)" in l["text"] and l["size"] == 11.0]
chk("table-continuation", verdict(len(cont) >= 1 and all(re.match(r"^Tablo \d+\. \(Devam\) ", l["text"]) for l in cont)), "'Tablo N. (Devam) Başlık' above the continuation fragment", [l["text"][:50] for l in cont], "guide §6.5.3 (p.30 'Tablo 1. (Devam)')")
chk("blockquote-authordate", None, None, None, "")
results.pop()
bq = [l for i in range(i_giris, i_concl) for l in pages[i] if l["size"] == 10.0 and l["x0"] > 45 and l["baseline"] < 272]
if bq:
    chk("blockquote-authordate", verdict(all(within(min(l["x0"] for l in bq), 50.0, 0.5) and l["x1"] <= 160.5 for l in bq) and set(l["size"] for l in bq) == {10.0}), "10 pt single, x0 = 50.0, x1 <= 160.0 (+-0.5)", {"n": len(bq), "x0": round(min(l["x0"] for l in bq), 2), "x1max": round(max(l["x1"] for l in bq), 2)}, "guide §6.3.1 xiv (bağlaç sistemi): 2 cm içeriden")

# ---------------------------------------------------------------- footnotes
fn = []
for i in range(N):
    notes = [l for l in pages[i] if l["size"] == 9.0 and 200 < l["baseline"] < 275]
    labs = [l for l in pages[i] if abs(l["size"] - 6.75) < 0.05 and l["baseline"] > 200 and l["x0"] < 31]
    if notes:
        fn.append((i, notes, labs))
pitch_fn = []
for i, notes, labs in fn:
    for a, b in zip(notes, notes[1:]):
        if within(b["x0"], 30.0, 0.5):
            pitch_fn.append(round((b["baseline"] - a["baseline"]) / PT, 3))
chk("footnote-size", verdict(fn and all(l["size"] == 9.0 and l["fonts"] == ["TimesNewRomanPSMT"] for _, notes, _ in fn for l in notes) and pitch_fn and all(within(p, 10.35, 0.2) for p in pitch_fn)), "9.0 pt Times New Roman, pitch 10.35 pt (+-0.2)", {"n": len(fn), "pitches": sorted(set(pitch_fn))}, "guide §6.4 (9 punto, tek satır)")
chk("footnote-indent", verdict(fn and all(within(l["x0"], 30.0, 0.5) for _, notes, labs in fn for l in labs)), "footnote starts at x0 = 30.0 (no indent)", sorted({round(l["x0"], 2) for _, _, labs in fn for l in labs}), "guide §6.4 (girintisiz)")
# separator
sep = []
for i, _, _ in fn:
    for d in doc[i].get_drawings():
        for it in d["items"]:
            if it[0] == "l":
                p1, p2 = it[1], it[2]
                if abs(p1.y - p2.y) < 0.1 and p1.y * PT > 200 and p1.y * PT < 275:
                    sep.append((round(min(p1.x, p2.x) * PT, 2), round(abs(p2.x - p1.x) * PT, 2)))
            elif it[0] == "re":
                r = it[1]
                if r.height * PT < 1 and r.y0 * PT > 200 and r.y0 * PT < 275 and r.width * PT > 20:
                    sep.append((round(r.x0 * PT, 2), round(r.width * PT, 2)))
chk("footnote-separator", verdict(sep and all(within(x, 30.0, 0.5) and within(w, 40.0, 2.0) for x, w in sep)), "starts x = 30.0, length ~40 mm (+-2)", sorted(set(sep))[:3] or "no separator rule found", "guide §6.4 (yaklaşık 4 cm)")
fn_labels = []
for i, notes, labs in sorted(fn):
    pass
all_labels = []
for i in range(N):
    for l in pages[i]:
        if abs(l["size"] - 6.75) < 0.05 and l["x0"] < 31 and l["baseline"] > 200 and l["text"].isdigit():
            all_labels.append(int(l["text"]))
chk("footnote-continuous", verdict(all_labels == list(range(1, len(all_labels) + 1)) and len(all_labels) >= 5), "1,2,3,... through GİRİŞ and all chapters", all_labels, "guide §6.4 (tez boyunca ardışık)")

# ---------------------------------------------------------------- bibliography
bl = [l for l in pages[i_bib] if 20 < l["baseline"] < 272]
title_l = next(l for l in bl if l["text"] == "KAYNAKÇA")
entries = [l for l in bl if l["baseline"] > title_l["baseline"]]
firsts = [l for l in entries if within(l["x0"], 30.0, 0.5)]
conts = [l for l in entries if within(l["x0"], 35.0, 0.5)]
chk("bib-first", verdict(len(firsts) >= 4), "first line x0 = 30.0", sorted({round(l["x0"], 2) for l in firsts}), "guide §4.1 (kaynakça), p.34 measured 0 mm first-line")
chk("bib-hanging", verdict(len(conts) >= 1 and all(within(l["x0"] - 30.0, 5.0, 0.5) for l in conts)), "continuation lines 5.0 mm in (+-0.5)", sorted({round(l["x0"] - 30.0, 3) for l in conts}), "guide §4.1 '0,5 cm içeriden'")
pi = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(entries, entries[1:])]
chk("bib-pitch", verdict(pi and all(within(p, 13.8, 0.2) for p in pi)), "13.8 pt, no gap between entries (0/0)", sorted(set(pi)), "guide §4.1 'üst:0nk ve alt:0nk, tek satır aralığı'")
chk("bib-title", verdict(title_l["bold"] and within((title_l["x0"] + title_l["x1"]) / 2, 105.0, 0.5) and title_l["size"] == 12.0), "KAYNAKÇA bold uppercase centred 105.0, no number", {"centre": round((title_l["x0"] + title_l["x1"]) / 2, 2), "bold": title_l["bold"]}, "guide §4.1 Not")
chk("bib-title-gap", verdict(within((entries[0]["baseline"] - title_l["baseline"]) / PT, 13.8 - 11.2 + 12 + 11.2, 0.3)), "title -> first entry 25.8 pt (12 after, 0 before)", round((entries[0]["baseline"] - title_l["baseline"]) / PT, 3), "guide §4.1 (başlıktan bir satır aralığı aşağıdan); 12 pt INFERRED", "title spacing INFERRED")

# ---------------------------------------------------------------- TOC
toc_lines = [l for l in pages[i_toc] if l["baseline"] < 272]
toc_title = next(l for l in toc_lines if l["text"] == "İÇİNDEKİLER")
sayfa = next(l for l in toc_lines if l["text"] == "Sayfa")
chk("toc-sayfa", verdict(within(sayfa["x1"], 180.0, 0.5) and within((sayfa["baseline"] - toc_title["baseline"]) / PT, 27.6, 0.2) and sayfa["bold"]), "'Sayfa' bold, ends 180.0, baseline 27.6 pt below the title", {"x1": round(sayfa["x1"], 2), "dy_pt": round((sayfa["baseline"] - toc_title["baseline"]) / PT, 3)}, "guide §2.6 i (iki satır aralığı aşağıya, sağ kenarda)")
chk("toc-title", verdict(toc_title["bold"] and within((toc_title["x0"] + toc_title["x1"]) / 2, 105.0, 0.5)), "İÇİNDEKİLER bold centred", round((toc_title["x0"] + toc_title["x1"]) / 2, 2), "guide §2.6 (EK 8)")
toc_all = []
for i in range(i_toc, i_lot):
    toc_all += [(i, l) for l in pages[i] if 20 < l["baseline"] < 272]
rows = [(i, l) for i, l in toc_all if re.search(r"\.{5,}\s*[\divx]+$", l["text"]) or re.search(r"[\divx]+$", l["text"]) and l["x1"] > 170]
nums = [l for i, l in rows]
chk("toc-pagenum-right", verdict(len(nums) > 20 and all(within(l["x1"], 180.0, 0.5) for l in nums)), "page numbers end at x1 = 180.0 (+-0.5)", {"n": len(nums), "x1": sorted({round(l['x1'], 2) for l in nums})[:4]}, "guide §2.6 viii")
chk("toc-leader", verdict(sum(1 for l in nums if "." * 5 in l["text"]) > 20), "dotted leader between entry and number", sum(1 for l in nums if "." * 5 in l["text"]), "guide §2.6 viii")
# pitch of sub rows (single rows in one block)
sub = [l for i, l in toc_all if re.match(r"^\d+\.(\d+\.)* ", l["text"]) and l["size"] == 12.0]
pp = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(sub, sub[1:]) if 0 < (b["baseline"] - a["baseline"]) / PT < 20]
chk("toc-pitch", verdict(pp and all(within(p, 13.8, 0.2) for p in pp)), "13.8 pt (single, 0/0)", {"n": len(pp), "set": sorted(set(pp))}, "guide §2.6 (tek satır aralığı)")
chk("toc-row-x0", verdict(sub and all(within(l["x0"], 30.0, 0.5) for l in sub)), "numbered rows start at x0 = 30.0 (no per-level indent)", sorted({round(l["x0"], 2) for l in sub}), "spec toc.indentPerLevelMm MEASURED 0 (EK 8)")
chap_rows = [l for i, l in toc_all if chapter_re.match(l["text"])]
chk("toc-chapter-rows", verdict(len(chap_rows) == 5 and all(l["bold"] and within((l["x0"] + l["x1"]) / 2, 105.0, 0.5) for l in chap_rows)), "chapter rows bold centred, no page number", [(l["text"], round((l["x0"] + l["x1"]) / 2, 2)) for l in chap_rows], "guide §2.6 iii")
toc_text = " ".join(l["text"] for i, l in toc_all)
front = [l["text"] for i, l in toc_all if l["text"].startswith("ETİK VE BİLİMSEL")]
chk("toc-front-rows", verdict(bool(front) and front[0].rstrip().endswith("ii")), "first row 'ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI ... ii'", front[:1], "guide §2.6 ii")
# back matter after the chapters: one empty single line (13.8 pt) above TARTIŞMA, SONUÇ VE ÖNERİLER
tail_rows = [(i, l) for i, l in toc_all if l["baseline"] < 272]
idx_t = next(k for k, (i, l) in enumerate(tail_rows) if l["text"].startswith("TARTIŞMA, SONUÇ VE ÖNERİLER"))
gap_t = (tail_rows[idx_t][1]["baseline"] - tail_rows[idx_t - 1][1]["baseline"]) / PT if tail_rows[idx_t][0] == tail_rows[idx_t - 1][0] else None
gap_after = [(tail_rows[k + 1][1]["baseline"] - tail_rows[k][1]["baseline"]) / PT for k in range(idx_t, idx_t + 3)]
chk("toc-backmatter-gap", verdict(gap_t is not None and within(gap_t, 27.6, 0.3) and all(within(g, 13.8, 0.2) for g in gap_after)), "27.6 pt between the last chapter row and TARTIŞMA (one empty single line), then 13.8 pt rows from the left edge", {"gap": None if gap_t is None else round(gap_t, 3), "after": [round(g, 3) for g in gap_after]}, "guide §2.6 vii; EK 8 (p.46: extra line before TARTIŞMA, SONUÇ VE ÖNERİLER)")
# TOC labels equal the real printed pages
def printed(i):
    l = label_of(i)
    return l["text"] if l else None
real = {}
for name, idx in (("ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI", i_ethics), ("ENSTİTÜ ONAYI", i_onay), ("ÖZET", i_ozet), ("ABSTRACT", i_abs), ("ÖN SÖZ", i_preface), ("TABLOLAR LİSTESİ", i_lot), ("ŞEKİLLER LİSTESİ", i_lof), ("RESİMLER LİSTESİ", i_lop), ("SİMGELER VE KISALTMALAR DİZİNİ", i_sym), ("GİRİŞ", i_giris), ("TARTIŞMA, SONUÇ VE ÖNERİLER", i_concl), ("KAYNAKÇA", i_bib), ("EKLER DİZİNİ", i_ekidx), ("EKLER", i_ekler)):
    real[name] = printed(idx)
mism = []
for name, lab in real.items():
    row = [l["text"] for i, l in toc_all if re.match(rf"^{re.escape(name)}\s*\.{{3,}}", l["text"]) and re.search(r"[\divx]+$", l["text"])]
    got = re.search(r"([\divx]+)$", row[0]).group(1) if row else None
    if got != lab:
        mism.append((name, got, lab))
chk("toc-labels-real-pages", verdict(not mism), "every front/back-matter TOC row carries the printed page of its section", mism or "14/14 rows match", "guide §2.6 viii; TOC rows vs printed labels in the same PDF")
# heading rows (numbered): compare with the real page of the heading text
mism2 = []
heads = []
for i in range(i_giris, i_concl):
    for l in pages[i]:
        m = re.match(r"^((\d+\.)+) (.+)$", l["text"])
        if m and l["size"] == 12.0 and l["x0"] < 31 and l["baseline"] < 272 and not re.search(r"\d+\. [a-zçğıöşü]", l["text"][:6]):
            heads.append((m.group(1), m.group(3).strip().upper(), printed(i)))
for lab, title, pg in heads[:40]:
    key = f"{lab} {title}"[:30]
    row = next((l["text"] for i, l in toc_all if l["text"].upper().startswith(key[:24])), None)
    if row is None:
        continue
    got = re.search(r"([\divx]+)$", row)
    if got and got.group(1) != pg:
        mism2.append((lab, title[:20], got.group(1), pg))
chk("toc-heading-rows-real-pages", verdict(not mism2 and len(heads) > 10), "numbered heading rows carry the real page", mism2 or f"{len(heads)} headings checked", "guide §2.6 viii")

# ---------------------------------------------------------------- lists
def list_check(idx, title, kind):
    ls = [l for l in pages[idx] if 20 < l["baseline"] < 272]
    t = next(l for l in ls if l["text"] == title)
    sy = next(l for l in ls if l["text"] == "Sayfa")
    rows_ = [l for l in ls if re.match(rf"^{kind} \d+\.", l["text"])]
    return t, sy, rows_
lst_ev = {}
ok_lists = True
for idx, title, kind in ((i_lot, "TABLOLAR LİSTESİ", "Tablo"), (i_lof, "ŞEKİLLER LİSTESİ", "Şekil"), (i_lop, "RESİMLER LİSTESİ", "Resim")):
    t, sy, rws = list_check(idx, title, kind)
    g1 = round((sy["baseline"] - t["baseline"]) / PT, 3)
    g2 = round((rws[0]["baseline"] - sy["baseline"]) / PT, 3)
    pitches_ = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(rws, rws[1:]) if within(b["x0"], 30.0, 0.5)]
    lst_ev[title] = {"title->Sayfa": g1, "Sayfa->row1": g2, "row pitches": sorted(set(pitches_)), "rows": len(rws), "labelBold": rws[0]["firstBold"], "centre": round((t["x0"] + t["x1"]) / 2, 2), "sayfaX1": round(sy["x1"], 2)}
    ok = within(g1, 13.8 - 11.2 + 6 + 11.2 - 0.0 - 0.0, 0.4) and within(g2, 13.8, 0.2) and all(within(p, 13.8, 0.2) for p in pitches_) and rws[0]["firstBold"] and t["bold"] and within(sy["x1"], 180.0, 0.5)
    ok_lists &= bool(ok)
chk("lot-title-spacing", verdict(ok_lists), "title 6 before / 6 after (title->Sayfa = 2.6+6+11.2 = 19.8 pt?? see note), entries single 0/0 (13.8 pt), 'Sayfa' ends 180.0, bold label", lst_ev, "guide §2.7-2.9 (başlık 6nk/6nk; kayıtlar 0nk/0nk, tek satır); spec lists.titleSpacing", "Sayfa follows the title directly (list pages), unlike İÇİNDEKİLER")
wrapped_list = []
for idx in (i_lof,):
    ls = [l for l in pages[idx] if 20 < l["baseline"] < 272]
    for a, b in zip(ls, ls[1:]):
        if a["text"].startswith("Şekil 4.") and b["x0"] > 33:
            wrapped_list.append((round(b["x0"] - 30.0, 2), round((b["baseline"] - a["baseline"]) / PT, 3)))
chk("lists-hanging", verdict(bool(wrapped_list) and all(10.5 <= w[0] <= 16 for w in wrapped_list)), "wrapped entry lines hang under the title after the label (EK 9 measured 12.4-15.3 mm by label width)", wrapped_list, "spec lists.hangingIndentMm MEASURED 12.36 (varies with label width)")

# ---------------------------------------------------------------- abstract, preface, symbols
oz = pages[i_ozet]
oz_text = [l for l in oz if 20 < l["baseline"] < 272 and l["size"] == 12.0 and not l["bold"] and l["text"].startswith(("Özet", "dijital", "ve", "güven")) or False]
oz_body = [l for l in oz if 20 < l["baseline"] < 272 and not l["bold"] and l["size"] == 12.0 and l["x1"] - l["x0"] > 60]
pa = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(oz_body, oz_body[1:]) if within(b["x0"], 30.0, 0.5) and within(a["x0"], 30.0, 0.5) and (b["baseline"] - a["baseline"]) / PT < 16]
chk("abstract-pitch", verdict(pa and all(within(p, 13.8, 0.2) for p in pa)), "13.8 pt (single)", {"n": len(pa), "set": sorted(set(pa))}, "guide §2.4 'tek satır aralığı ile'")
chk("abstract-onepage", verdict(i_abs - i_ozet == 1 and i_preface - i_abs == 1), "ÖZET and ABSTRACT each one page", {"ÖZET pages": i_abs - i_ozet, "ABSTRACT pages": i_preface - i_abs}, "guide §2.4 'bir sayfayı aşmamalı'")
first_text = next(l for l in oz if l["text"].startswith("Özet 1."))
kw = next(l for l in oz if l["text"].startswith("Anahtar Kelimeler:"))
kw_next = next(l for l in oz if l["baseline"] > kw["baseline"] + 1 and l["baseline"] < 272)
chk("abstract-keywords", verdict(within(first_text["x0"], 30.0, 0.5) and kw["firstBold"] and within(kw["x0"], 30.0, 0.5) and within(kw_next["x0"], 30.0 + 35.62, 0.6)), "text x0 = 30.0 (no first-line indent), label bold, continuation at the end of the label (+35.6 mm)", {"textX0": round(first_text["x0"], 2), "kwX0": round(kw["x0"], 2), "contX0": round(kw_next["x0"], 2)}, "guide §2.4, EK 5 (normatif, §2.4)")
pf = [l for l in pages[i_preface] if 20 < l["baseline"] < 272 and l["size"] == 12.0 and not l["bold"]]
pf_body = [l for l in pf if l["x1"] - l["x0"] > 100]
pf_pitch = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(pf_body, pf_body[1:]) if (b["baseline"] - a["baseline"]) / PT < 16]
chk("preface-pitch", verdict(pf_pitch and all(within(p, 13.8, 0.2) for p in pf_pitch)), "13.8 pt (single)", sorted(set(pf_pitch)), "guide §2.5 (tek satır aralığı)")
first_pf = next(l for l in pf if l["text"].startswith("Önsöz 1."))
chk("preface-indent", verdict(within(first_pf["x0"], 42.5, 0.5)), "first line x0 = 42.5 (12.5 mm indent)", round(first_pf["x0"], 2), "guide §5.2 (paragraf girintisi), spec preface-indent")
sig = next(l for l in pages[i_preface] if l["text"] == "Yusuf GÖKÇE")
last_pf = max((l for l in pf if l["baseline"] < sig["baseline"] - 1), key=lambda l: l["baseline"])
chk("preface-signature", verdict(within(sig["x1"], 180.0, 0.5) and within((sig["baseline"] - last_pf["baseline"]) / PT, 2.6 + 6 + 13.8 + 11.2, 0.3)), "student name right-aligned x1 = 180.0, one line below the text", {"x1": round(sig["x1"], 2), "dy_pt": round((sig["baseline"] - last_pf["baseline"]) / PT, 2)}, "guide §2.5 'bir satır aralığı altına ve sağ kenarda'")
sm = [l for l in pages[i_sym] if 20 < l["baseline"] < 272 and l["size"] == 12.0]
sm_e = [l for l in sm if l["text"].startswith(("f ", "% ", "α", "BAP", "ÖSYM", "f\t")) or l["text"].split(" ")[0] in ("f", "%", "BAP", "ÖSYM")]
sm_gap = [round((b["baseline"] - a["baseline"]) / PT - 13.8, 3) for a, b in zip(sm_e, sm_e[1:]) if within(a["x0"], 42.5, 0.5) and within(b["x0"], 42.5, 0.5) and (b["baseline"] - a["baseline"]) / PT < 28]
chk("symbols-list", verdict(sm_e and all(within(l["x0"], 42.5, 0.5) for l in sm_e if l["text"].split(" ")[0] in ("f", "%", "BAP", "ÖSYM")) and (not sm_gap or all(within(v, 12.0, 0.3) for v in sm_gap))), "single, 6/6 pt (12 pt extra between entries), first-line x0 = 42.5", {"x0": sorted({round(l['x0'], 2) for l in sm_e}), "extra": sm_gap}, "EK 10 + §5.2 + spec lists.symbols.format")

# ---------------------------------------------------------------- covers
ic = pages[i_inner]
hdr = [l for l in ic if l["text"] in ("T.C.", "AFYON KOCATEPE ÜNİVERSİTESİ", "SOSYAL BİLİMLER ENSTİTÜSÜ") or l["text"].endswith("ANABİLİM DALI") or l["text"] in ("YÜKSEK LİSANS TEZİ", "DOKTORA TEZİ")]
hp = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(hdr, hdr[1:])]
chk("inner-cover-header", verdict(len(hdr) == 5 and all(l["size"] == 12.0 and l["bold"] and within((l["x0"] + l["x1"]) / 2, 105.0, 0.5) for l in hdr) and all(within(p, 20.7, 0.2) for p in hp)), "12 pt bold caps centred on 105.0, pitch 20.7 pt", {"lines": [l["text"] for l in hdr], "pitch": hp}, "guide §2.1 i")
title_ls = [l for l in ic if l["size"] == 16.0]
tp = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(title_ls, title_ls[1:])]
chk("inner-cover-title", verdict(len(title_ls) >= 2 and all(l["bold"] and within((l["x0"] + l["x1"]) / 2, 105.0, 0.5) for l in title_ls) and all(within(p, 27.6, 0.2) for p in tp)), "16 pt bold caps centred, wrapped pitch 27.6 pt", {"lines": len(title_ls), "pitch": tp}, "guide §2.1 ii")
oth = [l for l in ic if l["size"] == 12.0 and (l["text"] in ("Hazırlayan", "Yusuf GÖKÇE", "Jüri Üyeleri") or re.match(r"^AFYONKARAHİSAR \d{4}$", l["text"]))]
chk("inner-cover-names", verdict(all(l["size"] == 12.0 and l["bold"] for l in oth) and len(oth) >= 4), "student/jury/city+year 12 pt bold", [(l["text"], l["size"], l["bold"]) for l in oth], "guide §2.1 iii-v")
deg = {"aku-sbe-master-tr-v1": "YÜKSEK LİSANS TEZİ", "aku-sbe-phd-tr-v1": "DOKTORA TEZİ"}[registry_id]
chk("inner-cover-degree-line", verdict(any(l["text"] == deg for l in ic)), deg, [l["text"] for l in ic if "TEZİ" in l["text"]], "guide §2.1 i; EK 2a")
seq_ic = [l["text"] for l in ic]
idx = lambda s: next((k for k, t in enumerate(seq_ic) if t.startswith(s)), 99)
chk("inner-cover-order", verdict(idx("T.C.") < idx("AFYON") < idx("SOSYAL") < idx(deg) < idx("YÖNETİCİYE") < idx("Hazırlayan") < idx("Jüri Üyeleri") < idx("Danışman") < next((k for k, t in enumerate(seq_ic) if re.match(r"^AFYONKARAHİSAR \d{4}$", t)), 99)), "header block, title, Hazırlayan+name, Jüri Üyeleri rows, city+year", seq_ic[:3] + ["..."] + seq_ic[-4:], "guide §2.1 / EK 2a")
ic_pages = i_ethics - i_inner
chk("inner-cover-onepage", verdict(ic_pages == 1), "inner cover on one sheet (counted as i)", ic_pages, "guide §5.3 (başlık sayfası tezin i numaralı sayfası)")
eth = pages[i_ethics]
et = [l for l in eth if 20 < l["baseline"] < 272]
eth_title = et[0]
eth_body = [l for l in et if l["size"] == 12.0 and (l["x1"] - l["x0"]) > 100 and not l["bold"] or (l["size"] == 12.0 and l["text"].startswith("Yüksek") ) or (l["size"] == 12.0 and l["text"].startswith("Doktora"))]
ep = [round((b["baseline"] - a["baseline"]) / PT, 3) for a, b in zip(eth_body, eth_body[1:]) if (b["baseline"] - a["baseline"]) / PT < 25]
sigl = [l for l in et if l["text"] in ("İmza", "Yusuf GÖKÇE") or re.match(r"^\d\d/\d\d/\d{4}$", l["text"])]
axes = [round((l["x0"] + l["x1"]) / 2, 2) for l in sigl]
chk("ethics-page", verdict(eth_title["bold"] and within((eth_title["x0"] + eth_title["x1"]) / 2, 105.0, 0.5) and within(eth_body[0]["x0"], 42.5, 0.5) and all(within(p, 20.7, 0.2) for p in ep) and degtxt_ok if (degtxt_ok := (("Yüksek Lisans tezi" if registry_id.startswith("aku-sbe-master") else "Doktora tezi") in " ".join(l["text"] for l in et))) else False), "title bold caps centred; text 12 pt 1.5 lines, 12.5 mm indent; degree wording per variant", {"indentX0": round(eth_body[0]["x0"], 2), "pitch": sorted(set(ep)), "wording": degtxt_ok}, "guide §2.2, EK 3")
chk("ethics-signature", verdict(len(sigl) == 3 and max(axes) - min(axes) < 0.3 and min(axes) > 105.0), "date / İmza / name share one centre axis right of the page centre", axes, "guide §2.2 (sağ alt), EK 3")
chk("ethics-justify", verdict(any(within(l["x1"], 180.0, 0.5) for l in eth_body)), "text justified to 180.0", [round(l["x1"], 2) for l in eth_body], "EK 3")
ap = pages[i_onay]
chk("approval-placeholder", verdict(labels[i_onay] == "iii" and any(l["text"] == "ENSTİTÜ ONAYI" and l["bold"] for l in ap)), "counted placeholder page iii titled ENSTİTÜ ONAYI", {"label": labels[i_onay], "lines": len(ap)}, "guide §2.3, EK 4 Not 1; AKU_DECISIONS")
oc = pages[0]
oc_first = oc[0]
chk("outer-cover-block", verdict(within(oc_first["baseline"], 228.34, 0.5) and all(within((l["x0"] + l["x1"]) / 2, 105.0, 0.5) for l in oc) and all(l["size"] == 12.0 for l in oc) and label_of(0) is None), "uncounted sheet, no number, centred 105.0, first baseline 228.34 (+-0.5), 12 pt (window size UNKNOWN)", {"first": round(oc_first["baseline"], 2), "last": round(oc[-1]["baseline"], 2), "lines": [l["text"] for l in oc][-5:], "maxWidth": round(max(l["x1"] - l["x0"] for l in oc), 1)}, "EK 1 (MEASURED 228.34); AKU_DECISIONS tanıtım", "window position/width NOT_SPECIFIED")
chk("no-extended-summary-tr", verdict(not any("GENİŞLETİLMİŞ" in l["text"] for p in pages for l in p)), "absent", "absent", "AKU_DECISIONS (TR variants carry no Genişletilmiş Türkçe Özet)")
chk("first-baseline-model", verdict(tops and all(within(b - 25.0, 3.95, 0.25) for _, b in tops)), "baseline - 25.0 mm = 3.95 (+-0.25)", [round(b - 25.0, 3) for _, b in tops[:6]], "spec wordModel.firstBaselineOffsetEm (MEASURED)")
lists_present = [t for t, i in (("TABLOLAR", i_lot), ("ŞEKİLLER", i_lof), ("RESİMLER", i_lop)) if i is not None]
chk("list-threshold", "PASS" if len(lists_present) == 3 and len(cap_t) >= 3 and len(cap_f) >= 3 and len(cap_p) >= 3 else "FAIL", "lists exist when >= 3 tables / figures / pictures", {"tables": len(numbered_seq(cap_t)), "figures": len(numbered_seq(cap_f)), "pictures": len(numbered_seq(cap_p)), "lists": lists_present}, "guide §2.7-2.9", "the <3 case is covered by the aku-sbe unit test and the lt3 export")

# ---------------------------------------------------------------- DOCX
d_ok = lambda c, e, a, ev, note="": chk(c, verdict(a is True or (a is not False and a)), e, a, ev, note)
mar = sects[2]  # a body section
chk("docx-margins", verdict(all(within(s["top"], tw(25), 3) and within(s["bottom"], tw(25), 3) and within(s["left"], tw(30), 3) and within(s["right"], tw(30), 3) for s in sects if s["w"] == 11906 and s["h"] >= 16830 and s is not sects[0])), "pgMar 25/25/30/30 mm = 1417/1417/1701/1701 twips (outer sheet frames excepted)", {"sections": len(sects), "set": sorted({(s['top'], s['bottom'], s['left'], s['right']) for s in sects})}, "guide §5.1; word/document.xml sectPr")
chk("docx-pgsize", verdict(all(s["w"] == 11906 and s["h"] == 16838 for s in sects)), "A4 11906 x 16838 twips", sorted({(s["w"], s["h"]) for s in sects}), "guide §5.1")
chk("docx-pagenum-formats", verdict(sects[1]["fmt"] == "lowerRoman" and sects[1]["start"] == "1" and any(s["fmt"] == "decimal" and s["start"] == "1" and k > 1 for k, s in enumerate(sects))), "inner cover section lowerRoman start 1; GİRİŞ section decimal start 1; outer sheet before it", [(k, s["fmt"], s["start"]) for k, s in enumerate(sects) if s["start"] or k < 2], "guide §5.3")
fonts_used = {r["font"] for p in dparas for r in p["runs"]} - {None}
chk("docx-fonts", verdict(fonts_used == {"Times New Roman"}), "all runs Times New Roman", sorted(fonts_used), "guide §5.2")
body_p = [p for p in dparas if p["text"].startswith("Çevrimiçi öğrenme ortamlarında öğretmen") and p["jc"] == "both"]
bp = body_p[0] if body_p else {}
chk("docx-body", verdict(bool(bp) and bp["line"] == "360" and bp["rule"] == "auto" and bp["before"] == "120" and bp["after"] == "120" and abs(int(bp["first"]) - 709) <= 2 and bp["runs"][0]["sz"] == 12.0), "Normal body: 12 pt, line 360 auto (1.5), before/after 120 (6 pt), firstLine 709 twips (12.5 mm), justified", {k: bp.get(k) for k in ("line", "rule", "before", "after", "first", "jc")}, "guide §5.2; word/document.xml")
h1p = [p for p in dparas if p["style"] == "Heading1" and "BÖLÜM" in p["text"]]
chk("docx-h1", verdict(len(h1p) >= 5 and all(p["jc"] == "center" and p["before"] == "240" and p["after"] == "240" and p["line"] == "360" and p["br"] and p["runs"][0]["b"] for p in h1p[:5])), "Heading1: centred bold, before/after 240 (12 pt), line 360, 'BİRİNCİ BÖLÜM' + line break + title", [(p["text"][:40], p["jc"], p["before"], p["after"], p["line"], p["br"]) for p in h1p[:2]], "guide §5.2, §5.5.1")
def hs(n):
    return [p for p in dparas if p["style"] == f"Heading{n}"]
chk("docx-h2-h5", verdict(all(hs(n) and all(p["line"] == "240" and p["before"] == "120" and p["after"] == "120" and p["jc"] == "left" for p in hs(n)) for n in (2, 3, 4, 5))) and verdict(hs(2)[0]["runs"][0]["b"] and not hs(3)[0]["runs"][0]["b"] and hs(4)[0]["runs"][0]["b"] and not hs(5)[0]["runs"][0]["b"]) == "PASS" and "PASS" or "FAIL", "Heading2-5: single (240), 120/120, left; bold: H2 yes, H3 no, H4 yes, H5 no", {n: (hs(n)[0]["text"][:25], hs(n)[0]["line"], hs(n)[0]["before"], hs(n)[0]["jc"], hs(n)[0]["runs"][0]["b"]) for n in (2, 3, 4, 5) if hs(n)}, "guide §2.6 iv, §5.5.2")
fn_xml = zf.read("word/footnotes.xml").decode("utf8")
fsz = sorted(set(re.findall(r'<w:sz w:val="(\d+)"', fn_xml)))
chk("docx-footnote", verdict(fsz == ["18"] or ("18" in fsz and "20" not in fsz)), "footnote runs 9 pt (sz 18), single", fsz, "guide §6.4; word/footnotes.xml")
ftr_sizes = set()
for name in zf.namelist():
    if re.match(r"word/footer\d+\.xml", name):
        x = zf.read(name).decode("utf8")
        if "PAGE" in x:
            ftr_sizes |= set(re.findall(r'<w:sz w:val="(\d+)"', x))
chk("docx-pagenum-field", verdict(ftr_sizes == {"24"} and any("PAGE" in zf.read(n).decode("utf8") and 'w:jc w:val="center"' in zf.read(n).decode("utf8") for n in zf.namelist() if re.match(r"word/footer\d+\.xml", n))), "centred PAGE field, 12 pt (sz 24)", sorted(ftr_sizes), "guide §5.3")
pageref = len(re.findall(r"PAGEREF", zf.read("word/document.xml").decode("utf8")))
chk("docx-toc-fields", verdict(pageref >= 30), "TOC/list rows are PAGEREF fields", pageref, "guide §2.6")
cap_p_x = [p for p in dparas if re.match(r"^Tablo \d+\. ", p["text"]) and p["runs"] and p["runs"][0]["sz"] == 11.0 and p["jc"] == "center"]
chk("docx-captions", verdict(len(cap_p_x) >= 3 and all(p["runs"][0]["b"] and not p["runs"][1]["b"] for p in cap_p_x[:3] if len(p["runs"]) > 1)), "caption paragraphs 11 pt centred, label run bold, title run regular", [(p["text"][:30], p["jc"], [r["b"] for r in p["runs"][:2]]) for p in cap_p_x[:2]], "guide §6.5.3")
toc_tail = [p for p in dparas if p["text"].startswith("TARTIŞMA, SONUÇ VE ÖNERİLER") and p["style"] is None and "PAGEREF" not in p["text"]]
toc_tail_row = next((p for p in dparas if p["text"].startswith("TARTIŞMA, SONUÇ VE ÖNERİLER") and p["jc"] == "left" and p["line"] == "240"), None)
chk("docx-toc-backmatter-gap", verdict(toc_tail_row is not None and toc_tail_row["before"] is not None and abs(int(toc_tail_row["before"]) - 276) <= 2), "TOC row of TARTIŞMA… has 13.8 pt (276 twips) space before", None if toc_tail_row is None else toc_tail_row["before"], "guide §2.6 vii; word/document.xml")
bib_x = [p for p in dparas if p["text"].startswith("Gilster")]
chk("docx-bibliography", verdict(bool(bib_x) and bib_x[0]["line"] == "240" and bib_x[0]["before"] == "0" and bib_x[0]["after"] == "0" and abs(int(bib_x[0]["hanging"] or 0) - 283) <= 3 and bib_x[0]["jc"] == "left"), "single, 0/0, hanging 0.5 cm = 283 twips, left", {k: bib_x[0].get(k) for k in ("line", "before", "after", "hanging", "jc")} if bib_x else None, "guide §4.1")

json.dump({"registryId": registry_id, "pdf": pdf_path, "docx": docx_path, "pages": N, "results": results}, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(r["status"] for r in results))
for r in results:
    if r["status"] != "PASS":
        print(r["status"], r["id"], "| expected:", str(r["expected"])[:110], "| actual:", str(r["actual"])[:220])
