#!/usr/bin/env bash
# Start/stop the TxtNote frontend Vite dev server used by export.mjs (port 5175).
# usage: engine/tools/devserver.sh start|stop|restart
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PIDFILE="${TMPDIR:-/tmp}/txtnote-vite.pid"
LOG="${TMPDIR:-/tmp}/txtnote-vite.log"
# Stops only the server this script started (its PID file) and that process's children (esbuild); other vite
# servers on the machine keep running (HE-TS-06).
stop() {
  [ -f "$PIDFILE" ] || return 0
  pid="$(cat "$PIDFILE")"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    pkill -P "$pid" 2>/dev/null
    kill "$pid" 2>/dev/null
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.25; done
  fi
  rm -f "$PIDFILE"
}
start() {
  cd "$ROOT/TxtNote/frontend" && nohup node node_modules/vite/bin/vite.js --port 5175 --strictPort --host 127.0.0.1 > "$LOG" 2>&1 &
  echo $! > "$PIDFILE"
  for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:5175/" && { echo "vite up (pid $(cat "$PIDFILE"))"; return 0; }; sleep 0.5; done
  echo "vite failed to start"; cat "$LOG"; return 1
}
case "${1:-start}" in start) start;; stop) stop;; restart) stop; sleep 1; start;; esac
