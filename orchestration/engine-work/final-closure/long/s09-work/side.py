import json,sys,fitz
d,pn=sys.argv[1],int(sys.argv[2]); lo=float(sys.argv[3]) if len(sys.argv)>3 else 0
W=fitz.open('orchestration/engine-work/mission01/references/'+__import__('os').environ.get('SRC','SRC09')+'/word.pdf')
ed=json.load(open(d+'/'+__import__('os').environ.get('SRC','SRC09')+'.pages.json',encoding='utf8'))
wl=[]
for bl in W[pn-1].get_text('dict')['blocks']:
    if bl['type']==0:
        for l in bl['lines']:
            t=''.join(s['text'] for s in l['spans']).strip()
            if t and l['bbox'][1]<762: wl.append((round(l['bbox'][1],1),t[:34]))
wl.sort()
seen=[]
for y,t in ed[pn-1]['words']:
    if seen and abs(seen[-1][0]-y)<3: seen[-1][1]+=' '+t
    else: seen.append([y,t])
ee=[(round(y/1.01197,1),t[:34]) for y,t in seen]
wl=[x for x in wl if x[0]>=lo];ee=[x for x in ee if x[0]>=lo]
if len(sys.argv)>4: wl=wl[:int(sys.argv[4])] if sys.argv[5]=="head" else wl[-int(sys.argv[4]):]; ee=ee[:int(sys.argv[4])] if sys.argv[5]=="head" else ee[-int(sys.argv[4]):]
for i in range(max(len(wl),len(ee))):
    a=wl[i] if i<len(wl) else ('','');b=ee[i] if i<len(ee) else ('','')
    print(f'{a[0]:>7} {a[1]:<36}| {b[0]:>7} {b[1]}')
