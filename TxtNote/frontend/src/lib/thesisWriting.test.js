import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appendAuthoredReference, authoredReferences, citationWithSpacing, managedReferences, numericReferenceOrder, requiredHeadingChoices} from './thesisWriting.js';
import tip from '../../../../engine/src/templates/mcbu-tip.js';

test('inline citations stay separate from adjacent words without inserting spaces before punctuation',()=>{
  assert.equal(citationWithSpacing('(1)','önce','sonra'),' (1) ');
  assert.equal(citationWithSpacing('(1)','önce ','.'),'(1)');
  assert.equal(citationWithSpacing('(Yazar, 2026)','',''),'(Yazar, 2026)');
});

test('source view keeps explicit reference numbers and adding preserves rich authored markup', () => {
  const html='<p data-txt-node-id="one">1. Yazar. <i>Eser</i>. 2024.</p><p>2. İkinci.</p>';
  assert.deepEqual(authoredReferences(html).map(row=>row.number),[1,2]);
  assert.equal(numericReferenceOrder(authoredReferences(html)),true);
  assert.equal(appendAuthoredReference(html,'3. Yeni & güvenli <kaynak>',true),html+'<p>3. Yeni &amp; güvenli &lt;kaynak&gt;</p>');
});
test('unordered entries never gain a numeric citation and broken numbering prevents append',()=>{
  assert.deepEqual(authoredReferences('<ul><li>İlk</li><li>İkinci</li></ul>').map(row=>row.number),[null,null]);
  assert.equal(appendAuthoredReference('<p>2. Yanlış başlangıç</p>','Yeni',true),null);
  assert.equal(appendAuthoredReference('<p>Numarasız</p>','Yeni',true),null);
});
test('ordered list start and explicit values match printed numbers and new entries stay in the list',()=>{
  const html='<ol start="3"><li>Üç</li><li value="5">Beş</li><li>Altı</li></ol>';
  assert.deepEqual(authoredReferences(html).map(row=>row.number),[3,5,6]);
  assert.equal(appendAuthoredReference('<ol><li>İlk</li></ol>','İkinci',true),'<ol><li>İlk</li><li>İkinci</li></ol>');
});
test('blank managed entries do not shift printed numeric citation indices',()=>{
  assert.deepEqual(managedReferences(['','Bir','  ','İki']).map(row=>[row.index,row.number]),[[1,1],[3,2]]);
});
test('required heading choices come from template and recognise accepted alternatives',()=>{
  const choices=requiredHeadingChoices(tip,'main','<h1>1. Giriş</h1><h2>Genel Bilgiler</h2><h1>Sonuçlar ve Öneriler</h1>');
  assert.equal(choices.length,6);
  assert.equal(choices[0].present,true);
  assert.equal(choices[1].present,false);
  assert.equal(choices.at(-1).present,true);
  assert.deepEqual(requiredHeadingChoices({},'main'),[]);
});
