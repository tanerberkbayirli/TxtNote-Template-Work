import fitz,json,sys,re
n=int(sys.argv[1]); lines=json.load(open(f'orchestration/engine-work/final-closure/long/g1/lines-{sys.argv[2]}.json',encoding='utf8'))[str(n)]['lines']
d=fitz.open('orchestration/engine-work/mission01/references/SRC09/word.pdf'); p=d[n-1]
W=[]
for b in p.get_text('dict')['blocks']:
    for l in b.get('lines',[]):
        t=''.join(s['text'] for s in l['spans']).strip()
        if t and 60<l['bbox'][1]<770: W.append((round(l['bbox'][1],1),t[:28]))
W.sort()
print('imgs',[[round(x) for x in i['bbox']] for i in p.get_image_info()])
N=lambda s:re.sub(r'[\W_]+','',s.lower())[:8]
for w in W:
    m=[l for l in lines if N(l['text'])==N(w[1]) and N(w[1])]
    print(w, '| ours', (m[0]['top'], round(w[0]-m[0]['top'],1)) if m else '-')
