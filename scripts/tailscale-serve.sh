#!/usr/bin/env bash
# Open the installed app to your own other devices over Tailscale:
#   - the server keeps listening on 127.0.0.1 only; `tailscale serve` proxies the tailnet to it
#   - only your Tailscale login is let in (other tailnet users and shared devices get 403)
# Result: http://<this-machine>.<tailnet>.ts.net:<port> from any device signed in as you.
# Restarting the service stops running agents; they reopen with --resume, but a turn in progress is cut.
# Turn off with: scripts/tailscale-serve.sh --off
set -euo pipefail

APP="${GRAND_SECRETARIAT_SERVICE:-grand-secretariat}"
ENV_FILE="$HOME/.config/grand-secretariat/env"
[[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE not found: run scripts/install-app.sh first" >&2; exit 1; }
command -v tailscale >/dev/null || { echo "tailscale not found on PATH" >&2; exit 1; }
PORT="$(sed -n 's/^GRAND_SECRETARIAT_PORT=//p' "$ENV_FILE" | tail -n1)"
PORT="${PORT:-4777}"

# Drops our settings from the env file, then appends the given lines (if any).
write_env() {
  sed -i '/^GRAND_SECRETARIAT_TAILNET_[A-Z]*=/d' "$ENV_FILE"
  [[ -z "$(tail -c1 "$ENV_FILE")" ]] || echo >>"$ENV_FILE"  # a hand-edited file may lack the last newline
  for line in "$@"; do echo "$line" >>"$ENV_FILE"; done
}

restart_service() {
  echo "==> Restarting service"
  systemctl --user restart "$APP"
  sleep 1
  systemctl --user is-active --quiet "$APP" \
    || { echo "Service failed to start, see: journalctl --user -u $APP -n 50" >&2; exit 1; }
}

# Removing a handler that does not exist fails: that is fine.
serve_off() {
  tailscale serve --http="$PORT" off >/dev/null 2>&1 || true
  tailscale serve --https="$PORT" off >/dev/null 2>&1 || true
}
serve_is_on() { tailscale serve status 2>/dev/null | grep -q ":$PORT\b"; }

if [[ "${1:-}" == "--off" ]]; then
  serve_off
  write_env
  restart_service
  serve_is_on && { echo "The server now refuses tailnet requests, but tailscale still serves port $PORT: check \`tailscale serve status\`." >&2; exit 1; }
  echo "Tailscale access is off."
  exit 0
fi

# This machine's MagicDNS name, the login that owns it, and whether the tailnet issues HTTPS certificates for it.
read -r NAME LOGIN SCHEME < <(tailscale status --json | node -e '
  let raw = ""; process.stdin.on("data", (c) => raw += c).on("end", () => {
    try {
      const s = JSON.parse(raw);
      const name = (s.Self.DNSName || "").replace(/\.$/, "");
      console.log(name, s.User?.[s.Self.UserID]?.LoginName || "", (s.CertDomains || []).includes(name) ? "https" : "http");
    } catch { console.log(""); }
  });') || true
[[ -n "${NAME:-}" && "${LOGIN:-}" == *@* ]] || { echo "Could not read this machine's MagicDNS name and owner login (is Tailscale up, with MagicDNS on, and the machine not tagged?)" >&2; exit 1; }
ORIGIN="$SCHEME://$NAME:$PORT"

# Server first, proxy second: the proxy must never front a server that does not check the login.
if grep -qxF "GRAND_SECRETARIAT_TAILNET_ORIGIN=$ORIGIN" "$ENV_FILE" && grep -qxF "GRAND_SECRETARIAT_TAILNET_LOGIN=$LOGIN" "$ENV_FILE" \
  && systemctl --user is-active --quiet "$APP"; then
  echo "==> Settings unchanged: service not restarted"
else
  serve_off
  write_env "GRAND_SECRETARIAT_TAILNET_ORIGIN=$ORIGIN" "GRAND_SECRETARIAT_TAILNET_LOGIN=$LOGIN"
  restart_service
fi
echo "==> tailscale serve: $SCHEME on port $PORT"
serve_off
OUT="$(tailscale serve --bg "--$SCHEME=$PORT" "http://127.0.0.1:$PORT" 2>&1)" || true
serve_is_on || { echo "$OUT" >&2; echo "tailscale serve did not start. If it asked for sudo, run once: sudo tailscale set --operator=\$USER" >&2; exit 1; }

echo "Open $ORIGIN on a device signed in to Tailscale as $LOGIN."
if [[ "$SCHEME" == http ]]; then
  echo "Note: plain HTTP, because this tailnet has no HTTPS certificates. Open that address only while Tailscale is"
  echo "connected: off the tailnet, a hostile network could answer for the name. To get HTTPS, enable it in the"
  echo "Tailscale admin console (DNS > HTTPS Certificates) and run this script again."
fi
