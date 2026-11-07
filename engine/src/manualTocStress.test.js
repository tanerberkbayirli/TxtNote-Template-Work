import test from 'node:test';
import assert from 'node:assert/strict';
import { manualTocEntries, normalizeManualTocRows, sortManualTocRows, contentsTitleParts, contentsPageKey, contentsPanelUniversity } from './manualToc.js';
import { compileThesisDocument } from './engine.js';
import { createThesisDocument } from './document.js';
import master from './templates/mcbu.js';
import { buildThesisDocx } from './export.js';
import { unzipSync, strFromU8 } from 'fflate';

const row = (id, title, page) => ({id,title,page,literalTitle:true});

test('interleaved chapter numbers obey pages without repairing user numbers or changing their targets', () => {
  const input = [row('parent','2','10'),row('child','2.1','20'),row('between','3','15')];
  const before = structuredClone(input);
  const result = manualTocEntries(input);
  assert.deepEqual(result.map(item=>[item.text,item.page,item.anchor]),[
    ['2','10','manual-toc-parent'],['3','15','manual-toc-between'],['2.1','20','manual-toc-child']
  ]);
  assert.deepEqual(input,before);
});

test('very large decimal page labels sort exactly rather than collapsing at Number precision or Infinity', () => {
  const pages=['9007199254740993','9007199254740992','9'.repeat(310),'1'+'0'.repeat(309)];
  assert.deepEqual(sortManualTocRows(pages.map((page,i)=>row(String(i),'Başlık',page))).map(item=>item.page),[
    '9007199254740992','9007199254740993','1'+'0'.repeat(309),'9'.repeat(310)
  ]);
});

test('Roman glyphs pasted from Word sort as their ASCII equivalents while preserving the labels', () => {
  const pages=['10','Ⅸ','Ⅱ','2','Ⅳ','１'];
  assert.deepEqual(sortManualTocRows(pages.map((page,i)=>row(String(i),'Başlık',page))).map(item=>item.page),['Ⅱ','Ⅳ','Ⅸ','１','2','10']);
});

test('multiline pasted names keep their number and all text', () => {
  assert.deepEqual(contentsTitleParts('2.1 Amaç\nve kapsam'),{label:'2.1',title:'Amaç\nve kapsam',level:2});
});

test('recovered rows with missing or duplicated identities get distinct stable targets', () => {
  const input=[row('same','A','20'),row('same','B','10'),row(undefined,'C','30'),row(undefined,'D','5')];
  const entries=manualTocEntries(input);
  assert.equal(new Set(entries.map(item=>item.anchor)).size,4);
  const edited=manualTocEntries(input.map(item=>({...item,page:item.title==='A'?'1':item.page})));
  for (const entry of entries) assert.equal(edited.find(item=>item.text===entry.text).anchor,entry.anchor);
});

test('partial recovered document data does not crash the editor', () => {
  assert.doesNotThrow(()=>manualTocEntries([null,undefined,{title:0,page:0,literalTitle:true}]));
  assert.doesNotThrow(()=>manualTocEntries(null));
  assert.doesNotThrow(()=>sortManualTocRows({}));
});

test('navigation equates Word Roman glyphs, case and leading zeroes but never blank/invalid pages', () => {
  assert.equal(contentsPageKey('Ⅸ'),contentsPageKey('ix'));
  assert.equal(contentsPageKey(' ００２ '),contentsPageKey('2'));
  for (const value of ['',null,'IIV','-1','1.5','1e3','Infinity','Sayfa 2']) assert.equal(contentsPageKey(value),null);
  assert.notEqual(contentsPageKey('II'),contentsPageKey('2'));
});

test('normalization is idempotent, preserves raw spaces/zeroes and cannot steal another valid identity', () => {
  const input=[row('x','  2.1   Amaç  ',' 002 '),row('x','Tekrar','2'),row('x~2','Başka','5'),{title:0,page:0}];
  const normalized=normalizeManualTocRows(input);
  assert.deepEqual(normalizeManualTocRows(normalized),normalized);
  assert.equal(normalized[0].title,input[0].title);
  assert.equal(normalized[0].page,input[0].page);
  assert.equal(normalized[2].id,'x~2');
  assert.equal(normalized[3].title,'0');
  assert.equal(normalized[3].page,'0');
  assert.equal(new Set(normalized.map(item=>item.id)).size,4);
  assert.doesNotThrow(()=>manualTocEntries([row('\uD800','Unicode','2')]));
});

test('unsupported and malformed template identities cannot activate the panel through inherited object keys', () => {
  for (const id of [null,undefined,123,'__proto__-x','constructor-x','toString-x','ege-master']) assert.equal(contentsPanelUniversity(id),null);
});

test('empty list, empty text, duplicate numbers, missing parents and deep headings preserve explicit input', () => {
  assert.deepEqual(manualTocEntries([]),[]);
  const input=['','2','2','9.7.4','1.2.3.4.5.6.7 Başlık','<>&" deneme','0'].map((title,i)=>row(String(i),title,i%2?'2':''));
  const entries=manualTocEntries(input);
  assert.equal(entries.length,input.length);
  for (const entry of entries) {
    const source=input.find(item=>`manual-toc-${item.id}`===entry.anchor);
    assert.equal(entry.text,source.title.trim());
    assert.equal(entry.page,source.page);
  }
  assert.equal(entries.find(item=>item.text.startsWith('1.2.3')).level,6);
});

test('all 1–3999 Roman pages sort by value, not their alphabetic spelling', () => {
  const roman = value => {
    let result='';
    for(const [n,letters] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])
      while(value>=n){result+=letters;value-=n;}
    return result;
  };
  const input=Array.from({length:3999},(_,i)=>row(String(i+1),'Ön sayfa',roman(i+1))).reverse();
  assert.deepEqual(sortManualTocRows(input).map(item=>item.id),Array.from({length:3999},(_,i)=>String(i+1)));
});

test('5000 deterministic add/edit/clear/delete/reorder operations never retarget or lose an unrelated row', () => {
  let seed=73421, serial=0, state=[];
  const random = n => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  const labels=['','2','20','10','IX','Ⅱ','0002','IIV','-1','0','9999999999999999999999'];
  for(let step=0;step<5000;step++) {
    const expected=new Map(state.map(item=>[item.id,{...item}]));
    const action=random(4);
    if (!state.length || (action===0 && state.length<80)) {
      const next=row(`stress-${++serial}`,`${random(8)}.${random(8)} Başlık <>& ${step}`,labels[random(labels.length)]);
      expected.set(next.id,next);
    } else {
      const target=state[random(state.length)];
      if(action===1) expected.set(target.id,{...target,page:labels[random(labels.length)]});
      else if(action===2) expected.set(target.id,{...target,title:step%3?'2.1.3 Düzenleme '+step:''});
      else expected.delete(target.id);
    }
    const unsorted=[...expected.values()],snapshot=structuredClone(unsorted);
    state=sortManualTocRows(unsorted);
    assert.deepEqual(unsorted,snapshot);
    assert.deepEqual(sortManualTocRows(state),state);
    const entries=manualTocEntries(state);
    assert.equal(entries.length,expected.size);
    assert.equal(new Set(entries.map(item=>item.anchor)).size,expected.size);
    for(const entry of entries) {
      const original=expected.get(decodeURIComponent(entry.anchor.slice('manual-toc-'.length)));
      assert.equal(entry.text,original.title.trim());
      assert.equal(entry.page,original.page.trim());
    }
  }
});

test('HTML-like names are escaped; conflicting hierarchy and missing pages survive Word export without live TOC fields', async () => {
  const input=[row('p','2','10'),row('c','2.1','20'),row('m','3','15'),row('html','4.1 <img src=x onerror=alert(1)> & "başlık"',''),row('dup','2','10')];
  const model=compileThesisDocument(master,{...createThesisDocument(master,{},2026),manualToc:{enabled:true,rows:input}},'Deneme','<p>Gövde</p>');
  const toc=model.sections.find(section=>section.generatedIndex?.kind==='toc');
  assert.deepEqual(toc.indexRows.map(item=>[item.text,item.page]),[['2','10'],['2','10'],['3','15'],['2.1','20'],['4.1 <img src=x onerror=alert(1)> & "başlık"','']]);
  assert.doesNotMatch(toc.html,/<img\b/);
  assert.match(toc.html,/&lt;img/);
  const xml=strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))['word/document.xml']);
  assert.match(xml,/>15<\/w:t>/);
  assert.match(xml,/>20<\/w:t>/);
  assert.doesNotMatch(xml,/PAGEREF[^<]*manual|>\s*TOC \\/);
});
