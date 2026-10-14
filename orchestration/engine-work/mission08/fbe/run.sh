cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
for v in base title40 title120 title250; do f=orchestration/engine-work/mission08/fbe/master-${v/title/title}.json; [ $v = base ] && f=orchestration/engine-work/mission08/fbe/master-base.json
 bash orchestration/engine-work/mission08/audit/run1.sh $f orchestration/engine-work/mission08/fbe/o-$v >/dev/null 2>&1 &
done; wait
python -X utf8 - <<'P'
import pymupdf
for v in ('base','title40','title120','title250'):
    d=pymupdf.open(f'orchestration/engine-work/mission08/fbe/o-{v}.pdf'); out=[]
    for i in range(8):
        t=d[i].get_text().strip().replace('\n',' | ')[:50]; out.append(f'{i+1}:{t}')
    print(v,len(d)); print('   ','\n    '.join(out))
P
