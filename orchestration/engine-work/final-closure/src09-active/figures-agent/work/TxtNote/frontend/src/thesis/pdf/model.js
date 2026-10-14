import {createContentDocument,installContentDocument} from '../contentModel.js';
import {escape} from './structure.js';

export function pdfPagesToDocument(pages,{fileName='belge.pdf',sha256='',formatMode='source',issues=[],packageBase64=''}={}){
  let nextId=1;
  const node=(type,tag,children=[],properties={},attributes={})=>({id:'pdf-node-'+nextId++,type,tag,attributes,properties,children});
  const text=s=>({type:'text',text:escape(s)});
  const sourcePages=[];
  const sections=pages.map((page,index)=>{
    const margins={header:[],footer:[]};
    const locator=item=>({page:page.number,box:{x:item.x,y:item.y,width:item.width,height:item.height},origin:'top-left',units:'pt',method:page.method});
    const runs=line=>line.tokens.map((token,i)=>node('textRun','span',[text((i && !/\s$/.test(line.tokens[i-1].text)&&!/^\s/.test(token.text)&&token.x-line.tokens[i-1].x-line.tokens[i-1].width>Math.max(.8,token.height*.12)?' ':'')+token.text)],
      {pdf:{...locator(token),tokenId:token.id,confidence:token.confidence??null},resolvedSource:{fontSizePt:token.height,fontFamily:token.fontFamily||'Times New Roman',bold:Boolean(token.bold),italic:Boolean(token.italic)}}));
    const nodes=[];
    for(const item of page.items){
      const properties={pdf:locator(item),review:{required:true,reason:page.method!=='text'?'ocr':'inferred-layout'},...(item.reviewText!==undefined?{sourceTokens:item.lines?.flatMap(l=>l.tokens)||[]}:{})};
      let value;
      if(item.kind==='table'){
        const rows=[];
        for(let r=0;r<item.rows;r++)rows.push(node('row','tr',item.cells.filter(c=>c.row===r).map(cell=>node('cell','td',
          cell.reviewText!==undefined?[node('paragraph','p',[text(cell.reviewText)])]:cell.lines?.map(line=>node('paragraph','p',runs(line)))||[node('paragraph','p',[text(cell.text||'')])],{pdf:locator(cell),...(cell.reviewText!==undefined?{sourceTokens:cell.tokens}:{})}, {colspan:String(cell.colspan),rowspan:String(cell.rowspan)}))));
        value=node('table','table',[node('element','tbody',rows)],{...properties,grid:{rows:item.rows,columns:item.columns}},{'data-native-object':'table'});
      }else if(item.kind==='image')value=node('figure','figure',[node('image','img',[],{pdf:locator(item)},{src:item.dataUrl,alt:'PDF görseli · sayfa '+page.number,width:String(Math.round(item.width*96/72)),height:String(Math.round(item.height*96/72))})],properties);
      else {
        const children=[];if(item.reviewText!==undefined)children.push(text(item.reviewText));else item.lines.forEach((line,i)=>{if(i)children.push(node('break','br'));children.push(...runs(line));});
        value=node(item.kind==='heading'?'heading':'paragraph',item.kind==='heading'?'h2':'p',children,properties);
      }
      if(item.kind==='header'||item.kind==='footer'){margins[item.kind].push(value);continue;}
      nodes.push(value);
    }
    sourcePages.push({number:page.number,widthPt:page.width,heightPt:page.height,rotation:page.rotation||0,method:page.method,
      originalPreview:page.method==='text'?'':page.originalPreview||page.preview,originalWidthPt:page.originalWidthPt||page.width,originalHeightPt:page.originalHeightPt||page.height,ocrRotation:page.ocrRotation||0,
      nativeTokens:page.nativeTokens||page.tokens,
      sourceTokenCount:page.tokens.length,sourceText:page.tokens.map(t=>t.text).join(' '),tokens:page.tokens,preview:page.preview,
      margins,items:structuredClone(page.items),ocrConfidence:page.ocrConfidence??null});
    // Every physical page has a section, including blank pages and failed OCR.
    return {id:index?'pdf-page-'+page.number:'main',type:index?'custom':'mainContent',title:'',nodes,properties:{nativeSectionIndex:index,breakType:'nextPage',page:{widthMm:page.width*25.4/72,heightMm:page.height*25.4/72,margins:{topMm:15,rightMm:15,bottomMm:15,leftMm:15}},pdfPage:page.number}};
  });
  return createContentDocument({nextId,formatMode,retainedNodes:{},mainSectionId:'main',sectionKeys:Object.fromEntries(sections.slice(1).map(s=>[s.id,s.id])),sections,
    source:{format:'pdf',fileName,sha256,packageBase64,pages:sourcePages,unsupported:issues,
      importReport:{version:1,status:'REVIEW_REQUIRED',pages:pages.length,ocrPages:pages.filter(p=>p.method!=='text').length,issues:issues.length,
        reviewRequired:true,reviewed:false,scope:'PDF layout and OCR are inferred. Equations are not reconstructed as native mathematics.'}}});
}
export function installPdfDocument(note,document){return installContentDocument(note,document);}

/** Preview corrections rebuild only the staged note. Original token geometry,
 * original PDF bytes and located notices remain available after correction. */
export function revisePdfImport(note,pageNumber,change){
  const source=note.researchData.thesis.document.source;
  const pages=structuredClone(source.pages).map(p=>({...p,width:p.widthPt,height:p.heightPt}));
  const page=pages.find(p=>p.number===pageNumber);if(!page)throw new Error('PDF sayfası bulunamadı');change(page);
  const document=pdfPagesToDocument(pages,{...source,issues:source.unsupported,formatMode:note.researchData.thesis.document.formatMode});
  document.source.importReport.corrections=(source.importReport.corrections||0)+1;
  return installPdfDocument(note,document);
}
