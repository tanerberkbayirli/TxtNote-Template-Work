#!/bin/sh
# usage: mission07_run.sh '<js expression>'  -> evaluates in the long-fixture page
rm -f orchestration/engine-work/mission07/result.json
printf '%s' "$1" > orchestration/engine-work/mission07/cmd.js
i=0; while [ ! -f orchestration/engine-work/mission07/result.json ] && [ $i -lt 600 ]; do sleep 0.5; i=$((i+1)); done
cat orchestration/engine-work/mission07/result.json
