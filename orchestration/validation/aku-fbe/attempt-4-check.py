"""Read-only measurements of fresh AKU-FBE attempt-4 real exports.

Usage: python attempt-4-check.py <export-directory> <result.json>
The directory contains master/phd.{pdf,docx}, *.long89.{pdf,docx}, and
eq-master/eq-phd/sweep.pdf, all produced through orchestration/tools/export.mjs.
"""
import json
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path[:0] = [str(ROOT / "tools"), str(HERE / "work2"), str(HERE / "work")]
from pdfmeasure import MM2PT, docx_sections, drawings_mm, embedded_fonts, open_pdf, page_number, page_size_mm, visual_lines
from checks import run as geometry_checks
from dchecks import dx as docx_checks
from schecks import specials as special_checks
from toccheck import run as toc_checks

EXPORTS = Path(sys.argv[1]).resolve()
OUTPUT = Path(sys.argv[2]).resolve()
SOURCE_DIR = ROOT.parent / "Butun-Sablonlar" / "Ege" / "Afyon Kocatepe Üniversitesi"
SOURCE_DOCX = SOURCE_DIR / "AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx"


def pick_checks(items):
    return [{k: c.get(k) for k in ("id", "expected", "actual", "difference", "tolerance", "result", "source")}
            for c in items]


def equation_sweep(path):
    doc = open_pdf(path)
    pairs = []
    eq_y = []
    for pno, page in enumerate(doc, 1):
        lines = [ln for ln in visual_lines(page) if 30 < ln["baseline"] < 262]
        for i, line in enumerate(lines):
            if not (line["text"].startswith("x") and re.search(r"\(\d+\.\d+\)$", line["text"])):
                continue
            eq_y.append(line["baseline"])
            for side, neighbour in (("before", lines[i-1] if i else None), ("after", lines[i+1] if i+1 < len(lines) else None)):
                if neighbour is None:
                    continue
                gap = abs(line["baseline"] - neighbour["baseline"]) * MM2PT
                if gap < 30:  # within a formula, rather than a neighbouring block
                    continue
                pairs.append({"page": pno, "equationBaselineMm": line["baseline"], "side": side,
                              "gapPt": round(gap, 3), "deltaPt": round(gap - 41.4, 3),
                              "status": "PASS" if abs(gap - 41.4) <= 0.2 else "FAIL"})
    return {"artifact": str(path), "pdfSha256": sha256(path), "pages": len(doc), "equationCount": len(eq_y),
            "checkedPairs": len(pairs), "uniqueBaselinesMm": sorted(set(round(y, 2) for y in eq_y)),
            "minPt": round(min(p["gapPt"] for p in pairs), 3),
            "maxPt": round(max(p["gapPt"] for p in pairs), 3),
            "failures": [p for p in pairs if p["status"] == "FAIL"], "pairs": pairs}


def default_equation_gap(doc):
    for pno, page in enumerate(doc, 1):
        lines = visual_lines(page)
        for line in lines:
            if not re.search(r"E = m c.*\(3\.1\)$", line["text"]):
                continue
            before = max((ln for ln in lines if ln["baseline"] < line["baseline"] - 2 and ln["size"] >= 11),
                         key=lambda ln: ln["baseline"])
            after = min((ln for ln in lines if ln["baseline"] > line["baseline"] + 2 and ln["size"] >= 11),
                        key=lambda ln: ln["baseline"])
            before_pt = (line["baseline"]-before["baseline"])*MM2PT
            after_pt = (after["baseline"]-line["baseline"])*MM2PT
            return {"page": pno, "equationBaselineMm": line["baseline"],
                    "beforePt": round(before_pt, 3), "afterPt": round(after_pt, 3),
                    "beforeDeltaPt": round(before_pt-41.4, 3),
                    "afterDeltaPt": round(after_pt-41.4, 3),
                    "beforeStatus": "PASS" if abs(before_pt-41.4) <= 0.2 else "FAIL",
                    "afterStatus": "PASS" if abs(after_pt-41.4) <= 0.2 else "FAIL",
                    "expectedPt": 41.4, "tolerancePt": 0.2}
    raise ValueError("Default fixture's numbered equation not found")


def layer_order(doc):
    checks = {"heading": [], "caption": [], "listMarker": [], "orphanNumber": []}
    heading = re.compile(r"^\d+\.(?:\d+\.){0,2}\d* ?[A-Za-zÇĞİÖŞÜçğıöşü]")
    caption = re.compile(r"^(Şekil|Çizelge|Resim) \d+\.\d+(?: \(Devam\))? .+")
    marker = re.compile(r"^(?:\d+[.)]|[a-zçğıöşü][.)]) (?:Veri|Ölçme|Bulgular|Madde)\b")
    for pno, page in enumerate(doc, 1):
        lines = page.get_text().splitlines()
        if pno < 14:  # generated TOC/list pages contain references, not source headings/captions
            continue
        for line in lines:
            if heading.match(line) and not marker.match(line):
                checks["heading"].append({"page": pno, "raw": line, "status": "PASS"})
            if caption.match(line):
                checks["caption"].append({"page": pno, "raw": line, "status": "PASS"})
            if marker.match(line):
                checks["listMarker"].append({"page": pno, "raw": line, "status": "PASS"})
            if re.fullmatch(r"\d+(?:\.\d+){0,3}\.", line):
                checks["orphanNumber"].append({"page": pno, "raw": line, "status": "FAIL"})
    return checks


def approval(pdf, docx):
    document = open_pdf(pdf)
    page = document[2]
    lines = visual_lines(page)
    strokes = [d for d in drawings_mm(page) if d["x0"] < 30 and d["x1"] > 175 and 180 < d["top"] < 285]
    # The frame's bottom horizontal strokes span almost the entire frame width.
    bottom = max(d["bottom"] for d in strokes)
    text_bottom = max(line["bottom"] for line in lines)
    section = docx_sections(docx)[2]
    margin = section["margins"]["bottom"]
    source_margin = min(s["margins"]["bottom"] for s in docx_sections(SOURCE_DOCX))
    limit = 297 - source_margin
    return {"pdf": str(pdf), "docx": str(docx), "pdfSha256": sha256(pdf),
            "frameBottomMm": round(bottom, 3),
            "textBottomMm": round(text_bottom, 3), "sourceBottomMarginMm": source_margin,
            "docxApprovalBottomMarginMm": margin, "docxMarginDeltaMm": round(margin-source_margin, 3),
            "sourceLimitMm": round(limit, 3), "frameDeltaMm": round(bottom-limit, 3),
            "frameStatus": "PASS" if bottom <= limit + 0.5 else "FAIL",
            "docxMarginStatus": "PASS" if abs(margin-source_margin) <= 0.5 else "FAIL"}


def section_margin_audit(docx):
    source_bottom = min(s["margins"]["bottom"] for s in docx_sections(SOURCE_DOCX))
    rows = []
    for i, section in enumerate(docx_sections(docx)[:4]):
        actual = section["margins"]["bottom"]
        rows.append({"physicalPage": i + 1, "sourceBottomMm": source_bottom,
                     "actualBottomMm": actual, "deltaMm": round(actual-source_bottom, 3),
                     "toleranceMm": 0.5, "status": "PASS" if abs(actual-source_bottom) <= 0.5 else "FAIL"})
    return rows


def cover_box(pdf):
    doc = open_pdf(pdf)
    lines = visual_lines(doc[0])
    bottom = max(line["bottom"] for line in lines)
    return {"pdf": str(pdf), "textBottomMm": round(bottom, 3),
            "sourceLimitMm": 275.0, "deltaMm": round(bottom-275, 3),
            "toleranceMm": 0.25, "status": "PASS" if bottom <= 275.25 else "FAIL"}


def index_labels(pdf):
    doc = open_pdf(pdf)
    page_labels, toc_rows, toc_failures, toc_ok = toc_checks(str(pdf))
    # The older TOC helper cannot resolve the three Turkish list titles after
    # the text-layer change. Their physical page labels can be checked directly.
    front_lists = {"ŞEKİLLER DİZİNİ": "vii", "ÇİZELGELER DİZİNİ": "viii", "RESİMLER DİZİNİ": "ix"}
    list_title_checks = []
    for title, expected in front_lists.items():
        pages = [i for i, page in enumerate(doc, 1) if any(ln["text"] == title for ln in visual_lines(page))]
        actual = page_labels.get(pages[0]) if pages else None
        list_title_checks.append({"title": title, "page": pages[0] if pages else None,
                                  "expected": expected, "actual": actual,
                                  "status": "PASS" if actual == expected else "FAIL"})
    captions = {}
    for i, page in enumerate(doc, 1):
        if not (page_labels.get(i) or "").isdigit():
            continue
        for ln in visual_lines(page):
            match = re.match(r"^(Şekil|Çizelge|Resim) (\d+\.\d+)\b", ln["text"])
            if match:
                captions.setdefault(match.group(0), page_labels[i])
    list_rows = []
    for page in doc:
        lines = visual_lines(page)
        if not lines or lines[0]["text"] not in front_lists:
            continue
        for ln in lines:
            match = re.match(r"^((?:Şekil|Çizelge|Resim) \d+\.\d+)\b.*\.{5,}\s*(\d+)$", ln["text"])
            if match:
                actual = match.group(2)
                expected = captions.get(match.group(1))
                list_rows.append({"caption": match.group(1), "expected": expected, "actual": actual,
                                  "status": "PASS" if expected == actual else "FAIL"})
    return {"tocRows": len(toc_rows), "tocMatchedByExistingHelper": toc_ok,
            "tocHelperUnresolved": toc_failures, "listTitleChecks": list_title_checks,
            "listRows": list_rows}


result = {"sourceDocx": str(SOURCE_DOCX), "sourceSectionMargins":
          [s["margins"] for s in docx_sections(SOURCE_DOCX)], "variants": {}, "regression": {}}
def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

for name, degree in (("master", ("YÜKSEK LİSANS TEZİ", "Yüksek Lisans Tezi", "M.Sc. Thesis")),
                     ("phd", ("DOKTORA TEZİ", "Doktora Tezi", "Ph.D. Thesis"))):
    pdf, docx = EXPORTS / f"{name}.pdf", EXPORTS / f"{name}.docx"
    geometry, pages = geometry_checks(str(pdf), str(docx), name, degree[0])
    structure = docx_checks(str(docx), name)
    special = special_checks(str(pdf), name, degree)
    doc = open_pdf(pdf)
    sweep = equation_sweep(EXPORTS / f"eq-{name}" / "sweep.pdf")
    result["variants"][name] = {
        "pdf": str(pdf), "docx": str(docx), "pdfSha256": sha256(pdf),
        "fixtureSha256": sha256(EXPORTS / f"{name}.fixture.json"), "pageCount": len(doc),
        "pageSizesMm": sorted(set(page_size_mm(p) for p in doc)),
        "pageLabels": [page_number(p)["text"] if page_number(p) else None for p in doc],
        "embeddedFonts": embedded_fonts(doc),
        "geometryChecks": pick_checks(geometry), "docxChecks": pick_checks(structure),
        "specialChecks": pick_checks(special), "equationSweep": sweep,
        "textLayer": layer_order(doc),
        "defaultEquationGap": default_equation_gap(doc),
        "indexLabels": index_labels(pdf),
        "approvalDefault": approval(pdf, docx),
        "approvalLong89": approval(EXPORTS / f"{name}.long89.pdf", EXPORTS / f"{name}.long89.docx"),
        "long89OuterCover": cover_box(EXPORTS / f"{name}.long89.pdf"),
        "firstFourDocxBottomMargins": section_margin_audit(docx),
    }
for name, v in result["variants"].items():
    print(name, "pages", v["pageCount"], "sweep", v["equationSweep"]["checkedPairs"],
          v["equationSweep"]["minPt"], v["equationSweep"]["maxPt"],
          "long approval", v["approvalLong89"]["frameBottomMm"], "/", v["approvalLong89"]["sourceLimitMm"])
    for category in ("geometryChecks", "docxChecks", "specialChecks"):
        print(category, [(c["id"], c["result"]) for c in v[category] if c["result"] == "FAIL"])
    print("text layer samples", {k: len(x) for k, x in v["textLayer"].items()})

repeat_pdf = EXPORTS / "phd-repeat.pdf"
if repeat_pdf.exists():
    repeat_doc = open_pdf(repeat_pdf)
    result["phdRepeat"] = {"pdf": str(repeat_pdf), "pdfSha256": sha256(repeat_pdf),
                           "fixtureSha256": sha256(EXPORTS / "phd.fixture.json"),
                           "pageCount": len(repeat_doc), "equationGap": default_equation_gap(repeat_doc)}

for registry_id, expected_pages, expected_font in (
    ("mcbu-lee-master-tr-v1", 34, "Times New Roman"),
    ("mcbu-lee-phd-tr-v1", 35, "Times New Roman"),
    ("demo-university-a-master-tr-v1", 24, "Tinos"),
):
    pdf = EXPORTS / f"{registry_id}.pdf"
    docx = EXPORTS / f"{registry_id}.docx"
    doc = open_pdf(pdf)
    families = sorted({f.get("family") for f in embedded_fonts(doc) if f.get("embedded") and f.get("family")})
    labels = [page_number(p)["text"] if page_number(p) else None for p in doc]
    layout = json.loads((EXPORTS / f"{registry_id}.layout.json").read_text(encoding="utf-8"))
    reg = {"pdf": str(pdf), "docx": str(docx), "expectedPagesFromAttempt3": expected_pages,
           "actualPages": len(doc), "expectedFont": expected_font, "embeddedFamilies": families,
           "pageLabels": labels, "docxSections": len(docx_sections(docx)),
           "exportErrors": layout.get("errors", []), "status": "PASS" if len(doc) == expected_pages and
           expected_font in families and not layout.get("errors") else "FAIL"}
    result["regression"][registry_id] = reg
    print("regression", registry_id, reg["status"], len(doc), families)

OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
