import json,sys,fitz
d,a,b=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
n=int(sys.argv[4]) if len(sys.argv)>4 else 3
W=fitz.open('orchestration/engine-work/mission01/references/SRC09/word.pdf')
ed=json.load(open(f'{d}/SRC09.pages.json',encoding='utf8'))
def wl(pn):
    ls=[]
    for bl in W[pn-1].get_text('dict')['blocks']:
        if bl['type']==0:
            for l in bl['lines']:
                t=''.join(s['text'] for s in l['spans']).strip()
                if t and l['bbox'][1]<762: ls.append((round(l['bbox'][1],1),round(l['bbox'][3],1),t[:42]))
    return sorted(ls)
def el(pn):
    seen=[]
    for y,t in ed[pn-1]['words']:
        if seen and abs(seen[-1][0]-y)<3: seen[-1][1]+=' '+t
        else: seen.append([round(y/1.01197,1),t])
    return seen
for pn in range(a,b+1):
    w=wl(pn);e=el(pn)
    print(f'=== page {pn}: word {len(w)} lines, editor {len(e)} lines')
    for lab,x in (('W',w),('E',e)):
        for l in x[:n]: print(' ',lab,'first',l)
        for l in x[-n:]: print(' ',lab,'last ',l)
