import test from 'node:test';
import assert from 'node:assert/strict';
import { needsLineAppTap, liffIntentUrl, liffQrUrl, resolveLineEntry, qrAttribution, createQrIntent } from '../lib/lineLaunch.js';

test('external iPhone and iPad browsers wait for a user tap; LINE and Android keep automatic flow', () => {
  assert.equal(needsLineAppTap('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'), true);
  assert.equal(needsLineAppTap('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), true);
  assert.equal(needsLineAppTap('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5), true);
  assert.equal(needsLineAppTap('Mozilla/5.0 (iPhone) Line/15.0.0'), false);
  assert.equal(needsLineAppTap('Mozilla/5.0 (Linux; Android 14)'), false);
  assert.equal(needsLineAppTap('Mozilla/5.0 (Macintosh)', 'MacIntel', 0), false);
});

test('open-app fallback retains the same attribution intent and rejects malformed input', () => {
  const token = 'aB0_-'.repeat(6) + 'ab';
  const link = new URL(liffIntentUrl('2011712212-SOWDnH5X', token));
  assert.equal(link.origin, 'https://liff.line.me');
  assert.equal(link.pathname, '/2011712212-SOWDnH5X');
  assert.equal(link.searchParams.get('t'), token);
  assert.equal(liffIntentUrl('https://evil.example', token), '');
  assert.equal(liffIntentUrl('2011712212-SOWDnH5X', 'bad'), '');
});

test('direct LIFF QR and login fallback retain the channel without a shared expiring token', () => {
  for (const channel of ['tiktok', 'facebook', 'google']) {
    const qr = new URL(liffQrUrl('2011712212-SOWDnH5X', channel));
    assert.equal(qr.origin, 'https://liff.line.me');
    assert.equal(qr.searchParams.get('t'), null);
    const entry = resolveLineEntry(`https://www.startupup-real-estate.com/line/connect${qr.search}`, '2011712212-SOWDnH5X');
    assert.equal(entry.channel, channel);
    assert.equal(entry.appUrl, qr.href);
    assert.equal(new URL(entry.redirectUri).searchParams.get('qr'), channel);
    assert.equal(qrAttribution(channel).last.campaign, `${channel}_qr`);
    assert.equal(qrAttribution(channel).last.source, channel === 'google' ? 'google_ads' : channel);
  }
  assert.throws(() => resolveLineEntry('https://www.startupup-real-estate.com/line/connect?qr=unknown', '2011712212-SOWDnH5X'));
  assert.throws(() => resolveLineEntry('https://www.startupup-real-estate.com/line/connect?qr=tiktok&t=bad', '2011712212-SOWDnH5X'));
  assert.throws(() => qrAttribution('__proto__'));
});

test('each QR scan creates a fresh server intent and only accepts its configured LIFF destination', async () => {
  const id = '2011712212-SOWDnH5X';
  let count = 0;
  const fetcher = async (url, options) => {
    assert.equal(url, '/api/line/start');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.attribution.first.source, 'tiktok');
    assert.equal(body.attribution.last.medium, 'qr');
    return { ok: true, json: async () => ({ url: liffIntentUrl(id, String(++count).repeat(32)) }) };
  };
  assert.notEqual(await createQrIntent('tiktok', id, fetcher), await createQrIntent('tiktok', id, fetcher));
  await assert.rejects(createQrIntent('tiktok', id, async () => ({ok: true, json: async () => ({url:'https://evil.example/?t='+'a'.repeat(32)})})));
  await assert.rejects(createQrIntent('tiktok', id, async () => ({ok: false, json: async () => ({error:'Service unavailable'})})), /Service unavailable/);
});
