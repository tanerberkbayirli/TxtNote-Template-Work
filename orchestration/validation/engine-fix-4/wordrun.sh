#!/bin/bash
cd "$(dirname "$0")"; mode=$1; shift
powershell -NoProfile -ExecutionPolicy Bypass -File word.ps1 -mode $mode -names "$(IFS=,; echo "$*")" 2>&1 | grep -v "^$"
