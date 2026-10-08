#!/bin/bash
# usage: run.sh before|after [names...]
cd "$(dirname "$0")"
export PLAYWRIGHT_MODULE="C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright" THESIS_BROWSER_EXECUTABLE="C:/Program Files/Google/Chrome/Application/chrome.exe"
mode=$1; shift
while read name fx; do
  if [ $# -gt 0 ] && [[ ! " $* " =~ " $name " ]]; then continue; fi
  node ../../tools/export.mjs $fx $mode/$name > $mode/$name.log 2>&1
  python dumplines.py $mode/$name.pdf $mode/$name.txt 2>/dev/null
  echo "done $name"
done < fixtures.txt
