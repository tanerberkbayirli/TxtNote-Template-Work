import json,fitz
order=json.load(open('exp/eqprobe2.order.json'))
d=fitz.open('exp/eqprobe2.word.pdf')
ys={}
for pg in d:
    for w in pg.get_text('words'):
        if w[4].startswith('MARK'): ys[w[4]]=(w[1],w[3])
m=[ys[f'MARK{i}'][0] for i in range(0,len(order)+1)]
print('Word marker y0 diffs (pitch MARK i-1 -> i = 20.7 + H_eq):')
for (name,line,k) in order:
    print(name,line,'H_eq=',round(m[k]-m[k-1]-20.7,1))
o=json.load(open('eq/EQ_PROBE.pages.json',encoding='utf8'))
import sys
