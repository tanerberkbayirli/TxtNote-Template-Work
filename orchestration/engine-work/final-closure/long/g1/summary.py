import json,sys,fitz,re
case,src=sys.argv[1],sys.argv[2]
ours=json.load(open(src,encoding='utf8'))
import os
doc=fitz.open(os.environ.get('WORD_PDF') or f'orchestration/engine-work/mission01/references/{case}/word.pdf')
N=lambda s:re.sub(r'[\W_]+','',s.lower())
def wl(i):
    ws=sorted(doc[i].get_text('words'),key=lambda x:(round(x[1]),x[0])); ws=[x[4] for x in ws if 60<x[1]<760]
    return N(''.join(ws))
def ol(i): return N(''.join(x for _,x in sorted(ours[i]['words'],key=lambda a:a[0])))
n=min(len(doc),len(ours)); bad=[]; lens=[]
for i in range(n):
    w,o=wl(i),ol(i)
    ok_first=w[:12]==o[:12]; ok_last=w[-12:]==o[-12:]
    if not(ok_first and ok_last): bad.append((i+1,ok_first,ok_last,len(w),len(o)))
print(case,'word',len(doc),'ours',len(ours),'pages with matching first&last 12 chars:',n-len(bad),'/',n)
print('first mismatching:',bad[:25])
