#!/bin/sh
# reload the long fixture, wait until paginated, extract pages and compare to Word
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
rm -f orchestration/engine-work/mission07/result.json; printf 'setTimeout(()=>location.reload(),50);1' > orchestration/engine-work/mission07/cmd.js
sleep 30
i=0; while [ $i -lt 120 ]; do rm -f orchestration/engine-work/mission07/result.json; printf '%s' "document.querySelector('[aria-label=\"Belge sayfaları\"]')?.dataset.thesisPaginationReady==='true'&&document.querySelectorAll('.thesis-sheet').length" > orchestration/engine-work/mission07/cmd.js
 j=0; while [ ! -f orchestration/engine-work/mission07/result.json ] && [ $j -lt 40 ]; do sleep 1; j=$((j+1)); done
 if grep -q '"v":[1-9]' orchestration/engine-work/mission07/result.json 2>/dev/null; then break; fi; sleep 5; i=$((i+1)); done
python orchestration/engine-work/mission07_extract.py && python -X utf8 orchestration/engine-work/mission07_compare.py > orchestration/engine-work/mission07/compare.txt 2>&1; head -3 orchestration/engine-work/mission07/compare.txt
