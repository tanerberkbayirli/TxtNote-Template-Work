import { strToU8, zipSync } from "fflate";
import { readDocxPackage, W, child, elements, attr } from "./importPackage.js";
import { safeFieldInstruction, runFormatAttributes } from "./runFormat.js";
import { readParagraphProperties, readRunProperties } from "./properties.js";
import { auditDocxFields } from "./fields.js";
import { nativeDrawingRun } from "./nativeDrawings.js";
import { finalizeThesisDocx } from "./package.js";
import { Document, Packer, Paragraph } from "./runtime.js";
import { imageRun } from "./imageRuns.js";
import { equationRun } from "./equations.js";

const XML = "http://www.w3.org/XML/1998/namespace";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const decode = (value) => String(value ?? "").replace(/&(?:amp|quot|lt|gt|apos|nbsp|#\d+|#x[\da-f]+);/gi, entity => {
  const key = entity.slice(1, -1).toLowerCase();
  if (key[0] !== "#") return {amp:"&",quot:'"',lt:"<",gt:">",apos:"'",nbsp:"\u00a0"}[key];
  const n = key[1] === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "\ufffd";
});
const textOf = node => node.type === "text" ? decode(node.text) : (node.children || []).map(textOf).join("");
// CT_RPr / CT_PPr child order; Word rejects out-of-order property children.
const RPR_ORDER = "rStyle rFonts b bCs i iCs caps smallCaps strike dstrike outline shadow emboss imprint noProof snapToGrid vanish webHidden color spacing w kern position sz szCs highlight u effect bdr shd fitText vertAlign rtl cs em lang eastAsianLayout specVanish oMath".split(" ");
const PPR_ORDER = "pStyle keepNext keepLines pageBreakBefore framePr widowControl numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr sectPr pPrChange".split(" ");
// Leaf run content: the model may attach text children to these, OOXML forbids them.
const LEAF_RUN_CONTENT = new Set(["tab","br","cr","noBreakHyphen","softHyphen","separator","continuationSeparator","pgNum","dayShort","dayLong","monthShort","monthLong","yearShort","yearLong","annotationRef","footnoteRef","endnoteRef"]);
const sortProperties = (pr, order) => {
  const rank = n => { const i = n.namespaceURI === W ? order.indexOf(n.localName) : -1; return i < 0 ? order.length : i; };
  const kids = Array.from(pr.childNodes).filter(n => n.nodeType === 1).map((n, i) => ({n, i, r: rank(n)}));
  kids.sort((a, b) => a.r - b.r || a.i - b.i).forEach(({n}) => pr.appendChild(n));
};
const METADATA = {p:["pPr"],r:["rPr"],tbl:["tblPr","tblGrid"],tr:["tblPrEx","trPr"],tc:["tcPr"],sdt:["sdtPr","sdtEndPr"]};

/** Source-mode writer. Rebuild the body from LIVE nodes, using source XML only
 * as property/opaque-object templates. Styles, numbering and resource owners
 * stay in their original package; presentation HTML/CSS never becomes OOXML.
 * In particular, fields may span paragraphs AND source sections.
 */
export async function buildSourceDocx(model) {
  const content = model.nativeDocument;
  if (content?.formatMode !== "source" || content.source?.format !== "docx" || !content.source.packageBase64) return null;
  const binary = atob(content.source.packageBase64);
  const pkg = await readDocxPackage(Uint8Array.from(binary, c => c.charCodeAt(0)));
  const doc = pkg.xml(pkg.mainPart), body = child(doc.documentElement, "body");
  const templates = new Map();
  const index = node => { templates.set(pkg.location(node), node); elements(node).forEach(index); };
  index(doc.documentElement);
  for (const section of content.sections) for (const kind of ["header", "footer"]) for (const ref of Object.values(section.properties?.headerFooterReferences?.[kind] || {})) {
    const root = ref.part && pkg.xml(ref.part)?.documentElement;
    if (root) index(root);
  }
  for(const note of Object.values(content.notes||{})){
    const part=note.locator?.split(':')[0],root=part&&pkg.xml(part)?.documentElement;
    if(root)index(root);
  }
  const make = name => doc.createElementNS(W, "w:" + name);
  const value = (parent, name, val) => {
    let n = child(parent, name); if (!n) { n = make(name); parent.appendChild(n); }
    n.setAttributeNS(W, "w:val", String(val)); return n;
  };
  const property = (el, name) => {
    let pr = child(el, name); if (!pr) { pr = make(name); el.insertBefore(pr, el.firstChild); } return pr;
  };
  const set = (n, name, v) => n.setAttributeNS(W, "w:" + name, String(v));
  const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  const paragraphFormat = (el, node, original) => {
    const old = readParagraphProperties(child(original, "pPr"));
    const direct = node.properties?.direct || {};
    const delta = Object.fromEntries(Object.entries(direct).filter(([k,v]) => changed(old[k],v)));
    const align = /(?:^|\s)fmt-align-(left|center|right|justify)(?:\s|$)/.exec(node.attributes?.class || "")?.[1];
    if (align) delta.align = align;
    if (!Object.keys(delta).length) return;
    const pr = property(el, "pPr");
    if (delta.align) value(pr,"jc",delta.align === "justify" ? "both" : delta.align);
    for (const [key,tag] of [["keepWithNext","keepNext"],["keepLines","keepLines"],["pageBreakBefore","pageBreakBefore"],["widowControl","widowControl"],["contextualSpacing","contextualSpacing"]]) if (delta[key] !== undefined) value(pr,tag,delta[key] ? 1 : 0);
    for (const [key,name] of [["spaceBeforePt","before"],["spaceAfterPt","after"]]) if (delta[key] !== undefined) set(property(pr,"spacing"),name,Math.round(delta[key]*20));
    if (delta.lineSpacing) { const s=property(pr,"spacing");set(s,"line",Math.round(delta.lineSpacing.value*(delta.lineSpacing.rule === "auto" ? 240 : 20)));set(s,"lineRule",delta.lineSpacing.rule); }
    for (const [key,name] of [["leftIndentMm","left"],["rightIndentMm","right"],["firstLineIndentMm","firstLine"],["hangingIndentMm","hanging"]]) if (delta[key] !== undefined) set(property(pr,"ind"),name,Math.round(delta[key]*1440/25.4));
    sortProperties(pr, PPR_ORDER);
  };
  const runFormat = (el, node, original, inherited = {}) => {
    const direct = node.properties?.direct || {};
    const old = readRunProperties(child(original,"rPr"));
    const expected = runFormatAttributes(old), attrs = node.attributes || {};
    const overrides = {...inherited,...Object.fromEntries(Object.entries(direct).filter(([k,v]) => changed(old[k],v)))};
    for (const [key,cls] of [["bold","fmt-bold"],["italic","fmt-italic"],["underline","fmt-underline"],["strike","fmt-strike"]]) {
      const has = (attrs.class || "").split(/\s+/).includes(cls);
      const had = (expected.class || "").split(/\s+/).includes(cls);
      if (has !== had || !original && has) overrides[key] = has;
      if ((attrs.class || "").split(/\s+/).includes(`fmt-not-${key}`)) overrides[key] = false;
    }
    for (const [key,a] of [["fontSizePt","data-fmt-pt"],["color","data-fmt-color"]]) if (attrs[a] !== undefined) overrides[key] = key === "fontSizePt" ? Number(attrs[a]) : attrs[a];
    if (!Object.keys(overrides).length) return;
    const pr = property(el,"rPr");
    for (const [key,tag] of [["bold","b"],["italic","i"],["strike","strike"],["caps","caps"],["smallCaps","smallCaps"],["hidden","vanish"]]) if (overrides[key] !== undefined) value(pr,tag,overrides[key] ? 1 : 0);
    if (overrides.underline !== undefined) value(pr,"u",overrides.underline ? "single" : "none");
    if (overrides.fontSizePt > 0) { value(pr,"sz",Math.round(overrides.fontSizePt*2));value(pr,"szCs",Math.round(overrides.fontSizePt*2)); }
    if (overrides.fontFamily) { const f=property(pr,"rFonts");for(const a of ["ascii","hAnsi","eastAsia","cs"])set(f,a,overrides.fontFamily); }
    if (/^#[\da-f]{6}$/i.test(overrides.color || "")) value(pr,"color",overrides.color.slice(1));
    if (attrs["data-fmt-valign"]) value(pr,"vertAlign",attrs["data-fmt-valign"] === "super" ? "superscript" : "subscript");
    sortProperties(pr, RPR_ORDER);
  };
  const source = node => templates.get(node.properties?.locator);
  const normalizedDrawings = new Map();
  const authoredObjects = new Map();
  const mainRelsPath=pkg.mainPart.replace(/([^/]+)$/,'_rels/$1.rels');
  const mainRels=pkg.xml(mainRelsPath);
  let linkId=0;
  const noteParts=new Map();
  let numberingPart;
  const appendList=(node,level=0,numId)=>{
    if(!numberingPart){
      const part=Object.values(pkg.relationships(pkg.mainPart)).find(r=>r.type.endsWith('/numbering'))?.part || 'word/numbering.xml';
      if(!pkg.files[part]){
        pkg.files[part]=strToU8(`<w:numbering xmlns:w="${W}"/>`);
        const rel=mainRels.createElementNS(RELS,'Relationship');rel.setAttribute('Id','txnSourceNumbering');rel.setAttribute('Type',R+'/numbering');rel.setAttribute('Target','numbering.xml');mainRels.documentElement.appendChild(rel);
        const types=pkg.xml('[Content_Types].xml'),type=types.createElementNS(types.documentElement.namespaceURI,'Override');type.setAttribute('PartName','/'+part);type.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml');types.documentElement.appendChild(type);pkg.files['[Content_Types].xml']=strToU8(pkg.serialize(types));
      }
      numberingPart={part,xml:pkg.xml(part)};
    }
    const root=numberingPart.xml.documentElement;
    if(numId===undefined){
      const abstractId=Math.max(-1,...elements(root).filter(n=>n.localName==='abstractNum').map(n=>Number(attr(n,'abstractNumId'))))+1;
      numId=Math.max(0,...elements(root).filter(n=>n.localName==='num').map(n=>Number(attr(n,'numId'))))+1;
      const abstract=make('abstractNum');set(abstract,'abstractNumId',abstractId);
      for(let i=0;i<9;i++){const lvl=make('lvl');set(lvl,'ilvl',i);value(lvl,'start',i===0?Number(node.attributes?.start)||1:1);value(lvl,'numFmt',node.tag==='ul'?'bullet':'decimal');value(lvl,'lvlText',node.tag==='ul'?'•':`%${i+1}.`);value(lvl,'lvlJc','left');const pr=make('pPr'),ind=make('ind');set(ind,'left',720*(i+1));set(ind,'hanging',360);pr.appendChild(ind);lvl.appendChild(pr);abstract.appendChild(lvl);}
      root.appendChild(abstract);const num=make('num');set(num,'numId',numId);value(num,'abstractNumId',abstractId);root.appendChild(num);
    }
    const result=[];
    for(const item of node.children||[]){
      if(item.type!=='listItem'&&item.tag!=='li')continue;
      const nested=(item.children||[]).filter(n=>n.type==='list');
      const ordinary=(item.children||[]).filter(n=>n.type!=='list');
      const rendered=ordinary.flatMap(n=>render(n));
      let paragraphs=rendered.filter(n=>n.localName==='p');
      if(!paragraphs.length){const p=make('p');rendered.forEach(n=>p.appendChild(n));paragraphs=[p];}
      for(const p of paragraphs){const pr=property(p,'pPr'),num=property(pr,'numPr');value(num,'ilvl',Math.min(8,level));value(num,'numId',numId);result.push(p);}
      for(const n of nested)result.push(...appendList(n,level+1,numId));
    }
    return result;
  };
  const appendNote=node=>{
    const kind=node.type==='endnoteReference'?'endnote':'footnote';
    let part=Object.values(pkg.relationships(pkg.mainPart)).find(r=>r.type.endsWith('/'+kind+'s'))?.part;
    if(!part){
      part='word/'+kind+'s.xml';
      pkg.files[part]=strToU8(`<w:${kind}s xmlns:w="${W}"><w:${kind} w:id="-1" w:type="separator"><w:p><w:r><w:separator/></w:r></w:p></w:${kind}><w:${kind} w:id="0" w:type="continuationSeparator"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:${kind}></w:${kind}s>`);
      const rel=mainRels.createElementNS(RELS,'Relationship');rel.setAttribute('Id','txnSource'+kind);rel.setAttribute('Type',R+'/'+kind+'s');rel.setAttribute('Target',kind+'s.xml');mainRels.documentElement.appendChild(rel);
      const types=pkg.xml('[Content_Types].xml'),override=types.createElementNS(types.documentElement.namespaceURI,'Override');override.setAttribute('PartName','/'+part);override.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.'+kind+'s+xml');types.documentElement.appendChild(override);pkg.files['[Content_Types].xml']=strToU8(pkg.serialize(types));
    }
    const notes=pkg.xml(part),root=notes.documentElement;
    const id=Math.max(0,...elements(root).map(n=>Number(attr(n,'id'))||0))+1;
    const note=make(kind),p=make('p'),markRun=make('r'),mark=make(kind+'Ref'),textRun=make('r'),text=make('t');
    set(note,'id',id);text.textContent=node.attributes?.['data-fn-text']||'';text.setAttributeNS(XML,'xml:space','preserve');
    markRun.appendChild(mark);textRun.appendChild(text);p.appendChild(markRun);p.appendChild(textRun);note.appendChild(p);root.appendChild(note);noteParts.set(part,notes);
    const run=make('r'),reference=make(kind+'Reference');set(reference,'id',id);run.appendChild(reference);return [run];
  };
  const authorFormat = (node,inherited={}) => {
    const result={...inherited},a=node.attributes||{},cls=a.class||"";
    for(const [key,tag,token] of [["bold",/^(b|strong)$/,"fmt-bold"],["italic",/^(i|em)$/,"fmt-italic"],["underline",/^u$/,"fmt-underline"],["strike",/^(s|del)$/,"fmt-strike"]])if(tag.test(node.tag||"")||cls.split(/\s+/).includes(token))result[key]=true;
    for (const key of ["bold", "italic"]) if (cls.split(/\s+/).includes(`fmt-not-${key}`)) result[key] = false;
    if(a['data-fmt-pt'])result.fontSizePt=Number(a['data-fmt-pt']);
    if(a['data-fmt-color'])result.color=a['data-fmt-color'];
    return result;
  };
  const branches = node => {
    const chartEx = (node.children || []).find(n=>n.properties?.nativeName === "Choice" && /drawing\/2014\/chartex/.test(pkg.serialize(source(n))));
    return chartEx ? [chartEx] : (node.children || []).filter(n=>n.properties?.selected);
  };
  const inlineTags = new Set(["span","strong","b","i","em","u","s","sup","sub"]);
  const render = (node, inRun = false, inherited = {}) => {
    if (node.type === "text") {
      const t=make("t"); t.setAttributeNS(XML,"xml:space","preserve"); t.textContent=decode(node.text);
      if(inRun)return [t];
      const r=make("r");runFormat(r,{attributes:{},properties:{direct:inherited}},null);r.appendChild(t);return [r];
    }
    const original=source(node), name=node.properties?.nativeName;
    if(!original && ['footnoteReference','endnoteReference'].includes(node.type))return appendNote(node);
    if(!original && node.type==='list' && !node.properties?.numId)return appendList(node);
    if(authoredObjects.has(node.id))return authoredObjects.get(node.id).map(n=>n.cloneNode(true));
    if(node.type === "alternative" || name === "AlternateContent")return branches(node).flatMap(n=>render(n,inRun,inherited));
    if(node.type === "alternativeBranch" || ["Choice","Fallback"].includes(name))return (node.children||[]).flatMap(n=>render(n,inRun,inherited));
    // Browser-only table/list/preview wrappers are not Word elements.
    if (!original && ["drawingPreview","drawingSummary"].includes(node.type) || node.tag === "colgroup" || node.tag === "col") return [];
    if (original && ["drawing","pict","object"].includes(name)) {
      const relations=pkg.relationships(node.properties.locator.split(':')[0]);
      const check=n=>{for(const a of Array.from(n.attributes||[]))if(a.namespaceURI===R){const relation=relations[a.value];if(relation?.external&&!relation.type.endsWith('/hyperlink'))throw new Error('Word çizimi için dış ilişki desteklenmiyor');}elements(n).forEach(check);};
      check(original);
      if(normalizedDrawings.has(node.id)){
        const run=normalizedDrawings.get(node.id).cloneNode(true);
        return inRun ? elements(run) : [run];
      }
      const clone=original.cloneNode(true);
      // Textbox paragraphs remain editable; patch their live subtrees without
      // reconstructing the surrounding DrawingML/VML geometry.
      const replacements=new Map();
      const visit=n=>{if(n.properties?.nativeName === "p" && source(n))replacements.set(n.properties.locator,n);else (n.children||[]).forEach(visit);};
      (node.children||[]).forEach(visit);
      const patch=(a,b)=>{const live=replacements.get(pkg.location(a));if(live){b.parentNode.replaceChild(render(live)[0],b);return;}const aa=elements(a),bb=elements(b);aa.forEach((c,i)=>patch(c,bb[i]));};
      patch(original,clone);return [clone];
    }
    if (original && ["annotation","bookmark","equation","footnoteReference","endnoteReference","symbol","image"].includes(node.type)) return [original.cloneNode(true)];
    if (original && name === "instrText") { const el=original.cloneNode(false);el.textContent=safeFieldInstruction(node.attributes?.["data-docx-instruction"] ?? node.properties.instruction);return [el]; }
    if (original && name === "fldChar") { const el=original.cloneNode(true);set(el,"fldCharType",node.attributes?.["data-docx-fldchar"] || node.properties.fieldType);return [el]; }
    if (original && ["t","delText"].includes(name)) { const el=original.cloneNode(false);el.textContent=textOf(node);el.setAttributeNS(XML,"xml:space","preserve");return [el]; }
    if (!original && ["list","listItem","tableBody"].includes(node.type)) return (node.children||[]).flatMap(n=>render(n,inRun,inherited));
    if(!original && node.tag==='div' && (node.children||[]).some(n=>['p','div','table','ol','ul'].includes(n.tag)))return(node.children||[]).flatMap(n=>render(n,false,authorFormat(node,inherited)));
    let native = original ? name : ({p:"p",h1:"p",h2:"p",h3:"p",h4:"p",h5:"p",h6:"p",div:"p",table:"tbl",tbody:null,tr:"tr",td:"tc",th:"tc",br:"br",a:"hyperlink"})[node.tag];
    if (!original && inlineTags.has(node.tag)) native=inRun ? null : "r";
    if (!native) return (node.children||[]).flatMap(n=>render(n,inRun,authorFormat(node,inherited)));
    const el=original ? original.cloneNode(false) : make(native);
    if(native==='hyperlink'){
      const href=node.attributes?.href||'';
      if(/^#[A-Za-z_][\w]*$/.test(href)){el.removeAttributeNS(R,'id');set(el,'anchor',href.slice(1));}
      else if(/^https?:|^mailto:/i.test(href)){
        const current=original?.getAttributeNS(R,'id'),relation=current&&pkg.relationships(pkg.mainPart)[current];
        if(!relation||relation.target!==href){
          let id;do{id='txnSourceLink'+(++linkId);}while(elements(mainRels.documentElement).some(r=>r.getAttribute('Id')===id));
          const rel=mainRels.createElementNS(RELS,'Relationship');rel.setAttribute('Id',id);rel.setAttribute('Type',R+'/hyperlink');rel.setAttribute('Target',href);rel.setAttribute('TargetMode','External');mainRels.documentElement.appendChild(rel);el.setAttributeNS(R,'r:id',id);el.removeAttributeNS(W,'anchor');
        }
      }else return(node.children||[]).flatMap(n=>render(n,false,inherited));
    }
    if(native === 'r' && (node.children||[]).some(n=>['t','delText'].includes(n.properties?.nativeName) && (n.children||[]).some(c=>c.tag))){
      const output=[];
      for(const n of node.children||[]){
        if(['t','delText'].includes(n.properties?.nativeName)){
          const leaves=[];
          const flatten=(n,format)=>{if(n.type==='text')leaves.push({text:decode(n.text),format});else(n.children||[]).forEach(c=>flatten(c,authorFormat(n,format)));};
          flatten(n,authorFormat(node,inherited));
          for(const leaf of leaves){const r=original.cloneNode(false);const pr=child(original,'rPr');if(pr)r.appendChild(pr.cloneNode(true));runFormat(r,{properties:{direct:leaf.format}},original);const t=make('t');t.setAttributeNS(XML,'xml:space','preserve');t.textContent=leaf.text;r.appendChild(t);output.push(r);}
        }else {const r=original.cloneNode(false);const pr=child(original,'rPr');if(pr)r.appendChild(pr.cloneNode(true));for(const c of render(n,true,inherited))r.appendChild(c);output.push(r);}
      }
      return output;
    }
    if (native === "sdt") {
      for(const c of elements(original)) if(METADATA.sdt.includes(c.localName))el.appendChild(c.cloneNode(true));
      const wrapper=make("sdtContent");
      const kids=node.children?.some(n=>n.properties?.nativeName === "sdtContent") ? node.children.flatMap(n=>n.properties?.nativeName === "sdtContent" ? n.children : []) : node.children;
      for(const n of kids||[])for(const c of render(n))wrapper.appendChild(c);
      el.appendChild(wrapper);return [el];
    }
    const metadata=METADATA[native]||[];
    for(const c of elements(original)) if(metadata.includes(c.localName)){
      const clone=c.cloneNode(true);
      if(native === "p")for(const sect of elements(clone).filter(n=>n.localName === "sectPr"))clone.removeChild(sect);
      el.appendChild(clone);
    }
    if(native === "p")paragraphFormat(el,node,original);
    if(native === 'p' && !original && /^h[1-6]$/.test(node.tag)){
      const level=Number(node.tag.slice(1))-1;
      const styleId=Object.keys(content.styles||{}).find(id=>content.styles[id].type==='paragraph'&&content.styles[id].properties?.outlineLevel===level);
      if(styleId)value(property(el,'pPr'),'pStyle',styleId);
      else value(property(el,'pPr'),'outlineLvl',level);
    }
    const format=authorFormat(node,inherited);
    if(native === "r")runFormat(el,node,original,inherited);
    if(native === "fldSimple")set(el,"instr",safeFieldInstruction(node.attributes?.["data-docx-fldsimple"] || attr(original,"instr")));
    if(!(original && LEAF_RUN_CONTENT.has(native)))for(const n of node.children||[])for(const c of render(n,native === "r",format))el.appendChild(c);
    if(native === 'r' && elements(el).some(c=>c.localName==='r'||['oMath','oMathPara'].includes(c.localName))){
      const result=[],pr=child(el,'rPr');let current=el.cloneNode(false);if(pr)current.appendChild(pr.cloneNode(true));
      const flush=()=>{if(elements(current).some(c=>c.localName!=='rPr'))result.push(current);current=el.cloneNode(false);if(pr)current.appendChild(pr.cloneNode(true));};
      for(const c of elements(el).filter(c=>c.localName!=='rPr'))if(c.localName==='r'||['oMath','oMathPara'].includes(c.localName)){flush();result.push(c);}else current.appendChild(c);
      flush();return result;
    }
    if(native === "tc" && !elements(el).some(c=>c.localName === "p")){const p=make("p");el.appendChild(p);}
    return [el];
  };
  // Reuse the existing editable-object adapters (relationship ownership,
  // unique VML IDs, ChartEx wrappers, external dependency checks and chart
  // normalization), rather than losing those contracts in source mode.
  const drawings=[],newObjects=[];
  const collect=nodes=>{for(const n of nodes||[]){if(n.type === "alternative" || n.properties?.nativeName === "AlternateContent"){collect(branches(n));continue;}if(source(n)&&["drawing","pict"].includes(n.properties?.nativeName))drawings.push(n);else if(n.properties?.nativeName!=='object')collect(n.children);}};
  content.sections.forEach(s=>collect(s.nodes));
  const collectAuthored=nodes=>{for(const n of nodes||[]){if(!source(n)&&(n.tag==='img'||n.type==='equation'))newObjects.push(n);else collectAuthored(n.children);}};
  content.sections.forEach(s=>collectAuthored(s.nodes));
  if(drawings.length||newObjects.length){
    const context={nativeDocument:content,nativeDrawings:[]};
    const runs=drawings.map(n=>nativeDrawingRun({xml:pkg.serialize(render(n,true)[0]),part:n.properties.locator.split(":")[0]},context));
    const objects=newObjects.map(n=>{
      if(n.tag==='img'){const result=imageRun({...n.attributes,width:Number(n.attributes.width||n.attributes['data-img-w']),height:Number(n.attributes.height||n.attributes['data-img-h'])});if(!result)throw new Error('Kaynak belgeye eklenen görsel DOCX biçimine dönüştürülemedi');return [result];}
      const result=equationRun({latex:n.attributes?.['data-latex']||'',omml:n.attributes?.['data-docx-omml']},{fontFamily:'Cambria Math',fontSizePt:12});return Array.isArray(result)?result:[result];
    });
    const packed=await finalizeThesisDocx(await Packer.toBlob(new Document({sections:[{children:[new Paragraph({children:runs}),...objects.map(children=>new Paragraph({children}))]}]})),context);
    const normalized=await readDocxPackage(new Uint8Array(await packed.arrayBuffer()));
    const paragraph=child(child(normalized.xml(normalized.mainPart).documentElement,"body"),"p");
    const resultRuns=elements(paragraph).filter(n=>n.localName === "r");
    const newParagraphs=elements(child(normalized.xml(normalized.mainPart).documentElement,'body')).filter(n=>n.localName==='p').slice(1);
    const normalizedRels=normalized.xml('word/_rels/document.xml.rels');
    let imageId=0;
    for(const relation of elements(normalizedRels.documentElement))if(relation.getAttribute('Type').endsWith('/image')){
      const old=relation.getAttribute('Id'),id='txnSourceImage'+(++imageId);relation.setAttribute('Id',id);
      const replace=n=>{for(const a of Array.from(n.attributes||[]))if(a.namespaceURI===R&&a.value===old)a.value=id;elements(n).forEach(replace);};newParagraphs.forEach(replace);resultRuns.forEach(replace);
    }
    normalized.files['word/_rels/document.xml.rels']=strToU8(normalized.serialize(normalizedRels));
    // Imported only after the image relationships were renamed, so native
    // drawing runs reference the relationship ids that are written to the package.
    drawings.forEach((n,i)=>normalizedDrawings.set(n.id,doc.importNode(resultRuns[i],true)));
    newObjects.forEach((n,i)=>authoredObjects.set(n.id,elements(newParagraphs[i]).filter(el=>el.localName!=='pPr').map(el=>doc.importNode(el,true))));
    for(const [name,bytes] of Object.entries(normalized.files))if(name.startsWith("word/txnNative/")||name.startsWith('word/media/'))pkg.files[name]=bytes;
    for(const [name,key] of [["[Content_Types].xml","PartName"],["word/_rels/document.xml.rels","Id"]]){
      const into=pkg.xml(name), from=normalized.xml(name);
      const existing=new Set(elements(into.documentElement).map(n=>n.getAttribute(key)||n.getAttribute("Extension")));
      for(const n of elements(from.documentElement)){
        const id=n.getAttribute(key)||n.getAttribute("Extension");
        if(name.endsWith(".rels")&&!id.startsWith("txn"))continue;
        if(!existing.has(id)){into.documentElement.appendChild(into.importNode(n,true));existing.add(id);}
      }
      pkg.files[name]=strToU8(pkg.serialize(into));
    }
  }
  // Rebuild every active section in order. Section properties live at the end
  // of each section, even when its former terminal paragraph was deleted.
  const rendered=[];
  for(const [i,section] of content.sections.entries()){
    const nodes=(section.nodes||[]).flatMap(n=>render(n));
    const props=section.properties?.ooxml;
    if(props){
      const parser = typeof DOMParser === "undefined" ? new (await import("@xmldom/xmldom")).DOMParser() : new DOMParser();
      const sect=doc.importNode(parser.parseFromString(props,"application/xml").documentElement,true);
      const effective=model.sections.find(s=>s.id===section.id || s.type==='mainContent'&&section.id===(content.mainSectionId||'main'))?.rules.page;
      if(effective && model.documentLayout?.page){
        const size=property(sect,'pgSz');set(size,'w',Math.round(effective.widthMm*1440/25.4));set(size,'h',Math.round(effective.heightMm*1440/25.4));set(size,'orient',effective.orientation||'portrait');
        const margins=effective.docxMargins||effective.margins,mar=property(sect,'pgMar');
        for(const [name,key] of [['left','leftMm'],['right','rightMm'],['top','topMm'],['bottom','bottomMm']])set(mar,name,Math.round(margins[key]*1440/25.4));
      }
      if(i === content.sections.length-1)nodes.push(sect);
      else {
        let last=nodes.at(-1);
        if(last?.localName === "sdt")last=elements(child(last,"sdtContent")).at(-1);
        if(last?.localName !== "p"){last=make("p");nodes.push(last);}
        property(last,"pPr").appendChild(sect);
      }
    }
    // The importer splits a gallery/content-control at section boundaries.
    // Rejoin consecutive pieces of the SAME source control, not its neighbours.
    for(const n of nodes){
      const previous=rendered.at(-1);
      const sourceSdt=section.nodes?.find(x=>x.properties?.nativeName === "sdt");
      if(n.localName === "sdt" && previous?.node.localName === "sdt" && previous.locator === sourceSdt?.properties.locator){
        const into=child(previous.node,"sdtContent");while(child(n,"sdtContent").firstChild)into.appendChild(child(n,"sdtContent").firstChild);
      }else rendered.push({node:n,locator:n.localName === "sdt" ? sourceSdt?.properties.locator : null});
    }
  }
  while(body.firstChild)body.removeChild(body.firstChild);
  for(const {node} of rendered)body.appendChild(node);
  pkg.files[pkg.mainPart]=strToU8(pkg.serialize(doc));
  pkg.files[mainRelsPath]=strToU8(pkg.serialize(mainRels));
  const chromeParts=new Map();
  for(const section of content.sections)for(const kind of ["header","footer"])for(const ref of Object.values(section.properties?.headerFooterReferences?.[kind]||{}))if(ref.part&&ref.nodes)chromeParts.set(ref.part,ref);
  for(const [part,ref] of chromeParts){
    const root=pkg.xml(part)?.documentElement.cloneNode(false);
    if(!root)continue;
    for(const n of ref.nodes)for(const el of render(n))root.appendChild(el);
    // Keep the real fields but discard stale source-machine PAGE/NUMPAGES
    // caches. Word evaluates them for its final pagination.
    const fields=[];
    const refresh=el=>{
      if(el.localName === "fldSimple"){
        const code=safeFieldInstruction(attr(el,"instr")).trim();
        if(["PAGE","NUMPAGES"].includes(code)){
          const r=make("r"),begin=make("fldChar"),instruction=make("instrText"),separate=make("fldChar"),end=make("fldChar");
          set(begin,"fldCharType","begin");instruction.textContent=code;set(separate,"fldCharType","separate");set(end,"fldCharType","end");
          [begin,instruction,separate,end].forEach(n=>r.appendChild(n));el.parentNode.replaceChild(r,el);return;
        }
      }
      if(el.localName === "fldChar"){
        const type=attr(el,"fldCharType");if(type === "begin")fields.push({code:"",result:false});if(type === "separate"&&fields.length)fields.at(-1).result=true;if(type === "end")fields.pop();
      }else if(el.localName === "instrText"&&fields.length){el.textContent=safeFieldInstruction(el.textContent).trim();fields.at(-1).code+=el.textContent;}
      else if(el.localName === "t"&&fields.at(-1)?.result&&["PAGE","NUMPAGES"].includes(fields.at(-1).code.trim()))el.textContent="";
      elements(el).forEach(refresh);
    };
    refresh(root);pkg.files[part]=strToU8(pkg.serialize(root));
  }
  for(const note of Object.values(content.notes||{})){
    const original=templates.get(note.locator),part=note.locator?.split(':')[0];
    if(!original||!part)continue;
    const clone=original.cloneNode(false);for(const n of note.nodes||[])for(const el of render(n))clone.appendChild(el);
    original.parentNode.replaceChild(clone,original);noteParts.set(part,pkg.xml(part));
  }
  for(const [part,notes] of noteParts)pkg.files[part]=strToU8(pkg.serialize(notes));
  if(numberingPart)pkg.files[numberingPart.part]=strToU8(pkg.serialize(numberingPart.xml));
  // New notes/list relationships can be created while stories are rendered.
  pkg.files[mainRelsPath]=strToU8(pkg.serialize(mainRels));
  let drawingId=0;
  for(const name of Object.keys(pkg.files).filter(name=>/^word\/(?:document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(name)).sort()){
    // Headers kept their original resource owner; drawing IDs still share the
    // package-wide uniqueness contract with the normalized body objects.
    const xml=new TextDecoder().decode(pkg.files[name]);
    pkg.files[name]=strToU8(xml.replace(/<wp:docPr\b[^>]*>/g,tag=>tag.replace(/\bid="[^"]+"/,`id="${++drawingId}"`)));
  }
  const blob=new Blob([zipSync(pkg.files)],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  blob.wordXmlParts=Object.keys(pkg.files).filter(name=>/^word\/[^/]+\.xml$/.test(name)).map(name=>new TextDecoder().decode(pkg.files[name]));
  blob.exportIssues={fieldIssues:[],fieldAudit:auditDocxFields(blob.wordXmlParts)};
  return blob;
}
