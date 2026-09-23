import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { detectTouch, mergeAttribution, sanitizeTouch, ATTRIBUTION_TTL, chatUrl, lineContactHref, contactAttribution, sourceGroup } from '../lib/lineAttribution.js';
import { qrAttribution } from '../lib/lineLaunch.js';
import { allowedAdmin, sameOrigin, verifyLineToken, createIntent, claimIntent, recordLineEvent,
  rateLimit, validSignature, LEADS_COLLECTION, INTENTS_COLLECTION, getLineConfig } from '../lib/lineServer.js';

const now = Date.now();
const url = query => 'https://www.startupup-real-estate.com/' + query;
const userId = 'U' + 'a'.repeat(32);
function memoryDb() {
  const data = new Map();
  const ref = (collection, id) => ({ key: collection + '/' + id,
    async create(value) { if (data.has(this.key)) throw new Error('exists'); data.set(this.key, value); } });
  const db = { collection: collection => ({ doc: id => ref(collection, id) }),
    runTransaction: async callback => callback({
      get: async r => ({ exists: data.has(r.key), data: () => data.get(r.key) }),
      set: (r, value, options) => data.set(r.key, options?.merge ? { ...data.get(r.key), ...value } : value),
      update: (r, value) => data.set(r.key, { ...data.get(r.key), ...value }),
    }), data };
  return db;
}

test('direct QR attribution survives server intent creation and LINE identity matching for every channel', async () => {
  const db = memoryDb();
  for (const [index, channel] of ['tiktok', 'facebook', 'google'].entries()) {
    const token = await createIntent({ attribution: qrAttribution(channel, now) }, db, now);
    const profile = {userId: 'U' + String(index + 1).repeat(32), displayName: 'QR test'};
    const result = await claimIntent(token, profile, db, now);
    assert.equal(result.chatUrl, chatUrl());
    const lead = db.data.get(`${LEADS_COLLECTION}/${profile.userId}`);
    assert.equal(lead.lastTouch.source, channel === 'google' ? 'google_ads' : channel);
    assert.equal(lead.lastTouch.campaign, `${channel}_qr`);
  }
});

test('Google ad identifiers and paid UTMs classify Google Ads without storing identifiers', () => {
  for (const id of ['gclid', 'wbraid', 'gbraid']) {
    const touch = detectTouch(url('?' + id + '=secret-click-id'), '', now);
    assert.equal(touch.source, 'google_ads');
    assert.ok(!JSON.stringify(touch).includes('secret-click-id'));
  }
  assert.equal(detectTouch(url('?utm_source=google&utm_medium=cpc'), '', now).source, 'google_ads');
});
test('unpaid Facebook clicks are never mislabeled ads; TikTok migration is separate', () => {
  assert.equal(detectTouch(url('?fbclid=123'), '', now).source, 'facebook');
  assert.equal(detectTouch(url('?utm_source=facebook&utm_medium=paid_social'), '', now).source, 'facebook_ads');
  assert.equal(detectTouch(url('?ttclid=123'), '', now).source, 'tiktok_ads');
  assert.equal(detectTouch(url('?utm_source=tiktok_oa'), '', now).source, 'tiktok_migration');
});
test('unknown/direct remains unknown; lookalike referral domains cannot impersonate channels', () => {
  assert.equal(detectTouch(url(''), '', now).source, 'unknown');
  assert.equal(detectTouch(url(''), 'https://facebook.com.evil.example/', now).source, 'other');
  assert.equal(detectTouch(url(''), 'https://www.google.co.th/search', now).source, 'google_organic');
});
test('direct/internal navigation preserves first and last known touch; later campaign changes only last', () => {
  const google = detectTouch(url('?gclid=1'), '', now);
  const tik = detectTouch(url('?utm_source=tiktok'), '', now + 1000);
  let record = mergeAttribution(null, google, now);
  record = mergeAttribution(record, detectTouch(url('?tab=all'), '', now + 500), now + 500);
  assert.equal(record.last.source, 'google_ads');
  record = mergeAttribution(record, tik, now + 1000);
  assert.equal(record.first.source, 'google_ads'); assert.equal(record.last.source, 'tiktok');
});
test('expired attribution, future timestamps and arbitrary fields are discarded', () => {
  assert.equal(sanitizeTouch({ source: 'tiktok', at: now - ATTRIBUTION_TTL - 1 }, now), null);
  assert.equal(sanitizeTouch({ source: 'tiktok', at: now + 60001 }, now), null);
  const value = sanitizeTouch({ at: now, source: 'admin', role: 'host', campaign: 'x'.repeat(500) }, now);
  assert.equal(value.source, 'unknown'); assert.equal(value.campaign.length, 160); assert.equal(value.role, undefined);
});
test('all outgoing contact links use the main OA, never a generic LINE recipient picker', () => {
  assert.match(chatUrl(), /%40SURE141/);
  assert.match(chatUrl('นัดชมบ้าน'), /^https:\/\/line\.me\/R\/oaMessage\/%40SURE141/);
  assert.equal(decodeURIComponent(chatUrl('นัดชมบ้าน\nบ้านตัวอย่าง').split('/?')[1]), 'นัดชมบ้าน\nบ้านตัวอย่าง');
  assert.match(lineContactHref({ id: '1', project_name: 'ทดสอบ' }), /^\/line\/go\?property=1/);
});
test('admin data requires a verified Google email explicitly in the allowlist', () => {
  const claims = { email: 'admin@example.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  assert.equal(allowedAdmin(claims, 'admin@example.com'), true);
  assert.equal(allowedAdmin(claims, 'other@example.com'), false);
  assert.equal(allowedAdmin({ ...claims, email_verified: false }, 'admin@example.com'), false);
  assert.equal(allowedAdmin({ ...claims, firebase: { sign_in_provider: 'anonymous' } }, 'admin@example.com'), false);
});

test('website and sale contact buttons group as Website/Google Ads without losing campaign evidence', () => {
  for (const property of [undefined, { id: 'house-1', project_name: 'Home' }]) {
    const href = lineContactHref(property, 'นัดชมบ้าน');
    assert.equal(new URL(href, url('')).searchParams.get('via'), 'website');
    const google = detectTouch(url('?utm_source=google&utm_medium=cpc&utm_campaign=house_ads'), '', now);
    const tagged = contactAttribution({ first: google, last: google }, href, now + 1000);
    assert.equal(tagged.last.source, 'google_ads');
    assert.equal(tagged.last.campaign, 'house_ads');
    assert.equal(sourceGroup(sanitizeTouch(tagged.last, now + 1000)), 'website');
    assert.equal(sourceGroup(tagged.first), 'website');
    const direct = detectTouch(url(''), '', now);
    const website = contactAttribution({ first: direct, last: direct }, href, now);
    assert.equal(website.first.source, 'website');
    assert.equal(website.last.source, 'website');
  }
});

test('QR links retain their separate channels and direct OA contacts remain unknown', () => {
  for (const source of ['tiktok', 'facebook', 'google_ads']) {
    const href = url(`line/go?utm_source=${source}&utm_medium=qr&utm_campaign=${source}_qr`);
    const touch = detectTouch(href, '', now);
    const result = contactAttribution({ first: touch, last: touch }, href, now);
    assert.equal(result.last.source, source);
    assert.equal(result.last.campaign, `${source}_qr`);
  }
  assert.equal(sourceGroup(null), 'unknown');
  const facebook = detectTouch(url('?utm_source=facebook'), '', now);
  const result = contactAttribution({ first: facebook, last: facebook }, lineContactHref(), now);
  assert.equal(sourceGroup(result.first), 'facebook');
  assert.equal(sourceGroup(result.last), 'website');
});
test('write endpoints reject cross-origin requests', () => {
  assert.throws(() => sameOrigin({ headers: { origin: 'https://attacker.example', 'content-type': 'application/json' } }), { status: 403 });
  assert.doesNotThrow(() => sameOrigin({ headers: { origin: 'https://www.startupup-real-estate.com', 'content-type': 'application/json' } }));
});
test('LINE user identity is verified with LINE, never accepted from client profile fields', async () => {
  process.env.LINE_LOGIN_CHANNEL_ID = '1234';
  const claims = { sub: userId, aud: '1234', iss: 'https://access.line.me', exp: Math.floor(Date.now() / 1000) + 100, name: 'Customer' };
  let sent;
  const fetcher = async (endpoint, options) => { sent = { endpoint, options }; return { ok: true, json: async () => claims }; };
  const profile = await verifyLineToken('a'.repeat(50), fetcher);
  assert.equal(profile.userId, userId); assert.equal(sent.options.body.get('client_id'), '1234');
  assert.match(sent.endpoint, /^https:\/\/api.line.me\//);
  await assert.rejects(verifyLineToken('a'.repeat(50), async () => ({ ok: false })), { status: 401 });
  await assert.rejects(verifyLineToken('a'.repeat(50), async () => ({ ok: true, json: async () => ({ ...claims, aud: 'wrong' }) })), { status: 401 });
  delete process.env.LINE_LOGIN_CHANNEL_ID;
});
test('claim is idempotent and cannot be reused for another LINE user', async () => {
  const db = memoryDb();
  const touch = detectTouch(url('?utm_source=tiktok'), '', now);
  const token = await createIntent({ attribution: { first: touch, last: touch }, property: { id: 'house-1' } }, db, now);
  const profile = { userId, displayName: 'Test', pictureUrl: '' };
  await claimIntent(token, profile, db, now + 1);
  await claimIntent(token, profile, db, now + 2);
  const lead = db.data.get(LEADS_COLLECTION + '/' + userId);
  assert.equal(lead.connectionCount, 1); assert.equal(lead.lastTouch.source, 'tiktok');
  await assert.rejects(claimIntent(token, { ...profile, userId: 'U' + 'b'.repeat(32) }, db, now + 3), { status: 409 });
  assert.equal(db.data.get(INTENTS_COLLECTION + '/' + token).claimedBy, userId);
});
test('expired and missing intents never create customer records', async () => {
  const db = memoryDb();
  const token = await createIntent({}, db, now - 31 * 60000);
  await assert.rejects(claimIntent(token, { userId }, db, now), { status: 410 });
  await assert.rejects(claimIntent('x'.repeat(32), { userId }, db, now), { status: 410 });
  assert.equal(db.data.has(LEADS_COLLECTION + '/' + userId), false);
});
test('out-of-order attribution and direct returns cannot overwrite a later known source', async () => {
  const db = memoryDb(); const profile = { userId, displayName: 'Test', pictureUrl: '' };
  for (const [query, at] of [['?utm_source=google&utm_medium=cpc', now - 1000], ['?utm_source=tiktok', now], ['?utm_source=facebook', now - 500], ['', now + 500]]) {
    const touch = detectTouch(url(query), '', at);
    const token = await createIntent({ attribution: { first: touch, last: touch } }, db, now + 500);
    await claimIntent(token, profile, db, now + 1000);
  }
  const lead = db.data.get(LEADS_COLLECTION + '/' + userId);
  assert.equal(lead.firstTouch.source, 'google_ads'); assert.equal(lead.lastTouch.source, 'tiktok');
});
test('webhook signature covers exact bytes; mutation and missing secret fail', () => {
  const body = Buffer.from('{"events":[]}'); const secret = 'test-secret';
  const sig = createHmac('sha256', secret).update(body).digest('base64');
  assert.equal(validSignature(body, sig, secret), true);
  assert.equal(validSignature(Buffer.from('{ "events":[]}'), sig, secret), false);
  assert.equal(validSignature(body, sig, ''), false);
  assert.equal(validSignature(body, 'broken', secret), false);
});
test('webhook retries/out-of-order delivery do not undo latest status; message text is not stored', async () => {
  const db = memoryDb();
  const event = { type: 'message', timestamp: now, source: { type: 'user', userId }, message: { text: 'private conversation' } };
  await recordLineEvent(event, db, now);
  await recordLineEvent({ ...event, timestamp: now - 1000 }, db, now);
  await recordLineEvent(event, db, now);
  const lead = db.data.get(LEADS_COLLECTION + '/' + userId);
  assert.equal(lead.lastMessageAt, now); assert.ok(!JSON.stringify(lead).includes('private conversation'));
});
test('shared rate limiter persists quota and stores only a keyed IP hash', async () => {
  process.env.LINE_TRACKING_SECRET = 's'.repeat(40);
  const db = memoryDb(); const req = { headers: { 'x-vercel-forwarded-for': '192.0.2.1' } };
  for (let i = 0; i < 40; i++) await rateLimit(req, 'start', db, now);
  await assert.rejects(rateLimit(req, 'start', db, now), { status: 429 });
  assert.ok(!JSON.stringify([...db.data]).includes('192.0.2.1'));
  delete process.env.LINE_TRACKING_SECRET;
});
test('tracking stays disabled until private database rules have been confirmed', () => {
  assert.equal(getLineConfig().enabled, false);
  assert.ok(getLineConfig().missing.includes('LINE_PRIVATE_RULES_CONFIRMED'));
});
