import pymupdf
d = pymupdf.open('/home/user/TxtNote-Template-Work/Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf')
mm = 25.4 / 72
print(len(d))
for i in range(1, len(d)):
    p = d[i]
    best = None
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if s['text'].strip():
                    if best is None or s['origin'][1] < best[0]:
                        best = (s['origin'][1], s['bbox'][0], s['text'][:30], s['size'], s['font'])
    print(i + 1, round(p.rect.height, 2), f'{best[0]*mm:.3f}', f'{best[1]*mm:.2f}', best[2:])
print(d[22].get_text()[:1500])
for i in range(13, 22):
    print(i + 1, d[i].get_text()[:120].replace('\n', ' | '))
