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
import hashlib
import json
import math
import os
import posixpath
import re
import statistics
import sys
import time
import zipfile
from xml.etree import ElementTree as ET
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pdfmeasure import (MM2PT, W, _attr, drawings_mm, docx_paragraphs, docx_sections, docx_styles, docx_xml, embedded_fonts, images_mm, open_pdf,  # noqa: E402
                        page_number, page_size_mm, visual_lines)

EPS = 1e-6
DEFAULT_TOL = 0.5


def get_layout(ctx, params):
    variant = ctx['variants'].get(params.get('fixture', 'default')) or {}
    path = variant.get('layout') or (variant.get('pdf') or '').replace('.pdf', '.layout.json')
    if not path or not os.path.exists(path):
        raise Skip('engine layout report unavailable; run the real export')
    cache = ctx.setdefault('_layouts', {})
    if path not in cache:
        with open(path, encoding='utf8') as stream:
            data = json.load(stream)
        cache[path] = data.get('engineLayout', data)
    report = cache[path]
    if report.get('version') != 1 or not report.get('pages'):
        raise Skip('engine layout report has no measured pages (version 1 required)')
    return report


def layout_hits(ctx, params):
    report = get_layout(ctx, params)
    pages = params.get('pages', params.get('page', 'all'))
    selected = set(get_doc(ctx, {**params, 'source': 'layout'}).pages(pages))
    hits = []
    for page in report['pages']:
        if page['page'] not in selected:
            continue
        for mark in page['landmarks']:
            if params.get('id') and mark['id'] != params['id']:
                continue
            if params.get('kind') and mark['kind'] != params['kind']:
                continue
            if params.get('sectionId') and mark.get('sectionId') != params['sectionId']:
                continue
            if params.get('regex') and not re.search(params['regex'], mark['text']):
                continue
            hits.append((page['page'], mark))
    return hits


def _landmark_value(mark, attr):
    return {'baseline': mark.get('firstBaselineMm'), 'x0': mark['xMm'],
            'x1': mark['xMm'] + mark['widthMm'], 'cx': mark['xMm'] + mark['widthMm'] / 2,
            'top': mark['yMm'], 'bottom': mark['yMm'] + mark['heightMm'],
            'size': mark.get('fontSizePt'), 'pitch': mark.get('linePitchMm')}.get(attr)


def _layout_attribute(ctx, c, attr):
    hits = layout_hits(ctx, c['params'])
    values = [_landmark_value(mark, c['params'].get('attr', attr)) for _, mark in hits]
    if not values or any(value is None for value in values):
        return {'actual': None, 'note': 'no matching landmark or a matched landmark lacks the requested measurement'}
    agg = c['params'].get('agg', 'first')
    if agg == 'all' and isinstance(c['expected'], (int, float)):
        value = max(values, key=lambda value: abs(value - c['expected']))
    else:
        value = {'min': min, 'max': max, 'first': lambda v: v[0], 'median': statistics.median}.get(agg, lambda v: v)(values)
    return {'actual': value, 'note': f'{len(hits)} landmarks measured from PDF draw operations'}


def k_landmark_x(ctx, c):
    return _layout_attribute(ctx, c, 'x0')


def k_landmark_y(ctx, c):
    return _layout_attribute(ctx, c, 'baseline')


def k_landmark_gap(ctx, c):
    params = c['params']
    a = layout_hits(ctx, {**params, **params.get('a', {})})
    b = layout_hits(ctx, {**params, **params.get('b', {})})
    if not a or not b:
        return {'actual': None, 'note': 'gap endpoints missing'}
    for page, second in b:
        if second.get('firstBaselineMm') is None:
            continue
        before = [first for p, first in a if p == page and first.get('lastBaselineMm') is not None
                  and first['lastBaselineMm'] < second.get('firstBaselineMm', -1)]
        if before:
            return {'actual': second['firstBaselineMm'] - max(m['lastBaselineMm'] for m in before), 'note': f'page {page}'}
    return {'actual': None, 'note': 'no ordered endpoints on the same page'}


def k_page_of(ctx, c):
    hits = layout_hits(ctx, c['params'])
    return {'actual': hits[0][0] if hits else None}


def k_layout_ids_match(ctx, c):
    """Compare independent real exports, never geometry-derived or text-hash identities."""
    first = get_layout(ctx, c['params'])
    variant = ctx['variants'][c['params'].get('fixture', 'default')]
    path = variant.get('repeatLayout')
    if not path or not os.path.exists(path):
        return {'actual': None, 'pass': False, 'note': 'second real layout export missing'}
    with open(path, encoding='utf8') as stream:
        raw = json.load(stream)
    second = raw.get('engineLayout', raw)
    def identity(report):
        return [(page['page'], page['label'], page['sectionIds'],
                 [(mark['id'], mark['kind'], mark['sectionId']) for mark in page['landmarks']])
                for page in report['pages']]
    return {'actual': identity(first) == identity(second),
            'note': f"{len(first['pages'])} pages: ordered landmark IDs/kinds/sections and labels"}


def k_layout_report_valid(ctx, c):
    """Validate the measured report contract; box-only landmarks have explicit null text metrics."""
    report = get_layout(ctx, c['params'])
    errors = []
    number = lambda value: type(value) in (int, float) and math.isfinite(value)
    if report.get('origin') != 'top-left' or report.get('units') != {'geometry': 'mm', 'fontSize': 'pt'}:
        errors.append('expected top-left origin and mm/pt units')
    for page in report['pages']:
        ids = [mark['id'] for mark in page['landmarks']]
        if len(ids) != len(set(ids)):
            errors.append(f"p{page['page']}: duplicate landmark IDs")
        for mark in page['landmarks']:
            if not all(isinstance(mark.get(key), str) for key in ('id', 'kind', 'sectionId', 'text')):
                errors.append(f"p{page['page']}: missing landmark identity/text")
            if not all(number(mark.get(key)) for key in ('xMm', 'yMm', 'widthMm', 'heightMm')):
                errors.append(f"{mark['id']}: non-finite geometry")
            if not isinstance(mark.get('lineCount'), int) or not isinstance(mark.get('exportedFonts'), list):
                errors.append(f"{mark['id']}: missing line/font metadata")
            for key in ('firstBaselineMm', 'lastBaselineMm', 'linePitchMm', 'fontSizePt', 'fontFamily'):
                if key not in mark:
                    errors.append(f"{mark['id']}: missing {key}")
        for op in page['textOps']:
            if op.get('landmarkId') not in ids or any(key not in ids for key in op.get('ancestorIds', [])):
                errors.append(f"p{page['page']}: text references an absent landmark")
    return {'actual': not errors, 'note': '; '.join(errors[:8]) or 'version-1 layout contract valid'}


def k_layout_pdf_consistency(ctx, c):
    """Independent glyph-origin check; absent/mismatched samples FAIL, never SKIP."""
    params = c['params']
    try:
        report = get_layout(ctx, params)
    except Skip as error:
        return {'actual': None, 'pass': False, 'note': str(error)}
    doc = get_doc(ctx, params)
    failures, checked, worst = [], 0, 0.0
    if len(report['pages']) != doc.n:
        return {'actual': len(report['pages']), 'pass': False, 'note': f'PDF has {doc.n} pages'}
    if [page.get('page') for page in report['pages']] != list(range(1, doc.n + 1)):
        return {'actual': None, 'pass': False,
                'note': 'layout physical pages must occur exactly once in PDF order (1..N)'}
    for page in report['pages']:
        if not 1 <= page['page'] <= doc.n:
            failures.append('invalid physical page')
            continue
        chars = []
        for block in doc.pdf[page['page'] - 1].get_text('rawdict')['blocks']:
            for line in block.get('lines', []):
                line_chars = [char for span in line['spans'] for char in span['chars']]
                chars.extend((char, ''.join(ch['c'] for ch in line_chars[i:i + 12])) for i, char in enumerate(line_chars))
        samples, seen = [], set()
        for op in page['textOps']:
            key = op.get('landmarkId')
            if not key or key in seen or not op['text'].strip() or op['fontSizePt'] < 7 or op.get('clipped'):
                continue
            seen.add(key)
            samples.append(op)
        if not samples and any(char['c'].strip() for char, _ in chars):
            failures.append(f"p{page['page']}: PDF has visible text but no eligible layout samples")
        for op in samples[:params.get('samples_per_page', 16)]:
            text = op['text'][:12]
            candidates = [char for char, following in chars if following.startswith(text)]
            if not candidates:
                failures.append(f"p{page['page']} {op['id']}: PDF text absent {text!r}")
                continue
            delta = min(max(abs(char['origin'][0] / MM2PT - op['xMm']),
                            abs(char['origin'][1] / MM2PT - op['baselineMm'])) for char in candidates)
            worst = max(worst, delta)
            checked += 1
            if delta > c.get('tolerance', .25) + EPS:
                failures.append(f"p{page['page']} {op['id']}: delta {delta:.4f} mm")
    return {'actual': round(worst, 4), 'pass': checked > 0 and not failures,
            'expected_override': '<=0.25 mm; all sampled text present',
            'note': f'{checked} independent PDF glyph samples; ' + '; '.join(failures[:8])}


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
        if getattr(self, 'trim_trailing_whitespace', False):
            chars = [char for block in self.pdf[p - 1].get_text('rawdict')['blocks'] for line in block.get('lines', [])
                     for span in line['spans'] for char in span['chars'] if char['c'].strip()]
            for line in ls:
                ends = [char['bbox'][2] / MM2PT for char in chars if abs(char['origin'][1] / MM2PT - line['baseline']) < .05]
                if ends:
                    line['x1'] = max(ends)
        if with_pn:
            return ls
        pn = self.page_num(p)
        return [l for l in ls if l is not pn]

    def page_num(self, p, region=None):
        region = region or getattr(self, 'page_number_region', None)
        key = ("pn", p, json.dumps(region, sort_keys=True))
        if key not in self._labels:
            lines = self.lines(p, True)
            h = self.pdf[p - 1].rect.height * 25.4 / 72
            cand = [l for l in lines if NUM_RX.match(l["text"].strip())
                    and (region.get('yMinMm', 0) <= l['baseline'] <= region.get('yMaxMm', h)
                         and region.get('xMinMm', 0) <= (l['x0'] + l['x1']) / 2 <= region.get('xMaxMm', 10000)
                         if region else l['baseline'] > h - 25)]
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
        if type(spec) is int:
            return self.pages({'page': spec})
        if isinstance(spec, list) and len(spec) == 2 and all(isinstance(x, int) for x in spec):
            a, b = spec
            b = self.n if b < 0 else b
            return [p for p in range(a, b + 1) if 1 <= p <= self.n]
        if isinstance(spec, list) and all(type(p) is int for p in spec):
            return list(dict.fromkeys(q for p in spec for q in self.pages({'page': p})))
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
                if "from" in spec:  # restrict to pages at/after the first page whose text matches (e.g. skip cover PAGE fields)
                    start = self.pages({"find": spec["from"]})
                    out = [p for p in out if start and p >= start[0]]
                return out
            if "until" in spec:  # every page before the first page whose text matches
                stop = self.pages({"find": spec["until"]})
                return list(range(1, stop[0])) if stop else []
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
    if src == 'layout':
        report = get_layout(ctx, params)
        key = params.get('fixture', 'default')
        cache = ctx.setdefault('_layout_docs', {})
        if key not in cache:
            cache[key] = LayoutDoc(report)
        return cache[key]
    var = ctx["variants"].get(params.get("fixture", "default")) or {}
    path = var.get({"word": "wordPdf", "word-refreshed": "wordRefreshedPdf"}.get(src, "pdf"))
    if not path or not os.path.exists(path):
        if src == "word-refreshed":
            raise Skip(var.get("wordRefreshNote") or var.get("wordNote") or "Word field-refresh render unavailable (run with --word)")
        if src == "word":
            raise Skip(var.get("wordNote") or "Word render unavailable (run with --word)")
        raise Skip(f"no export for variant {params.get('fixture', 'default')}")
    cache = ctx.setdefault("_docs", {})
    region = params.get('page_number_region')
    if region is None and var.get('layout'):
        # A positioned PAGE field can sit above the legacy bottom-25mm search
        # band. Locate it in the real PDF near the exported field's geometry;
        # geometry checks still compare its actual position against the source.
        report = get_layout(ctx, params)
        baselines = [mark['firstBaselineMm'] for page in report['pages'] for mark in page['landmarks']
                     if mark.get('kind') == 'page-number' and mark.get('firstBaselineMm') is not None]
        if baselines:
            region = {'yMinMm': min(baselines) - 3, 'yMaxMm': max(baselines) + 3}
    key = (path, json.dumps(region, sort_keys=True), bool(params.get('trim_trailing_whitespace')))
    if key not in cache:
        cache[key] = Doc(path)
        cache[key].page_number_region = region
        cache[key].trim_trailing_whitespace = params.get('trim_trailing_whitespace', False)
    return cache[key]


class Skip(Exception):
    pass


class LayoutDoc(Doc):
    """PDF check selectors backed by actual engine draw ops; fonts still use PDF."""
    def __init__(self, report):
        self.report = report
        self.n = len(report['pages'])
        self._lines = {}

    def label(self, p):
        return self.report['pages'][p - 1]['label']

    def page_num(self, p, region=None):
        return next((line for line in self.lines(p, True) if line.get('pageNumber')), None)

    def lines(self, p, with_pn=False):
        if p not in self._lines:
            page = self.report['pages'][p - 1]
            marks = {mark['id']: mark for mark in page['landmarks']}
            groups = []
            for op in sorted(page['textOps'], key=lambda op: (round(op['baselineMm'], 1), op['xMm'])):
                for line in groups:
                    if abs(line['baseline'] - op['baselineMm']) <= .35 and abs(line['size'] - op['fontSizePt']) < .6:
                        line['ops'].append(op)
                        break
                else:
                    groups.append({'baseline': op['baselineMm'], 'size': op['fontSizePt'], 'ops': [op]})
            lines = []
            for line in groups:
                ops = sorted(line['ops'], key=lambda op: op['xMm'])
                text, previous = '', None
                for op in ops:
                    if previous and (previous.get('spaceAfter') or re.fullmatch(r'[.…·]+', op['text']) or op['xMm'] - previous['xMm'] - previous['widthMm'] > .25 * op['fontSizePt'] / MM2PT) and not text.endswith(' '):
                        text += ' '
                    text += op['text']
                    previous = op
                lines.append({'text': re.sub(r'\s+', ' ', text).strip(),
                              'baseline': round(statistics.mean(op['baselineMm'] for op in ops), 3),
                              'x0': min(op['xMm'] for op in ops), 'x1': max(op['xMm'] + op['widthMm'] for op in ops),
                              'top': min(op['yMm'] for op in ops), 'bottom': max(op['baselineMm'] for op in ops),
                              'size': max(op['fontSizePt'] for op in ops),
                              'pageNumber': any(marks.get(op.get('landmarkId'), {}).get('kind') == 'page-number' for op in ops)})
            self._lines[p] = sorted(lines, key=lambda line: (line['baseline'], line['x0']))
        return [line for line in self._lines[p] if with_pn or not line.get('pageNumber')]


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


def drawn_font_names(doc, params):
    """Scope drawn fonts to selected text lines without filtering font identities."""
    return {_clean_font(span['font']) for page in doc.pages(params.get('pages'))
            for line in doc.lines(page, not params.get('exclude_page_numbers', False))
            if (not params.get('regex') or re.search(params['regex'], line['text']))
            and (not params.get('ignore') or not re.search(params['ignore'], line['text']))
            for span in line['spans']}


def k_fonts(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    allowed, fams = set(c["expected"]), P.get("families")
    seen, bad = [], []
    used = drawn_font_names(d, P)
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


def k_page_number_font(ctx, c):
    doc = get_doc(ctx, c['params'])
    fonts = set()
    missing = []
    for page in doc.pages(c['params'].get('pages')):
        line = doc.page_num(page)
        if not line:
            missing.append(page)
        else:
            fonts.update(_clean_font(span['font']) for span in line['spans'])
    return {'actual': sorted(fonts), 'pass': bool(fonts) and not missing and fonts <= set(c['expected']),
            'note': f'missing page numbers: {missing}' if missing else ''}


def k_font_size(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    cnt = Counter()
    for p in d.pages(P.get("pages")):
        for l in d.lines(p):
            if P.get('regex') and not re.search(P['regex'], l['text']):
                continue
            if P.get('ignore') and re.search(P['ignore'], l['text']):
                continue
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


def anchored_lines(ctx, params):
    """Resolve a semantic layout anchor, then locate its full text in the chosen output.

    Word pagination may differ, so no physical page number is copied from layout.
    Missing/ambiguous anchors or incomplete rendered text produce no measurement.
    """
    anchor = params.get('anchor')
    d = get_doc(ctx, params)
    pages = d.pages(params.get('pages'))
    if not anchor:
        return [(p, line) for p in pages for line in d.lines(p)]
    hits = layout_hits(ctx, {**anchor, 'fixture': params.get('fixture', 'default')})
    ids = {mark['id'] for _, mark in hits}
    if len(ids) != 1:
        return []
    report = get_layout(ctx, params)
    scoped = {**report, 'pages': [{**page, 'textOps': [op for op in page['textOps']
              if op.get('landmarkId') in ids]} for page in report['pages']]}
    layout_doc = LayoutDoc(scoped)
    target_lines = [(p, line) for p in layout_doc.pages(params.get('pages')) for line in layout_doc.lines(p)]
    if params.get('source') == 'layout':
        return target_lines
    compact = lambda text: re.sub(r'\s+', '', text)
    target = compact(''.join(line['text'] for _, line in target_lines))
    if not target:
        return []
    rendered = [(p, line) for p in pages for line in d.lines(p)]
    matches = []
    starts = range(len(rendered))
    if anchor.get('afterHeading'):
        headings = [i for i, (_, line) in enumerate(rendered) if re.search(anchor['afterHeading'], line['text'])]
        occurrence = anchor.get('headingOccurrence', 0)
        if not isinstance(occurrence, int) or occurrence < 0 or occurrence >= len(headings): return []
        starts = [headings[occurrence] + 1]
    for start in starts:
        if start >= len(rendered): continue
        _, line = rendered[start]
        if not target.startswith(compact(line['text'])):
            continue
        text = ''
        for end in range(start, len(rendered)):
            text += compact(rendered[end][1]['text'])
            if not target.startswith(text):
                break
            if text == target:
                matches.append(rendered[start:end + 1])
                break
    return matches[0] if len(matches) == 1 else []


def k_line_text(ctx, c):
    hits = anchored_lines(ctx, c['params'])
    text = ' '.join(line['text'] for _, line in hits)
    return {'actual': text or None, 'note': 'semantic anchor; full rendered text'}


def k_line_pitch(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    if P.get('anchor'):
        hits = anchored_lines(ctx, P)
        ds = [b['baseline'] - a['baseline'] for (pa, a), (pb, b) in zip(hits, hits[1:])
              if pa == pb and abs(a['size'] - b['size']) <= .6
              and P.get('lo', 3.0) <= b['baseline'] - a['baseline'] <= P.get('hi', 12.0)]
    else:
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


def k_page_labels_match(ctx, c):
    a = get_doc(ctx, {**c['params'], 'source': 'pdf'})
    b = get_doc(ctx, {**c['params'], 'source': 'word'})
    first = [a.label(p) for p in range(1, a.n + 1)]
    second = [b.label(p) for p in range(1, b.n + 1)]
    return {'actual': {'pdf': rle(first), 'word': rle(second)}, 'pass': first == second, 'expected_override': 'identical labels on every physical page'}


def k_line_pitch_match(ctx, c):
    params = c['params']
    values = {}
    for source in ('pdf', 'word'):
        doc = get_doc(ctx, {**params, 'source': source})
        gaps = []
        for p in doc.pages(params.get('pages')):
            lines = [line for line in doc.lines(p) if re.search(params['regex'], line['text'])]
            gaps.extend(b['baseline'] - a['baseline'] for a, b in zip(lines, lines[1:]))
        if not gaps:
            return {'actual': None, 'note': f'no matching multiline paragraph in {source}'}
        values[source] = statistics.median(gaps)
    delta = abs(values['pdf'] - values['word'])
    return {'actual': {**values, 'deltaPt': delta * MM2PT}, 'pass': delta <= c.get('tolerance', .2 / MM2PT) + EPS,
            'expected_override': 'PDF vs Word pitch within 0.2 pt'}


def _first_line(doc, regex, pages=None):
    for p in doc.pages(pages):
        for line in sorted(doc.lines(p), key=lambda l: l['baseline']):
            if re.search(regex, line['text']):
                return p, line
    return None, None


def k_first_baseline_match(ctx, c):
    """Baseline (mm below the page top) of the first line matching a regex: PDF vs Word (line placement inside the line box)."""
    params = c['params']
    values = {}
    for source in ('pdf', 'word'):
        _, line = _first_line(get_doc(ctx, {**params, 'source': source}), params['regex'], params.get('pages'))
        if line is None:
            return {'actual': None, 'note': f'no matching line in {source}'}
        values[source] = line['baseline']
    delta = abs(values['pdf'] - values['word'])
    return {'actual': {**values, 'deltaMm': delta}, 'pass': delta <= c.get('tolerance', .5) + EPS,
            'expected_override': 'PDF vs Word first baseline within tolerance'}


def k_first_ink_top_match(ctx, c):
    """Height (mm) of the glyph ink above the baseline of the first matching line (a first line has nothing above it):
    exposes glyph clipping of oversized exact line spacing. PDF vs Word."""
    import numpy as np
    params = c['params']
    values = {}
    for source in ('pdf', 'word'):
        doc = get_doc(ctx, {**params, 'source': source})
        p, line = _first_line(doc, params['regex'], params.get('pages'))
        if line is None:
            return {'actual': None, 'note': f'no matching line in {source}'}
        page = doc.pdf[p - 1]
        base_pt = line['baseline'] * MM2PT
        pix = page.get_pixmap(dpi=288, clip=__import__("pymupdf").Rect(0, 0, page.rect.width, base_pt))
        a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, 0]
        rows = np.where(a.min(axis=1) < 128)[0]
        if not len(rows):
            return {'actual': None, 'note': f'no ink above baseline in {source}'}
        values[source] = (pix.height - rows[0]) / 4 / MM2PT
    delta = abs(values['pdf'] - values['word'])
    return {'actual': {**values, 'deltaMm': delta}, 'pass': delta <= c.get('tolerance', .5) + EPS,
            'expected_override': 'PDF vs Word glyph ink above baseline within tolerance'}


def _case_lines(doc, tag):
    """Texts of all lines on the page (and following pages until another tag) where the case tag first appears."""
    out, started = [], False
    for p in range(1, doc.n + 1):
        ls = [re.sub(r'\s+', ' ', l['text']).strip() for l in doc.lines(p)]
        if not started and any(re.match(re.escape(tag) + r'-1', t) for t in ls):
            started = True
        elif started and any(re.match(r'J\d+-1', t) for t in ls):
            break
        if started:
            out.extend(ls)
    return out


def k_line_breaks_match(ctx, c):
    """Every line of a tagged section has identical text (hence identical line breaks) in the PDF and the Word render."""
    tag = c['params']['tag']
    a = _case_lines(get_doc(ctx, {**c['params'], 'source': 'pdf'}), tag)
    b = _case_lines(get_doc(ctx, {**c['params'], 'source': 'word'}), tag)
    diff = [i for i in range(max(len(a), len(b))) if (a[i] if i < len(a) else None) != (b[i] if i < len(b) else None)]
    return {'actual': {'lines': {'pdf': len(a), 'word': len(b)}, 'firstDiff': diff[:3] and [(i, a[i] if i < len(a) else None, b[i] if i < len(b) else None) for i in diff[:2]]},
            'pass': bool(a) and not diff, 'expected_override': 'identical line texts in PDF and Word'}


def _case_last_lines(doc, tag):
    """Word x positions (mm) of the last line of every paragraph of the tagged case: [(first words, [x0 ...])]."""
    items, started = [], False
    for p in range(1, doc.n + 1):
        ls = sorted(doc.lines(p), key=lambda l: (l['baseline'], l['x0']))
        if not started and any(re.match(re.escape(tag) + r'-1', l['text']) for l in ls):
            started = True
        elif started and any(re.match(r'J\d+-1', l['text']) for l in ls):
            break
        if started:
            items.extend((p, l) for l in ls)
    out = []
    for i, (p, line) in enumerate(items):
        nxt = items[i + 1][1]['text'] if i + 1 < len(items) else ''
        if i + 1 < len(items) and not re.match(re.escape(tag) + r'-\d+( |$)', nxt):
            continue
        words = [w for w in doc.pdf[p - 1].get_text('words') if line['top'] - .5 <= (w[1] + w[3]) / 2 / MM2PT <= line['bottom'] + .5]
        words.sort(key=lambda w: w[0])
        out.append((line['text'][:24], [round(w[0] / MM2PT, 3) for w in words]))
    return out


def k_last_line_words_match(ctx, c):
    """Word x positions of every paragraph's last line (natural word spacing in Word) agree between the PDF and the Word render."""
    tag, tol = c['params']['tag'], c.get('tolerance', .25)
    a = _case_last_lines(get_doc(ctx, {**c['params'], 'source': 'pdf'}), tag)
    b = _case_last_lines(get_doc(ctx, {**c['params'], 'source': 'word'}), tag)
    worst, bad = 0.0, []
    for i in range(max(len(a), len(b))):
        if i >= len(a) or i >= len(b) or len(a[i][1]) != len(b[i][1]):
            bad.append((i, a[i][0] if i < len(a) else None, b[i][0] if i < len(b) else None, 'word count'))
            continue
        d = max((abs(x - y) for x, y in zip(a[i][1], b[i][1])), default=0.0)
        worst = max(worst, d)
        if d > tol + EPS:
            bad.append((i, a[i][0], round(d, 3)))
    return {'actual': {'paragraphs': {'pdf': len(a), 'word': len(b)}, 'maxDeltaMm': round(worst, 3), 'bad': bad[:2]},
            'pass': bool(a) and not bad, 'expected_override': f'last-line word x within {tol} mm of Word'}


def _line_words(doc, page, line):
    """(non-leader glyph [x0, x1] list, leader run [x0, x1] or None) of one visual line; a leader is a run of >= 4 identical . - _ glyphs."""
    chars = [ch for block in doc.pdf[page - 1].get_text('rawdict')['blocks'] for ln in block.get('lines', []) for sp in ln['spans'] for ch in sp['chars']
             if ch['c'].strip() and line['top'] - .5 <= (ch['bbox'][1] + ch['bbox'][3]) / 2 / MM2PT <= line['bottom'] + .5]
    chars.sort(key=lambda ch: ch['bbox'][0])
    leader, rest, i = [], [], 0
    while i < len(chars):
        j = i
        while j + 1 < len(chars) and chars[j + 1]['c'] == chars[i]['c']:
            j += 1
        if chars[i]['c'] in '.-_' and j - i + 1 >= 4:
            leader.extend(chars[i:j + 1])
        else:
            rest.extend(chars[i:j + 1])
        i = j + 1
    return ([[round(ch['bbox'][0] / MM2PT, 3), round(ch['bbox'][2] / MM2PT, 3)] for ch in rest],
            [round(min(ch['bbox'][0] for ch in leader) / MM2PT, 3), round(max(ch['bbox'][2] for ch in leader) / MM2PT, 3), len(leader)] if leader else None)


def k_line_words_match(ctx, c):
    """Every matched line: non-leader word extents and the leader run (first/last leader glyph) agree between the PDF and the Word render."""
    P, tol = c['params'], c.get('tolerance', .5)
    res = {}
    for source in ('pdf', 'word'):
        doc = get_doc(ctx, {**P, 'source': source})
        res[source] = [(p, l['text'][:20], *_line_words(doc, p, l)) for p, l in _find_lines(doc, doc.pages(P.get('pages')), P['regex'])]
    a, b = res['pdf'], res['word']
    if not a or not b:
        return {'actual': {k: len(v) for k, v in res.items()}, 'pass': False, 'note': 'matching lines must exist in both outputs'}
    worst, bad = 0.0, []
    if len(a) != len(b):
        bad.append(('line count', len(a), len(b)))
    for x, y in zip(a, b):
        if x[0] != y[0] or len(x[2]) != len(y[2]) or (x[3] is None) != (y[3] is None):
            bad.append((x[1], 'structure', x[2:], y[2:]))
            continue
        ds = [abs(m - n) for u, v in zip(x[2], y[2]) for m, n in zip(u, v)]
        if P.get('leader', True) and x[3] and y[3]:
            ds += [abs(m - n) for m, n in zip(x[3][:2], y[3][:2])]
            if x[3][2] != y[3][2]:
                bad.append((x[1], 'leader glyph count', x[3][2], y[3][2]))
        d = max(ds, default=0.0)
        worst = max(worst, d)
        if d > tol + EPS:
            bad.append((x[1], round(d, 3), x[2:], y[2:]))
    return {'actual': {'lines': len(a), 'maxDeltaMm': round(worst, 3), 'bad': bad[:2]}, 'pass': not bad,
            'expected_override': f'word and leader extents within {tol} mm of Word'}


def k_page_size_match(ctx, c):
    a = get_doc(ctx, {**c['params'], 'source': 'pdf'})
    b = get_doc(ctx, {**c['params'], 'source': 'word'})
    sa = [page_size_mm(a.pdf[p]) for p in range(a.n)]
    sb = [page_size_mm(b.pdf[p]) for p in range(b.n)]
    tol = c.get('tolerance', .25)
    ok = len(sa) == len(sb) and all(abs(x[0] - y[0]) <= tol and abs(x[1] - y[1]) <= tol for x, y in zip(sa, sb))
    rle_ = lambda v: rle([f'{x[0]:.1f}x{x[1]:.1f}' for x in v])
    return {'actual': {'pdf': rle_(sa), 'word': rle_(sb)}, 'pass': ok, 'expected_override': f'identical page size on every page within {tol} mm'}


def k_page_number_attr_match(ctx, c):
    P = c['params']
    vals = {}
    for source in ('layout', 'word'):
        d = get_doc(ctx, {**P, 'source': source})
        vals[source] = [[p, round(ATTR[P.get('attr', 'baseline')](pn), 4)] for p in d.pages(P.get('pages')) for pn in [d.page_num(p)] if pn]
    if not vals['layout'] or not vals['word']:
        return {'actual': {k: len(v) for k, v in vals.items()}, 'pass': False, 'note': 'page numbers must exist in both outputs'}
    equal, delta = compare(vals['word'], vals['layout'], c.get('tolerance', .25))
    equal = equal and [v[0] for v in vals['word']] == [v[0] for v in vals['layout']]
    return {'actual': {k: v[:6] for k, v in vals.items()}, 'pass': equal, 'note': f'delta {delta}', 'expected_override': 'same pages and page-number geometry within tolerance'}


def k_fields_refresh_match(ctx, c):
    """Word's render of the DOCX with cached field results equals Word's render after updating every field (TOC/PAGEREF/NUMPAGES/SEQ/PAGE)."""
    a = get_doc(ctx, {**c['params'], 'source': 'word'})
    b = get_doc(ctx, {**c['params'], 'source': 'word-refreshed'})
    norm = lambda doc, p: [re.sub(r'\s+', ' ', l['text']).strip() for l in sorted(doc.lines(p, True), key=lambda l: (round(l['baseline'], 1), l['x0']))]
    diffs = []
    for p in range(1, max(a.n, b.n) + 1):
        la = norm(a, p) if p <= a.n else None
        lb = norm(b, p) if p <= b.n else None
        if la != lb:
            diffs.append((p, [x for x in (la or []) if x not in (lb or [])][:3], [x for x in (lb or []) if x not in (la or [])][:3]))
    return {'actual': {'pages': {'cached': a.n, 'refreshed': b.n}, 'diffs': diffs[:3]}, 'pass': not diffs and a.n == b.n,
            'expected_override': 'cached field results identical to Word-refreshed results on every page'}


def k_fields_cached_match(ctx, c):
    """Cached field results as Word loaded the DOCX equal Word's results after updating every field. Compared per kind: TOC results,
    SEQ / PAGE / NUMPAGES results in order per part, PAGEREF results per bookmark (Word rebuilds a TOC field's inner PAGEREFs with new bookmarks; they
    are covered by the TOC result text)."""
    var = ctx["variants"].get(c["params"].get("fixture", "default")) or {}
    path = var.get("wordFieldDump")
    if not path or not os.path.exists(path):
        raise Skip(var.get("wordRefreshNote") or var.get("wordNote") or "Word field dump unavailable (run with --word)")
    data = json.load(open(path, encoding="utf-8-sig"))
    rows = lambda key: [data.get(key)] if isinstance(data.get(key), dict) else (data.get(key) or [])
    before, after = rows("before"), rows("after")
    kind = lambda r: (r["code"].split() or [""])[0].upper()
    norm = lambda t: re.sub(r"\s+", " ", t).strip()
    diffs, seen = [], {}
    # NUMPAGES: Word has not paginated yet when it loads the file (COM reports a provisional count), so the cached value is read from the DOCX XML.
    cached_np = []
    with zipfile.ZipFile(get_docx(ctx, c["params"])) as z:
        for name in z.namelist():
            if name.startswith("word/") and name.endswith(".xml"):
                cached_np += re.findall(r"NUMPAGES</w:instrText>.*?w:fldCharType=\"separate\"/>.*?<w:t[^>]*>([^<]*)</w:t>", z.read(name).decode("utf8", "replace"), re.S)
    updated_np = sorted({norm(r["result"]) for r in after if kind(r) == "NUMPAGES"})
    seen["NUMPAGES(cached xml)"] = len(cached_np)
    if set(cached_np) - set(updated_np) or (cached_np and not updated_np):
        diffs.append(("NUMPAGES", sorted(set(cached_np)), updated_np))
    for k in ("TOC", "SEQ", "PAGE"):
        x = [(r["part"], norm(r["result"])) for r in before if kind(r) == k]
        y = [(r["part"], norm(r["result"])) for r in after if kind(r) == k]
        seen[k] = len(x)
        if x != y:
            diffs.append((k, x[:3], y[:3]))
    pb = {r["code"]: norm(r["result"]) for r in before if kind(r) == "PAGEREF"}
    pa = {r["code"]: norm(r["result"]) for r in after if kind(r) == "PAGEREF"}
    common = [code for code in pb if code in pa]
    seen["PAGEREF(common)"] = len(common)
    diffs += [("PAGEREF", code, pb[code], pa[code]) for code in common if pb[code] != pa[code]]
    return {"actual": {"fields": len(before), "kinds": seen, "diffs": diffs[:4]}, "pass": bool(before) and not diffs,
            "expected_override": "cached results identical to Word-updated results"}


def k_body_pitch_match(ctx, c):
    values = {source: k_line_pitch(ctx, {'params': {**c['params'], 'source': source}})['actual']
              for source in ('pdf', 'word')}
    if None in values.values():
        return {'actual': values, 'pass': False, 'note': 'no usable body baselines'}
    delta = abs(values['pdf'] - values['word'])
    return {'actual': {**values, 'deltaPt': delta * MM2PT}, 'pass': delta <= .2 / MM2PT + EPS}


def k_line_attr_match(ctx, c):
    params = c['params']
    values = {}
    for source in ('layout', 'word'):
        doc = get_doc(ctx, {**params, 'source': source, 'trim_trailing_whitespace': params.get('attr') == 'x1'})
        hits = _find_lines(doc, doc.pages(params.get('pages')), params['regex'])
        values[source] = [[page, round(ATTR[params.get('attr', 'baseline')](line), 4)] for page, line in hits]
    if not values['layout'] or not values['word']:
        return {'actual': values, 'pass': False, 'note': 'matching lines must exist in both outputs'}
    equal, delta = compare(values['word'], values['layout'], c.get('tolerance', .25))
    # Page identifiers are categorical, not a geometric tolerance.
    equal = equal and [v[0] for v in values['word']] == [v[0] for v in values['layout']]
    return {'actual': values, 'pass': equal, 'note': f'delta {delta}', 'expected_override': 'same physical pages and geometry within tolerance'}


def k_line_attr(ctx, c):
    P = c["params"]
    d = get_doc(ctx, P)
    hits = [(p, line) for p, line in anchored_lines(ctx, P) if re.search(P['regex'], line['text'])] if P.get('anchor') else _find_lines(d, d.pages(P.get("pages")), P["regex"])
    if 'nth' in P:
        nth = P['nth']
        if not isinstance(nth, int) or isinstance(nth, bool) or nth < 0:
            raise ValueError('line_attr nth must be a nonnegative integer')
        hits = hits[nth:nth + 1]
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


def open_end(seq):
    """'..., 1, 2, 3' -> '..., 1..N': the trailing run of consecutive Arabic labels, whose length depends on the
    fixture's content length (not on a source rule), is reduced to its start."""
    toks = seq.split(", ")
    j = len(toks)
    while j > 0 and toks[j - 1].isdigit() and (j == len(toks) or int(toks[j - 1]) + 1 == int(toks[j])):
        j -= 1
    return ", ".join(toks[:j] + [f"{toks[j]}..N"]) if len(toks) - j >= 2 else seq


def k_page_labels(ctx, c):
    """params.open_end: compare the trailing Arabic run by its start only (expected written as '..., 1..N')."""
    d = get_doc(ctx, c["params"])
    labels = [d.label(p) for p in d.pages(c["params"].get("pages"))]
    if c['params'].get('each'):
        return {'actual': labels, 'pass': bool(labels) and all(label == c['expected'] for label in labels)}
    seq = rle(labels)
    return {"actual": open_end(seq) if c["params"].get("open_end") else seq}


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
    """Every TOC entry equals its printed page label or an explicitly source-backed hidden index label."""
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
            m = entry_rx.match(t) if re.search(r"[.…·]{3,}|\s{2}", t) or True else None
            leader = re.search(r"[.…·]{3,}", t)
            if m and (leader or P.get("leader") == "none"):
                title = (buf + " " + m.group(1)).strip() if buf else m.group(1).strip()
                entries.append((title, m.group(2), p))
                buf = ""
                entry_ids.add(id(l))
            elif l["bold"]:
                buf = ""
            else:
                buf = (buf + " " + t).strip() if buf else t
    # buf accumulates headings that are not entries: reset on every page start is handled by the leader rule above
    ok, bad, hidden_checked = 0, [], []
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
        hidden = [item for item in P.get("hidden_index_labels", [])
                  if re.search(item.get("title_regex", r"$^"), title, re.I)]
        if labs == {""} and len(hidden) == 1:
            # Counted-but-unprinted front matter has no physical page numeral to extract.
            # Its contents label must be declared from source evidence; never infer one from position.
            labs = {str(hidden[0]["label"])}
            hidden_checked.append(f"{title[:32]}={hidden[0]['label']} (unprinted)")
        elif len(hidden) > 1:
            bad.append(f"{title[:40]!r}: multiple hidden-label rules match")
            continue
        elif len(hidden) == 1:
            bad.append(f"{title[:40]!r}: expected an unprinted counted page, found {sorted(labs) or 'not found'}")
            continue
        if lab.lower() in {x.lower() for x in labs}:
            ok += 1
        else:
            bad.append(f"{title[:40]!r}->{lab} vs {sorted(labs) or 'not found'}")
    n = len(entries)
    return {"actual": f"{ok}/{n}", "pass": n >= P.get("min_entries", 1) and ok == n,
            "note": "; ".join((bad + (["source-backed hidden index labels: " + ", ".join(hidden_checked)] if hidden_checked else []))[:5]),
            "expected_override": "all entries match printed labels or declared hidden index labels"}


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


def k_docx_paragraph_sequence(ctx, c):
    """Validate ordered paragraph/field signatures in selected XML parts."""
    params = c['params']
    path = get_docx(ctx, params)
    with zipfile.ZipFile(path) as archive:
        parts = [name for name in archive.namelist()
                 if re.search(params.get('part_regex', '^word/document.xml$'), name)]
    actual, bad = {}, []
    for part in parts:
        root = docx_xml(path, part)
        rows = []
        for paragraph in root.iter(W + 'p'):
            text = ''.join(node.text or '' for node in paragraph.iter(W + 't'))
            instruction = ' '.join([node.text or '' for node in paragraph.iter(W + 'instrText')]
                                   + [_attr(node, 'instr') or '' for node in paragraph.iter(W + 'fldSimple')])
            rows.append({'text': text, 'instruction': instruction,
                         'style': _attr(paragraph.find(f'{W}pPr/{W}pStyle'), 'val'),
                         'empty': not text.strip() and not instruction.strip()})
        if params.get('require_field') and not any(re.search(params['require_field'], row['instruction']) for row in rows):
            continue
        actual[part] = rows
        if len(rows) != len(c['expected']):
            bad.append(f'{part}: {len(rows)} paragraphs, expected {len(c["expected"])}')
            continue
        for index, (row, pattern) in enumerate(zip(rows, c['expected']), 1):
            for key, value in pattern.items():
                matches = re.search(value, row['instruction'] if key == 'field_regex' else row['text']) if key in ('field_regex', 'text_regex') else row.get(key) == value
                if not matches:
                    bad.append(f'{part} paragraph {index}: {key} mismatch')
    return {'actual': actual, 'pass': bool(actual) and not bad,
            'note': '; '.join(bad) if actual else 'no matching XML parts with required field'}


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
                if n.startswith('word/') and n.endswith('.xml'):
                    root = docx_xml(path, n)
                    stack = []
                    for element in root.iter(W + 'fldChar'):
                        edge = _attr(element, 'fldCharType')
                        if edge == 'begin':
                            stack.append(False)
                        elif edge == 'separate':
                            if not stack or stack[-1]:
                                hits.append(f'{n}: orphan/duplicate field separator')
                            else:
                                stack[-1] = True
                        elif edge == 'end':
                            if not stack:
                                hits.append(f'{n}: orphan field end')
                            else:
                                stack.pop()
                    if stack:
                        hits.append(f'{n}: {len(stack)} unclosed fields')
                    if any(list(field.iter(W + 'p')) for field in root.iter(W + 'fldSimple')):
                        hits.append(f'{n}: fldSimple contains a paragraph')
    return {"actual": hits or "none", "pass": not hits, "expected_override": "none"}


# ------------------------------------------------------------------ misc kinds
def k_docx_package_relationships(ctx, c):
    """XML well-formedness and OPC relationship integrity, not SDK schema validation."""
    errors = []
    rel_ns = 'http://schemas.openxmlformats.org/package/2006/relationships'
    attr_ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    with zipfile.ZipFile(get_docx(ctx, c['params'])) as archive:
        names = set(archive.namelist())
        xml = {name: ET.fromstring(archive.read(name)) for name in names if name.endswith(('.xml', '.rels'))}
        for name, root in xml.items():
            if name.endswith('.rels'):
                base = posixpath.dirname(posixpath.dirname(name))
                seen = set()
                for rel in root.findall('{' + rel_ns + '}Relationship'):
                    rid = rel.get('Id')
                    if not rid or rid in seen: errors.append(name + ': duplicate/missing relationship ID')
                    seen.add(rid)
                    if rel.get('TargetMode') == 'External': continue
                    target = rel.get('Target', '')
                    resolved = posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join(base, target))
                    if resolved not in names: errors.append(name + ': missing target ' + resolved)
            else:
                rel_path = posixpath.join(posixpath.dirname(name), '_rels', posixpath.basename(name) + '.rels')
                ids = {rel.get('Id') for rel in xml.get(rel_path, [])}
                for element in root.iter():
                    for key, value in element.attrib.items():
                        if key.startswith('{' + attr_ns + '}') and value not in ids:
                            errors.append(name + ': unresolved relationship ' + value)
    return {'actual': errors or 'none', 'pass': not errors,
            'expected_override': 'well-formed XML and resolvable package relationships; schema validation separate'}


def k_word_opens(ctx, c):
    var = ctx["variants"].get(c["params"].get("fixture", "default")) or {}
    if var.get("wordPdf") and os.path.exists(var["wordPdf"]):
        return {"actual": "opened and exported", "pass": True, "expected_override": "opens in Word"}
    raise Skip(var.get("wordNote") or "Word render unavailable (run with --word)")


def k_note(ctx, c):
    return {"actual": c["params"].get("text", ""), "status": "UNKNOWN" if c.get('required') and c.get('evidence') == 'UNKNOWN' else "INFO"}


KINDS = {n[2:]: f for n, f in list(globals().items()) if n.startswith("k_")}


# ------------------------------------------------------------------ run
def resolve_ref(ctx, path):
    """expected = {"ref": "pageCount"} / {"ref": "pages.1.firstBaseline"} -> value from cached reference.json."""
    f = os.path.join(ctx.get("reference") or "", "reference.json")
    if not os.path.exists(f):
        raise Skip("reference.json missing (run --build-reference)")
    v = json.load(open(f, encoding="utf8"))
    manifest = v.get('cacheProvenance')
    if not manifest:
        raise Skip('reference cache lacks source/renderer provenance; rebuild reference metadata')
    for name, expected_hash in manifest.get('artifactSha256', {}).items():
        artifact = os.path.join(ctx['reference'], name)
        if not os.path.isfile(artifact) or hashlib.sha256(open(artifact, 'rb').read()).hexdigest() != expected_hash:
            raise Skip('reference cache artifact missing or changed: ' + name)
    environment = json.loads(os.environ.get('CHECK_RENDERER_ENVIRONMENT', '{}'))
    if not environment.get('sha256') or manifest.get('environmentSha256') != environment['sha256']:
        raise Skip('reference renderer/font/locale environment missing or changed')
    for part in path.split("."):
        v = v[int(part)] if isinstance(v, list) else v[part]
    return v


def run_check(ctx, c):
    r = {"id": c["id"], "kind": c["kind"], "expected": c.get("expected"), "tolerance": c.get("tolerance", DEFAULT_TOL),
         "source": c.get("source"), "evidence": c.get("evidence"), "ruling": c.get("ruling"),
         "required": c.get('required', c['kind'] != 'note')}
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
    started = time.monotonic()
    checks = json.load(open(a.checks, encoding="utf8"))
    if isinstance(checks, dict):
        checks = checks["checks"]
    ctx = {"variants": json.loads(a.variants), "reference": a.reference}
    automatic = []
    for variant in ctx['variants']:
        automatic.append({'id': f'engine-docx-package-{variant}', 'kind': 'docx_package_relationships',
                          'params': {'fixture': variant}, 'expected': 'none', 'tolerance': 0,
                          'source': {'file': 'DOCX package', 'locator': 'XML parse and internal relationship targets'},
                          'evidence': 'MEASURED'})
        automatic.append({'id': f'engine-layout-pdf-{variant}', 'kind': 'layout_pdf_consistency',
                          'params': {'fixture': variant}, 'expected': 0, 'tolerance': .25,
                          'source': {'file': 'exported PDF', 'locator': 'independent PyMuPDF glyph origins vs engine report'},
                          'evidence': 'MEASURED'})
        automatic.append({'id': f'engine-layout-report-{variant}', 'kind': 'layout_report_valid',
                          'params': {'fixture': variant}, 'expected': True, 'tolerance': 0,
                          'source': {'file': 'schema.d.ts', 'locator': 'ThesisLayoutReport version 1'}, 'evidence': 'EXPLICIT'})
        if ctx['variants'][variant].get('repeatLayout'):
            automatic.append({'id': f'engine-layout-ids-{variant}', 'kind': 'layout_ids_match',
                              'params': {'fixture': variant}, 'expected': True, 'tolerance': 0,
                              'source': {'file': 'two real exports', 'locator': 'same fixture; deterministic landmark identity'},
                              'evidence': 'MEASURED'})
        if a.word_requested:
            for kind in ('page_count_match', 'page_labels_match'):
                automatic.append({'id': f'engine-{kind}-{variant}', 'kind': kind,
                                  'params': {'fixture': variant}, 'expected': 'equal PDF and Word',
                                  'evidence': 'MEASURED', 'source': {'file': 'real exports', 'locator': 'PDF vs Word-rendered DOCX'}})
            pitch = next((c for c in checks if c['kind'] == 'line_pitch'
                          and c.get('params', {}).get('fixture', 'default') == variant), None)
            if pitch:
                automatic.append({'id': f'engine-body-pitch-{variant}', 'kind': 'body_pitch_match',
                                  'params': {**pitch['params'], 'fixture': variant}, 'expected': 'equal within 0.2 pt',
                                  'evidence': 'MEASURED', 'source': pitch.get('source')})
    checks.extend(automatic)
    if a.only:
        ids = set(a.only.split(","))
        unknown = ids - {c["id"] for c in checks}
        if unknown:
            print("unknown check ids: " + ",".join(sorted(unknown)), file=sys.stderr)
            return 2
        checks = [c for c in checks if c["id"] in ids]
        # Independently verify every regenerated export, including a failed-only retry.
        checks.extend(c for c in automatic if c['id'] not in {r['id'] for r in checks})
    results = [run_check(ctx, c) for c in checks]
    stamp = a.stamp or datetime.datetime.now().strftime("%Y%m%d-%H%M")
    os.makedirs(a.out, exist_ok=True)
    fingerprints = {}
    for variant, paths in ctx["variants"].items():
        fingerprints[variant] = {}
        for key in ('fixture', 'pdf', 'docx', 'layout', 'repeatLayout', 'wordPdf', 'wordRefreshedPdf', 'wordFieldDump', 'wordRenderInfoPath'):
            path = paths.get(key)
            if path and os.path.isfile(path):
                with open(path, 'rb') as artifact:
                    fingerprints[variant][key] = hashlib.file_digest(artifact, 'sha256').hexdigest()
    with open(a.checks, 'rb') as specification:
        checks_hash = hashlib.file_digest(specification, 'sha256').hexdigest()
    provenance = json.loads(os.environ.get('CHECK_SOURCE_PROVENANCE', '{}'))
    document_settings = {}
    for variant, paths in ctx['variants'].items():
        if not paths.get('docx') or not os.path.isfile(paths['docx']): continue
        with zipfile.ZipFile(paths['docx']) as archive:
            if 'word/settings.xml' not in archive.namelist(): continue
            settings = ET.fromstring(archive.read('word/settings.xml'))
            document_settings[variant] = [ET.tostring(element, encoding='unicode') for element in settings
                                          if element.tag in (W + 'compat', W + 'decimalSymbol', W + 'listSeparator', W + 'updateFields', W + 'themeFontLang')]
    jpath, counts, rows = write_report(a.target, results, a.out, stamp, {"variants": ctx["variants"], "wordRequested": a.word_requested,
        'measurementSeconds': round(time.monotonic() - started, 3),
        'commandSeconds': round(float(os.environ.get('CHECK_DRIVER_ELAPSED_SECONDS', '0')) + time.monotonic() - started, 3),
        'exportMode': os.environ.get('CHECK_EXPORT_MODE', 'existing-artifacts'), 'sourceProvenance': provenance,
        'rendererEnvironment': json.loads(os.environ.get('CHECK_RENDERER_ENVIRONMENT', '{}')),
        'wordDocumentSettings': document_settings,
        'checksSha256': checks_hash, 'artifactSha256': fingerprints})
    print(f"{a.target}: " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())) + f"  -> {os.path.relpath(jpath)}")
    for r in rows:
        print(f"  {r['status']:7} {r['id']}: expected={fmt(r.get('expected'), 50)} actual={fmt(r.get('actual'), 50)} delta={fmt(r.get('delta', ''), 20)} {r.get('reason') or r.get('note') or ''}"[:260])
    return 1 if any(row['status'] in ('FAIL', 'CONFLICT') or (row.get('required') and row['status'] in ('UNKNOWN', 'SKIPPED')) for row in results) else 0


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
    environment = json.loads(os.environ.get('CHECK_RENDERER_ENVIRONMENT', '{}'))
    prior_path = os.path.join(d, 'reference.json')
    prior = json.load(open(prior_path, encoding='utf8')) if os.path.isfile(prior_path) else {}
    if os.environ.get('CHECK_REFERENCE_RENDER_FRESH') == '1' and environment.get('sha256'):
        ref['cacheProvenance'] = {'environmentSha256': environment['sha256'], 'artifactSha256': {
            name: hashlib.sha256(open(os.path.join(d, name), 'rb').read()).hexdigest()
            for name in ('official.docx', 'official-word.pdf', 'official-word.render.json')
            if os.path.isfile(os.path.join(d, name))}}
    elif prior.get('cacheProvenance'):
        # Existing renders retain their original environment; never bless them
        # using today's fonts/settings without a real render.
        ref['cacheProvenance'] = prior['cacheProvenance']
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
    inspect = sub.add_parser('inspect')
    inspect.add_argument('--pdf', required=True)
    inspect.add_argument('--layout')
    inspect.add_argument('--raw', action='store_true')
    inspect.add_argument('--images', action='store_true')
    inspect.add_argument('--page', type=int)
    inspect.add_argument('--summary', action='store_true')
    inspect.add_argument('--regex', default='.')
    inspect.add_argument('--extrema', choices=['x0', 'x1', 'baseline', 'size'])
    inspect_docx = sub.add_parser('inspect-docx')
    inspect_docx.add_argument('--docx', required=True)
    inspect_docx.add_argument('--part', default='word/document.xml')
    inspect_docx.add_argument('--regex', default='.')
    inspect_docx.add_argument('--styles', action='store_true')
    b = sub.add_parser("build-reference")
    b.add_argument("--dir", required=True)
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf8")
    if a.cmd == 'inspect-docx':
        if a.styles:
            print(json.dumps(docx_styles(a.docx), ensure_ascii=False))
        else:
            for index, paragraph in enumerate(docx_paragraphs(a.docx, a.part), 1):
                if re.search(a.regex, paragraph['text']):
                    print(json.dumps({'paragraph': index, **paragraph}, ensure_ascii=False))
        sys.exit(0)
    if a.cmd == 'inspect':
        doc = LayoutDoc(json.load(open(a.layout, encoding='utf8'))['engineLayout']) if a.layout else Doc(a.pdf)
        if a.images:
            for page in ([a.page] if a.page else range(1, doc.n + 1)):
                for item in images_mm(doc.pdf[page - 1]):
                    print(json.dumps({'page': page, **item}, ensure_ascii=False))
            doc.pdf.close()
            sys.exit(0)
        if a.extrema:
            hits = [(page, line) for page in ([a.page] if a.page else range(1, doc.n + 1))
                    for line in doc.lines(page, True) if re.search(a.regex, line['text'])]
            if hits:
                for name, pick in [('min', min), ('max', max)]:
                    page, line = pick(hits, key=lambda hit: hit[1][a.extrema])
                    print(json.dumps({'extreme': name, 'page': page,
                                      **{key: value for key, value in line.items() if key != 'spans'}}, ensure_ascii=False))
            if hasattr(doc, 'pdf'):
                doc.pdf.close()
            sys.exit(0)
        if a.summary:
            for page in range(1, doc.n + 1):
                lines = [line['text'] for line in doc.lines(page) if re.search(a.regex, line['text'])]
                print(json.dumps({'page': page, 'label': doc.label(page), 'first': lines[:2], 'last': lines[-2:]}, ensure_ascii=False))
            if hasattr(doc, 'pdf'):
                doc.pdf.close()
            sys.exit(0)
        if not a.page:
            ap.error('inspect requires --page or --summary')
        if a.raw:
            for block in doc.pdf[a.page - 1].get_text('rawdict')['blocks']:
                for line in block.get('lines', []):
                    text = ''.join(char['c'] for span in line['spans'] for char in span['chars'])
                    if re.search(a.regex, text):
                        print(json.dumps({'text': text, 'spans': [{**span, 'chars': span['chars'][-8:]} for span in line['spans']]}, ensure_ascii=False))
            doc.pdf.close()
            sys.exit(0)
        for line in doc.lines(a.page, True):
            if re.search(a.regex, line['text']):
                print(json.dumps({key: value for key, value in line.items() if key != 'spans'}, ensure_ascii=False))
        if hasattr(doc, 'pdf'):
            doc.pdf.close()
        sys.exit(0)
    sys.exit(cmd_run(a) if a.cmd == "run" else cmd_build_reference(a))
