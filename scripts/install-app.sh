#!/usr/bin/env bash
# Install Grand Secretariat as a desktop app on Ubuntu:
#   - builds the UI (dist/)
#   - a systemd user service that starts the server at login and restarts it if it crashes
#   - an app-menu launcher (.desktop) that opens the court in its own browser window
# Re-run any time: it overwrites its own files and restarts the service.
# Remove with: scripts/install-app.sh --uninstall
set -euo pipefail

APP=grand-secretariat
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_DIR="$HOME/.config/systemd/user"
UNIT_FILE="$UNIT_DIR/$APP.service"
ENV_DIR="$HOME/.config/$APP"
DESKTOP_FILE="$HOME/.local/share/applications/$APP.desktop"
ICON_FILE="$HOME/.local/share/icons/hicolor/scalable/apps/$APP.svg"
# The installed app gets its own port so `npm run dev` (4777) can still run beside it,
# and its own local name. Names ending in .localhost resolve to this machine on their own
# (browsers, curl, systemd-resolved), so /etc/hosts is not touched.
APP_PORT=4780
APP_HOSTNAME="$APP.localhost"
HOSTS_TAG="# $APP"

if [[ "${1:-}" == "--uninstall" ]]; then
  systemctl --user disable --now "$APP" 2>/dev/null || true
  rm -f "$UNIT_FILE" "$DESKTOP_FILE" "$ICON_FILE"
  if grep -q " $HOSTS_TAG\$" /etc/hosts; then  # written by older versions of this script
    echo "==> Removing our entry from /etc/hosts (sudo)"
    sudo sed -i "/ $HOSTS_TAG\$/d" /etc/hosts
  fi
  systemctl --user daemon-reload
  echo "Removed service and launcher. State (~/.local/state/$APP) and $ENV_DIR were kept."
  exit 0
fi

# systemd does not read .zshrc, so pin the absolute node path and this shell's PATH
# (minus npm's per-project node_modules/.bin entries) so agents find claude (or ccs), git, curl, cargo...
NODE_BIN="$(command -v node)" || { echo "node not found on PATH" >&2; exit 1; }
# Agents start with plain `claude`, or with the `ccs` account switcher when it is installed.
command -v claude >/dev/null || command -v ccs >/dev/null || { echo "claude not found on PATH (install Claude Code first)" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl not found on PATH" >&2; exit 1; }
CLEAN_PATH="$(tr ':' '\n' <<<"$PATH" | grep -v -e 'node_modules/\.bin' -e 'node-gyp-bin' | awk '!seen[$0]++' | paste -sd:)"

echo "==> Installing dependencies and building UI"
cd "$REPO"
npm ci
touch node_modules/.package-lock.installed  # lets update-app.sh skip npm ci until the lock changes
npm run build

echo "==> Writing $UNIT_FILE"
mkdir -p "$UNIT_DIR" "$ENV_DIR"
[[ -f "$ENV_DIR/env" ]] || cat >"$ENV_DIR/env" <<'EOF'
# Overrides for Grand Secretariat (see README "Configuration"). Restart the service after editing.
# GRAND_SECRETARIAT_ROOT=/home/you/workspaces
# GRAND_SECRETARIAT_FOLDERS=notes,/home/you/scratch
# GRAND_SECRETARIAT_LAUNCHER=claude
EOF
# Add port/hostname only if not set yet, so manual edits survive a re-install.
grep -q '^GRAND_SECRETARIAT_PORT=' "$ENV_DIR/env" || echo "GRAND_SECRETARIAT_PORT=$APP_PORT" >>"$ENV_DIR/env"
grep -q '^GRAND_SECRETARIAT_HOSTNAME=' "$ENV_DIR/env" || echo "GRAND_SECRETARIAT_HOSTNAME=$APP_HOSTNAME" >>"$ENV_DIR/env"
APP_PORT="$(sed -n 's/^GRAND_SECRETARIAT_PORT=//p' "$ENV_DIR/env" | tail -n1)"
APP_HOSTNAME="$(sed -n 's/^GRAND_SECRETARIAT_HOSTNAME=//p' "$ENV_DIR/env" | tail -n1)"

cat >"$UNIT_FILE" <<EOF
[Unit]
Description=Grand Secretariat (Claude Code agent court)
After=network.target

[Service]
Type=simple
WorkingDirectory=$REPO
Environment=NODE_ENV=production
Environment=PATH=$CLEAN_PATH
EnvironmentFile=-$ENV_DIR/env
ExecStart=$NODE_BIN $REPO/server/index.js
# SIGTERM to the server first so it saves agent state, then the rest of the group.
KillMode=mixed
TimeoutStopSec=15
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

echo "==> Writing launcher and icon"
mkdir -p "$(dirname "$DESKTOP_FILE")" "$(dirname "$ICON_FILE")"
cp "$REPO/scripts/grand-secretariat-icon.svg" "$ICON_FILE"
cat >"$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Grand Secretariat
Comment=Summon and watch Claude Code agents in the court of Hue
Exec=$REPO/scripts/open-app.sh
Icon=$APP
Terminal=false
Categories=Development;
StartupNotify=true
StartupWMClass=$APP
EOF
chmod +x "$REPO/scripts/open-app.sh" "$REPO/scripts/update-app.sh"
update-desktop-database "$(dirname "$DESKTOP_FILE")" 2>/dev/null || true

echo "==> Enabling and (re)starting service"
systemctl --user daemon-reload
systemctl --user enable "$APP" >/dev/null
systemctl --user restart "$APP"
sleep 1
systemctl --user --no-pager --lines=5 status "$APP" || true

echo
echo "Done. Open 'Grand Secretariat' from the app menu, or http://$APP_HOSTNAME:$APP_PORT"
echo "Logs:   journalctl --user -u $APP -f"
echo "Update: npm run update"
