#!/bin/bash
# usage: run.sh SRC10|SRC09 outdir
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
export PYTHONUTF8=1 THESIS_BASE_URL=http://localhost:5223 LONG_FIXTURE_ID=${1}_ACTIVE LONG_MEASURE_OUT=orchestration/engine-work/final-closure/src09-active/src10-agent/$2
node orchestration/engine-work/final-closure/src09-active/src10-agent/measure.mjs $1 2>&1 | tail -1 | cut -c1-200
python orchestration/engine-work/final-closure/long/compare-breaks.py $1 $LONG_MEASURE_OUT $LONG_MEASURE_OUT/cmp.json 2>&1 | tail -1
python -c "
import json;d=json.load(open('$LONG_MEASURE_OUT/cmp.json'));print([ (r['wordPage'],r['editorPage']) for r in d['firstMisaligned']])"
