import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {analyzePage,box,repeatedMargins,ruledTables,rasterRegions} from './pdf/structure.js';
import {pdfPagesToDocument,installPdfDocument} from './pdf/model.js';
import {base64} from './docx/importPackage.js';

const abortError=()=>new DOMException('PDF aktarımı iptal edildi','AbortError');
const check=signal=>{if(signal?.aborted)throw abortError();};
const canvas=(width,height)=>{const c=document.createElement('canvas');c.width=Math.ceil(width);c.height=Math.ceil(height);return c;};
const point=(m,x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function imageBoxes(ops,OPS,viewport){
  let transform=[1,0,0,1,0,0];const stack=[],result=[];
  ops.fnArray.forEach((op,i)=>{
    const args=ops.argsArray[i];
    if(op===OPS.save)stack.push([...transform]);
    else if(op===OPS.restore)transform=stack.pop()||[1,0,0,1,0,0];
    else if(op===OPS.transform)transform=multiply(transform,args);
    else if([OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject].includes(op)){
      const matrix=multiply(viewport.transform,transform),corners=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>({...point(matrix,x,y),width:0,height:0}));
      result.push({...box(corners),operation:i});
    }
  });return result;
}
function crop(source,rect,scale){
  const x=Math.max(0,Math.floor(rect.x*scale)),y=Math.max(0,Math.floor(rect.y*scale));
  const width=Math.min(source.width-x,Math.ceil(rect.width*scale)),height=Math.min(source.height-y,Math.ceil(rect.height*scale));
  if(width<1||height<1)return '';
  const out=canvas(width,height);out.getContext('2d').drawImage(source,x,y,width,height,0,0,width,height);return out.toDataURL('image/png');
}
function ocrTokens(data,scale,page){
  const words=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[])));
  return words.filter(w=>w.text).map((w,i)=>({id:`p${page}-ocr-${i}`,text:w.text,x:w.bbox.x0/scale,y:w.bbox.y0/scale,
    width:(w.bbox.x1-w.bbox.x0)/scale,height:(w.bbox.y1-w.bbox.y0)/scale,baseline:w.bbox.y1/scale,confidence:w.confidence,fontFamily:'Times New Roman'}));
}
function rotateCanvas(source,degrees){
  const swap=degrees===90||degrees===270,out=canvas(swap?source.height:source.width,swap?source.width:source.height),ctx=out.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);ctx.translate(out.width/2,out.height/2);ctx.rotate(degrees*Math.PI/180);ctx.drawImage(source,-source.width/2,-source.height/2);return out;
}
export async function importThesisPdf(buffer,{fileName='belge.pdf',signal,onProgress=()=>{},forceOcr=false,ocrLanguage='tur+eng'}={}){
  const original=new Uint8Array(buffer);if(original.length>64*1024*1024)throw new Error('PDF dosyası 64 MB sınırını aşıyor');
  if(!['tur+eng','tur','eng'].includes(ocrLanguage))throw new Error('Desteklenmeyen OCR dili');
  check(signal);
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
  const assetRoot=new URL(import.meta.env.BASE_URL+'pdf-assets/',location.href).href;
  const task=pdfjs.getDocument({data:original.slice(),isEvalSupported:false,enableXfa:false,stopAtErrors:true,
    cMapUrl:assetRoot+'cmaps/',cMapPacked:true,standardFontDataUrl:assetRoot+'standard_fonts/',wasmUrl:assetRoot+'wasm/'});
  let pdf,worker,renderTask,stopped=false;
  const cancel=()=>{stopped=true;renderTask?.cancel();void task.destroy();if(worker)void worker.terminate();};
  signal?.addEventListener('abort',cancel,{once:true});
  const pages=[],issues=[];
  const issue=(code,page,message,rect)=>issues.push({code,locator:`PDF sayfa ${page}${rect?` · x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)} pt`:''}`,page,message,preserved:true,...(rect?{box:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}}:{})});
  try{
    pdf=await task.promise;check(signal);if(pdf.numPages>1000)throw new Error('PDF 1000 sayfa sınırını aşıyor');
    for(let number=1;number<=pdf.numPages;number++){
      check(signal);onProgress({page:number,total:pdf.numPages,stage:'Sayfa okunuyor'});
      const page=await pdf.getPage(number),viewport=page.getViewport({scale:1});
      const scale=Math.min(2.5,Math.sqrt(12_000_000/(viewport.width*viewport.height)));
      if(!Number.isFinite(scale)||scale<=0)throw new Error(`PDF sayfa ölçüsü geçersiz: ${number}`);
      const rendered=canvas(viewport.width*scale,viewport.height*scale),ctx=rendered.getContext('2d',{willReadFrequently:true});
      renderTask=page.render({canvasContext:ctx,viewport:page.getViewport({scale}),background:'rgb(255,255,255)'});await renderTask.promise;renderTask=null;check(signal);
      const content=await page.getTextContent(),ops=await page.getOperatorList();
      let tokens=content.items.filter(t=>typeof t.str==='string'&&t.str.length).map((t,i)=>{
        const matrix=pdfjs.Util.transform(viewport.transform,t.transform),height=Math.max(1,Math.hypot(matrix[2],matrix[3]));
        const font=content.styles[t.fontName]||{},family=/Arial|Helvetica/i.test(font.fontFamily)?'Arial':/Calibri/i.test(font.fontFamily)?'Calibri':'Times New Roman';
        return {id:`p${number}-text-${i}`,text:t.str,x:matrix[4],y:matrix[5]-height,width:Math.abs(t.width),height,baseline:matrix[5],fontFamily:family,
          bold:/bold/i.test(font.fontFamily||''),italic:/italic|oblique/i.test(font.fontFamily||''),direction:t.dir};
      });
      let method='text',ocrConfidence=null,working=rendered,ocrRotation=0;
      const originalCanvas=canvas(viewport.width,viewport.height);originalCanvas.getContext('2d').drawImage(rendered,0,0,originalCanvas.width,originalCanvas.height);
      const originalPreview=originalCanvas.toDataURL('image/jpeg',.78);
      const painted=imageBoxes(ops,pdfjs.OPS,viewport),largeImage=painted.some(i=>i.width*i.height>viewport.width*viewport.height*.4);
      const nativeTokens=tokens;
      const imageWithoutText=painted.some(i=>i.width*i.height>viewport.width*viewport.height*.3&&tokens.filter(t=>t.x+t.width/2>=i.x&&t.x+t.width/2<=i.x+i.width&&t.y+t.height/2>=i.y&&t.y+t.height/2<=i.y+i.height).reduce((n,t)=>n+t.text.trim().length,0)<80);
      const needsOcr=forceOcr || imageWithoutText || (tokens.reduce((n,t)=>n+t.text.trim().length,0)<12&&largeImage);
      if(needsOcr){
        method='ocr';onProgress({page:number,total:pdf.numPages,stage:'OCR ile metin okunuyor'});
        if(!worker){
          const {createWorker}=await import('tesseract.js');check(signal);
          const root=new URL(import.meta.env.BASE_URL+'ocr/',location.href).href;
          worker=await createWorker(ocrLanguage,1,{workerPath:root+'worker.min.js',corePath:root,langPath:root,gzip:false,workerBlobURL:false,cacheMethod:'none',
            logger:m=>onProgress({page:number,total:pdf.numPages,stage:'OCR',progress:m.progress})});
          if(stopped){await worker.terminate();throw abortError();}
          await worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1',user_defined_dpi:String(Math.round(72*scale))});
        }
        let {data}=await worker.recognize(rendered,{rotateAuto:true},{text:true,blocks:true,imageColor:true});check(signal);
        if(data.confidence<65){
          let best=data;
          for(const angle of [90,180,270]){
            check(signal);onProgress({page:number,total:pdf.numPages,stage:'OCR yönü kontrol ediliyor'});
            const candidate=rotateCanvas(rendered,angle),result=await worker.recognize(candidate,{rotateAuto:true},{text:true,blocks:true,imageColor:true});check(signal);
            if(result.data.confidence>best.confidence){best=result.data;ocrRotation=angle;}
            candidate.width=candidate.height=1;
          }
          data=best;if(ocrRotation)issue('ocr-orientation',number,`OCR sayfa yönünü ${ocrRotation}° düzeltti; özgün sayfa görüntüsü ayrıca saklandı.`);
        }
        if(data.imageColor){const image=new Image();image.src=data.imageColor;await image.decode();working=canvas(image.width,image.height);working.getContext('2d').drawImage(image,0,0);}
        tokens=ocrTokens(data,scale,number);ocrConfidence=data.confidence;
        if(!forceOcr&&nativeTokens.length&&!ocrRotation&&Math.abs(data.rotateRadians||0)<.005){
          tokens=[...nativeTokens,...tokens.filter(t=>!nativeTokens.some(n=>{
            const area=Math.max(0,Math.min(t.x+t.width,n.x+n.width)-Math.max(t.x,n.x))*Math.max(0,Math.min(t.y+t.height,n.y+n.height)-Math.max(t.y,n.y));
            return area>t.width*t.height*.35;
          }))];method='mixed';
        }
        issue('ocr-review',number,'OCR metni tahmindir; metni, Türkçe karakterleri, formülleri ve okuma sırasını kaynak görüntüyle karşılaştırın. Formüller yerel denklem olarak kurulmaz.');
        if(Math.abs(data.rotateRadians||0)>.005)issue('ocr-deskew',number,'OCR eğimi düzeltti; sözcük konumları düzeltilmiş görüntüye aittir. Kaynak görüntü korunur.');
        const low=tokens.filter(t=>t.confidence<75);if(low.length)issue('ocr-low-confidence',number,`${low.length} sözcükte OCR güveni düşük; metni düzeltin.`);
        if(!tokens.length)issue('ocr-empty',number,'OCR metin bulamadı. Sayfa görüntüsü korundu; metni elle ekleyebilir veya OCR seçimini değiştirebilirsiniz.');
      }
      const previewCanvas=canvas(working.width/scale,working.height/scale);previewCanvas.getContext('2d').drawImage(working,0,0,previewCanvas.width,previewCanvas.height);
      const raster=working.getContext('2d',{willReadFrequently:true}).getImageData(0,0,working.width,working.height);
      const tables=ruledTables(raster,scale);
      const regions=method==='text'?painted.filter(i=>i.width>8&&i.height>8&&i.width*i.height<viewport.width*viewport.height*.8):rasterRegions(raster,scale,tokens,tables);
      const images=regions.map(i=>({...i,dataUrl:crop(working,i,scale)}));
      for(const image of images)if(image.candidate)issue('visual-region-review',number,'Tanımlanamayan görsel/çizim bölgesi çıkarıldı. Formül veya tanınmayan metin olabilir; kaynakla karşılaştırın.',image);
      const structured=analyzePage({number,width:working.width/scale,height:working.height/scale,rotation:page.rotate,method,tokens,tables,images,
        preview:previewCanvas.toDataURL('image/jpeg',.78),originalPreview,originalWidthPt:viewport.width,originalHeightPt:viewport.height,ocrRotation,ocrConfidence,nativeTokens});
      if(structured.multipleColumns)issue('reading-order-review',number,'Birden çok sütun veya hizalı alan bulundu; okuma sırasını kontrol edin.');
      for(const table of tables)issue('table-review',number,'Tablo çizgilerden çıkarıldı; hücre birleşimlerini ve okuma sırasını kontrol edin.',table);
      if(tokens.some(t=>/[∫∑√=±𝑎-𝑧]/u.test(t.text)))issue('formula-review',number,'Formül olabilecek metin bulundu; PDF matematik yapısını kodlamaz. Formülü kaynakla karşılaştırın.');
      if(!tokens.length&&!needsOcr)issue('empty-page',number,'Metin bulunmayan sayfa korundu. Görsel veya çizim varsa kaynak önizlemesini inceleyin.');
      pages.push(structured);page.cleanup();rendered.width=rendered.height=1;if(working!==rendered)working.width=working.height=1;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    repeatedMargins(pages);
    for(const p of pages)if(p.items.some(i=>['header','footer'].includes(i.kind)))issue('margin-review',p.number,'Sayfa kenarındaki metin üst/alt bilgi olarak ayrıldı; gerekirse gövdeye taşıyın.');
    const digest=await crypto.subtle.digest('SHA-256',original);check(signal);
    return pdfPagesToDocument(pages,{fileName,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),issues,packageBase64:base64(original)});
  }catch(error){if(signal?.aborted)throw abortError();if(error.name==='PasswordException')throw new Error('Şifreli PDF için önce şifresiz bir kopya kaydedin.');throw error;}
  finally{signal?.removeEventListener('abort',cancel);if(worker&&!stopped)await worker.terminate();await task.destroy();}
}
export async function importThesisPdfFile(file,note,options={}){
  if(!file||!String(file.name).toLowerCase().endsWith('.pdf'))throw new Error('PDF belgesi seçin');
  if(file.size>64*1024*1024)throw new Error('PDF dosyası 64 MB sınırını aşıyor');
  check(options.signal);const buffer=await file.arrayBuffer();check(options.signal);
  const document=await importThesisPdf(buffer,{...options,fileName:file.name});
  return installPdfDocument(note,document);
}
