#!/bin/bash
# usage: cycle.sh <SRC id> <tag>
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
id=$1; tag=$2; out=orchestration/engine-work/final-closure/long/s09-work/$tag; mkdir -p $out
THESIS_BASE_URL=http://127.0.0.1:5210 LONG_MEASURE_OUT=$out timeout 580 node orchestration/engine-work/final-closure/long/measure.mjs $id 2>&1 | tail -c 300
python -I orchestration/engine-work/final-closure/long/compare-breaks.py $id $out $out/cmp.json >/dev/null 2>&1
python -I - <<P
import json
d=json.load(open('$out/cmp.json'))
print({k:d[k] for k in ('wordPages','editorPages','textCoverage','openingsChecked','misalignedOpenings')})
print([(m['wordPage'],m['offsetTokens']) for m in d['firstMisaligned']])
P
