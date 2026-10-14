import json, unicodedata
from pathlib import Path
import pymupdf

out = Path('orchestration/engine-work/final-closure/quick-math')
cases = json.loads((out/'cases.json').read_text(encoding='utf-8'))
doc = pymupdf.open(out/'word.pdf')
normalize = lambda s: unicodedata.normalize('NFKC', s.encode('utf-16', 'surrogatepass').decode('utf-16'))
rows = {c['id']: [] for c in cases}
current = None
for pi, page in enumerate(doc):
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            chars = [c for s in line['spans'] for c in s['chars']]
            label = normalize(''.join(c['c'] for c in chars)).strip()
            if label in rows:
                current = label
            elif current:
                rows[current].extend(dict(text=normalize(c['c']), bbox=c['bbox'], page=pi) for c in chars if c['c'].strip())
results = []
for case in cases:
    chars = rows[case['id']]
    if case.get('type') == 'lin':
        chars = sorted(chars, key=lambda c: c['bbox'][0])
    actual = ''.join(c['text'] for c in chars)
    assert actual == case['text'], (case['id'], actual, case['text'])
    result = dict(id=case['id'], text=actual)
    if case.get('type'):
        a, b = [next(c for c in chars if c['text'] == t) for t in 'ab']
        if case['type'] == 'lin':
            assert abs(a['bbox'][1]-b['bbox'][1]) < .1
            assert a['bbox'][2] < b['bbox'][0]
        else:
            assert a['page'] == b['page'] and a['bbox'][3] < b['bbox'][1]
            area = pymupdf.Rect(min(a['bbox'][0], b['bbox'][0])-.1, a['bbox'][3], max(a['bbox'][2], b['bbox'][2])+.5, b['bbox'][1])
            rules = [d for d in doc[a['page']].get_drawings() if area.intersects(d['rect'])]
            assert bool(rules) == (case['type'] == 'bar'), (case['id'], len(rules))
            result['fractionRule'] = bool(rules)
    results.append(result)
(out/'word-check.json').write_text(json.dumps(dict(status='PASS', cases=len(results), rows=results), ensure_ascii=False, indent=2), encoding='utf-8')
print('Real Word: 10 PASS / 0 FAIL.')
