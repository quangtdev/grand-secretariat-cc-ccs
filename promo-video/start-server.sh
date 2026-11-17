#!/usr/bin/env bash
# Isolated dev server for recording: own port, own state, fake agents. Never touches the installed app.
K="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$K/.."
exec env NODE_ENV=development GRAND_SECRETARIAT_PORT=4791 GRAND_SECRETARIAT_STATE_DIR="$K/state" GRAND_SECRETARIAT_ROOT="$K/repos" \
  GRAND_SECRETARIAT_LAUNCHER="$K/fake-agent-launcher.js" GRAND_SECRETARIAT_PROFILES= GRAND_SECRETARIAT_FLAGS= node server/index.js
