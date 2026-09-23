// Attribution is a marketing hint, never an authorization decision.
export const MAIN_LINE_ID = '@SURE141';
export const MAIN_LINE_URL = 'https://line.me/R/ti/p/%40SURE141';
export const ATTRIBUTION_KEY = 'startupup:attribution:v1';
export const ATTRIBUTION_TTL = 30 * 24 * 60 * 60 * 1000;
let capturedDocument = false;
export const SOURCE_LABELS = {
  google_ads: 'Website/Google Ads', website: 'Website/Google Ads', google_organic: 'Google Search',
  facebook_ads: 'Facebook Ads', facebook: 'Facebook',
  tiktok_ads: 'TikTok Ads', tiktok: 'TikTok',
  tiktok_migration: 'ย้ายจาก LINE TikTok', other: 'ช่องทางอื่น', unknown: 'ไม่ทราบที่มา/ไอดีไลน์',
};
export const cleanText = (value, max = 160) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
export const cleanBookingText = value => typeof value === 'string'
  ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, 1000) : '';

export function detectTouch(href, referrer = '', now = Date.now()) {
  const url = new URL(href, 'https://www.startupup-real-estate.com');
  const p = url.searchParams;
  const source = cleanText(p.get('utm_source')).toLowerCase();
  const medium = cleanText(p.get('utm_medium')).toLowerCase();
  const paid = /^(cpc|ppc|paid|paid_social|paid_search|display|cpm)$/.test(medium);
  let key = 'unknown';
  let evidence = 'none';
  if (p.get('gclid') || p.get('gbraid') || p.get('wbraid')) {
    key = 'google_ads'; evidence = 'google_click_id';
  } else if (p.get('ttclid')) {
    key = 'tiktok_ads'; evidence = 'tiktok_click_id';
  } else if (source) {
    evidence = 'utm';
    if (source === 'tiktok_oa') key = 'tiktok_migration';
    else if (/^(google|googleads|google_ads)$/.test(source)) key = paid || source !== 'google' ? 'google_ads' : 'google_organic';
    else if (/^(facebook|fb|meta)$/.test(source)) key = paid ? 'facebook_ads' : 'facebook';
    else if (source === 'tiktok') key = paid ? 'tiktok_ads' : 'tiktok';
    else key = 'other';
  } else if (p.get('fbclid')) {
    // fbclid also appears on unpaid links. It does not prove an ad click.
    key = 'facebook'; evidence = 'facebook_click_id';
  } else if (referrer) {
    try {
      const host = new URL(referrer).hostname.toLowerCase();
      const matches = domain => host === domain || host.endsWith('.' + domain);
      if (host !== url.hostname) {
        evidence = 'referrer';
        if (matches('facebook.com') || matches('fb.com')) key = 'facebook';
        else if (matches('tiktok.com')) key = 'tiktok';
        else if (matches('google.com') || matches('google.co.th')) key = 'google_organic';
        else if (!matches('line.me') && !matches('line.biz')) key = 'other';
      }
    } catch { /* Missing/malformed referrers stay unattributed. */ }
  }
  return { source: key, campaign: cleanText(p.get('utm_campaign')), medium,
    content: cleanText(p.get('utm_content')), landingPath: cleanText(url.pathname, 240),
    evidence, at: now };
}

export function sanitizeTouch(value, now = Date.now()) {
  if (!value || typeof value !== 'object') return null;
  const at = Number(value.at);
  if (!Number.isFinite(at) || at > now + 60000 || now - at > ATTRIBUTION_TTL) return null;
  return { source: Object.hasOwn(SOURCE_LABELS, value.source) ? value.source : 'unknown',
    campaign: cleanText(value.campaign), medium: cleanText(value.medium), content: cleanText(value.content),
    landingPath: cleanText(value.landingPath, 240).split('?')[0],
    evidence: cleanText(value.evidence, 32), entryPoint: value.entryPoint === 'website' ? 'website' : '', at };
}

export function sourceGroup(touch) {
  const source = touch?.source || 'unknown';
  return touch?.entryPoint === 'website' || source === 'google_ads' ? 'website' : source;
}

export function contactAttribution(attribution, href, now = Date.now()) {
  if (new URL(href, 'https://www.startupup-real-estate.com').searchParams.get('via') !== 'website') return attribution;
  const previous = sanitizeTouch(attribution?.last, now) || detectTouch(href, '', now);
  const last = { ...previous, source: previous.source === 'unknown' ? 'website' : previous.source,
    entryPoint: 'website', at: now };
  const first = sanitizeTouch(attribution?.first, now);
  return { first: first && first.source !== 'unknown' ? first : last, last };
}

export function mergeAttribution(previous, touch, now = Date.now()) {
  const first = sanitizeTouch(previous?.first, now);
  const last = sanitizeTouch(previous?.last, now);
  const next = sanitizeTouch(touch, now) || detectTouch('/', '', now);
  // Keep the last known channel across internal navigation and direct returns.
  // Upgrade an initially unknown first touch when evidence becomes available.
  return { first: first && (first.source !== 'unknown' || next.source === 'unknown') ? first : next,
    last: next.source !== 'unknown' || !last ? next : last };
}

export function captureAttribution() {
  if (typeof window === 'undefined') return null;
  if (/^\/(admin|line\/connect)(\/|$)/.test(window.location.pathname)) return null;
  let previous;
  try { previous = JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) || 'null'); } catch { /* Storage is optional. */ }
  const result = mergeAttribution(previous, detectTouch(window.location.href, capturedDocument ? '' : document.referrer));
  capturedDocument = true;
  try { window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(result)); } catch { /* Private mode still tracks this visit. */ }
  return result;
}

export function lineContactHref(property, bookingText = '') {
  const p = new URLSearchParams();
  if (property?.id) p.set('property', cleanText(String(property.id), 100));
  if (property?.project_name) p.set('name', cleanText(property.project_name));
  if (bookingText) p.set('booking', cleanBookingText(bookingText));
  p.set('via', 'website');
  return '/line/go' + (p.size ? '?' + p.toString() : '');
}

export function chatUrl(bookingText = '') {
  const text = cleanBookingText(bookingText);
  return text ? `https://line.me/R/oaMessage/%40SURE141/?${encodeURIComponent(text)}` : MAIN_LINE_URL;
}
