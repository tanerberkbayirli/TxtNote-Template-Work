"""Independent long-document check against the real Word render (word.pdf):
  1. page openings and closings: the first / last 12 word tokens of every page, compared as sets (table cell order differs between
     Word's PDF and the editor, so order is ignored), must overlap by >= 50 %;
  2. text coverage: every Word token (multiset) must exist in the editor text and vice versa; a page-count difference is reported.
Usage: python verify_pages.py <word.pdf> <editor.pages.json> [label]
A page count that matches while the openings do not is NOT a pass."""
import json, re, sys
from collections import Counter
import fitz

pdf, pages = sys.argv[1], sys.argv[2]
label = sys.argv[3] if len(sys.argv) > 3 else pages
tok = lambda s: [t for t in re.findall(r"[0-9a-zçğıöşü]+", s.lower()) if len(t) > 1]
doc = fitz.open(pdf)
ours = json.load(open(pages, encoding="utf8"))
W = [tok(" ".join(w[4] for w in sorted([w for w in p.get_text("words") if 60 < w[1] < 760], key=lambda w: (round(w[1]), w[0])))) for p in doc]
O = [tok(" ".join(x for _, x in sorted(p["words"], key=lambda a: a[0]))) for p in ours]
n = min(len(W), len(O))
def overlap(a, b):
    a, b = set(a), set(b)
    return len(a & b) / max(1, len(a | b)) if a or b else 1.0
bad = []
for i in range(n):
    first = overlap(W[i][:12], O[i][:12]); last = overlap(W[i][-12:], O[i][-12:])
    if first < 0.5 or last < 0.5: bad.append((i + 1, round(first, 2), round(last, 2)))
cw, co = Counter(t for p in W for t in p), Counter(t for p in O for t in p)
missing = sum((cw - co).values()); extra = sum((co - cw).values()); total = sum(cw.values())
print(f"{label}: word pages {len(W)}, editor pages {len(O)}")
print(f"  openings+closings matching: {n - len(bad)}/{n}; first mismatching pages: {[b[0] for b in (bad if __import__('os').environ.get('ALL') else bad[:20])]}")
print(f"  text coverage: {total - missing}/{total} word tokens present in the editor ({100 * (total - missing) / total:.2f} %), {extra} editor-only tokens")
