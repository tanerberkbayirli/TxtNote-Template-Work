#!/usr/bin/env python3
"""PASS gate: measure a template's real exports and compare them with the sources.

  python3 scripts/pass-gate.py <templateId> [--exports output/pass-gate/<id>] [--draft output/template-drafts/<id>.draft.json] [--guide output/guide-rules/X.rules.json]

Inputs are the DOCX and PDF that tests/thesis-export-gate.e2e.mjs produced through the real
editor. The PDF is measured with PyMuPDF (text bounding boxes, baselines, fonts, page
number position), the DOCX with extract-docx-spec.py (section properties, styles).
Every check states expected (with its source), measured, difference and tolerance, and ends
PASS, FAIL or LIMIT (a documented engine limitation that is not compliance — e.g. the PDF
font substitute). Overall: FAIL if any check fails; LIMIT if none fails but a limit remains;
PASS only when every check passes. Output: <exports>/gate-report.{json,md}.
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PT2MM = 25.4 / 72
SINGLE_LINE_EM = {"Times New Roman": 1.15, "Arial": 1.15, "Cambria": 1.17, "Calibri": 1.22}
PDF_SUBSTITUTES = {"Times New Roman": {"Tinos", "TimesNewRoman", "Times New Roman"}, "Arial": {"Helvetica", "Arimo", "Arial"}, "Courier New": {"Courier", "Cousine"}}
ROMAN_RE = re.compile(r"^(?=[ivxlc]+$)m*(c[md]|d?c{0,3})(x[cl]|l?x{0,3})(i[xv]|v?i{0,3})$", re.I)


def roman_to_int(text: str) -> int:
    values = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100, "d": 500, "m": 1000}
    total, previous = 0, 0
    for char in reversed(text.lower()):
        value = values.get(char, 0)
        total += -value if value < previous else value
        previous = max(previous, value)
    return total


class Gate:
    def __init__(self):
        self.checks: list[dict] = []

    def add(self, name, expected, source, actual, result, *, tolerance=None, note=""):
        self.checks.append({"check": name, "expected": expected, "source": source, "actual": actual, "tolerance": tolerance, "result": result, "note": note})

    def compare(self, name, expected, source, actual, tolerance, note="", unit=""):
        if expected is None:
            self.add(name, None, source, actual, "UNKNOWN", note="kaynak değer yok")
            return
        if actual is None:
            self.add(name, expected, source, None, "FAIL", tolerance=tolerance, note="ölçülemedi")
            return
        diff = round(abs(actual - expected), 3)
        self.add(name, expected, source, actual, "PASS" if diff <= tolerance else "FAIL", tolerance=tolerance, note=f"fark {diff} {unit}. {note}".strip())


def pdf_lines(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            out.append({
                "x0": min(s["bbox"][0] for s in spans) * PT2MM, "x1": max(s["bbox"][2] for s in spans) * PT2MM,
                "y0": min(s["bbox"][1] for s in spans) * PT2MM, "y1": max(s["bbox"][3] for s in spans) * PT2MM,
                "font": spans[0]["font"], "size": round(spans[0]["size"], 2), "text": "".join(s["text"] for s in spans).strip(),
                "fonts": collections.Counter((s["font"], round(s["size"], 1)) for s in spans),
            })
    return out


def measure_pdf(path: Path, expected: dict, gate: Gate):
    import fitz
    doc = fitz.open(path)
    page_w, page_h = doc[0].rect.width * PT2MM, doc[0].rect.height * PT2MM
    gate.compare("PDF sayfa genişliği (mm)", expected["page"]["widthMm"], "şablon page.widthMm", round(page_w, 2), 0.5, unit="mm")
    gate.compare("PDF sayfa yüksekliği (mm)", expected["page"]["heightMm"], "şablon page.heightMm", round(page_h, 2), 0.5, unit="mm")
    margins = expected["page"]["margins"]
    body = expected["typography"]["body"]
    size = body.get("fontSizePt")
    spacing = expected["typography"].get("lineSpacing") or {}
    em = spacing.get("singleLineEm", 1.0) if spacing.get("mode") == "word" else 1.0
    pitch_expected = round(size * (body.get("lineHeight") or 1.0) * em, 2) if size else None
    numbering = expected["page"]["numbering"]
    body_lines, numbers, fonts, duplicates, pitches, tops, bottoms = [], [], collections.Counter(), 0, [], [], []
    for pno, page in enumerate(doc):
        lines = pdf_lines(page)
        seen = collections.Counter((round(l["x0"], 1), round(l["y0"], 1), l["text"]) for l in lines)
        duplicates += sum(count - 1 for count in seen.values())
        for l in lines:
            fonts.update(l["fonts"])
        # Page number: short numeric/roman line in the footer or header zone.
        number_lines = [l for l in lines if (l["text"].isdigit() or ROMAN_RE.match(l["text"])) and (l["y0"] > page_h - margins["bottomMm"] - 1 or l["y1"] < margins["topMm"] + 1) and (l["x1"] - l["x0"]) < 15]
        numbers.extend({**l, "page": pno + 1} for l in number_lines)
        content = [l for l in lines if l not in number_lines]
        full = [l for l in content if abs(l["size"] - size) < 0.6 and (l["x1"] - l["x0"]) > (page_w - margins["leftMm"] - margins["rightMm"]) * 0.9]
        if len(full) >= 6:  # a body page with real paragraphs
            body_lines.extend(full)
            ys = sorted({round(l["y0"], 2) for l in full})
            pitches.extend(round((b - a) / PT2MM, 2) for a, b in zip(ys, ys[1:]) if 5 < (b - a) / PT2MM < 60)
            tops.append(min(l["y0"] for l in content))
            bottoms.append(max(l["y1"] for l in content))
    if not body_lines:
        gate.add("PDF gövde satırları", "≥ 6 tam satırlı sayfa", "ölçüm ön koşulu", 0, "FAIL", note="Gövde sayfası bulunamadı")
        return
    left = statistics.mode(round(l["x0"], 2) for l in body_lines)
    right = page_w - statistics.mode(round(l["x1"], 2) for l in body_lines)
    gate.compare("PDF sol kenar boşluğu (mm)", margins["leftMm"], "şablon page.margins.leftMm", round(left, 2), 0.5, unit="mm", note="tam satırların x0 modu")
    gate.compare("PDF sağ kenar boşluğu (mm)", margins["rightMm"], "şablon page.margins.rightMm", round(right, 2), 0.5, unit="mm", note="iki yana yaslı tam satırların x1 modu")
    # Top: glyph box starts below the line box by the half-leading plus the font's internal lead; allow 2 mm.
    gate.compare("PDF üst kenar boşluğu (mm, ilk satır üstü)", margins["topMm"], "şablon page.margins.topMm", round(min(tops), 2), 2.0, unit="mm", note="glif kutusu satır kutusundan yarım boşluk + iç lead kadar aşağıdadır; 2 mm tolerans")
    bottom_gap = page_h - max(bottoms)
    pitch_mm = (pitch_expected or 20) * PT2MM
    bottom_ok = margins["bottomMm"] - 0.5 <= bottom_gap <= margins["bottomMm"] + pitch_mm + 2.0
    gate.add("PDF alt kenar boşluğu (mm, en dolu sayfanın son satırı)", f"{margins['bottomMm']} … {round(margins['bottomMm'] + pitch_mm + 2, 1)}", "şablon page.margins.bottomMm (+ bir satır payı)", round(bottom_gap, 2), "PASS" if bottom_ok else "FAIL", tolerance="aralık", note="son satır alt kenara en fazla bir satır kala biter")
    gate.compare("PDF satır aralığı (pt, taban çizgisi adımı modu)", pitch_expected, f"şablon body.lineHeight {body.get('lineHeight')} × {size} pt" + (f" × {em} em (Word satırı)" if em != 1 else ""), statistics.mode(pitches) if pitches else None, 0.3, unit="pt")
    (font, size_seen), _ = fonts.most_common(1)[0]
    gate.compare("PDF gövde puntosu (baskın span)", size, "şablon body.fontSizePt", size_seen, 0.1, unit="pt")
    expected_font = body.get("fontFamily")
    if font == expected_font:
        gate.add("PDF yazı tipi", expected_font, "şablon body.fontFamily", font, "PASS")
    elif font in PDF_SUBSTITUTES.get(expected_font, set()):
        gate.add("PDF yazı tipi", expected_font, "şablon body.fontFamily", font, "LIMIT", note=f"PDF yazıcısı {expected_font} yerine metrik eşdeğeri {font} gömüyor (lisans). Geometri aynı; yazı tipi uyumu sağlanmış sayılmaz.")
    else:
        gate.add("PDF yazı tipi", expected_font, "şablon body.fontFamily", font, "FAIL")
    gate.add("PDF aynı yere iki kez çizilen metin", 0, "export tutarlılığı", duplicates, "PASS" if duplicates == 0 else "FAIL", note="aynı konum ve metinle tekrar eden satır sayısı")
    # Page numbers
    if numbering.get("enabled"):
        if not numbers:
            gate.add("PDF sayfa numarası", "var", "şablon page.numbering", "yok", "FAIL")
        else:
            at_bottom = sum(1 for n in numbers if n["y0"] > page_h / 2)
            position = "bottom" if at_bottom >= len(numbers) / 2 else "top"
            gate.add("PDF sayfa numarası konumu", numbering["position"], "şablon page.numbering.position", position, "PASS" if position == numbering["position"] else "FAIL", note=f"{len(numbers)} numara bulundu")
            centers = [(n["x0"] + n["x1"]) / 2 for n in numbers]
            if numbering.get("align") == "center":
                gate.compare("PDF sayfa numarası yatay konumu (mm, orta)", round(page_w / 2, 2), "sayfa ortası", round(statistics.median(centers), 2), 0.5, unit="mm")
            elif numbering.get("align") == "right":
                gate.compare("PDF sayfa numarası sağ kenarı (mm)", round(page_w - margins["rightMm"], 2), "metin bloğu sağ kenarı", round(statistics.median(n["x1"] for n in numbers), 2), 0.5, unit="mm")
            romans = [n["text"] for n in numbers if ROMAN_RE.match(n["text"]) and not n["text"].isdigit()]
            arabics = [n["text"] for n in numbers if n["text"].isdigit()]
            roman_values = [roman_to_int(r) for r in romans]
            arabic_values = [int(a) for a in arabics]
            sequential = all(b == a + 1 for a, b in zip(roman_values, roman_values[1:])) and all(b == a + 1 for a, b in zip(arabic_values, arabic_values[1:]))
            gate.add("PDF ön sayfalar Romen / gövde Arap rakamı, artan dizi", "i, ii, iii… → 1, 2, 3…", "şablon bölüm numaralandırması", f"{', '.join(romans[:6])} → {', '.join(arabics[:4])}", "PASS" if romans and arabics and arabic_values[0] == 1 and roman_values[0] == 1 and sequential else "FAIL", note="" if sequential else "numaralar her bölümde yeniden başlıyor ya da atlıyor")
    return {"left": left, "right": right, "top": min(tops), "bottomGap": bottom_gap, "pitch": statistics.mode(pitches) if pitches else None, "font": font, "duplicates": duplicates, "numbers": len(numbers)}


def measure_docx(path: Path, expected: dict, gate: Gate):
    spec_path = path.with_suffix(".spec.json")
    subprocess.run([sys.executable, str(ROOT / "scripts" / "extract-docx-spec.py"), str(path), "--out", str(spec_path)], check=True, capture_output=True, text=True)
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    margins = expected["page"]["margins"]
    body_sections = [s for s in spec["sections"] if s["numbering"]["format"] == "decimal"] or spec["sections"]
    sect = max(body_sections, key=lambda s: s["paragraphs"])
    for side, key in (("top", "topMm"), ("bottom", "bottomMm"), ("left", "leftMm"), ("right", "rightMm")):
        gate.compare(f"DOCX {side} kenar boşluğu (mm, gövde bölümü)", margins[key], f"şablon page.margins.{key}", sect["marginsMm"][side], 0.5, unit="mm", note=f"sectPr#{sect['index']}")
    gate.compare("DOCX sayfa genişliği (mm)", expected["page"]["widthMm"], "şablon page.widthMm", sect["page"]["widthMm"], 0.5, unit="mm")
    gate.compare("DOCX sayfa yüksekliği (mm)", expected["page"]["heightMm"], "şablon page.heightMm", sect["page"]["heightMm"], 0.5, unit="mm")
    body = expected["typography"]["body"]
    profile = spec["profile"].get("bodyProfile") or {}
    gate.add("DOCX gövde yazı tipi (gerçek kullanım)", body.get("fontFamily"), "şablon body.fontFamily", profile.get("font"), "PASS" if profile.get("font") == body.get("fontFamily") else "FAIL", note=profile.get("basis", ""))
    gate.compare("DOCX gövde puntosu", body.get("fontSizePt"), "şablon body.fontSizePt", profile.get("sizePt"), 0.1, unit="pt")
    gate.add("DOCX gövde satır aralığı", f"{body.get('lineHeight')} satır", "şablon body.lineHeight (Word 'n satır')", profile.get("lineSpacing"), "PASS" if profile.get("lineSpacing") == f"{body.get('lineHeight')} satır" else "FAIL")
    gate.add("DOCX gövde hizası", body.get("align"), "şablon body.align", profile.get("align"), "PASS" if profile.get("align") == body.get("align") else "FAIL")
    formats = [s["numbering"]["format"] for s in spec["sections"]]
    gate.add("DOCX bölüm numara biçimleri", "Romen ön sayfalar, decimal gövde", "şablon bölümleri", ", ".join(str(f) for f in formats), "PASS" if "decimal" in formats and any(f and "Roman" in f for f in formats) else "FAIL")
    numbering = expected["page"]["numbering"]
    fields = [hf for s in spec["sections"] for hf in list(s["footers"].values()) + list(s["headers"].values()) if hf.get("hasPageField")]
    if numbering.get("enabled"):
        aligns = collections.Counter(hf.get("pageFieldAlign") for hf in fields)
        gate.add("DOCX PAGE alanı hizası", numbering.get("align"), "şablon page.numbering.align", dict(aligns), "PASS" if fields and aligns.most_common(1)[0][0] == numbering.get("align") else "FAIL")
    return {"sections": len(spec["sections"]), "margins": sect["marginsMm"]}


def guide_checks(rules: dict, expected: dict, gate: Gate):
    """Independent check of the installed template against the guide's EXPLICIT rules (spec may be wrong, AGENTS §15)."""
    margins = expected["page"]["margins"]
    for side, key in (("top", "topMm"), ("bottom", "bottomMm"), ("left", "leftMm"), ("right", "rightMm")):
        rule = rules.get(f"page.margins.{side}")
        if rule and rule["status"] == "EXPLICIT":
            gate.compare(f"Kılavuz ↔ şablon {side} kenar (mm)", rule["value"], f"kılavuz: “{rule['evidence'][0]['sentence'][:80]}”", margins[key], 0.5, unit="mm")
    body = expected["typography"]["body"]
    for key, field, tol in (("body.fontSizePt", "fontSizePt", 0.1), ("body.lineHeight", "lineHeight", 0.01)):
        rule = rules.get(key)
        if rule and rule["status"] == "EXPLICIT":
            gate.compare(f"Kılavuz ↔ şablon {field}", rule["value"], f"kılavuz: “{rule['evidence'][0]['sentence'][:80]}”", body.get(field), tol)
    for key, field in (("body.fontFamily", "fontFamily"), ("body.align", "align")):
        rule = rules.get(key)
        if rule and rule["status"] == "EXPLICIT":
            gate.add(f"Kılavuz ↔ şablon {field}", rule["value"], f"kılavuz: “{rule['evidence'][0]['sentence'][:80]}”", body.get(field), "PASS" if body.get(field) == rule["value"] else "FAIL")
    for key, path in (("page.numbering.position", "position"), ("page.numbering.align", "align")):
        rule = rules.get(key)
        if rule and rule["status"] == "EXPLICIT":
            gate.add(f"Kılavuz ↔ şablon sayfa numarası {path}", rule["value"], f"kılavuz: “{rule['evidence'][0]['sentence'][:80]}”", expected["page"]["numbering"].get(path), "PASS" if expected["page"]["numbering"].get(path) == rule["value"] else "FAIL")
    for kind in ("figures", "tables"):
        rule = rules.get(f"{kind}.position")
        if rule and rule["status"] == "EXPLICIT" and expected.get(kind):
            gate.add(f"Kılavuz ↔ şablon {kind} yazısı konumu", rule["value"], f"kılavuz: “{rule['evidence'][0]['sentence'][:80]}”", expected[kind]["position"], "PASS" if expected[kind]["position"] == rule["value"] else "FAIL")


def main() -> int:
    parser = argparse.ArgumentParser(description="Gerçek dışa aktarımı ölç ve kaynakla karşılaştır.")
    parser.add_argument("template_id")
    parser.add_argument("--exports", type=Path)
    parser.add_argument("--draft", type=Path)
    parser.add_argument("--guide", type=Path)
    args = parser.parse_args()
    exports = args.exports or (ROOT / "output" / "pass-gate" / args.template_id)
    draft_path = args.draft or (ROOT / "output" / "template-drafts" / f"{args.template_id}.draft.json")
    draft = json.loads(draft_path.read_text(encoding="utf-8"))
    expected = draft.get("template", draft)
    gate = Gate()
    pdf = measure_pdf(exports / "export.pdf", expected, gate)
    docx = measure_docx(exports / "export.docx", expected, gate)
    if args.guide:
        guide_checks(json.loads(args.guide.read_text(encoding="utf-8"))["rules"], expected, gate)
    results = collections.Counter(c["result"] for c in gate.checks)
    overall = "FAIL" if results["FAIL"] else ("LIMIT" if results["LIMIT"] else "PASS")
    unknown = draft.get("unknown", [])
    conflicts = draft.get("conflicts", [])
    report = {"templateId": args.template_id, "overall": overall, "results": dict(results), "checks": gate.checks, "pdf": pdf, "docx": docx, "draftUnknown": [u["field"] for u in unknown], "draftConflicts": conflicts}
    (exports / "gate-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    lines = [f"# PASS kapısı — {args.template_id}", "", f"**Sonuç: {overall}** · {results['PASS']} PASS · {results['FAIL']} FAIL · {results['LIMIT']} LIMIT · {results['UNKNOWN']} UNKNOWN", "",
             "Kaynak: " + str(expected.get("source", {}).get("documentName", "")) + (f" · kılavuz: {args.guide.name}" if args.guide else ""), "",
             "| Denetim | Beklenen | Kaynak | Ölçülen | Tolerans | Sonuç | Not |", "|---|---|---|---|---|---|---|"]
    for c in gate.checks:
        lines.append(f"| {c['check']} | {c['expected']} | {c['source']} | {c['actual']} | {c['tolerance'] if c['tolerance'] is not None else '—'} | **{c['result']}** | {c['note']} |")
    if unknown:
        lines += ["", f"Taslakta bilinmeyen alanlar ({len(unknown)}): " + ", ".join(u["field"] for u in unknown)]
    if conflicts:
        lines += ["", f"Şablon ↔ kılavuz çelişkileri ({len(conflicts)}):"] + [f"- {c['field']}: ölçülen {c['measured']} ≠ kılavuz {c['guide']} — {c['guideSource'][:120]}" for c in conflicts]
    lines += ["", "Tanımlar: PASS = kaynakla ölçülen değer tolerans içinde; FAIL = tolerans dışı; LIMIT = belgelenmiş motor sınırı (uyum sağlanmış sayılmaz); UNKNOWN = kaynak değer yok. Genel sonuç ancak hiç FAIL ve LIMIT yoksa PASS'tır."]
    (exports / "gate-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{overall}: {dict(results)} → {exports / 'gate-report.md'}")
    for c in gate.checks:
        if c["result"] != "PASS":
            print(f"  {c['result']:7} {c['check']}: beklenen {c['expected']} ölçülen {c['actual']} {c['note'][:70]}")
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
