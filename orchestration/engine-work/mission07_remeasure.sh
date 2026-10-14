#!/bin/sh
# usage: mission07_remeasure.sh SRC10   (reload the session page, wait, extract, compare, stats)
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
ID=$1; WAIT=${2:-50}
printf 'setTimeout(()=>location.reload(),50);1' > orchestration/engine-work/mission07/cmd.js
sleep $WAIT
i=0
while [ $i -lt 200 ]; do
  rm -f orchestration/engine-work/mission07/result.json; cp orchestration/engine-work/mission07/extract.js orchestration/engine-work/mission07/cmd.js
  j=0; while [ ! -f orchestration/engine-work/mission07/result.json ] && [ $j -lt 120 ]; do sleep 1; j=$((j+1)); done
  if grep -q '"v":\[' orchestration/engine-work/mission07/result.json 2>/dev/null; then break; fi
  sleep 10; i=$((i+1))
done
python - "$ID" <<'P'
import json,sys
r=json.load(open('orchestration/engine-work/mission07/result.json',encoding='utf8'))
json.dump(r['v'],open(f'orchestration/engine-work/mission07/{sys.argv[1]}.pages.json','w',encoding='utf8'));print('sheets',len(r['v']))
P
python -X utf8 orchestration/engine-work/mission07_compare.py $ID > orchestration/engine-work/mission07/compare_$ID.txt 2>&1
python -X utf8 orchestration/engine-work/mission07_stats.py $ID | head -1
