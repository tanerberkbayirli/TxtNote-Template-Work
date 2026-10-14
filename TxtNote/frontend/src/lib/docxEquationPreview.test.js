import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { equationPreview, equationMathSettings, inlineEquationContext } from '../../../../engine/src/docx/equationPreview.js';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {contentNodesToHtml} from '../../../../engine/src/contentModel.js';
import {docxImportFixture} from './fixtures/docxImportFixture.js';

const M='http://schemas.openxmlformats.org/officeDocument/2006/math';
function preview(properties, settings) {
  const doc=new DOMParser().parseFromString(`<m:oMath xmlns:m="${M}"><m:nary><m:naryPr>${properties}</m:naryPr><m:sub><m:r><m:t>LOW</m:t></m:r></m:sub><m:sup><m:r><m:t>HIGH</m:t></m:r></m:sup><m:e><m:r><m:t>BODY</m:t></m:r></m:e></m:nary></m:oMath>`,'application/xml');
  return equationPreview(doc.documentElement, settings);
}
const find=(node,tag)=>node.tag===tag?node:(node.children||[]).map(n=>find(n,tag)).find(Boolean);
const content=node=>node.text??(node.children||[]).map(content).join('');
function mathPreview(xml) {
  return equationPreview(new DOMParser().parseFromString(`<m:oMath xmlns:m="${M}">${xml}</m:oMath>`,'application/xml').documentElement);
}
const run=t=>`<m:r><m:t>${t}</m:t></m:r>`;
describe('Word matrix baseline spacing',()=>{
 const matrix=(count,pr='',font='Cambria Math')=>equationPreview(new DOMParser().parseFromString(`<m:oMath xmlns:m="${M}"><m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e><m:m><m:mPr>${pr}</m:mPr>${Array.from({length:count},(_,i)=>`<m:mr><m:e>${run(String(i))}</m:e></m:mr>`).join('')}</m:m></m:e></m:d></m:oMath>`,'application/xml').documentElement,{mathFont:font});
 it('reserves internal baseline edges without adding outer row leading',()=>{
  const view=matrix(3),table=find(view,'mtable');
  assert.deepEqual(table.children.map(r=>r.children[0].children[0].attributes),[
   {width:'0',height:'0',depth:'0.22216796875em'},
   {width:'0',height:'0.951171875em',depth:'0.22216796875em'},
   {width:'0',height:'0.951171875em',depth:'0'},
  ]);
  assert.equal(find(view,'mo').attributes.maxsize,'100%');
  assert.equal(content(view),'[012]');
 });
 it('leaves a single row, explicit row spacing and other fonts to their existing layout',()=>{
  for(const view of [matrix(1),matrix(3,'<m:rSp m:val="200"/>'),matrix(3,'<m:rSpRule m:val="3"/>'),matrix(3,'','Latin Modern Math')])assert.equal(find(view,'mspace'),undefined);
 });
});

describe('Word equation paragraph context',()=>{
  const nary=`<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub>${run('L')}</m:sub><m:sup>${run('U')}</m:sup><m:e>${run('x')}</m:e></m:nary></m:oMath>`;
  const paragraph=body=>new DOMParser().parseFromString(`<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="${M}">${body}</w:p>`,'application/xml').documentElement;
  it('ignores paragraph properties, empty runs and bookmarks beside a sole equation',()=>{
    assert.equal(inlineEquationContext(paragraph(`<w:pPr><w:rPr><w:sz w:val="24"/></w:rPr></w:pPr><w:bookmarkStart w:id="0" w:name="a"/><w:r><w:rPr><w:b/></w:rPr></w:r>${nary}`)),false);
  });
  it('uses inline math for preserved spaces, tabs, text and multiple equations',()=>{
    for(const prefix of ['<w:r><w:t xml:space="preserve"> </w:t></w:r>','<w:r><w:tab/></w:r>','<w:r><w:t>TEXT</w:t></w:r>',nary])assert.equal(inlineEquationContext(paragraph(prefix+nary)),true);
  });
  it('uses small side limits in inline math even for explicit under-over limits',async()=>{
    const imported=await importThesisDocx(docxImportFixture({body:`<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r>${nary}</w:p>`}));
    const html=contentNodesToHtml(imported.sections[0].nodes);
    assert.match(html,/<msubsup[ >]/);assert.doesNotMatch(html,/<munderover[ >]/);
    assert.match(html,/largeop="false"/);assert.match(html,/displaystyle="false"/);
    const eq=imported.sections[0].nodes[0].children.find(n=>n.type==='equation');
    assert.match(eq.properties.omml,/limLoc m:val="undOvr"/);
  });
  it('uses display style for a sole equation without altering its source OMML',async()=>{
    const imported=await importThesisDocx(docxImportFixture({body:`<w:p>${nary}</w:p>`}));
    const html=contentNodesToHtml(imported.sections[0].nodes);
    assert.match(html,/<munderover[ >]/);assert.match(html,/displaystyle="true"/);
  });
});
describe('Word delimiter and fraction compatibility view',()=>{
  const delimiter=properties=>mathPreview(`<m:d><m:dPr>${properties}</m:dPr><m:e>${run('a')}</m:e><m:e>${run('b')}</m:e><m:e>${run('c')}</m:e></m:d>`);
  it('uses default fences and a separator between every argument',()=>{
    assert.equal(content(delimiter('')),'(a|b|c)');
    assert.equal(content(delimiter('<m:begChr m:val="["/><m:endChr m:val="]"/><m:sepChr m:val=";"/>')),'[a;b;c]');
  });
  it('honors empty fences without consuming or joining the arguments',()=>{
    assert.equal(content(delimiter('<m:begChr/><m:endChr m:val=""/>')),'a|b|c');
    assert.equal(content(delimiter('<m:begChr m:val=""/>')),'a|b|c)');
    assert.equal(content(delimiter('<m:endChr/>')),'(a|b|c');
  });
  it('honors an empty separator and does not create separators for a single argument',()=>{
    assert.equal(content(delimiter('<m:sepChr/>')),'(abc)');
    assert.equal(content(delimiter('<m:sepChr m:val=""/>')),'(abc)');
    assert.equal(content(mathPreview(`<m:d><m:e>${run('x')}</m:e></m:d>`)),'(x)');
  });
  it('preserves a stacked fraction while removing only its rule',()=>{
    const fraction=find(mathPreview(`<m:f><m:fPr><m:type m:val="noBar"/></m:fPr><m:num>${run('a')}</m:num><m:den>${run('b')}</m:den></m:f>`),'mfrac');
    assert.equal(fraction.attributes.linethickness,'0');
    assert.equal(content(fraction.children[0]),'a');
    assert.equal(content(fraction.children[1]),'b');
  });
  it('keeps a linear fraction on the baseline with its slash',()=>{
    const tree=mathPreview(`<m:f><m:fPr><m:type m:val="lin"/></m:fPr><m:num>${run('a')}</m:num><m:den>${run('b')}</m:den></m:f>`);
    assert.equal(find(tree,'mfrac'),undefined);
    assert.equal(content(tree),'a⁄b');
    assert.equal(find(tree,'mo').attributes.stretchy,'false');
  });
  it('keeps the default barred fraction',()=>{
    const fraction=find(mathPreview(`<m:f><m:num>${run('a')}</m:num><m:den>${run('b')}</m:den></m:f>`),'mfrac');
    assert.deepEqual(fraction.attributes,{});
    assert.equal(content(fraction),'ab');
  });
});
describe('Word n-ary equation compatibility view',()=>{
  it('keeps default sum limits above/below when paragraph context is unavailable',()=>{
    const tree=preview('<m:chr m:val="∑"/>');
    const limits=find(tree,'munderover');
    assert.ok(limits);
    assert.equal(limits.attributes.displaystyle,'true');
    assert.equal(limits.children[0].attributes.movablelimits,'false');
    assert.equal(content(tree),'∑LOWHIGHBODY');
    assert.equal(tree.attributes.display,'inline');
  });
  it('keeps integral defaults at the side and honors explicit limLoc in both directions',()=>{
    assert.ok(find(preview(''),'msubsup'));
    assert.ok(find(preview('<m:chr m:val="∑"/><m:limLoc m:val="subSup"/>'),'msubsup'));
    assert.ok(find(preview('<m:chr m:val="∫"/><m:limLoc m:val="undOvr"/>'),'munderover'));
  });
  for(const [props,tag,expected] of [
    ['<m:subHide m:val="1"/>','mover','∑LOWHIGHBODY'],
    ['<m:supHide m:val="true"/>','munder','∑LOWHIGHBODY'],
    ['<m:subHide m:val="on"/><m:supHide m:val="1"/>','mo','∑LOWHIGHBODY'],
    ['<m:limLoc m:val="subSup"/><m:subHide m:val="1"/>','msup','∑LOWHIGHBODY'],
    ['<m:subHide/><m:supHide/>','mo','∑LOWHIGHBODY'],
    ['<m:subHide m:val="false"/><m:supHide m:val="0"/>','munderover','∑LOWHIGHBODY'],
  ]) it(`honors hidden limits: ${tag}`,()=>{
    const tree=preview(`<m:chr m:val="∑"/>${props}`);
    assert.ok(find(tree,tag));
    assert.equal(content(tree),expected);
  });
  it('uses document defaults, with an explicit empty limLoc meaning undOvr',()=>{
    const settings=equationMathSettings(new DOMParser().parseFromString(`<w:settings xmlns:w="urn:word" xmlns:m="${M}"><m:mathPr><m:naryLim m:val="subSup"/><m:intLim m:val="undOvr"/></m:mathPr></w:settings>`,'application/xml').documentElement);
    assert.ok(find(preview('<m:chr m:val="∑"/>',settings),'msubsup'));
    assert.ok(find(preview('',settings),'munderover'));
    assert.ok(find(preview('<m:chr m:val="∑"/><m:limLoc/>',settings),'munderover'));
    assert.deepEqual(equationMathSettings(null),{naryLimit:'undOvr',integralLimit:'subSup'});
  });
  it('passes settings from the related DOCX part into the imported preview',async()=>{
    const imported=await importThesisDocx(docxImportFixture({body:'<w:p><m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub><m:r><m:t>i</m:t></m:r></m:sub><m:sup><m:r><m:t>n</m:t></m:r></m:sup><m:e><m:r><m:t>x</m:t></m:r></m:e></m:nary></m:oMath></w:p>',relationships:'<Relationship Id="rSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="options.xml"/>',parts:{'word/options.xml':`<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="${M}"><m:mathPr><m:naryLim m:val="subSup"/></m:mathPr></w:settings>`}}));
    assert.match(contentNodesToHtml(imported.sections[0].nodes),/<msubsup[ >]/);
    assert.doesNotMatch(contentNodesToHtml(imported.sections[0].nodes),/<munderover[ >]/);
  });
});
