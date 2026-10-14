import bisect,json,re,sys
from pathlib import Path
import pymupdf

case=sys.argv[1] if len(sys.argv)>1 else 'SRC09'
out=Path('orchestration/engine-work/mission08/resume-long')
ours=json.loads((out/(case+'.pages.json')).read_text(encoding='utf-8'))
reference=pymupdf.open(f'orchestration/engine-work/mission01/references/{case}/word.pdf')
norm=lambda text:re.sub(r'[\W_]+','',text.lower())
editor=[norm(''.join(word for _,word in sorted(page['words'],key=lambda pair:pair[0]))) for page in ours]
word=[norm(''.join(item[4] for item in sorted(page.get_text('words'),key=lambda item:(round(item[1]),item[0])))) for page in reference]
positions=[]
offset=0
for text in editor:
    positions.append(offset)
    offset+=len(text)
stream=''.join(editor)
rows=[]
for index,text in enumerate(word):
    if len(text)<30:
        rows.append(dict(wordPage=index+1,status='SHORT_REFERENCE'))
        continue
    location=stream.find(text[:30])
    if location<0:
        rows.append(dict(wordPage=index+1,status='OPENING_NOT_FOUND'))
        continue
    editor_page=bisect.bisect_right(positions,location)-1
    local_offset=location-positions[editor_page]
    rows.append(dict(wordPage=index+1,editorPage=editor_page+1,offset=local_offset,status='MATCH' if editor_page==index and local_offset==0 else 'DIFFERENT_BREAK'))
report=dict(id=case,editorPages=len(editor),wordPages=len(word),pageCountMatches=len(editor)==len(word),scope='Physical page count and diagnostic normalized opening-prefix alignment. Repeated prefixes and short pages are not full text/visual equality.',openingMatches=sum(row['status']=='MATCH' for row in rows),rows=rows)
(out/(case+'.comparison.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({key:value for key,value in report.items() if key!='rows'},ensure_ascii=False))
