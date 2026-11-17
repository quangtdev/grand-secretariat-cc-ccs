#!/usr/bin/env bash
# Apply a new version: install deps if the lock file changed, rebuild the UI, restart the service.
# Restarting stops running agents; they reopen with --resume, but a turn in progress is cut.
# Pass --pull to `git pull` first.
set -euo pipefail

APP="${GRAND_SECRETARIAT_SERVICE:-grand-secretariat}"  # the server passes its own unit name
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$REPO/node_modules/.package-lock.installed"
cd "$REPO"

[[ "${1:-}" == "--pull" ]] && git pull --ff-only

# npm ci only when package-lock.json is newer than the last install (or node_modules is missing).
if [[ ! -f "$STAMP" || package-lock.json -nt "$STAMP" ]]; then
  echo "==> Dependencies changed: npm ci"
  npm ci
  touch "$STAMP"
fi

echo "==> Building UI"
npm run build

echo "==> Restarting service"
systemctl --user restart "$APP"
sleep 1
systemctl --user is-active --quiet "$APP" \
  && echo "Service is running. Reload the app window (Ctrl+R)." \
  || { echo "Service failed to start, see: journalctl --user -u $APP -n 50" >&2; exit 1; }
