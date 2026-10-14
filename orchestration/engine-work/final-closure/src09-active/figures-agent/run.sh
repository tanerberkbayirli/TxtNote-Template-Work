#!/bin/bash
# usage: run.sh <name> <fixtureId> <SRCid> [shots]   (copy Vite on 5222, no overlay patches)
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
F=orchestration/engine-work/final-closure/src09-active/figures-agent
mkdir -p $F/$1
THESIS_BASE_URL=http://127.0.0.1:5222 LONG_FIXTURE_ID=$2 LONG_MEASURE_OUT=$F/$1 SHOT=${4:-$SHOT} node $F/measure.mjs $3 | tail -1
python orchestration/engine-work/final-closure/long/compare-breaks.py $3 $F/$1 $F/$1/cmp.json 2>&1 | grep -v warning
