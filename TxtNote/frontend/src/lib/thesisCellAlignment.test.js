import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileThesisDocument, buildThesisCss } from '../thesis/engine.js';
import generic from '../thesis/templates/generic.js';

test('authored cell alignment retains table-cell geometry and overrides template defaults', () => {
  const model = compileThesisDocument(generic, {}, 'Cells', '<table><tr><td class="fmt-align-center">40</td></tr></table>');
  const css = buildThesisCss(model);
  for (const alignment of ['left', 'center', 'right', 'justify']) {
    assert.ok(css.includes(`:is(td,th).fmt-align-${alignment}{display:table-cell;width:auto;text-align:${alignment};}`));
  }
});
