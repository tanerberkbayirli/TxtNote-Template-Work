import json
from pathlib import Path
import pymupdf

out = Path('orchestration/engine-work/final-closure/src09-active')
probe = json.loads((out/'final-equations.json').read_text(encoding='utf-8'))
markers = {}
for pi, page in enumerate(pymupdf.open('orchestration/engine-work/final-closure/resume2/exp/eqprobe.word.pdf')):
    for word in page.get_text('words'):
        if word[4].startswith('MARK'):
            markers[int(word[4][4:])] = (pi, word[1])
rows = []
for index in [2,3,4,5,10,11,14,15]:
    assert markers[index][0] == markers[index+1][0]
    word = markers[index+1][1]-markers[index][1]-20.7
    editor = probe['baseline'][index]['height']/probe['zoom']*.75
    error = abs(word-editor)
    assert error < 1, (index, word, editor)
    rows.append(dict(case=index,wordPt=word,editorPt=editor,errorPt=error))
(out/'height-check.json').write_text(json.dumps(dict(status='PASS',cases=8,tolerancePt=1,rows=rows),indent=2),encoding='utf-8')
print('Tall equation heights: 8/8 within 1 pt of actual Word. This is a targeted check, not long-document acceptance.')
