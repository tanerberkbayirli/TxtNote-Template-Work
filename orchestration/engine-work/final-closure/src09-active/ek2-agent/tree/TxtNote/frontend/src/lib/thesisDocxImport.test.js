import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { importThesisDocx, importThesisWordFile } from "../thesis/importDocx.js";
import { contentNodesToHtml, installContentDocument, prepareThesisNote } from "../thesis/contentModel.js";
import { buildThesisCss, compileThesisDocument } from "../thesis/engine.js";
import { buildNotePayload, noteFromPayload } from "../features/sync/payload.js";
import { packageTarget } from "../thesis/docx/importPackage.js";
import generic from "../thesis/templates/generic.js";
import { docxImportFixture, styledDocxFixture } from "./fixtures/docxImportFixture.js";
const walk = nodes => nodes.flatMap(n => [n, ...walk(n.children || [])]);
const all = d => walk(d.sections.flatMap(s => s.nodes));
const file = (buffer,name="test.docx") => ({name,arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)});
const seed = () => ({title:"Tezim",content:"<p>Mevcut</p>",researchData:{thesis:{templateId:generic.id,values:{YEAR:"2026"}}}});

describe("native DOCX import", () => {
  it("maps Word sections, inherited paragraph/run styles, toggle properties and explicit false", async () => {
    const d=await importThesisDocx(styledDocxFixture());
    assert.equal(d.sections.length,2);assert.equal(d.sections[1].properties.page.orientation,"landscape");
    assert.equal(d.sections[1].properties.page.numbering.startAt,0);
    const p=all(d).filter(n=>n.properties?.nativeName==='p'),r=all(d).filter(n=>n.type==='run');
    assert.equal(p[0].tag,'h1');assert.equal(p[0].properties.styleId,'Heading');assert.equal(p[0].properties.resolvedSource.spaceAfterPt,8);
    assert.equal(r[0].properties.resolvedSource.fontFamily,'Arial');assert.equal(r[0].properties.resolvedSource.fontSizePt,16);
    assert.equal(r[0].properties.resolvedSource.bold,false);assert.equal(r[1].properties.resolvedSource.bold,false);assert.equal(r[2].properties.resolvedSource.bold,true);
  });
  it("renders every imported section in source and template modes without creating empty headings", async()=>{
    const note=await importThesisWordFile(file(styledDocxFixture()),seed());
    for(const mode of ['source','template']){
      note.researchData.thesis.document.formatMode=mode;
      const model=compileThesisDocument(generic,note.researchData.thesis,note.title,note.content);
      assert.ok(model.sections.some(s=>s.id==='docx-section-2'&&s.editorHtml.includes('Son bölüm')));
      assert.ok(!model.sections.some(s=>s.prefixHtml.includes('<h1 data-unnumbered="true"></h1>')));
      if(mode==='source'){assert.equal(model.sections.length,2);assert.equal(model.sections[1].rules.page.orientation,'landscape');assert.match(buildThesisCss(model),/font-family:"Arial"/);}
    }
  });
  it("keeps semantic node types, native properties and source bytes after JSON sync",async()=>{
    const note=await importThesisWordFile(file(styledDocxFixture()),seed());
    const loaded=noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:'docx',note}))));
    assert.deepEqual(loaded.researchData.thesis.document,note.researchData.thesis.document);
    assert.equal(all(loaded.researchData.thesis.document).filter(n=>n.type==='textRun').length,3);
    const edit=prepareThesisNote({...loaded,content:loaded.content.replace('Kaynak başlığı','Değişen başlık')});
    assert.equal(all(edit.researchData.thesis.document).find(n=>n.tag==='h1').properties.styleId,'Heading');
  });
  it("preserves whitespace, entities, field cache, tabs and breaks without executing XML or field code",async()=>{
    const d=await importThesisDocx(docxImportFixture({body:'<w:p><w:r><w:t xml:space="preserve">  A &amp; &lt; B </w:t><w:tab/><w:br/><w:instrText>HYPERLINK javascript:evil()</w:instrText><w:t>Önbellek</w:t></w:r></w:p>'}));
    const html=contentNodesToHtml(d.sections[0].nodes);
    assert.match(html,/  A &amp; &lt; B /);assert.match(html,/\t/);assert.match(html,/<br/);assert.match(html,/Önbellek/);assert.doesNotMatch(html,/javascript:evil/);
  });
  it("maps inherited multilevel numbering and explicit instance restart overrides",async()=>{
    const num='<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%2)"/></w:lvl></w:abstractNum><w:num w:numId="5"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="7"/></w:lvlOverride></w:num>';
    const p=(level,text)=>`<w:p><w:pPr><w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="5"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
    const d=await importThesisDocx(docxImportFixture({numbering:num,body:p(0,'Yedi')+p(1,'Alt')+p(0,'Sekiz')}));
    assert.equal(d.sections[0].nodes[0].tag,'ol');assert.equal(d.sections[0].nodes[0].attributes.start,'7');
    assert.equal(all(d).filter(n=>n.type==='paragraph').length,3);assert.equal(all(d).filter(n=>n.type==='listItem')[0].properties.ordinal,7);
    assert.ok(all(d).some(n=>n.type==='list'&&n.attributes.type==='a'));
  });
  it("keeps merged cell geometry, nested tables and range identities outside paragraphs",async()=>{
    const body='<w:bookmarkStart w:id="2" w:name="B"/><w:tbl><w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/><w:vMerge/></w:tcPr><w:p/></w:tc></w:tr><w:bookmarkEnd w:id="2"/></w:tbl>';
    const d=await importThesisDocx(docxImportFixture({body})),cells=all(d).filter(n=>n.type==='cell');
    assert.equal(cells[0].attributes.colspan,'2');assert.equal(cells[0].attributes.rowspan,'2');assert.equal(cells[1].attributes['data-docx-vmerge'],'continue');
    assert.ok(d.references['docx-bookmark-2']);assert.equal(all(d).filter(n=>n.type==='bookmark').length,2);
  });
  it("locates unsupported features and style cycles without dropping their source",async()=>{
    const d=await importThesisDocx(docxImportFixture({styles:'<w:style w:styleId="A"><w:basedOn w:val="B"/></w:style><w:style w:styleId="B"><w:basedOn w:val="A"/></w:style>',body:'<w:p><w:r><w:unknownThing/><m:oMath><m:r><m:t>x</m:t></m:r></m:oMath></w:r></w:p>'}));
    assert.ok(d.source.unsupported.some(i=>i.code==='style-cycle'));assert.ok(d.source.unsupported.some(i=>i.code==='equation-layout'&&i.locator.includes('oMath')));
    assert.ok(d.source.packageBase64);assert.ok(d.source.unsupported.every(i=>i.preserved&&i.locator));
  });
  it("blocks external image fetching and unsafe hyperlinks while retaining relationship provenance",async()=>{
    const d=await importThesisDocx(docxImportFixture({relationships:'<Relationship Id="bad" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:evil()" TargetMode="External"/>',body:'<w:p><w:hyperlink r:id="bad"><w:r><w:t>Bağlantı</w:t></w:r></w:hyperlink></w:p>'}));
    assert.ok(d.source.unsupported.some(i=>i.code==='unsafe-link'));assert.doesNotMatch(contentNodesToHtml(d.sections[0].nodes),/href="javascript:/);
  });
  it("rejects malformed and entity-bearing XML, invalid package paths and non-DOCX bytes",async()=>{
    await assert.rejects(importThesisDocx(new Uint8Array([1,2,3])),/DOCX paketi/);
    await assert.rejects(importThesisDocx(docxImportFixture({parts:{'word/document.xml':'<!DOCTYPE x [<!ENTITY x SYSTEM "file:///secret">]><x/>'}})),/dış varlık/);
    await assert.rejects(importThesisDocx(docxImportFixture({body:'<w:p><w:r></w:p>'})),/XML okunamadı/);
    assert.throws(()=>packageTarget('word/document.xml','../../private'),/paket dışına/);
  });
  it("offers a clear legacy DOC conversion route before reading bytes; failed imports leave notes intact",async()=>{
    const note=seed(),before=structuredClone(note);
    await assert.rejects(importThesisWordFile({name:'old.doc',arrayBuffer:()=>{throw Error('read')}} ,note),e=>e.code==='LEGACY_DOC_CONVERSION_REQUIRED'&&e.message.includes('LibreOffice'));
    assert.deepEqual(note,before);
  });
});
