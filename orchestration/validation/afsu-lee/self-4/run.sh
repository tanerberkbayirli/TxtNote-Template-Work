#!/bin/bash
# usage: run.sh master|phd   (real export of the fixture; PLAYWRIGHT env as in worker brief)
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
export PLAYWRIGHT_MODULE="C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright" THESIS_BROWSER_EXECUTABLE="C:/Program Files/Google/Chrome/Application/chrome.exe"
S=orchestration/validation/afsu-lee/self-4
timeout 600 node orchestration/tools/export.mjs $S/$1-fixture.json $S/$1 2>&1 | tail -2
