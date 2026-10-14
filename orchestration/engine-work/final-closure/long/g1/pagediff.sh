#!/bin/bash
# usage: pagediff.sh name from to
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
ID=${4:-SRC09}; node orchestration/engine-work/final-closure/long/g1/lines.mjs $ID $2 $1 $3 >/dev/null && python - "$1" "$2" "$3" "$ID" <<'PY'
import fitz,json,re,sys
name,a,b,ID=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
d=fitz.open(f'orchestration/engine-work/mission01/references/{ID}/word.pdf')
lines=json.load(open(f'orchestration/engine-work/final-closure/long/g1/lines-{name}.json',encoding='utf8'))
N=lambda s:re.sub(r'[\W_]+','',s.lower())[:7]
for n in range(a,b+1):
    L=lines[str(n)]['lines']; p=d[n-1]; out=[]
    for bl in p.get_text('dict')['blocks']:
        for l in bl.get('lines',[]):
            t=''.join(s['text'] for s in l['spans']).strip()
            if len(N(t))>=5 and 60<l['bbox'][1]<770:
                m=[x for x in L if N(x['text'])==N(t)]
                if m: out.append((round(l['bbox'][1],1),round(l['bbox'][1]-m[0]['top'],1)))
    out.sort()
    print(n,'n=',len(L),[o[1] for o in out][:24])
PY
