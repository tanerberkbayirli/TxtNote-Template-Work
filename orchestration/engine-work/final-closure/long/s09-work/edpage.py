import json,sys
d,pn0,pn1=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
mode=sys.argv[4] if len(sys.argv)>4 else 'full'
ed=json.load(open(f'{d}/SRC09.pages.json',encoding='utf8'))
for pn in range(pn0,pn1+1):
    seen=[]
    for y,t in ed[pn-1]['words']:
        if seen and abs(seen[-1][0]-y)<3: seen[-1][1]+=' '+t
        else: seen.append([round(y/1.01197,1),t])
    print('--- ED',pn,len(seen),'lines')
    sel=seen if mode=='full' else seen[:4]+['..']+seen[-4:]
    for l in sel: print(l if l=='..' else f'{l[0]:>4} {l[1][:60]}')
