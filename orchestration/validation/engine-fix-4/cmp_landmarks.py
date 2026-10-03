import sys, pymupdf
sys.stdout.reconfigure(encoding='utf-8')
mode, n = sys.argv[1], sys.argv[2]
FIRST = int(sys.argv[3]) if len(sys.argv) > 3 else 12
d = pymupdf.open(f'{mode}/{n}.pdf')
texts = [p.get_text() for p in d]
rows = [l.rstrip('\n').split('\t') for l in open(f'{mode}/{n}.landmarks.txt', encoding='utf-8-sig')][1:]
used = {}
print('word_page  y_pt  editor_page  text')
for r in rows:
    page, y, t = int(r[0]), r[1], r[2]
    key = t[:28].rstrip(' .0123456789')
    k = used.get(key, 0)
    hits = [i + 1 for i, tx in enumerate(texts) if key in tx.replace('\n', ' ')]
    # skip TOC/list pages: take occurrences in order
    ed = hits[k] if k < len(hits) else None
    used[key] = k + 1
    flag = '' if ed == page else '  <-- DIFF'
    print(f'{page:>5} {y:>7} {str(ed):>8}   {t[:50]}{flag}')
