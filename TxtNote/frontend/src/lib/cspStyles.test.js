import assert from 'node:assert/strict';
import { test } from 'node:test';
import { trustedStyleNonce, styleNonceAttribute, withoutInlineStyleAttributes } from './cspStyles.js';
import { buildThesisPrintHtml, compileThesisDocument, buildThesisCss } from '../../../../engine/src/engine.js';
import { resolveThesisTemplate } from '../../../../engine/src/registry.js';
import { FIXTURE_REGISTRY } from './thesisFixtures.js';
import { figureHtml } from './academicMedia.js';
test('CSP cleanup drops inline styles, retaining dimensions, quoted attribute content and widget styles',()=>{
  const html='<p style="color:red">text</p><IMG WIDTH="200" height="100" alt="style=\'keep\' >" STYLE="width: 200px; height: 100px;" src="data:image/png;base64,abc"><img width=40 style=width:40px height=20>';
  const result=withoutInlineStyleAttributes(html);
  assert.match(result, /<p>text<\/p>/);
  assert.match(result, /WIDTH="200" height="100" alt="style='keep' >" src=/);
  assert.match(result, /<img width=40 height=20>/);
  const figure=figureHtml('data:image/png;base64,abc','test',{width:200,height:100});
  assert.match(figure,/width="200" height="100"/);assert.doesNotMatch(figure,/\sstyle=/);
  // Chromium's block merge (multi-line selection + Backspace) left this in saved notes.
  const merged='<p>Birinci par<span style="font-size: 12pt; font-weight: 700;">şlığı</span></p>';
  assert.equal(withoutInlineStyleAttributes(merged),'<p>Birinci par<span>şlığı</span></p>');
  const math='<p>a</p><span class="math-formula math-formula--inline" data-latex="x&lt;1"><span class="katex"><span style="height:1em"><span style="top:-2em">x</span></span></span></span><span style="color:red">b</span>';
  assert.equal(withoutInlineStyleAttributes(math),'<p>a</p><span class="math-formula math-formula--inline" data-latex="x&lt;1"><span class="katex"><span style="height:1em"><span style="top:-2em">x</span></span></span></span><span>b</span>');
  assert.equal(withoutInlineStyleAttributes('<p title="a style=b">x</p>'),'<p title="a style=b">x</p>');
});
test('nonce comes only from the trusted startup anchor property, with web/SSR fallback', () => {
  assert.equal(trustedStyleNonce({ getElementById: id => id === 'txtnote-trusted-style' ? {nonce:'runtime-123',getAttribute:()=>''} : null }), 'runtime-123');
  assert.equal(trustedStyleNonce({getElementById:()=>null}), '');
  assert.equal(trustedStyleNonce(), '');
  assert.equal(styleNonceAttribute('a"&'), ' nonce="a&quot;&amp;"');
});
test('cover layout uses scoped stylesheet rules and print inherits the supplied nonce', async () => {
  const {template} = await resolveThesisTemplate({templateId:'fixture-university-a-master-tr-v1'}, FIXTURE_REGISTRY);
  const model = compileThesisDocument(template,{},'Nonce test','<img width="200" height="100" style="width:200px;height:100px" src="data:image/png;base64,abc">');
  for (const section of model.sections) assert.doesNotMatch(section.prefixHtml,/\sstyle=/);
  const css=buildThesisCss(model);
  assert.match(css,/data-thesis-block="0"\]\{height:\d+mm;/);
  assert.match(buildThesisPrintHtml(model,{nonce:'runtime-123'}), /<style nonce="runtime-123">/);
  assert.doesNotMatch(buildThesisPrintHtml(model,{nonce:'runtime-123'}), /<img[^>]*\sstyle=/);
  assert.match(buildThesisPrintHtml(model), /<style>/);
});
