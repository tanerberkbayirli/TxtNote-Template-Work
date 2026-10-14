import {useState} from 'react';
import {setDocumentFormatMode} from '../../../../../engine/src/contentModel.js';
import {revisePdfImport} from '../../../../../engine/src/pdf/model.js';
const label={paragraph:'Paragraf',heading:'Başlık',header:'Üst bilgi',footer:'Alt bilgi',table:'Tablo',image:'Görsel'};
const itemText=item=>item.reviewText??item.lines?.map(l=>l.text).join('\n')??'';
const cellText=cell=>cell.reviewText??cell.lines?.map(l=>l.text).join('\n')??'';
const methodLabel=method=>method==='mixed'?'Metin + OCR':method==='ocr'?'OCR':'Metin';

export function PdfImportSetup({file,onCancel,onStart}){
  const [ocrLanguage,setLanguage]=useState('tur+eng'),[forceOcr,setForce]=useState(false);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="pdf-setup-title"><div className="max-w-lg rounded-xl bg-white p-5 dark:bg-neutral-900">
    <h2 id="pdf-setup-title" className="text-lg font-semibold">PDF belgesini içe aktar</h2><p className="my-3">{file.name}. Taranmış sayfalarda OCR cihazda çalışır. Ardından kaynak sayfaları ve çıkarılan içeriği inceleyebilirsiniz.</p>
    <label className="block my-3">OCR dili <select aria-label="OCR dili" value={ocrLanguage} onChange={e=>setLanguage(e.target.value)}><option value="tur+eng">Türkçe ve İngilizce</option><option value="tur">Türkçe</option><option value="eng">İngilizce</option></select></label>
    <label className="block my-3"><input type="checkbox" checked={forceOcr} onChange={e=>setForce(e.target.checked)}/> Her sayfada OCR kullan (bozuk metin katmanı için)</label>
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel}>İptal</button><button type="button" className="rounded bg-blue-600 px-4 py-2 text-white" onClick={()=>onStart({ocrLanguage,forceOcr})}>PDF'yi incelemeye hazırla</button></div>
  </div></div>;
}

export function PdfImportReport({document}){
  const [pageNumber,setPageNumber]=useState(1),source=document?.source;
  if(source?.format!=='pdf')return null;
  const page=source.pages.find(p=>p.number===pageNumber)||source.pages[0];
  return <details aria-label="PDF aktarım raporu" className="border-t p-3 text-xs">
    <summary>PDF aktarım raporu · {source.fileName} · {source.importReport.pages} sayfa · {source.unsupported.length} bildirim</summary>
    <p className="my-2">Çıkarılan yerleşim ve OCR metni kontrol gerektirir. Formüller yerel denklem olarak yeniden kurulmadı. Özgün PDF saklandı.</p>
    <label>Kaynak sayfa <select aria-label="Rapor kaynak sayfası" value={page?.number} onChange={e=>setPageNumber(Number(e.target.value))}>{source.pages.map(p=><option key={p.number} value={p.number}>{p.number}</option>)}</select></label>
    {page?<div className="mt-2 max-h-60 overflow-auto"><img src={page.originalPreview||page.preview} alt={`Kaynak PDF sayfa ${page.number}`} className="max-w-xs"/><p>{page.margins.header.length} üst bilgi, {page.margins.footer.length} alt bilgi gövdeden ayrı saklandı.</p></div>:null}
    <button type="button" className="my-2 rounded border px-2 py-1" onClick={()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify({fileName:source.fileName,sha256:source.sha256,...source.importReport,issues:source.unsupported},null,2)],{type:'application/json'}));
      const a=window.document.createElement('a');a.href=url;a.download='pdf-aktarim-raporu.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }}>PDF raporunu indir</button>
    <ul className="max-h-40 overflow-auto">{source.unsupported.filter(i=>i.page===page?.number).map((i,n)=><li key={n} className="mb-2">{i.message}<small className="block">{i.locator}</small></li>)}</ul>
  </details>;
}
export function PdfImportReview({note,onChange,onCancel,onApply}){
  const [pageNumber,setPageNumber]=useState(1),[ack,setAck]=useState(false);
  const document=note.researchData.thesis.document,source=document.source,page=source.pages.find(p=>p.number===pageNumber)||source.pages[0];
  const revise=change=>{setAck(false);onChange(revisePdfImport(note,page.number,change));};
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="pdf-import-title">
    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-auto rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
      <h2 id="pdf-import-title" className="text-lg font-semibold">PDF aktarımını incele ve düzelt</h2>
      <p className="my-2 text-sm">{source.fileName} · {source.pages.length} sayfa · {source.importReport.ocrPages} OCR sayfası. Uyguladığınızda mevcut tez içeriği değişir. Kaynak görüntüyle karşılaştırıp belirsiz metin, hücre ve sırayı düzeltebilirsiniz.</p>
      <div className="my-2 flex flex-wrap gap-4 text-sm"><label>Sayfa <select aria-label="PDF inceleme sayfası" value={page.number} onChange={e=>setPageNumber(Number(e.target.value))}>{source.pages.map(p=><option key={p.number} value={p.number}>{p.number} · {methodLabel(p.method)}</option>)}</select></label>
        <label>Biçim <select aria-label="PDF biçimi" value={document.formatMode} onChange={e=>onChange({...note,researchData:{...note.researchData,thesis:setDocumentFormatMode(note.researchData.thesis,e.target.value)}})}><option value="source">Kaynak sayfa ölçülerini koru</option><option value="template">Üniversite şablonuna uyarla</option></select></label></div>
      <div className="grid min-h-0 gap-4 md:grid-cols-2"><div className="max-h-[55vh] overflow-auto rounded border bg-neutral-100 p-2"><p className="text-xs text-neutral-600">{page.method==='ocr'?'OCR için yönü/eğimi düzeltilmiş görünüm':'Kaynak sayfa'}</p><img src={page.preview} alt={`Kaynak PDF sayfa ${page.number}`} className="w-full"/>{page.ocrRotation?<details className="text-xs"><summary>Özgün yönü göster</summary><img src={page.originalPreview} alt={`Özgün PDF sayfa ${page.number}`} className="w-full"/></details>:null}</div>
        <div className="max-h-[55vh] overflow-auto" aria-label="Çıkarılan PDF öğeleri">{page.items.map((item,index)=><div key={index} className="mb-3 rounded border p-2 text-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2"><strong>{index+1}. {label[item.kind]}</strong>
            {!['table','image'].includes(item.kind)?<select aria-label={`Öğe ${index+1} türü`} value={item.kind} onChange={e=>revise(p=>{p.items[index].kind=e.target.value;})}>{['paragraph','heading','header','footer'].map(k=><option key={k} value={k}>{label[k]}</option>)}</select>:null}
            <button type="button" aria-label={`Öğe ${index+1} yukarı`} disabled={!index} onClick={()=>revise(p=>{[p.items[index-1],p.items[index]]=[p.items[index],p.items[index-1]];})}>↑</button>
            <button type="button" aria-label={`Öğe ${index+1} aşağı`} disabled={index===page.items.length-1} onClick={()=>revise(p=>{[p.items[index+1],p.items[index]]=[p.items[index],p.items[index+1]];})}>↓</button></div>
          {item.kind==='image'?<img src={item.dataUrl} alt="Çıkarılan PDF görseli" className="max-w-full"/>:item.kind==='table'?<><p>Hücre birleşimlerini kaynakla karşılaştırın. Tablo belirsizse metin olarak düzenleyebilirsiniz.</p><button type="button" className="my-1 border px-2" onClick={()=>revise(p=>{p.items[index]={...item,kind:'paragraph',reviewText:item.cells.map(cellText).join('\t'),lines:[],sourceTable:item};})}>Tabloyu metne dönüştür</button><div className="grid gap-1">{item.cells.map((cell,c)=><label key={c} className="text-xs">Satır {cell.row+1}, sütun {cell.col+1} · birleşim {cell.rowspan}×{cell.colspan}<textarea aria-label={`Tablo ${index+1} hücre ${cell.row+1} ${cell.col+1}`} className="block w-full rounded border bg-transparent p-1" value={cellText(cell)} onChange={e=>revise(p=>{p.items[index].cells[c].reviewText=e.target.value;})}/></label>)}</div></>:<textarea aria-label={`Öğe ${index+1} metni`} className="min-h-16 w-full rounded border bg-transparent p-2" value={itemText(item)} onChange={e=>revise(p=>{p.items[index].reviewText=e.target.value;})}/>}
          <small className="block text-neutral-500">Sayfa {page.number} · x {item.x.toFixed(1)}, y {item.y.toFixed(1)} pt{item.repeatedMargin?' · Tekrarlanan kenar metni':''}</small>
        </div>)}{!page.items.length?<p>Bu sayfada metin bulunmadı. Kaynak görüntüsü korunuyor.</p>:null}
        <button type="button" className="rounded border p-2 text-sm" onClick={()=>revise(p=>{p.items.push({kind:'paragraph',x:0,y:p.heightPt/2,width:p.widthPt,height:12,lines:[],reviewText:''});})}>Paragraf ekle</button>
        </div></div>
      <ul className="my-3 max-h-24 overflow-auto text-xs">{source.unsupported.filter(i=>i.page===page.number).map((i,n)=><li key={n}>{i.locator}: {i.message}</li>)}</ul>
      <label className="my-2 text-sm"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/> OCR ve yerleşim belirsizliklerini gördüm; kalan bildirimlerle aktarımı uygulamak istiyorum.</label>
      <div className="flex justify-end gap-3"><button type="button" className="rounded border px-4 py-2" onClick={onCancel}>İptal</button><button type="button" disabled={!ack} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40" onClick={()=>onApply({...note,researchData:{...note.researchData,thesis:{...note.researchData.thesis,document:{...document,source:{...source,importReport:{...source.importReport,acknowledged:true}}}}}})}>PDF içeriğini uygula</button></div>
    </div>
  </div>;
}
