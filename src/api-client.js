// Thin client for the local server: live session feed, summon, dismiss, history.

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Calls `onSessions(list)` on every change and `onLink(connected)` when the feed drops or returns. */
export function subscribeToSessions(onSessions, onLink) {
  const feed = new EventSource('/api/events');
  feed.onmessage = (event) => { onLink(true); onSessions(JSON.parse(event.data)); };
  // EventSource reconnects on its own unless the server refused it (CLOSED): then only a reload helps.
  feed.onerror = () => onLink(false, feed.readyState === EventSource.CLOSED);
  return () => feed.close();
}

export const fetchSummonOptions = () => request('GET', '/api/options');
/** One level of the machine's folders, for choosing a working folder outside the listed repositories. */
export const fetchFolder = (dir) => request('GET', `/api/folders?path=${encodeURIComponent(dir)}`);
export const summonAgent = (order) => request('POST', '/api/sessions', order);
export const dismissAgent = (id) => request('DELETE', `/api/sessions/${id}`);
export const renameAgent = (id, ticket) => request('PATCH', `/api/sessions/${id}`, { ticket });

/** Scribes that left the court with a conversation to go back to, newest first. */
export const fetchHistory = () => request('GET', '/api/history');
export const recallAgent = (id) => request('POST', `/api/history/${id}/recall`, {});
export const forgetHistoryEntry = (id) => request('DELETE', `/api/history/${id}`);

/** One day of the court annals; no `day` = today, or the latest earlier day when today is still empty. */
export const fetchAnnals = (day) => request('GET', day ? `/api/annals?day=${encodeURIComponent(day)}` : '/api/annals');

export const fetchAppInfo = () => request('GET', '/api/app');
/** @param {'restart' | 'update' | 'pull'} action */
export const runAppAction = (action) => request('POST', `/api/app/${action}`, {});

export function terminalSocketUrl(id) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/ws/term/${id}`;
}
