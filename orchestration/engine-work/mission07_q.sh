#!/bin/sh
# usage: mission07_q.sh '<js>'  (short wait)
rm -f orchestration/engine-work/mission07/result.json; printf '%s' "$1" > orchestration/engine-work/mission07/cmd.js
for i in $(seq 1 100); do [ -f orchestration/engine-work/mission07/result.json ] && break; sleep 1; done; cat orchestration/engine-work/mission07/result.json
