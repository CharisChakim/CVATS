const TTL = 24 * 60 * 60 * 1000; // 24 hours

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function cacheGet(parts) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const key = 'cvats_ai_' + hashStr(parts.join('|'));
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { v, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { localStorage.removeItem(key); return null; }
    return v;
  } catch { return null; }
}

export function cacheSet(parts, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = 'cvats_ai_' + hashStr(parts.join('|'));
    localStorage.setItem(key, JSON.stringify({ v: value, ts: Date.now() }));
  } catch {}
}
