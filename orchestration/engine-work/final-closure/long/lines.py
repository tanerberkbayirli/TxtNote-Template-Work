import json,sys,pymupdf
sys.stdout.reconfigure(encoding='utf-8')
id=sys.argv[1];wp=int(sys.argv[2]);ops=[int(x) for x in sys.argv[3].split(',')]
ours=json.load(open(f'orchestration/engine-work/final-closure/long/{id}.pages.json',encoding='utf8'))
doc=pymupdf.open(f'orchestration/engine-work/mission01/references/{id}/word.pdf')
print('WORD page',wp, doc[wp-1].rect)
ln={}
for w in doc[wp-1].get_text('words'): ln.setdefault(round(w[1]/2)*2,[]).append(w)
for y in sorted(ln): print(' %6.1fpt'%(y*1.0), ' '.join(x[4] for x in sorted(ln[y]))[:90])
for o in ops:
    print('OURS page',o)
    ln={}
    for y,w in ours[o-1]['words']: ln.setdefault(round(y/2)*2,[]).append(w)
    for y in sorted(ln): print(' %6.1fpx'%y, ' '.join(ln[y])[:90])

