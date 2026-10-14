import json,sys,fitz,re
case,src,a,b=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
ours=json.load(open(src,encoding='utf8'))
doc=fitz.open(f'orchestration/engine-work/mission01/references/{case}/word.pdf')
N=lambda s:re.sub(r'[\W_]+','',s.lower())
def wl(i):
    ws=sorted(doc[i].get_text('words'),key=lambda x:(round(x[1]),x[0])); ws=[x[4] for x in ws if 60<x[1]<760]
    return N(''.join(ws))
def ol(i):
    return N(''.join(x for _,x in sorted(ours[i]['words'],key=lambda a:a[0])))
for i in range(a-1,b):
    w=wl(i);o=ol(i) if i<len(ours) else ''
    print(i+1,'first',w[:14]==o[:14],'last',w[-14:]==o[-14:],'len',len(w),len(o),'| W',w[:14],w[-14:],'| O',o[:14],o[-14:])
