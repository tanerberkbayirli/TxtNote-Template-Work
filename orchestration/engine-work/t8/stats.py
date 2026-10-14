import re,sys
import sys
ID=sys.argv[1] if len(sys.argv)>1 else 'SRC09'
L=open(f'orchestration/engine-work/t8/compare_{ID}.txt',encoding='utf8').read().split('=== ours->word')[1].splitlines()
seq=[]
for l in L:
    m=re.match(r'(\d+) -> word (\d+) off (\d+) len (\d+) wordlen (\d+)',l)
    if m: seq.append(tuple(map(int,m.groups())))
al={s[1] for s in seq if s[2]<=3}
print('word pages start-aligned with an editor page:',len(al),'/ 180 (non-blank word pages ~',90,')')
print('aligned word pages:',sorted(al))
