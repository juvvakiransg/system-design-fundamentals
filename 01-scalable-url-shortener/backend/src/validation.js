export function validateUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.username || url.password) return false;
    if (!url.hostname || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$)/.test(url.hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) return false;
    return true;
  } catch { return false; }
}
export function validateCode(code) {
  return typeof code === 'string' && /^[A-Za-z0-9_-]{6,16}$/.test(code);
}
