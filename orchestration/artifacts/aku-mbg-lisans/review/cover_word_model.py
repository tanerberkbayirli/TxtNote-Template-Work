"""Recompute absolute baselines of the AKU MBG inner cover (template section 1) from
word/document.xml under an explicit Word line model, instead of the LibreOffice render.

Word line model (evidence: guide PDF, see review section of the report):
  * single line height of Times New Roman = 1.15 em (hhea 1825+443+87 / 2048 = 1.1499)
  * baseline sits ASC_EM below the top of the line box for single AND for multiple spacing;
    measured on the Word-2010 guide PDF: 0.906-0.912 em (page-top continuation lines of 1.5-spaced
    paragraphs, first row of a single-spaced table). The hypothesis ascent+lineGap = 0.934 em is
    printed as an alternative (difference 0.09 mm at 14 pt).
  * "1,5 satir" (w:line=360 auto): line height = 1.5 x natural line height; the extra goes BELOW.
  * inline picture: natural above-baseline part = picture extent + effectExtent t/b; below part = text descent.
Two variants for the logo line (the only inline-picture line):
  A = Word multiplies only the text height (extra = 0.5 x 1.15 em of the paragraph font)
  B = Word multiplies the whole natural line height incl. the picture.
Usage: python3 cover_word_model.py <document.xml>
"""
import re, sys
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
ns = {'w': W, 'wp': WP}
PT = 25.4 / 72
EMU = 1 / 36000.0
EM_SINGLE = 1.1499
DESC_EM = 0.2163 + 0.0425 / 2          # below-baseline part of the single line box

doc = etree.parse(sys.argv[1])
body = doc.getroot().find('w:body', ns)
paras = []
for p in body.iterchildren('{%s}p' % W):
    paras.append(p)
    if p.find('w:pPr/w:sectPr', ns) is not None:
        break                             # end of section 1 (inner cover)

def pinfo(p):
    sp = p.find('w:pPr/w:spacing', ns)
    line = int(sp.get('{%s}line' % W)) if sp is not None and sp.get('{%s}line' % W) else 240
    rule = sp.get('{%s}lineRule' % W) if sp is not None else 'auto'
    sizes = []
    for r in p.findall('w:r', ns):
        if r.find('w:t', ns) is None and r.find('w:drawing/wp:inline', ns) is None:
            continue
        sz = r.find('w:rPr/w:sz', ns)
        sizes.append(int(sz.get('{%s}val' % W)) / 2 if sz is not None else 10.0)
    mark = p.find('w:pPr/w:rPr/w:sz', ns)
    msz = int(mark.get('{%s}val' % W)) / 2 if mark is not None else 10.0
    size = max(sizes + [msz]) if sizes else msz
    pic = 0.0
    for inl in p.findall('.//w:drawing/wp:inline', ns):
        ext = inl.find('wp:extent', ns); ee = inl.find('wp:effectExtent', ns)
        h = int(ext.get('cy')) + (int(ee.get('t')) + int(ee.get('b')) if ee is not None else 0)
        pic = max(pic, h * EMU)
    text = ''.join(t.text or '' for t in p.findall('w:r/w:t', ns)).strip()
    nbr = len([b for b in p.findall('w:r/w:br', ns) if b.get('{%s}type' % W) in (None, 'textWrapping')])
    return dict(mult=line / 240.0, rule=rule, size=size, picMm=pic, text=text, lines=1 + nbr)

def run(asc_em, variant, top_mm=568 / 1440 * 25.4):
    y = top_mm
    out = []
    for p in paras:
        i = pinfo(p)
        sz = i['size']
        asc = asc_em * sz * PT
        desc = (EM_SINGLE - asc_em) * sz * PT
        above = max(asc, i['picMm'])
        natural = above + desc
        if i['picMm'] and variant == 'A':
            h = natural + (i['mult'] - 1) * EM_SINGLE * sz * PT
        else:
            h = natural * i['mult']
        label = i['text'] or ('<pictures %.2f mm>' % i['picMm'] if i['picMm'] else '(empty)')
        for k in range(i['lines']):
            hk = h if k == 0 else (asc + desc) * i['mult']
            ak = above if k == 0 else asc
            out.append((label + ('' if i['lines'] == 1 else ' [line %d]' % (k + 1)), sz, i['mult'],
                        round(y, 2), round(y + ak, 2), round(y + hk, 2)))
            y += hk
    return out

if __name__ == '__main__':
    for asc_em in (0.911, 0.9336):
        for variant in ('A', 'B'):
            print('=== asc %.4f em, logo-line variant %s' % (asc_em, variant))
            for t, sz, m, top, base, bot in run(asc_em, variant):
                flag = '  <-- line box ends below the bottom margin (266.99 mm)' if bot > 297 - 1701 / 1440 * 25.4 + 0.005 else ''
                print('  top %6.2f  baseline %6.2f  bottom %6.2f  %4.1fpt x%.1f  %s%s' % (top, base, bot, sz, m, t[:40], flag))
