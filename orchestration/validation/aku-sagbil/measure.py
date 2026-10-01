import pymupdf as fitz, json, zipfile, re, sys
from collections import Counter
sys.path.insert(0, 'orchestration/artifacts/aku-sagbil/export')
from base import lines, MM
R = []
def chk(id, exp, act, ok, ev, status=None):
    R.append(dict(id=id, expected=exp, actual=act, status=status or ('PASS' if ok else 'FAIL'), evidence=ev))
def foot(d, i):
    ls = [l for l in lines(d[i]) if round(l['size'],1) == 11.0 and l['base'] > 270]
    return ls[0] if ls else None
for v in ('master', 'phd'):
    pre = f'orchestration/artifacts/aku-sagbil/export/aku-sagbil-{v}-tr-v1'
    d = fitz.open(pre + '.pdf'); t = v + ':'
    w, h = d[0].rect.width * MM, d[0].rect.height * MM
    chk(t + 'page-size', [210, 297], [round(w, 2), round(h, 2)], abs(w - 210) < .5 and abs(h - 297) < .5, 'PDF page rect (page.size EXPLICIT 2.1)')
    emb = sorted({f[3] for p in d for f in p.get_fonts() if 'TimesNewRoman' in f[3] and f[1] == 'ttf'})
    chk(t + 'font-genuine-TNR', 'embedded TimesNewRomanPSMT + BoldMT ttf programs', emb, 'TimesNewRomanPSMT' in emb and 'TimesNewRomanPS-BoldMT' in emb, 'PyMuPDF get_fonts: embedded TrueType programs')
    foots = {i: foot(d, i) for i in range(len(d))}
    numbered = [i for i, l in foots.items() if l]
    first = next((i for i in numbered if foots[i]['text'].strip() == '1'), None)
    chk(t + 'main-starts-at-1', 1, None if first is None else 1, first is not None, 'footer label 1 on the GIRIS page (2.6)')
    bad = [i + 1 for i in numbered if not (abs((foots[i]['x0'] + foots[i]['x1']) / 2 - 105) < .5 and 'TimesNewRoman' in foots[i]['font'])]
    chk(t + 'pagenum-bottom-center-TNR11', 'x centre 105 mm +-0.5, TNR 11 pt, below 270 mm', 'violations on pages %s' % bad, not bad, 'footer spans (2.3, 2.6)')
    labels = [foots[i]['text'].strip() for i in numbered]
    chk(t + 'front-labels-roman-lower', ['iv', 'v', 'vi'], labels[:3], labels[:3] == ['iv', 'v', 'vi'], 'Ornek 8 counting: OZET=iv; 2.6 text would give i (CONFLICT, spec)', 'FAIL' if labels[:3] != ['iv', 'v', 'vi'] else 'PASS')
    hidden = [i + 1 for i in range(len(d)) if i not in numbered]
    chk(t + 'unnumbered-front-pages', [1, 2, 3, 4], hidden, hidden == [1, 2, 3, 4], 'cover-under, inner cover, approval, ethics unnumbered (2.6)')
    for i in range(first + 1, first + 6):
        ls = [l for l in lines(d[i]) if round(l['size'],1) == 12.0 and l['base'] < 270]
        if len(ls) > 8:
            x0 = min(l['x0'] for l in ls); x1 = max(l['x1'] for l in ls); bmax = max(l['base'] for l in ls)
            chk(t + 'margin-left-30', 30, round(x0, 2), abs(x0 - 30) <= .5, f'p{i+1} min x0')
            chk(t + 'margin-right-30', 180, round(x1, 2), abs(x1 - 180) <= .5, f'p{i+1} max x1 of justified lines')
            chk(t + 'text-above-bottom-margin', '<=267', round(bmax, 2), bmax <= 267, f'p{i+1} last baseline')
            bs = sorted({round(l['base'], 2) for l in ls}); ps = [b - a for a, b in zip(bs, bs[1:]) if 6 < b - a < 8]
            chk(t + 'body-pitch-20.7pt', 20.7, round(ps[0] / MM, 2) if ps else None, bool(ps) and abs(ps[0] / MM - 20.7) <= .2, f'p{i+1} (2.4 1.5 lines)')
            chk(t + 'body-size-12', [12.0], sorted({round(l['size'], 1) for l in ls}), {round(l['size'], 1) for l in ls} == {12.0}, f'p{i+1} (2.2)')
            break
    H = []
    for i in range(first, len(d)):
        for l in lines(d[i]):
            if re.match(r'^\d+\. [A-ZÇĞİÖŞÜ]', l['text']) and 'Bold' in l['font'] and l['text'] == l['text'].replace('ve', 've') and round(l['size']) == 12 and abs(l['x0'] - 30) < 1:
                H.append((i + 1, l))
    chk(t + 'h1-bold-12-left-upper', 'x0=30, 12pt bold, uppercase (ve lowercase)', [(p, l['text'][:22], round(l['x0'], 2)) for p, l in H], bool(H) and all(abs(l['x0'] - 30) <= .5 for _, l in H) and all(re.sub(r' ve ', ' VE ', l['text']) == re.sub(r' ve ', ' VE ', l['text']).upper() for _, l in H), '2.7')
    chk(t + 'h1-each-new-page', 'distinct pages', [p for p, _ in H], len({p for p, _ in H}) == len(H), '3.3.1')
    nums = [l['text'].split()[0] for _, l in H]
    chk(t + 'h1-numbering-sequence', "2.. 7. after 1. GIRIS (page 1 heading counted separately)", nums, nums[-6:] == ['2.', '3.', '4.', '5.', '6.', '7.'] or nums == ['1.', '2.', '3.', '4.', '5.', '6.', '7.'], '2.7')
    ic = lines(d[1])
    chk(t + 'inner-cover-first-baseline', 55.68, round(ic[0]['base'], 2), abs(ic[0]['base'] - 55.68) <= .5, 'Ornek 2 MEASURED (not a stated requirement)')
    chk(t + 'inner-cover-14pt-bold', '14 pt bold lines, 12 bold support sentence', sorted({(round(l['size']), 'Bold' in l['font']) for l in ic}), all('Bold' in l['font'] for l in ic) and {round(l['size']) for l in ic} == {12, 14}, '3.2.2 (vs Ornek 2 note 12 pt: CONFLICT)')
    cu = lines(d[0])
    chk(t + 'cover-under-first-baseline', 214.41, round(cu[0]['base'], 2), abs(cu[0]['base'] - 214.41) <= .5, 'Ornek 1 MEASURED')
    et = [l for l in lines(d[3]) if 'BİLDİRİMİ' in l['text']]
    chk(t + 'ethics-title-at-top', 33.96, round(et[0]['base'], 2) if et else None, bool(et) and abs(et[0]['base'] - 33.96) <= .5, 'Ornek 4 MEASURED; approval stays on one page')
    ab = [l for l in lines(d[4]) if l['text'].strip() == 'ÖZET'] if False else []
    oz = [i for i in range(len(d)) if lines(d[i]) and any(l['text'].strip() == 'ÖZET' and round(l['size']) == 12 and l['base'] < 40 for l in lines(d[i]))]
    if oz:
        L = lines(d[oz[0]]); tt = [l for l in L if 30 < l['base'] < 60]
        chk(t + 'ozet-title-top-centered', '33.96 centre 105', (round(tt[0]['base'], 2), round((tt[0]['x0'] + tt[0]['x1']) / 2, 2)), abs(tt[0]['base'] - 33.96) <= .5 and abs((tt[0]['x0'] + tt[0]['x1']) / 2 - 105) <= .5, '3.2.5')
        gap = [l['base'] for l in L if l['base'] < 60]
        chk(t + 'ozet-title-gap-24pt', '24 pt between title line box and thesis title: baselines 20.7+24 pt apart = 15.77 mm', round(gap[1] - gap[0], 2), abs(gap[1] - gap[0] - (20.7 + 24) * MM) <= .5, '3.2.5')
    z = zipfile.ZipFile(pre + '.docx'); x = z.read('word/document.xml').decode('utf8')
    pg = re.findall(r'<w:pgMar [^>]*/>', x); body = pg[-1]
    mm = lambda k: int(re.search(k + r'="(\d+)"', body).group(1)) * 25.4 / 1440
    chk(t + 'docx-pgMar-30mm', [30] * 4, [round(mm(k), 2) for k in ('left', 'right', 'top', 'bottom')], all(abs(mm(k) - 30) <= .25 for k in ('left', 'right', 'top', 'bottom')), 'last sectPr w:pgMar (body section)')
    chk(t + 'docx-line-360', 'w:line=360 present', 'w:line="360"' in x, 'w:line="360"' in x, 'document.xml')
    st = z.read('word/styles.xml').decode('utf8')
    chk(t + 'docx-font-TNR', True, 'Times New Roman' in st, 'Times New Roman' in st, 'styles.xml')
    fx = ''.join(z.read(n).decode('utf8') for n in z.namelist() if 'footer' in n)
    chk(t + 'docx-pagenum-11pt-center', 'w:sz 22 and jc center', ['w:sz w:val="22"' in fx, 'w:val="center"' in fx], 'w:sz w:val="22"' in fx and 'w:val="center"' in fx, 'footer xml')
    toc = [i for i in range(len(d)) if i < first and 'SAYFA' in d[i].get_text() and 'İÇİNDEKİLER' in d[i].get_text()]
    tp = lines(d[toc[0]]); sa = [l for l in tp if l['text'].strip() == 'SAYFA']
    chk(t + 'toc-SAYFA-bold-right', 'bold, x1 ~180', round(sa[0]['x1'], 2) if sa else None, bool(sa) and abs(sa[0]['x1'] - 180) <= .5 and 'Bold' in sa[0]['font'], '3.2.7')
    chk(t + 'toc-no-leader-dots', True, not any('....' in l['text'] or '…' in l['text'] for l in tp), not any('....' in l['text'] for l in tp), 'Ornek 8 vector page has none (spec dotted claim refuted)')
    bi = [i for i in range(first, len(d)) if re.search(r'KAYNAKLAR', d[i].get_text()) and any(round(l['size'],1) == 11.0 and l['base'] < 270 for l in lines(d[i]))]
    if bi:
        bl = [l for l in lines(d[bi[-1]]) if round(l['size'],1) == 11.0 and l['base'] < 270]
        chk(t + 'bib-size-11', 11, sorted({round(l['size'],1) for l in bl}), {round(l['size'],1) for l in bl} == {11.0}, '3.3.6')
        xs = sorted({round(l['x0'], 1) for l in bl})
        chk(t + 'bib-hanging-12.5', '12.5 mm', xs[:2], len(xs) >= 2 and abs(xs[1] - xs[0] - 12.5) <= .3, '3.3.6')
        bs = sorted(l['base'] for l in bl); ps = [b - a for a, b in zip(bs, bs[1:])]
        chk(t + 'bib-single-pitch', '12.65 pt (single 11 pt) within entry', round(min(ps) / MM, 2), abs(min(ps) / MM - 12.65) <= .2, '3.3.6')
json.dump(R, open('orchestration/validation/aku-sagbil/attempt-1.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(Counter(r['status'] for r in R))
for r in R:
    if r['status'] != 'PASS': print(r['id'], r['expected'], r['actual'])
