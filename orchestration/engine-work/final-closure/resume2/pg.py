import fitz,sys
f,pn=sys.argv[1],int(sys.argv[2])
d=fitz.open(f);p=d[pn-1]
print('page',p.rect)
for b in p.get_text('dict')['blocks']:
  if 'lines' not in b: continue
  for l in b['lines']:
    s=l['spans']
    print(round(s[0]['origin'][1],2),round(l['bbox'][0],1),round(s[0]['size'],1),''.join(x['text'] for x in s)[:70])
for dr in p.get_drawings():
  print('DRAW',[round(v,1) for v in dr['rect']])
