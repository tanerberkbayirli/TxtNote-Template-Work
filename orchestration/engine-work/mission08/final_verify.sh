#!/bin/sh
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
export PLAYWRIGHT_MODULE=C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright
O=orchestration/engine-work/mission08/final
mkdir -p $O
(cd TxtNote/frontend && npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)") > $O/unit.txt
for i in 1 2 3 4 5; do node orchestration/tools/check.mjs --target aku-sbe --out $O/sbe$i 2>&1 | grep -E "^aku-sbe|rror" | cut -c1-160 >> $O/sbe.txt; done
node orchestration/tools/check.mjs --all --out $O/all --manifest $O/all.json > $O/all.log 2>&1
node orchestration/tools/check.mjs --all --targets engine-word-justify,engine-word-pagefit,engine-word-parity,engine-word-structure,engine-word-style-precedence,phase52-justify --word --out $O/word --manifest $O/word.json > $O/word.log 2>&1
echo DONE > $O/done.txt
