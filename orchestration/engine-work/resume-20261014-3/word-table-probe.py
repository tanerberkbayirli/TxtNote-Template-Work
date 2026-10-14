import pymupdf as fitz,json,pathlib
root=pathlib.Path(__file__).parent
doc=fitz.open(root.parent/'mission01/references/SRC10/word.pdf')
out=[]
for i in [83,84,85]:
    ys=set()
    for drawing in doc[i].get_drawings():
        for item in drawing['items']:
            if item[0]=='l' and abs(item[1].y-item[2].y)<.1 and abs(item[1].x-item[2].x)>250:
                ys.add(round(item[1].y,3))
    lines=[{'y':l['bbox'][1],'text':''.join(s['text'] for s in l['spans'])}for b in doc[i].get_text('dict')['blocks'] if 'lines'in b for l in b['lines']]
    out.append({'page':i+1,'borders':sorted(ys),'lines':lines})
(root/'word-table.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print([(r['page'],r['borders'])for r in out])
