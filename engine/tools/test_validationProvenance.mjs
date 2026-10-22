import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptanceFingerprint, stableWordEnvironment } from './validationProvenance.mjs';

test('cache identity invalidates each source/code/spec/fixture/renderer/font environment change', () => {
  const inputs = { source: 'source', checks: 'checks', fixture: 'fixture', code: 'code', renderer: 'renderer', environment: 'environment' };
  const before = acceptanceFingerprint(inputs);
  for (const key of Object.keys(inputs)) {
    assert.notEqual(before, acceptanceFingerprint({ ...inputs, [key]: inputs[key] + '-changed' }));
    assert.throws(() => acceptanceFingerprint({ ...inputs, [key]: null }));
  }
});
test('Word PID and timestamp do not invalidate an otherwise identical renderer', () => {
  assert.deepEqual(stableWordEnvironment({ pid: 10, renderedAt: 'a', build: '16', culture: 'tr-TR' }),
    stableWordEnvironment({ pid: 20, renderedAt: 'b', build: '16', culture: 'tr-TR' }));
  assert.notDeepEqual(stableWordEnvironment({ build: '16', printHiddenText: false }),
    stableWordEnvironment({ build: '16', printHiddenText: true }));
});
