import { detectTouch } from './lineAttribution.js';

const QR_SOURCES = { tiktok: 'tiktok', facebook: 'facebook', google: 'google_ads' };
const ENTRY_ERROR = 'กรุณาเริ่มจากปุ่ม LINE บนเว็บไซต์หรือ QR ของเรา';

// iOS Universal Links are more reliable when navigation follows a user tap.
export function needsLineAppTap(userAgent = '', platform = '', maxTouchPoints = 0) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent)
    || (platform === 'MacIntel' && maxTouchPoints > 1);
  return ios && !/\bLine\//i.test(userAgent);
}

export function liffIntentUrl(liffId, token) {
  if (!/^\d+-[A-Za-z0-9]+$/.test(liffId) || !/^[A-Za-z0-9_-]{32}$/.test(token)) return '';
  return `https://liff.line.me/${encodeURIComponent(liffId)}?t=${encodeURIComponent(token)}`;
}

export function liffQrUrl(liffId, channel) {
  if (!/^\d+-[A-Za-z0-9]+$/.test(liffId) || !Object.hasOwn(QR_SOURCES, channel)) return '';
  return `https://liff.line.me/${encodeURIComponent(liffId)}?qr=${channel}`;
}

// Call only after liff.init() has restored the final URL from liff.state.
export function resolveLineEntry(href, liffId) {
  const current = new URL(href);
  const token = current.searchParams.get('t');
  const channel = current.searchParams.get('qr');
  const appUrl = token !== null ? liffIntentUrl(liffId, token) : liffQrUrl(liffId, channel);
  if (!appUrl) throw new Error(ENTRY_ERROR);
  const query = token !== null ? `t=${encodeURIComponent(token)}` : `qr=${channel}`;
  return { token, channel: token !== null ? null : channel, appUrl,
    redirectUri: `${current.origin}/line/connect?${query}` };
}

export function qrAttribution(channel, now = Date.now()) {
  if (!Object.hasOwn(QR_SOURCES, channel)) throw new Error(ENTRY_ERROR);
  const query = new URLSearchParams({ utm_source: QR_SOURCES[channel], utm_medium: 'qr', utm_campaign: `${channel}_qr` });
  const touch = detectTouch(`https://www.startupup-real-estate.com/line/connect?${query}`, '', now);
  return { first: touch, last: touch };
}

export async function createQrIntent(channel, liffId, fetcher = fetch) {
  const response = await fetcher('/api/line/start', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attribution: qrAttribution(channel) }), signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'เตรียมการเชื่อมบัญชีไม่สำเร็จ');
  const result = new URL(data.url);
  const token = result.searchParams.get('t');
  if (data.url !== liffIntentUrl(liffId, token)) throw new Error('ลิงก์เชื่อมบัญชีไม่ถูกต้อง กรุณาลองใหม่');
  return token;
}
