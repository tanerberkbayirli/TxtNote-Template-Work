#!/usr/bin/env bash
# Start/stop the TxtNote frontend Vite dev server used by export.mjs (port 5175).
# usage: orchestration/tools/devserver.sh start|stop|restart
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PIDFILE="${TMPDIR:-/tmp}/txtnote-vite.pid"
LOG="${TMPDIR:-/tmp}/txtnote-vite.log"
stop() { [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null; rm -f "$PIDFILE"; for p in $(ps -eo pid,comm,args | awk '$2=="node" && /vite/ {print $1}'); do kill "$p" 2>/dev/null; done; }
start() {
  cd "$ROOT/TxtNote/frontend" && nohup node node_modules/.bin/vite --port 5175 --strictPort --host 127.0.0.1 > "$LOG" 2>&1 &
  echo $! > "$PIDFILE"
  for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:5175/" && { echo "vite up (pid $(cat "$PIDFILE"))"; return 0; }; sleep 0.5; done
  echo "vite failed to start"; cat "$LOG"; return 1
}
case "${1:-start}" in start) start;; stop) stop;; restart) stop; sleep 1; start;; esac
