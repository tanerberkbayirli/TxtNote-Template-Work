# Compares the first N pages of the official template PDF (Word render) with the exported PDF / Word render of the exported DOCX:
# for every template text line (outside the red instruction boxes) the same text is looked up on the same page; dy/dx in mm.
import sys, pymupdf, re
mm = 25.4/72
def lines(path, pages):
    d = pymupdf.open(path); out = {}
    for pn in range(min(pages, len(d))):
        L = []
        for b in d[pn].get_text('dict')['blocks']:
            if b['type'] != 0: continue
            for l in b['lines']:
                t = ''.join(s['text'] for s in l['spans']).strip()
                if t: L.append((t, l['bbox'][0]*mm, l['bbox'][1]*mm, l['bbox'][2]*mm, l['spans'][0]['size']))
        out[pn+1] = L
    return out
tpl, a = lines(sys.argv[1], int(sys.argv[3])), lines(sys.argv[2], int(sys.argv[3]))
SKIP = ('Sadece bu', '14 punto', 'kullan', 'Savunman', 'tarih dikkate', '(*)', 'II. satır', 'satıra', 'hizalan', 'olmalı', 'Anahtar kelimelerin', 'arasında olmal', 'Times New', '10 Punto', 'Boşluklarda', 'Prof.', 'Doç.', 'Dr. Öğr', 'İngilizce Kar', '1 sayfayı', 'istenildiği', 'İçindekiler Dizininde', 'eğer açıklamalar', 'hizalanmalı', 'Kısaltmalar bölümü', 'alfabetik', 'olmalıdır', 'Şekiller, Çizelgeler', 'sonraki sayfaları', 'dahil)', 'notudur', 'Başlama', 'yılı yazılmalı', 'Ayrıca kenar', 'boşluklarına', 'taşmamalı', 'Çizelgeler ve', 'Resimler sayfaya', 'ortalanmalıdır', 'Resimlerin açıklamaları', 'üst satıra', 'taşıyorsa', 'Bu kısım', 'kapsar', 'Şekiller,', 'Resimler Dizininde', 'Şayet', 'sığmıyorsa', 'başlık şekildeki', 'gibi yazılmalı', 'sayfaya', 'ortalanmalıdır')
n = bad = 0
for pn, L in tpl.items():
    for t, x0, y0, x1, sz in L:
        if t.startswith(SKIP) or '(Bir' in t or sz < 11: continue
        c = [m for m in a.get(pn, []) if m[0][:18] == t[:18]]
        if not c: print(f'p{pn} MISSING {t[:40]!r}'); continue
        m = min(c, key=lambda m: abs(m[2]-y0))
        dy, dx = m[2]-y0, m[1]-x0; n += 1
        flag = '' if abs(dy) <= 0.5 and abs(dx) <= 0.5 else '  <<<'
        if flag: bad += 1
        print(f'p{pn} dy={dy:+6.2f} dx={dx:+6.2f} {t[:44]!r}{flag}')
print('compared', n, 'outside 0.5 mm:', bad)
