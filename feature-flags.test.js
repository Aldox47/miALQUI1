const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizePropertyFlags, toBooleanFlag } = require('./feature-flags.js');

test('toBooleanFlag converts common truthy values', () => {
  assert.equal(toBooleanFlag(true), true);
  assert.equal(toBooleanFlag('true'), true);
  assert.equal(toBooleanFlag(1), true);
  assert.equal(toBooleanFlag('1'), true);
  assert.equal(toBooleanFlag(false), false);
  assert.equal(toBooleanFlag(undefined), false);
});

test('normalizePropertyFlags resolves legacy and DB field names', () => {
  const normalized = normalizePropertyFlags({
    destacada: 'true',
    nuevo: '1',
    categoria: 'Casa'
  });

  assert.deepEqual(normalized, {
    destacada: true,
    es_nuevo: true
  });
});

test('normalizePropertyFlags defaults missing flags to false', () => {
  const normalized = normalizePropertyFlags({ id: 'abc' });

  assert.deepEqual(normalized, {
    destacada: false,
    es_nuevo: false
  });
});
