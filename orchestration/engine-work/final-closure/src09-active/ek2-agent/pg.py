import json,sys,fitz
d=sys.argv[1]
ours=json.load(open(f'orchestration/engine-work/final-closure/src09-active/ek2-agent/{d}/SRC09.pages.json',encoding='utf8'))
w=fitz.open('orchestration/engine-work/mission01/references/SRC09/word.pdf')
for p in map(int,sys.argv[2:]):
    e=' '.join(x for _,x in sorted(ours[p-1]['words'],key=lambda i:i[0]))
    wt=' '.join(x[4] for x in w[p-1].get_text('words',sort=True) if 58<x[1]<790)
    print('EDITOR',p,len(e.split())); print('  H:',e[:160]); print('  T:',e[-160:])
    print('WORD',p,len(wt.split())); print('  H:',wt[:160]); print('  T:',wt[-160:])
