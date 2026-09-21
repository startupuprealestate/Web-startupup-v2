import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPublicPropertyRest, makePropertySlug, matchesPropertySlug } from '../lib/firestorePublic.js';

const document = (fields = {}) => ({
  name: 'projects/test/databases/(default)/documents/properties/new-house',
  fields: { project_name: { stringValue: 'New house' }, ...fields },
});

test('a newly added house can be read by document ID without the cached list', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json(document());
  });
  const property = await fetchPublicPropertyRest('new-house');
  assert.equal(property.id, 'new-house');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/properties\/new-house\?/);
  assert.equal(calls[0].options.cache, 'no-store');
});

test('encoded Thai custom IDs with slashes resolve through a targeted query', async t => {
  const customId = 'บ้านใหม่ 12/34';
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json([{ document: document({ custom_id: { stringValue: customId } }) }]);
  });
  const slug = new URLSearchParams({ property: makePropertySlug({ custom_id: customId }) }).get('property');
  const property = await fetchPublicPropertyRest(slug);
  assert.equal(property.custom_id, customId);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/public\/data:runQuery\?/);
  const query = JSON.parse(calls[0].options.body).structuredQuery;
  assert.equal(query.where.fieldFilter.field.fieldPath, 'custom_id');
  assert.ok(query.where.fieldFilter.value.arrayValue.values.some(value => value.stringValue === customId));
  assert.equal(query.limit, 1);
});

test('legacy slash/hyphen and numeric house-number links still work', async t => {
  const queries = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    if (!options.body) return new Response(null, { status: 404 });
    const query = JSON.parse(options.body).structuredQuery;
    queries.push(query);
    return Response.json(query.where.fieldFilter.field.fieldPath === 'house_number'
      ? [{ document: document({ house_number: { integerValue: '123' } }) }]
      : [{ readTime: '2026-09-21T00:00:00Z' }]);
  });
  const property = await fetchPublicPropertyRest('123');
  assert.equal(property.house_number, 123);
  assert.ok(queries[1].where.fieldFilter.value.arrayValue.values.some(value => value.doubleValue === 123));
  assert.ok(matchesPropertySlug({ custom_id: '12/34' }, '12-34'));
});

test('only successful empty lookups mean a house does not exist', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => options.body
    ? Response.json([{ readTime: '2026-09-21T00:00:00Z' }])
    : new Response(null, { status: 404 }));
  assert.equal(await fetchPublicPropertyRest('missing'), null);
});

test('database failures are not reported as a missing house', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  await assert.rejects(fetchPublicPropertyRest('12/34'), /503/);
});

test('navigation cancellation aborts the pending lookup', async t => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    options.signal.throwIfAborted();
  });
  await assert.rejects(fetchPublicPropertyRest('new-house', { signal: controller.signal }), { name: 'AbortError' });
});
