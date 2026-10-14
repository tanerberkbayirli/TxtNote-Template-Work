import json,sys,fitz
case,src,a,b=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
ours=json.load(open(src,encoding='utf8'))
doc=fitz.open(f'orchestration/engine-work/mission01/references/{case}/word.pdf')
def w(i):
    p=doc[i]; ws=sorted(p.get_text('words'),key=lambda x:(round(x[1]),x[0]))
    ws=[x for x in ws if x[1]<760 and x[1]>60]
    return ' '.join(x[4] for x in ws[:7]),' '.join(x[4] for x in ws[-5:])
def o(i):
    ws=[x for _,x in sorted(ours[i]['words'],key=lambda a:a[0])]
    return ' '.join(ws[:7]),' '.join(ws[-5:])
for i in range(a-1,b):
    W=w(i);O=o(i) if i<len(ours) else ('','')
    print(i+1,'W:',W[0][:50],'..',W[1][-30:]);print('   O:',O[0][:50],'..',O[1][-30:])
