"""Measure the official AKÜ FBE Word-rendered PDF and the test copy.

Run with PyMuPDF 1.28.2 (the validation environment used for the AKÜ exports):
  python measure_word_pdf.py [official.pdf] [long-title-seven-jurors.pdf]

Coordinates and baselines are extracted from the actual Word PDFs. Values are
converted from PDF points to millimetres (25.4 / 72), with no visual estimate.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[4]
DEFAULTS = [
    ROOT / "orchestration/artifacts/aku-fbe/source/word-render/official.pdf",
    Path(__file__).parent / "official-long89-seven-jurors.docx.pdf",
]
MM = 25.4 / 72


def line_rows(doc):
    rows = []
    for page_no, page in enumerate(doc, 1):
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                spans = line["spans"]
                text = "".join(span["text"] for span in spans).strip()
                if not text:
                    continue
                x0, y0, x1, y1 = line["bbox"]
                origins = [s.get("origin") for s in spans if s.get("origin")]
                rows.append({
                    "page": page_no,
                    "text": text,
                    "x0Mm": round(x0 * MM, 3),
                    "y0Mm": round(y0 * MM, 3),
                    "x1Mm": round(x1 * MM, 3),
                    "y1Mm": round(y1 * MM, 3),
                    "baselineMm": round(origins[0][1] * MM, 3) if origins else None,
                    "sizesPt": sorted({round(float(s["size"]), 3) for s in spans}),
                    "fonts": sorted({s["font"] for s in spans}),
                })
    return rows


def page_size(doc):
    rect = doc[0].rect
    return {"widthMm": round(rect.width * MM, 3), "heightMm": round(rect.height * MM, 3)}


def embedded_font_rows(doc):
    result = {}
    for page_no in range(len(doc)):
        for font in doc.get_page_fonts(page_no, full=True):
            xref, ext, font_type, base_font = font[0], font[1], font[2], font[3]
            extracted = doc.extract_font(xref)
            result[base_font] = {
                "name": base_font,
                "xref": xref,
                "extension": ext,
                "type": font_type,
                "embeddedProgramBytes": len(extracted[3]) if extracted else 0,
            }
    return sorted(result.values(), key=lambda f: f["xref"])


def selected(rows, page, regex, limit=12):
    pattern = re.compile(regex, re.IGNORECASE)
    return [r for r in rows if r["page"] == page and pattern.search(r["text"])][:limit]


def summarize(pdf: Path):
    doc = fitz.open(pdf)
    rows = line_rows(doc)
    fonts = embedded_font_rows(doc)
    page_labels = {}
    for page in range(1, len(doc) + 1):
        candidates = [r for r in rows if r["page"] == page and r["y0Mm"] > 278 and r["y1Mm"] < 286]
        if candidates:
            page_labels[str(page)] = candidates

    samples = {
        "outerCoverAndDate": [r for r in rows if r["page"] == 1 and
                               ("Ay Yıl" in r["text"] or "Dijital Okuryazarlık" in r["text"] or
                                "TEZ BAŞLIĞI" in r["text"])],
        "innerCoverAndDate": [r for r in rows if r["page"] == 2 and
                               ("Ay Yıl" in r["text"] or "Dijital Okuryazarlık" in r["text"] or
                                "TEZ BAŞLIĞI" in r["text"] or r["text"] in {"AFYON KOCATEPE ÜNİVERSİTESİ", "FEN BİLİMLERİ ENSTİTÜSÜ", "YÜKSEK LİSANS TEZİ / DOKTORA TEZİ", "Öğrencinin Adı SOYADI", "Danışman", "İkinci Danışman", "ANABİLİM DALI"})],
        "approval": [r for r in rows if r["page"] in (3, 4) and
                     ("TEZ ONAY SAYFASI" in r["text"] or "tarafından hazırlanan" in r["text"] or
                      r["text"].strip() in {"Başkan", "Üye", "Danışman", "İkinci Danışman", "Enstitü Müdürü"} or
                      "Üniversite adı, Fakültesi" in r["text"] or "Prof. Dr. Bekir YALÇIN" in r["text"])],
        "abstract": selected(rows, 5, r"ÖZET|Yüksek Lisans Tezi|Dijital Okuryazarlık|Danışman|Anahtar Kelimeler"),
        "toc": selected(rows, 8, r"İÇİNDEKİLER|Sayfa|ÖZET|ABSTRACT|GİRİŞ"),
        "bodyPage14": selected(rows, 14, r"GİRİŞ|Arpa \("),
        "captions": [r for r in rows if r["page"] in (17, 18, 24) and re.match(r"^(Çizelge|Şekil|Resim) \d+\.\d+", r["text"])],
        "pageNumbers": page_labels,
    }

    body_lines = [r for r in rows if r["page"] == 14 and
                  30 <= r["x0Mm"] <= 31 and 33 <= r["baselineMm"] <= 110 and 12 in r["sizesPt"]]
    body_pitch = [round((b["baselineMm"] - a["baselineMm"]) * 72 / 25.4, 3)
                  for a, b in zip(body_lines, body_lines[1:])
                  if 0 < (b["baselineMm"] - a["baselineMm"]) < 10]

    return {
        "pdf": str(pdf),
        "pageCount": len(doc),
        "pageSize": page_size(doc),
        "embeddedFonts": fonts,
        "timesNewRomanFontProgramsEmbedded": any(
            "TimesNewRoman" in f["name"] and f["embeddedProgramBytes"] > 0 for f in fonts
        ),
        "sampleBodyPitchPt": body_pitch,
        "samples": samples,
    }


def main():
    files = [Path(arg) for arg in sys.argv[1:]] or DEFAULTS
    result = {"pymupdfVersion": fitz.VersionBind, "millimetresPerPoint": MM,
              "documents": [summarize(path) for path in files]}
    output = Path(__file__).parent / "measurements.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
