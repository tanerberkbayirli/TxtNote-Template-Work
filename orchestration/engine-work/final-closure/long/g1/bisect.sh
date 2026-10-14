#!/bin/bash
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
mkdir -p orchestration/engine-work/final-closure/long/bis
for f in "" F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 "F1,F2,F3,F4,F5,F6,F7,F8,F9,F10"; do
  tag=${f:-none}; tag=${tag//,/_}
  TXT_OFF=$f THESIS_BASE_URL=http://127.0.0.1:5190 LONG_MEASURE_OUT=orchestration/engine-work/final-closure/long/bis/$tag timeout 590 node orchestration/engine-work/final-closure/long/measure.mjs SRC09 > /dev/null 2>&1
  echo "== off=$f" >> orchestration/engine-work/final-closure/long/bis/results.txt
  python orchestration/engine-work/final-closure/long/verify_pages.py orchestration/engine-work/mission01/references/SRC09/word.pdf orchestration/engine-work/final-closure/long/bis/$tag/SRC09.pages.json "off=$f" 2>/dev/null | sed -n 1,3p >> orchestration/engine-work/final-closure/long/bis/results.txt
done
echo FINISHED >> orchestration/engine-work/final-closure/long/bis/results.txt
