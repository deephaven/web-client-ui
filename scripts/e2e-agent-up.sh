#!/usr/bin/env bash
# Starts the core server and the dev app for local e2e runs. Every step has a hard time limit so a
# hang is reported as a named failure instead of consuming a whole agent session. The last line
# printed is always READY or FAILED <step>.
set -u
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f tests/docker-scripts/docker-compose.yml -f tests/docker-scripts/docker-compose.agent.yml)
APP_LOG=/tmp/e2e-app.log

log() { echo "[$(date +%T)] $*"; }

bounded() {
  local seconds=$1
  shift
  if command -v timeout >/dev/null 2>&1; then timeout "$seconds" "$@"; else "$@"; fi
}

fail() {
  log "$2"
  echo "FAILED $1"
  exit 1
}

log "docker: checking the daemon"
bounded 20 docker info >/dev/null 2>&1 || fail docker "docker is not usable here (docker info failed or timed out)"

IMAGE=$("${COMPOSE[@]}" config --images 2>/dev/null | grep 'deephaven/server' | head -1)
if [ -n "$IMAGE" ] && docker image inspect "$IMAGE" >/dev/null 2>&1; then
  log "server: $IMAGE is already present, skipping the pull"
else
  log "server: pulling the core server image (limit 300s)"
  bounded 300 "${COMPOSE[@]}" pull dhc-server || fail pull "image is not present and the pull failed or timed out; setup normally pre-pulls it, and the agent's firewall likely blocks ghcr.io"
fi

log "server: starting and waiting for healthy (limit 240s)"
if ! bounded 240 "${COMPOSE[@]}" up -d --wait --pull never dhc-server; then
  "${COMPOSE[@]}" logs --tail 40 dhc-server 2>&1 | sed 's/^/    /'
  fail server "core server did not become healthy"
fi

log "app: starting the dev server (limit 180s)"
(VITE_PLAYWRIGHT_CSS=1 nohup npm run start:app >"$APP_LOG" 2>&1 &)
for _ in $(seq 1 90); do
  if curl -fsS -o /dev/null http://localhost:4000/ide/ 2>/dev/null; then
    log "ready: core server on :10000, app on :4000/ide/"
    echo READY
    exit 0
  fi
  sleep 2
done
tail -20 "$APP_LOG" | sed 's/^/    /'
fail app "dev server did not answer on :4000/ide/ (last log lines above)"
