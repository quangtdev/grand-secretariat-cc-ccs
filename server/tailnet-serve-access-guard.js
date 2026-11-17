// Access from the user's other devices through `tailscale serve`.
// The server never listens beyond 127.0.0.1. tailscaled accepts the tailnet connection, proxies it
// to us and adds headers: `Tailscale-User-Login` (who the caller is, taken from the WireGuard
// identity; a copy sent by the caller is stripped) and `X-Forwarded-For`.
// Anyone who loads the UI gets the access token, i.e. a shell on this machine, so a proxied
// request is accepted only from the one configured login. Other tailnet users, shared-in
// devices and tagged nodes (which carry no login) are refused.
import { TAILNET_HOST, TAILNET_LOGIN } from './config.js';

/**
 * False when the request came through a proxy (`tailscale serve`) and is not from the allowed
 * login under the tailnet Host, or tailnet access is not configured. Direct local requests pass.
 */
export function isAllowedTailnetCaller(req, { host = TAILNET_HOST, login = TAILNET_LOGIN } = {}) {
  const headers = req.headers;
  const proxied = (host && headers.host === host) || 'x-forwarded-for' in headers || 'tailscale-user-login' in headers;
  if (!proxied) return true;
  return Boolean(host) && headers.host === host
    && String(headers['tailscale-user-login'] || '').toLowerCase() === login;
}
