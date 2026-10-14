import sys,json,re,bisect,pathlib
sys.path.insert(0,'orchestration/tools/measurement-packages')
import pymupdf
source=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'orchestration/engine-work/final-closure/long/exact/SRC09.pages.json')
pdf=pathlib.Path('orchestration/engine-work/mission01/references/SRC09/word.pdf')
ours=json.loads(source.read_text(encoding='utf8'))
norm=lambda text:re.sub(r'[\W_]+','',text.casefold())
otexts=[norm(' '.join(w for _,w in sorted(page['words'],key=lambda item:item[0]))) for page in ours]
word=pymupdf.open(pdf)
wtokens=[[w[4] for w in sorted(page.get_text('words'),key=lambda w:(round(w[1]),w[0]))] for page in word]
wtexts=[norm(' '.join(tokens)) for tokens in wtokens]
whole=''.join(otexts);wwhole=''.join(wtexts);offsets=[];off=0
for text in otexts:offsets.append(off);off+=len(text)
rows=[]
for index,tokens in enumerate(wtokens):
    selected=None
    for take in range(min(80,max(0,len(tokens)-8))):
        anchor=norm(' '.join(tokens[take:take+8]))
        if len(anchor)<35 or wwhole.count(anchor)!=1 or whole.count(anchor)!=1:continue
        pos=whole.find(anchor);page=bisect.bisect_right(offsets,pos)-1
        selected=dict(wordPage=index+1,editorPage=page+1,offset=pos-offsets[page],skippedWords=take,anchor=' '.join(tokens[take:take+8]));break
    rows.append(selected or dict(wordPage=index+1,editorPage=None))
report=json.dumps(dict(source=str(source),wordPages=len(word),editorPages=len(ours),rows=rows),ensure_ascii=False,indent=2)
pathlib.Path('orchestration/engine-work/final-closure/special/src09-exact-openings.json').write_text(report,encoding='utf8')
print('Word',len(word),'editor',len(ours),'opening map saved as UTF-8')

