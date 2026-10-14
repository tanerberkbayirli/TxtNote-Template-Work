import json,sys,fitz
id,dirn,wp,op=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
ours=json.load(open(f'{dirn}/{id}.pages.json',encoding='utf8'))
doc=fitz.open(f'../../mission01/references/{id}/word.pdf')
print('WORD',wp)
pg=doc[wp-1]
lines={}
for w in pg.get_text('words'):
    lines.setdefault(round(w[1]/2),[]).append(w)
for k in sorted(lines)[:200]:
    ws=sorted(lines[k],key=lambda w:w[0]);print(round(ws[0][1],1),' '.join(w[4] for w in ws)[:110])
print('OURS',op)
ls={}
for y,w in ours[op-1]['words']: ls.setdefault(round(y/2),[]).append(w)
for k in sorted(ls): print(k*2,' '.join(ls[k])[:110])
