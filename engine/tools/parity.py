"""Editor-PDF vs Word-PDF page parity of ONE document (used by parity.mjs).

No template knowledge: it compares what each renderer put on every physical page, so a long document with tables,
figures and footnotes shows where the editor/PDF and Word diverge, independently of the template.

usage: python parity.py --app <app.pdf> --word <word.pdf> --out <result.json> [--shift-words 6] [--offset-pt 1.0]

Metrics (all per document, nothing is averaged away):
  pageCount            app/word physical pages and equality
  shiftedPages         pages where >= --shift-words words sit on a different page (a real line moving across a page break;
                       a 2-3 word delta is PDF text-extraction noise such as "1Note"/"1 Note" and is reported separately)
  movedWordFraction    words on another page / all words (page-order independent word multisets)
  tableRowPages        rows of a long table ("Madde|Item N") that sit on different pages
  figures              pages and bounding boxes of images wider than 150 pt, with the largest offset
  captions             page and y of "Tablo|Table n" and "Şekil|Figure|Resim n" captions
  pageLabels           printed page number strings that differ
  divergences          first line per page whose unique text sits more than --offset-pt away, with the line before it
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter

_local = os.path.join(os.path.dirname(os.path.abspath(__file__)), "measurement-packages")
if os.path.isdir(_local):
    sys.path.insert(0, _local)
import pymupdf  # noqa: E402

ROW = re.compile(r"^(?:Madde|Item)\s+(\d+)\s*$")
TABLE = re.compile(r"^(?:Tablo|Table)\s+[\d.]+")
FIGURE = re.compile(r"^(?:Şekil|Figure|Resim|Photo|Fotoğraf)\s+[\d.]+")


def words(page):
    return Counter(re.findall(r"\w+", page.get_text().lower()))


def lines(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                out.append((line["bbox"][1], line["bbox"][3], text))
    return sorted(out)


def row_pages(doc):
    found = {}
    for page in doc:
        for line in page.get_text().splitlines():
            m = ROW.match(line.strip())
            if m:
                found.setdefault(int(m.group(1)), []).append(page.number + 1)
    return found


def figures(doc):
    found = {}
    for page in doc:
        for info in page.get_image_info():
            box = pymupdf.Rect(info["bbox"])
            if box.width > 150 and box.height > 80:
                found.setdefault(page.number + 1, []).append([round(box.x0, 1), round(box.y0, 1), round(box.x1, 1), round(box.y1, 1)])
    return found


def captions(doc):
    found = {}
    for page in doc:
        for block in page.get_text("blocks"):
            text = block[4].strip()
            for kind, pattern in (("table", TABLE), ("figure", FIGURE)):
                m = pattern.match(text)
                if m:
                    found.setdefault(kind, {}).setdefault(re.sub(r"\s+", " ", m.group(0)), [page.number + 1, round(block[1], 1)])
    return found


def labels(doc):
    out = []
    for page in doc:
        out.append("".join(w[4] for w in page.get_text("words") if w[1] > 780))
    return out


def compare(app_path, word_path, shift_words=6, offset_pt=1.0):
    app, word = pymupdf.open(app_path), pymupdf.open(word_path)
    n = min(len(app), len(word))
    result = {"pageCount": {"app": len(app), "word": len(word), "equal": len(app) == len(word)}}

    shifted, noise, moved, total = [], [], 0, 0
    for i in range(n):
        a, w = words(app[i]), words(word[i])
        delta = sum(((a - w) + (w - a)).values())
        total += sum(a.values())
        moved += delta
        if delta >= shift_words:
            shifted.append({"page": i + 1, "words": delta, "onlyApp": sum((a - w).values()), "onlyWord": sum((w - a).values())})
        elif delta:
            noise.append(i + 1)
    result["shiftedPages"] = shifted
    result["noisePages"] = noise
    result["movedWordFraction"] = round(moved / 2 / total, 5) if total else 0

    ra, rw = row_pages(app), row_pages(word)
    result["tableRowPages"] = {"rows": sum(len(v) for v in ra.values()), "onOtherPage": {str(k): [ra.get(k), rw.get(k)] for k in sorted(set(ra) | set(rw)) if ra.get(k) != rw.get(k)}}

    fa, fw = figures(app), figures(word)
    offsets = []
    for page in sorted(set(fa) | set(fw)):
        pa, pw = fa.get(page, []), fw.get(page, [])
        if len(pa) != len(pw):
            offsets.append({"page": page, "countApp": len(pa), "countWord": len(pw)})
        else:
            for x, y in zip(pa, pw):
                offsets.append({"page": page, "maxOffsetPt": round(max(abs(x[k] - y[k]) for k in range(4)), 1)})
    result["figures"] = {"app": sorted(fa), "word": sorted(fw), "samePages": sorted(fa) == sorted(fw), "offsets": offsets}

    ca, cw = captions(app), captions(word)
    result["captions"] = {kind: {name: {"app": ca.get(kind, {}).get(name), "word": cw.get(kind, {}).get(name)} for name in sorted(set(ca.get(kind, {})) | set(cw.get(kind, {})))} for kind in ("table", "figure")}

    la, lw = labels(app), labels(word)
    result["pageLabelMismatch"] = [{"page": i + 1, "app": la[i], "word": lw[i]} for i in range(n) if la[i] != lw[i]]

    divergences = []
    for i in range(n):
        a, w = lines(app[i]), lines(word[i])
        ca_, cw_ = Counter(t for _, _, t in a), Counter(t for _, _, t in w)
        top = {t: y0 for y0, _, t in w if cw_[t] == 1}
        for k, (y0, _, text) in enumerate(a):
            if ca_[text] == 1 and text in top and abs(y0 - top[text]) > offset_pt:
                divergences.append({"page": i + 1, "offsetPt": round(y0 - top[text], 1), "line": text[:40], "previous": a[k - 1][2][:40] if k else None})
                break
    result["divergences"] = divergences

    # Horizontal placement: a line whose text is unique on its page in both renders and starts more than --offset-pt
    # to the side (table columns, image/caption alignment, indents). Vertical drift is reported above.
    shifted_x, max_dx = [], 0.0
    for i in range(n):
        a = [(line["bbox"][0], text) for text, line in line_boxes(app[i])]
        w = [(line["bbox"][0], text) for text, line in line_boxes(word[i])]
        ca_, cw_ = Counter(t for _, t in a), Counter(t for _, t in w)
        left = {t: x0 for x0, t in w if cw_[t] == 1}
        for x0, text in a:
            if ca_[text] == 1 and text in left:
                dx = x0 - left[text]
                max_dx = max(max_dx, abs(dx))
                if abs(dx) > offset_pt:
                    shifted_x.append({"page": i + 1, "dxPt": round(dx, 1), "line": text[:40]})
    result["horizontal"] = {"linesOffset": len(shifted_x), "maxDxPt": round(max_dx, 1), "samples": shifted_x[:12]}
    return result


def line_boxes(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                out.append((text, line))
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app", required=True)
    parser.add_argument("--word", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--shift-words", type=int, default=6)
    parser.add_argument("--offset-pt", type=float, default=1.0)
    args = parser.parse_args()
    result = compare(args.app, args.word, args.shift_words, args.offset_pt)
    with open(args.out, "w", encoding="utf8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
