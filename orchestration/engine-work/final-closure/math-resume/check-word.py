import json, unicodedata
from pathlib import Path
import pymupdf

root=Path('orchestration/engine-work/final-closure/math-resume')
cases=json.loads((root/'cases.json').read_text(encoding='utf8'))
ids={c['id'] for c in cases}
groups={}; current=None
normalize=lambda text: unicodedata.normalize('NFKC',text.encode('utf-16','surrogatepass').decode('utf-16'))
doc=pymupdf.open(root/'nary-word.pdf')
for page in doc:
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                text=normalize(''.join(c['c'] for c in span['chars'])).strip()
                if text in ids:
                    current=text;groups[current]={};continue
                if current:
                    for char in span['chars']:
                        value=normalize(char['c'])
                        if value.strip():groups[current][value]=char['bbox']
results=[]
for case in cases:
    chars=groups[case['id']]
    for symbol in (case['op'],'L','U','x'):assert symbol in chars,(case['id'],symbol)
    op,lower,upper,body=(chars[s] for s in (case['op'],'L','U','x'))
    center=lambda rect:(rect[1]+rect[3])/2
    if case['tag']=='munderover':
        assert center(lower)>center(op)>center(upper),case['id']
    elif case['id']=='SUMSIDE':
        assert lower[0]>=op[2]-.5,case['id']
    elif case['id']=='INTDEFAULT':
        assert upper[0]>op[0]+5,case['id']
    elif case['id']=='HIDELOW':
        assert abs(center(lower)-center(upper))<.1 and center(upper)<center(op),case['id']
    elif case['id']=='HIDEHIGH':
        assert abs(center(upper)-center(body))<.1,case['id']
    elif case['id']=='HIDEBOTH':
        assert abs(center(lower)-center(body))<.1 and abs(center(upper)-center(body))<.1,case['id']
    results.append({'id':case['id'],'status':'PASS','characters':chars})
(root/'word-check.json').write_text(json.dumps({'status':'PASS','cases':results},ensure_ascii=True,indent=2))
print('PASS: 8 real Word cases; limit placement and hidden-content relocation verified')
