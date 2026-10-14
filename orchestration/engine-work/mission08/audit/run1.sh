#!/bin/bash
# usage: run1.sh fixture.json outPrefix
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
export PLAYWRIGHT_MODULE="C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright" THESIS_BROWSER_EXECUTABLE="C:/Program Files/Google/Chrome/Application/chrome.exe"
timeout 150 node orchestration/tools/export.mjs "$1" "$2" 2>&1 | tail -2
