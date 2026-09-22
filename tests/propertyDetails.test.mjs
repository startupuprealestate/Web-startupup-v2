import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribePropertyDetails } from '../lib/propertyDetails.js';

function harness() {
  const values = [], errors = [];
  let emit, fail, stopped = false, missing = 0;
  const stop = subscribePropertyDetails({
    observe: (options, onValue, onError) => {
      assert.equal(options.includeMetadataChanges, true);
      emit = onValue;
      fail = onError;
      return () => { stopped = true; };
    },
    onProperty: value => values.push(value),
    onMissing: () => { missing += 1; },
    onError: error => errors.push(error),
  });
  return {
    stop, values, errors,
    emit: (price, metadata = {}) => emit({
      id: 'house-1', exists: () => price !== null,
      data: () => ({ price }), metadata,
    }),
    fail: error => fail(error),
    get stopped() { return stopped; },
    get missing() { return missing; },
  };
}

test('an open detail page receives a price change without reloading', () => {
  const h = harness();
  h.emit(1890000);
  h.emit(1690000);
  assert.deepEqual(h.values.map(value => value.price), [1890000, 1690000]);
  assert.equal(h.values[1].id, 'house-1');
  h.stop();
});

test('older local data and unconfirmed edits cannot replace the server price', () => {
  const h = harness();
  h.emit(1890000, { fromCache: true });
  h.emit(1690000);
  h.emit(1890000, { fromCache: true });
  h.emit(1590000, { hasPendingWrites: true });
  assert.deepEqual(h.values.map(value => value.price), [1690000]);
  h.stop();
});

test('leaving a house detaches the listener and ignores late events', () => {
  const h = harness();
  h.stop();
  h.emit(1690000);
  h.emit(null);
  h.fail(new Error('late error'));
  assert.equal(h.stopped, true);
  assert.deepEqual(h.values, []);
  assert.deepEqual(h.errors, []);
  assert.equal(h.missing, 0);
});

test('only a server-confirmed deletion removes the detail page', () => {
  const h = harness();
  h.emit(null, { fromCache: true });
  assert.equal(h.missing, 0);
  h.fail(new Error('offline'));
  assert.equal(h.missing, 0);
  assert.equal(h.errors.length, 1);
  h.emit(null);
  assert.equal(h.missing, 1);
  h.stop();
});
