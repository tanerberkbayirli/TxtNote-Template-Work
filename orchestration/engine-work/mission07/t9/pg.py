import json,sys,fitz
id=sys.argv[1]; wp=[int(x) for x in sys.argv[2].split(',')]; op=[int(x) for x in sys.argv[3].split(',')]
doc=fitz.open(f'orchestration/engine-work/mission01/references/{id}/word.pdf')
for p in wp:
    ws=sorted(doc[p-1].get_text('words'),key=lambda w:(round(w[1]),w[0]))
    print('WORD',p,len(ws),'rot',doc[p-1].rotation,doc[p-1].rect, 'ys',sorted({round(w[1]) for w in ws})[:80])
    print('  ',' '.join(w[4] for w in ws)[:400])
ours=json.load(open(f'orchestration/engine-work/mission07/t9/{id}.pages.json',encoding='utf8'))
for p in op:
    ws=sorted(ours[p-1]['words'],key=lambda a:a[0])
    print('OURS',p,len(ws),'ys',sorted({round(y*0.75) for y,_ in ws})[:80])
    print('  ',' '.join(w for _,w in ws)[:400])
