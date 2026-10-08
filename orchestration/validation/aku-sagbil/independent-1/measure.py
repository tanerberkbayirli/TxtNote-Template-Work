# Independent measurement of aku-sagbil exports (own code, not derived from implementer's base.py).
import pymupdf, json, sys, re, collections, zipfile
from dump import lines
MM = 25.4/72
R = []
def chk(id, exp, act, ok, ev, status=None):
    R.append(dict(id=id, expected=exp, actual=act, status=status or ('PASS' if ok else 'FAIL'), evidence=ev))
for v in ('master', 'phd'):
    d = pymupdf.open(f'aku-sagbil-{v}-tr-v1.pdf'); t = v + ':'
    w, h = d[0].rect.width*MM, d[0].rect.height*MM
    chk(t+'page-size', [210, 297], [round(w, 2), round(h, 2)], abs(w-210) < .5 and abs(h-297) < .5, 'PDF mediabox; guide 2.1 A4 21x29.7 cm')
    body = []   # (page, line) of body text excluding footer band
    for i, p in enumerate(d):
        for l in lines(p):
            if l['base'] < 270: body.append((i+1, l))
    x0 = min(l['x0'] for _, l in body); x1 = max(l['x1'] for _, l in body)
    chk(t+'margin-left-right', '30.00 / 180.00 mm +-0.5', [round(x0, 2), round(x1, 2)], x0 > 29.5 and x1 < 180.5, 'min x0 / max x1 of all text lines (guide 2.3, 3 cm each side)')
    top = min(l['base']-0.9336*l['size']*MM for _, l in body if l['size'] >= 12)
    chk(t+'margin-top', '30.00 mm (line-box top; first body baseline 33.95)', round(top, 2), abs(top-30) < .5, 'first baseline - 0.9336 em (Word line model, 1.5 spacing puts extra leading below)')
    mx = max(l['base'] for _, l in body)
    chk(t+'margin-bottom', 'text bottom <= 267 mm', round(mx, 2), mx < 267, 'max body baseline (footnote line)')
    # fonts
    emb = sorted({f[3] for p in d for f in p.get_fonts() if f[1] == 'ttf'})
    chk(t+'font-genuine-TNR', 'Monotype Times New Roman ttf embedded', emb, set(emb) == {'TimesNewRomanPSMT', 'TimesNewRomanPS-BoldMT', 'TimesNewRomanPS-ItalicMT', 'TimesNewRomanPS-BoldItalicMT'}, 'name table: (c) Monotype, Version 7.12; no Tinos/Liberation')
    used = collections.Counter()
    for p in d:
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if s['text'].strip(): used[(s['font'], round(s['size'], 1))] += 1
    nonTNR = {k: n for k, n in used.items() if 'TimesNewRoman' not in k[0]}
    chk(t+'all-spans-TNR', {}, nonTNR, not nonTNR, 'span font census')
    # body pitch 1.5 (20.7pt = 7.30 mm) in a pure body page range
    pit = collections.Counter()
    for pn in range(15, 22):
        ls = [l for l in lines(d[pn-1]) if l['base'] < 270 and l['size'] == 12 and not l['bold']]
        for a, b in zip(ls, ls[1:]):
            dd = round(b['base']-a['base'], 2)
            if dd > 0: pit[dd] += 1
    chk(t+'body-line-pitch', '7.30 mm (20.7 pt) within paragraph', pit.most_common(4), abs(pit.most_common(1)[0][0]-7.30) < .07, '1.5 line spacing (guide 2.4); Word model 1.15 em x 1.5 x 12 pt')
    # footer
    foot = {}
    for i, p in enumerate(d):
        ft = [l for l in lines(p) if l['base'] >= 270]
        if ft: foot[i+1] = ft[0]
    bad = [pn for pn, l in foot.items() if not (abs((l['x0']+l['x1'])/2-105) < .5 and l['size'] == 11.0 and 'TimesNewRoman' in l['font'])]
    chk(t+'pagenum-bottom-center-TNR11', 'x centre 105 +-0.5 mm, 11 pt TNR', {'violations': bad, 'pages_numbered': len(foot)}, not bad, 'footer band lines (guide 2.6)')
    lab = {pn: l['text'].strip() for pn, l in foot.items()}
    chk(t+'unnumbered-pages', 'cover, inner cover, approval, ethics unnumbered', [pn for pn in range(1, 6) if pn not in foot], [pn for pn in range(1, 6) if pn not in foot] == [1, 2, 3, 4, 5][:4], 'pages 1-4 per guide; page 4 here is overflow of approval page; ethics is p5 (unnumbered) -> actual list below', status=None)
    chk(t+'page-labels-first', ['iv(ÖZET per Ornek 8) or i (2.6)'], [lab.get(i) for i in range(5, 9)], lab.get(6) == 'iv', 'ÖZET label; stray approval overflow page shifts count by 1')
    last_front = max(pn for pn, s in lab.items() if re.fullmatch(r'[ivxl]+', s))
    first_main = min(pn for pn, s in lab.items() if s == '1')
    chk(t+'main-arabic-from-1', 'GİRİŞ page labelled 1; continues arabic to last page', [lab[first_main], lab[max(lab)], len(d)-first_main+1], int(lab[max(lab)]) == len(d)-first_main+1, 'guide 2.6; Ekler continue after Kaynaklar (3.3.7)')
    json.dump({'labels': lab}, open(f'labels-{v}.json', 'w'))
json.dump(R, open('independent-1.json', 'w'), ensure_ascii=False, indent=1)
for r in R: print(r['status'], r['id'], '|', r['expected'], '|', r['actual'])
