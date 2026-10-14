import json
import unicodedata
from pathlib import Path
import pymupdf

out = Path('orchestration/engine-work/final-closure/src09-active')
rows = {f'C{i}': [] for i in range(6)}
current = None
for page in pymupdf.open(out / 'nary.word.pdf'):
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            chars = [c for s in line['spans'] for c in s['chars']]
            text = ''.join(c['c'] for c in chars).strip()
            if text in rows:
                current = text
            elif current:
                rows[current].extend(dict(text=unicodedata.normalize('NFKC', c['c']), bbox=c['bbox']) for c in chars)
results = []
for i, (label, chars) in enumerate(rows.items()):
    op = next(c for c in chars if c['text'] == '∑')['bbox']
    lower = next(c for c in chars if c['text'] == 'L')['bbox']
    upper = next(c for c in chars if c['text'] == 'U')['bbox']
    if i == 0:
        assert op[0] < lower[0] < lower[2] < op[2]
        assert op[0] < upper[0] < upper[2] < op[2]
        assert upper[3] < op[1] and lower[1] > op[3]
    else:
        assert lower[0] >= op[2] - .1 and upper[0] >= op[2] - .1
    results.append(dict(id=label, operatorWidth=op[2]-op[0], op=op, lower=lower, upper=upper))
assert results[0]['operatorWidth'] > results[1]['operatorWidth'] * 1.5
assert results[3]['operatorWidth'] > results[4]['operatorWidth'] * 1.5
(out / 'word-context-check.json').write_text(json.dumps(dict(status='PASS', cases=6, rows=results), ensure_ascii=False, indent=2), encoding='utf-8')
print('Actual Word: context 6 PASS / 0 FAIL.')
