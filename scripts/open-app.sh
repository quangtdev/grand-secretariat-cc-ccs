#!/usr/bin/env bash
# Launcher used by the .desktop entry: make sure the service is up, then open the
# court in a chromeless app window (Edge/Chrome/Chromium/Brave), else the default browser.
set -uo pipefail

APP=grand-secretariat
ENV_FILE="$HOME/.config/$APP/env"
PORT="$(sed -n 's/^GRAND_SECRETARIAT_PORT=//p' "$ENV_FILE" 2>/dev/null | tail -n1)"
NAME="$(sed -n 's/^GRAND_SECRETARIAT_HOSTNAME=//p' "$ENV_FILE" 2>/dev/null | tail -n1)"
URL="http://${NAME:-127.0.0.1}:${PORT:-4777}"

systemctl --user start "$APP"
# Wait up to ~10s for the server to answer.
for _ in $(seq 1 40); do
  curl -s -o /dev/null "$URL" && break
  sleep 0.25
done

# The app gets its own browser profile, so it runs as its own browser process.
# --class only applies to the process that starts first: without a separate
# profile, an Edge started by this launcher tags every later Edge window
# (normal tabs too) as Grand Secretariat, and the dock groups them under its icon.
PROFILE_DIR="$HOME/.local/share/$APP/browser-profile"
mkdir -p "$PROFILE_DIR"

# On Wayland the browser ignores --class and names its window itself (an app_id such as
# msedge-<host>__-Default), so the dock cannot match it to this launcher's StartupWMClass
# and shows it under a generic icon. Running this one app window through XWayland makes
# --class the window's WM_CLASS again. Only this profile's process is affected.
OZONE=()
[ "${XDG_SESSION_TYPE:-}" = wayland ] && OZONE=(--ozone-platform=x11)

for browser in microsoft-edge google-chrome chromium chromium-browser brave-browser; do
  if command -v "$browser" >/dev/null; then
    exec "$browser" "${OZONE[@]}" --app="$URL" --class="$APP" --user-data-dir="$PROFILE_DIR" \
      --no-first-run --no-default-browser-check
  fi
done
exec xdg-open "$URL"
