#!/bin/bash
# usage: run.sh <label>   (full SRC09 measure + compare)
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
A=orchestration/engine-work/final-closure/src09-active/ek2-agent
L=$1; mkdir -p $A/$L
THESIS_BASE_URL=http://127.0.0.1:5221 LONG_FIXTURE_ID=SRC09_EK2 LONG_MEASURE_OUT=$A/$L node $A/measure.mjs SRC09 | tail -c 600
python orchestration/engine-work/final-closure/long/compare-breaks.py SRC09 $A/$L $A/$L/cmp09.json
