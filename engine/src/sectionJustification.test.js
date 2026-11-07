import assert from 'node:assert/strict';
import test from 'node:test';
import { compileThesisDocument } from './engine.js';
import { validateThesisTemplate } from './validation.js';
import template from './templates/afsu-lee.js';

test('a section can opt out of Word space compression without changing other sections', () => {
 const copy=structuredClone(template);
 copy.typography.justify='word';
 const ethics=copy.sections.find(s=>s.id==='ethics');
 ethics.overrides.justify='browser';
 let model=compileThesisDocument(copy,{},'Example','<p>Example text.</p>');
 assert.equal(model.sections.find(s=>s.id==='ethics').rules.justify,'browser');
 assert.equal(model.sections.find(s=>s.id==='main').rules.justify,'word');
 delete ethics.overrides.justify;
 model=compileThesisDocument(copy,{},'Example','<p>Example text.</p>');
 assert.equal(model.sections.find(s=>s.id==='ethics').rules.justify,'word');
 ethics.overrides.justify='invalid';
 assert.ok(validateThesisTemplate(copy).some(message=>message.includes('ethics.justify')));
});
