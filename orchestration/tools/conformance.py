"""Deterministic conformance evaluation (used by check.mjs; see CHECKER.md).

Consolidates the measurements used by earlier validators (pdfmeasure.py, indep/indep2 scripts).
No university knowledge lives here: everything comes from <id>.checks.json.

CLI (called by check.mjs):
  python conformance.py run  --target ID --checks F --variants JSON --reference DIR --out DIR [--only a,b] [--word-requested]
  python conformance.py build-reference --dir DIR
"""
from __future__ import annotations

import argparse
import datetime
import glob
import json
import os
import re
import statistics
import sys
import zipfile
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pdfmeasure import (MM2PT, W, _attr, drawings_mm, docx_sections, docx_xml, embedded_fonts, open_pdf,  # noqa: E402
                        page_number, page_size_mm, visual_lines)

EPS = 1e-6
DEFAULT_TOL = 0.5


# ------------------------------------------------------------------ comparison
def compare(expected, actual, tol=DEFAULT_TOL):
    """Return (pass, delta). Numbers/lists of numbers use |delta| <= tol; everything else equality."""
    if actual is None:
        return False, None
    if isinstance(expected, bool) or isinstance(actual, bool):
        return type(expected) is type(actual) and expected == actual, None
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        d = round(actual - expected, 4)
        return abs(actual - expected) <= tol + EPS, d
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            return False, f"length {len(actual)} != {len(expected)}"
        res = [compare(e, a, tol) for e, a in zip(expected, actual)]
        return all(r[0] for r in res), [r[1] for r in res]
    return expected == actual, None


def rle(labels):
    """Run-length string of page labels: ['', '', 'ii', 'iii'] -> 'none x2, ii, iii'."""
    out, i = [], 0
    labels = [l or "none" for l in labels]
    while i < len(labels):
        j = i
        while j + 1 < len(labels) and labels[j + 1] == labels[i] == "none":
            j += 1
        out.append(f"none x{j - i + 1}" if labels[i] == "none" and j > i else labels[i])
        i = j + 1
    return ", ".join(out)


# ------------------------------------------------------------------ document wrapper
NUM_RX = re.compile(r"^(?:[ivxlcdm]+|\d+)$", re.I)


class Doc:
    def __init__(self, path):
        self.path = path
        self.pdf = open_pdf(path)
        self.n = len(self.pdf)
        self._lines, self._labels = {}, {}

    def lines(self, p, with_pn=False):
        if p not in self._lines:
            self._lines[p] = visual_lines(self.pdf[p - 1])
        ls = self._lines[p]
        if with_pn:
            return ls
        pn = self.page_num(p)
        return [l for l in ls if l is not pn]

    def page_num(self, p):
        key = ("pn", p)
        if key not in self._labels:
            lines = self.lines(p, True)
            h = self.pdf[p - 1].rect.height * 25.4 / 72
            cand = [l for l in lines if l["baseline"] > h - 25 and NUM_RX.match(l["text"].strip())]
            self._labels[key] = cand[-1] if cand else None
        return self._labels[key]

    def label(self, p):
        pn = self.page_num(p)
        return pn["text"].strip() if pn else ""

    def text(self, p):
        return "\n".join(l["text"] for l in self.lines(p))

    def pages(self, spec):
        """Resolve a page selector to a list of 1-based page numbers."""
        if spec in (None, "all"):
            return list(range(1, self.n + 1))
        if isinstance(spec, list) and len(spec) == 2 and all(isinstance(x, int) for x in spec):
            a, b = spec
            b = self.n if b < 0 else b
            return [p for p in range(a, b + 1) if 1 <= p <= self.n]
        if isinstance(spec, dict):
            if "page" in spec:
                p = spec["page"]
                p = self.n + 1 + p if p < 0 else p
                return [p] if 1 <= p <= self.n else []
            if "label" in spec:
                kind = spec["label"]
                out = []
                for p in range(1, self.n + 1):
                    lab = self.label(p)
                    if (kind == "arabic" and lab.isdigit()) or (kind == "roman" and lab and not lab.isdigit()) or (kind == "none" and not lab):
                        out.append(p)
                return out
            if "find" in spec:
                rx = re.compile(spec["find"])
                within = self.pages(spec["within"]) if "within" in spec else range(1, self.n + 1)
                hits = [p for p in within if any(rx.search(l["text"]) for l in self.lines(p))]
                if "after" in spec:
                    a = self.pages({"find": spec["after"]})
                    hits = [p for p in hits if a and p > a[0]]
                nth = spec.get("nth", 0)
                return [hits[nth]] if len(hits) > nth else []
        raise ValueError(f"bad page selector {spec!r}")


def get_doc(ctx, params):
    src = params.get("source", "pdf")
    var = ctx["variants"].get(params.get("fixture", "default")) or {}
    path = var.get("wordPdf" if src == "word" else "pdf")
    if not path or not os.path.exists(path):
        if src == "word":
            raise Skip(var.get("wordNote") or "Word render unavailable (run with --word)")
        raise Skip(f"no export for variant {params.get('fixture', 'default')}")
    cache = ctx.setdefault("_docs", {})
    if path not in cache:
        cache[path] = Doc(path)
    return cache[path]


class Skip(Exception):
    pass


# ------------------------------------------------------------------ PDF kinds
def k_page_size(ctx, c):
    d = get_doc(ctx, c["params"])
    sizes = [page_size_mm(d.pdf[p - 1]) for p in d.pages(c["params"].get("pages"))]
    exp = c["expected"]
    worst = max(sizes, key=lambda s: abs(s[0] - exp[0]) + abs(s[1] - exp[1]))
    return {"actual": [round(worst[0], 2), round(worst[1], 2)], "note": f"{len(sizes)} pages"}


def k_page_count(ctx, c):
    return {"actual": get_doc(ctx, c["params"]).n}


def k_text_extent(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    vals = []
    for p in d.pages(P.get("pages")):
        ls = [l for l in d.lines(p) if (not P.get("ignore") or not re.search(P["ignore"], l["text"])) and l["size"] >= P.get("min_size", 0)]
        if not ls:
            continue
        m = P["metric"]
        if m == "x0min":
            vals.append(min(l["x0"] for l in ls))
        elif m == "x1max":
            vals.append(max(l["x1"] for l in ls))
        elif m == "firstBaseline":
            vals.append(min(l["baseline"] for l in ls))
        elif m == "lastBaseline":
            vals.append(max(l["baseline"] for l in ls))
        else:
            raise ValueError(m)
    if not vals:
        return {"actual": None, "note": "no pages/lines selected"}
    agg = P.get("agg", {"x0min": "min", "x1max": "max", "firstBaseline": "min", "lastBaseline": "max"}[P["metric"]])
    v = {"min": min, "max": max, "median": statistics.median}[agg](vals)
    return {"actual": round(v, 3), "note": f"{agg} over {len(vals)} pages [{min(vals):.2f}..{max(vals):.2f}]"}


def _clean_font(n):
    return re.sub(r"^[A-Z]{6}\+", "", n or "")


def k_fonts(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    allowed, fams = set(c["expected"]), P.get("families")
    seen, bad = [], []
    used = {_clean_font(s["font"]) for p in range(1, d.n + 1) for l in d.lines(p, True) for s in l["spans"]}
    for f in embedded_fonts(d.pdf):
        name = _clean_font(f["basefont"])
        if name not in used:
            continue  # declared in a resource dictionary but never drawn
        fam = f.get("family")
        seen.append(f"{name}[{fam}]" if fam else name)
        if name not in allowed:
            bad.append(f"{name} not allowed")
        if not f["embedded"]:
            bad.append(f"{name} not embedded")
        if fams and fam and fam not in fams:
            bad.append(f"{name} program family {fam!r} not in {fams}")
    return {"actual": sorted(seen), "pass": not bad and bool(seen), "note": "; ".join(bad)}


def k_font_size(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    cnt = Counter()
    for p in d.pages(P.get("pages")):
        for l in d.lines(p):
            for s in l["spans"]:
                cnt[round(s["size"], 1)] += len(s["text"])
    if not cnt:
        return {"actual": None}
    return {"actual": cnt.most_common(1)[0][0], "note": f"sizes by chars: {dict(cnt.most_common(4))}"}


def _deltas(d, pages, lo=3.0, hi=30.0, same_size=True):
    out = []
    for p in pages:
        ls = sorted(d.lines(p), key=lambda l: l["baseline"])
        for a, b in zip(ls, ls[1:]):
            if same_size and abs(a["size"] - b["size"]) > 0.6:
                continue
            g = b["baseline"] - a["baseline"]
            if lo <= g <= hi:
                out.append(g)
    return out


def k_line_pitch(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    ds = _deltas(d, d.pages(P.get("pages")), P.get("lo", 3.0), P.get("hi", 12.0))
    if not ds:
        return {"actual": None}
    cnt = Counter(round(x, 1) for x in ds)
    top = cnt.most_common(1)[0][0]
    near = [x for x in ds if abs(x - top) < 0.1]
    return {"actual": round(statistics.median(near), 3), "note": f"mode bucket {top} ({len(near)}/{len(ds)} gaps)"}


def k_delta_present(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    ds = _deltas(d, d.pages(P.get("pages")), P.get("lo", 3.0), P.get("hi", 40.0), P.get("same_size", False))
    if not ds:
        return {"actual": None}
    exp = c["expected"]
    near = min(ds, key=lambda x: abs(x - exp))
    n = sum(1 for x in ds if abs(x - exp) <= c.get("tolerance", DEFAULT_TOL))
    return {"actual": round(near, 3), "pass": n >= P.get("min_count", 1) and abs(near - exp) <= c.get("tolerance", DEFAULT_TOL) + EPS,
            "note": f"{n} gaps within tolerance"}


def _find_lines(d, pages, rx, ignore_pn=True):
    rx = re.compile(rx)
    return [(p, l) for p in pages for l in d.lines(p) if rx.search(l["text"])]


ATTR = {"baseline": lambda l: l["baseline"], "x0": lambda l: l["x0"], "x1": lambda l: l["x1"], "size": lambda l: l["size"],
        "bold": lambda l: 1 if l["bold"] else 0, "top": lambda l: l["top"], "bottom": lambda l: l["bottom"],
        "cx": lambda l: (l["x0"] + l["x1"]) / 2}


def k_line_baselines(ctx, c):
    """Sequentially locate lines by regex on one page and report an attribute (default baseline)."""
    P = c["params"]
    d = get_doc(ctx, P)
    pg = d.pages(P["page"])
    if not pg:
        return {"actual": None, "note": f"page selector {P['page']} not found"}
    p = pg[0]
    ls = sorted(d.lines(p), key=lambda l: (l["baseline"], l["x0"]))
    attr = ATTR[P.get("attr", "baseline")]
    out, pos, missing = [], 0, []
    for rx in P["lines"]:
        r = re.compile(rx)
        for i in range(pos, len(ls)):
            if r.search(ls[i]["text"]):
                out.append(round(attr(ls[i]), 3))
                pos = i + 1
                break
        else:
            out.append(None)
            missing.append(rx)
    if missing:
        return {"actual": None, "note": f"p{p}: lines not found: {missing}"}
    return {"actual": out, "note": f"page {p}"}


def k_line_gap(ctx, c):
    """Baseline distance from the last line matching `a` that precedes the first line matching `b`, on one page."""
    P = c["params"]
    d = get_doc(ctx, P)
    pg = d.pages(P["page"])
    if not pg:
        return {"actual": None, "note": f"page selector {P['page']} not found"}
    ls = sorted(d.lines(pg[0]), key=lambda l: (l["baseline"], l["x0"]))
    ib = next((i for i, l in enumerate(ls) if re.search(P["b"], l["text"])), None)
    if ib is None:
        return {"actual": None, "note": f"b={P['b']!r} not found on p{pg[0]}"}
    ia = [i for i in range(ib) if re.search(P["a"], ls[i]["text"])]
    if not ia:
        return {"actual": None, "note": f"a={P['a']!r} not found before b on p{pg[0]}"}
    return {"actual": round(ls[ib]["baseline"] - ls[ia[-1]]["baseline"], 3), "note": f"page {pg[0]}"}


def k_page_count_match(ctx, c):
    n1 = get_doc(ctx, {**c["params"], "source": "pdf"}).n
    n2 = get_doc(ctx, {**c["params"], "source": "word"}).n
    return {"actual": f"pdf={n1} word={n2}", "pass": n1 == n2, "expected_override": "equal page counts"}


def k_line_attr(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    hits = _find_lines(d, d.pages(P.get("pages")), P["regex"])
    if not hits:
        return {"actual": None, "note": "no line matched"}
    vals = [round(ATTR[P["attr"]](l), 3) for _, l in hits]
    agg = P.get("agg", "all")
    if agg == "all":
        # report the value that deviates most from expected so failures are visible
        exp = c["expected"]
        v = max(vals, key=lambda x: abs(x - exp)) if isinstance(exp, (int, float)) else vals
    else:
        v = {"min": min, "max": max, "first": lambda x: x[0]}[agg](vals)
    return {"actual": v, "note": f"{len(hits)} lines, pages {sorted({p for p, _ in hits})[:6]}"}


def k_span_attr(ctx, c):
    """Attribute of the first text SPAN (not merged line) whose text matches `regex`; e.g. a table column start."""
    P = c["params"]
    d = get_doc(ctx, P)
    pg = d.pages(P["page"])
    if not pg:
        return {"actual": None, "note": f"page selector {P['page']} not found"}
    rx = re.compile(P["regex"])
    for l in sorted(d.lines(pg[0]), key=lambda l: l["baseline"]):
        for sp in l["spans"]:
            if rx.search(sp["text"]):
                return {"actual": round(sp[P.get("attr", "x0")], 3), "note": f"page {pg[0]}, span {sp['text'][:30]!r}"}
    return {"actual": None, "note": f"no span matching {P['regex']!r} on p{pg[0]}"}


def k_pitch_series(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    gaps = []
    for p in d.pages(P.get("pages")):
        ls = sorted([l for l in d.lines(p) if re.search(P["regex"], l["text"])], key=lambda l: l["baseline"])
        gaps += [b["baseline"] - a["baseline"] for a, b in zip(ls, ls[1:]) if b["baseline"] - a["baseline"] < P.get("max", 40)]
    if not gaps:
        return {"actual": None, "note": "no consecutive matching lines"}
    stat = P.get("stat", "median")
    v = {"median": statistics.median, "min": min, "max": max}[stat](gaps)
    return {"actual": round(v, 3), "note": f"{stat} of {len(gaps)} gaps [{min(gaps):.2f}..{max(gaps):.2f}]"}


def k_rules_count(ctx, c):
    """Count thin horizontal rules (table borders) drawn on one page."""
    P = c["params"]
    d = get_doc(ctx, P)
    pg = d.pages(P["page"])
    if not pg:
        return {"actual": None, "note": f"page selector {P['page']} not found"}
    ys = set()
    for dr in drawings_mm(d.pdf[pg[0] - 1]):
        if dr["bottom"] - dr["top"] < 0.6 and dr["x1"] - dr["x0"] > P.get("min_width", 15):
            ys.add(round(dr["top"], 1))
    return {"actual": len(ys), "note": f"page {pg[0]}, rule y mm {sorted(ys)[:6]}"}


def k_page_labels(ctx, c):
    d = get_doc(ctx, c["params"])
    return {"actual": rle([d.label(p) for p in d.pages(c["params"].get("pages"))])}


def k_page_number_attr(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    vals = []
    for p in d.pages(P.get("pages")):
        pn = d.page_num(p)
        if pn:
            vals.append(ATTR[P["attr"]](pn))
    if not vals:
        return {"actual": None, "note": "no page numbers found"}
    return {"actual": round(statistics.median(vals), 3), "note": f"median of {len(vals)} [{min(vals):.2f}..{max(vals):.2f}]"}


def k_toc_labels(ctx, c):
    """Every TOC / list entry's trailing page label equals the label of the page where its title appears."""
    P = c["params"]
    d = get_doc(ctx, P)
    start = d.pages({"find": P.get("toc_title", "^(İÇİNDEKİLER|ICINDEKILER)")})
    if not start:
        return {"actual": None, "note": "TOC title not found"}
    first_arabic = next((p for p in range(1, d.n + 1) if d.label(p).isdigit()), d.n + 1)
    span = [p for p in range(start[0], first_arabic)]
    entry_rx = re.compile(r"^(.*?)(?:\s*[.…·]{3,}\s*|\s{2,}|\s)([ivxlcdm]+|\d+)$", re.I)
    norm = lambda s: re.sub(r"[^0-9a-zçğıöşü]", "", s.casefold().replace("i̇", "i"))[: P.get("prefix", 22)]
    entries, buf, entry_ids = [], "", set()
    for p in span:
        buf = ""
        for l in d.lines(p):
            t = l["text"]
            if l["bold"]:
                buf = ""
                continue
            m = entry_rx.match(t) if re.search(r"[.…·]{3,}|\s{2}", t) or True else None
            leader = re.search(r"[.…·]{3,}", t)
            if m and leader:
                title = (buf + " " + m.group(1)).strip() if buf else m.group(1).strip()
                entries.append((title, m.group(2), p))
                buf = ""
                entry_ids.add(id(l))
            else:
                buf = (buf + " " + t).strip() if buf else t
    # buf accumulates headings that are not entries: reset on every page start is handled by the leader rule above
    ok, bad = 0, []
    heads = []
    for p in range(1, d.n + 1):
        for l in d.lines(p):
            if id(l) not in entry_ids:
                heads.append((norm(l["text"]), p))
    for title, lab, p in entries:
        # title may carry stray text from preceding non-entry lines: try progressively shorter tails
        words = title.split()
        pages_hit = set()
        for k in range(len(words)):
            key = norm(" ".join(words[k:]))
            if len(key) < 3:
                break
            pages_hit = {pp for h, pp in heads if h.startswith(key) or key.startswith(h) and len(h) >= 8}
            if pages_hit:
                break
        labs = {d.label(pp) for pp in pages_hit}
        if lab.lower() in {x.lower() for x in labs}:
            ok += 1
        else:
            bad.append(f"{title[:40]!r}->{lab} vs {sorted(labs) or 'not found'}")
    n = len(entries)
    return {"actual": f"{ok}/{n}", "pass": n >= P.get("min_entries", 1) and ok == n,
            "note": "; ".join(bad[:5]), "expected_override": "all entries match"}


# ------------------------------------------------------------------ DOCX kinds
NS = {"w": W[1:-1]}


def get_docx(ctx, params):
    var = ctx["variants"].get(params.get("fixture", "default")) or {}
    path = var.get("docx")
    if not path or not os.path.exists(path):
        raise Skip(f"no DOCX export for variant {params.get('fixture', 'default')}")
    return path


def k_docx_section(ctx, c):
    P = c["params"]
    secs = docx_sections(get_docx(ctx, P))
    sel = P.get("sections", "all")
    if sel != "all":
        secs = [secs[i] for i in sel if -len(secs) <= i < len(secs)]
    vals = []
    for s in secs:
        v = s
        for part in P["field"].split("."):
            v = (v or {}).get(part) if isinstance(v, dict) else None
        vals.append(v)
    vals = [v for v in vals if v is not None]
    if not vals:
        return {"actual": None, "note": "field absent in all selected sections"}
    exp = c["expected"]
    worst = max(vals, key=lambda v: abs(v - exp)) if isinstance(exp, (int, float)) else vals[0]
    return {"actual": worst, "note": f"{len(vals)} sections, range {min(vals)}..{max(vals)}"}


def _docx_parts(path, parts):
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        for part in parts:
            if part.endswith("*"):
                for n in names:
                    if n.startswith(part[:-1]) and n.endswith(".xml"):
                        yield n, docx_xml(path, n)
            elif part in names:
                yield part, docx_xml(path, part)


def k_docx_attr(ctx, c):
    """mode allowed: every value of attrs on <w:tag> is in expected; mode has: expected value(s) occur."""
    P = c["params"]
    path = get_docx(ctx, P)
    vals = []
    for _, root in _docx_parts(path, P.get("parts", ["word/document.xml", "word/styles.xml"])):
        for el in root.iter(W + P["tag"]):
            for a in P["attrs"]:
                v = _attr(el, a)
                if v is not None:
                    vals.append(v)
    got = sorted(set(vals))
    exp = [str(x) for x in c["expected"]] if isinstance(c["expected"], list) else [str(c["expected"])]
    if P.get("mode", "allowed") == "allowed":
        bad = [v for v in got if v not in exp]
        return {"actual": got, "pass": bool(vals) and not bad, "note": f"{len(vals)} occurrences" + (f"; disallowed {bad}" if bad else "")}
    nt = P.get("numeric_tol")
    if nt is not None:
        near = lambda e: any(abs(float(g) - float(e)) <= nt for g in got if re.match(r"^-?\d+(\.\d+)?$", g))
        miss = [e for e in exp if not near(e)]
    else:
        miss = [e for e in exp if e not in got]
    return {"actual": got, "pass": not miss, "note": f"{len(vals)} occurrences" + (f"; missing {miss}" if miss else "")}


def k_docx_no_undefined(ctx, c):
    path = get_docx(ctx, c["params"])
    hits = []
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if n.endswith(".xml") or n.endswith(".rels"):
                s = z.read(n).decode("utf8", "replace")
                if re.search(r"<undefined|>\s*undefined\s*<|instrText[^>]*>[^<]*undefined", s):
                    hits.append(n)
                    continue
                if n == "word/document.xml":
                    ins = re.findall(r"<w:instrText[^>]*>([^<]*)<", s)
                    b = len(re.findall(r'w:fldCharType="begin"', s)); e = len(re.findall(r'w:fldCharType="end"', s))
                    if b != e:
                        hits.append(f"{n}: fldChar begin {b} != end {e}")
    return {"actual": hits or "none", "pass": not hits, "expected_override": "none"}


# ------------------------------------------------------------------ misc kinds
def k_word_opens(ctx, c):
    var = ctx["variants"].get(c["params"].get("fixture", "default")) or {}
    if var.get("wordPdf") and os.path.exists(var["wordPdf"]):
        return {"actual": "opened and exported", "pass": True, "expected_override": "opens in Word"}
    raise Skip(var.get("wordNote") or "Word render unavailable (run with --word)")


def k_note(ctx, c):
    return {"actual": c["params"].get("text", ""), "status": "INFO"}


KINDS = {n[2:]: f for n, f in list(globals().items()) if n.startswith("k_")}


# ------------------------------------------------------------------ run
def resolve_ref(ctx, path):
    """expected = {"ref": "pageCount"} / {"ref": "pages.1.firstBaseline"} -> value from cached reference.json."""
    f = os.path.join(ctx.get("reference") or "", "reference.json")
    if not os.path.exists(f):
        raise Skip("reference.json missing (run --build-reference)")
    v = json.load(open(f, encoding="utf8"))
    for part in path.split("."):
        v = v[int(part)] if isinstance(v, list) else v[part]
    return v


def run_check(ctx, c):
    r = {"id": c["id"], "kind": c["kind"], "expected": c.get("expected"), "tolerance": c.get("tolerance", DEFAULT_TOL),
         "source": c.get("source"), "evidence": c.get("evidence"), "ruling": c.get("ruling")}
    if c.get("fixture"):
        r["fixture"] = c["fixture"]
    if c.get("params", {}).get("source") == "word":
        r["viaWord"] = True
    try:
        fn = KINDS.get(c["kind"])
        if fn is None:
            raise ValueError(f"unknown check kind {c['kind']!r}")
        c.setdefault("params", {})
        if isinstance(c.get("expected"), dict) and "ref" in c["expected"]:
            c = {**c, "expected": resolve_ref(ctx, c["expected"]["ref"])}
            r["expected"] = c["expected"]
        out = fn(ctx, c)
        if "status" in out:
            r.update(status=out["status"], actual=out.get("actual"))
            return r
        r["actual"] = out.get("actual")
        if "expected_override" in out:
            r["expected"] = out["expected_override"]
        if "pass" in out:
            ok, delta = out["pass"], None
        elif c.get("cmp") in ("le", "ge") and isinstance(out.get("actual"), (int, float)):
            delta = round(out["actual"] - c["expected"], 4)
            ok = delta <= r["tolerance"] + EPS if c["cmp"] == "le" else delta >= -r["tolerance"] - EPS
        else:
            ok, delta = compare(c.get("expected"), out.get("actual"), r["tolerance"])
        if delta is not None:
            r["delta"] = delta
        if out.get("note"):
            r["note"] = out["note"]
        r["status"] = "PASS" if ok else c.get("status_on_fail", "FAIL")
    except Skip as e:
        r.update(status="SKIPPED", reason=str(e))
    except Exception as e:  # a broken check must never be read as PASS
        r.update(status="FAIL", note=f"checker error: {type(e).__name__}: {e}")
    return r


def fmt(v, n=70):
    s = json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v
    return s if len(s) <= n else s[: n - 1] + "…"


def write_report(target, results, out_dir, stamp, meta):
    counts = Counter(r["status"] for r in results)
    jpath = os.path.join(out_dir, f"check-{stamp}.json")
    with open(jpath, "w", encoding="utf8") as f:
        json.dump({"target": target, "stamp": stamp, "counts": dict(counts), **meta, "checks": results}, f, ensure_ascii=False, indent=1)
    rows = [r for r in results if r["status"] in ("FAIL", "SKIPPED", "CONFLICT")]
    md = [f"# {target} conformance {stamp}", "", " ".join(f"{k}={v}" for k, v in sorted(counts.items())), ""]
    if rows:
        md += ["| id | status | expected | actual | delta | source / reason |", "|---|---|---|---|---|---|"]
        for r in rows:
            sc = r.get("source")
            src = r.get("reason") or (sc.get("locator", "") if isinstance(sc, dict) else (sc or ""))
            md.append(f"| {r['id']} | {r['status']} | {fmt(r.get('expected'))} | {fmt(r.get('actual'))} | {fmt(r.get('delta', ''), 30)} | {fmt(src, 60)} |")
    with open(jpath[:-5] + ".md", "w", encoding="utf8") as f:
        f.write("\n".join(md) + "\n")
    return jpath, counts, rows


def cmd_run(a):
    checks = json.load(open(a.checks, encoding="utf8"))
    if isinstance(checks, dict):
        checks = checks["checks"]
    if a.only:
        ids = set(a.only.split(","))
        unknown = ids - {c["id"] for c in checks}
        if unknown:
            print("unknown check ids: " + ",".join(sorted(unknown)), file=sys.stderr)
            return 2
        checks = [c for c in checks if c["id"] in ids]
    ctx = {"variants": json.loads(a.variants), "reference": a.reference}
    results = [run_check(ctx, c) for c in checks]
    stamp = a.stamp or datetime.datetime.now().strftime("%Y%m%d-%H%M")
    os.makedirs(a.out, exist_ok=True)
    jpath, counts, rows = write_report(a.target, results, a.out, stamp, {"variants": ctx["variants"], "wordRequested": a.word_requested})
    print(f"{a.target}: " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())) + f"  -> {os.path.relpath(jpath)}")
    for r in rows:
        print(f"  {r['status']:7} {r['id']}: expected={fmt(r.get('expected'), 50)} actual={fmt(r.get('actual'), 50)} delta={fmt(r.get('delta', ''), 20)} {r.get('reason') or r.get('note') or ''}"[:260])
    return 1 if counts.get("FAIL") else 0


def cmd_build_reference(a):
    d = a.dir
    wp = os.path.join(d, "official-word.pdf")
    if not os.path.exists(wp):
        print(f"missing {wp}", file=sys.stderr)
        return 2
    doc = Doc(wp)
    pages = []
    for p in range(1, doc.n + 1):
        ls = doc.lines(p)
        pages.append({"page": p, "label": doc.label(p), "size": list(page_size_mm(doc.pdf[p - 1])), "lines": len(ls),
                      "x0min": round(min((l["x0"] for l in ls), default=0), 2), "x1max": round(max((l["x1"] for l in ls), default=0), 2),
                      "firstBaseline": round(min((l["baseline"] for l in ls), default=0), 2),
                      "lastBaseline": round(max((l["baseline"] for l in ls), default=0), 2), "firstText": ls[0]["text"][:50] if ls else ""})
    ref = {"builtFrom": "official-word.pdf", "pageCount": doc.n, "labels": rle([doc.label(p) for p in range(1, doc.n + 1)]),
           "fonts": sorted({_clean_font(f["basefont"]) for f in embedded_fonts(doc.pdf)}), "pages": pages}
    dp = os.path.join(d, "official.docx")
    if os.path.exists(dp):
        ref["docxSections"] = docx_sections(dp)
    json.dump(ref, open(os.path.join(d, "reference.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"reference.json written ({doc.n} pages)")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--target", required=True); r.add_argument("--checks", required=True); r.add_argument("--variants", required=True)
    r.add_argument("--reference", default=""); r.add_argument("--out", required=True); r.add_argument("--only", default="")
    r.add_argument("--stamp", default=""); r.add_argument("--word-requested", action="store_true")
    b = sub.add_parser("build-reference")
    b.add_argument("--dir", required=True)
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf8")
    sys.exit(cmd_run(a) if a.cmd == "run" else cmd_build_reference(a))
