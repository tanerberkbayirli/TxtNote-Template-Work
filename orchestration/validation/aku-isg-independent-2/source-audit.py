from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from pypdf import PdfReader
import json
BASE=Path('orchestration/validation/aku-isg-independent-2')
SOURCE=Path('orchestration/artifacts/aku-isg-tezsiz-proje/source')
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS={'w':W,'r':R}

def val(el, name):
    return None if el is None else el.get('{%s}%s'%(W,name))
def ptext(p): return ''.join(p.xpath('.//w:t/text()',namespaces=NS))

def read_docx(path):
  out={'sections':[],'paragraphs':[],'styles':{},'footers':{},'relationships':[]}
  with ZipFile(path) as z:
    doc=etree.fromstring(z.read('word/document.xml'))
    for si,s in enumerate(doc.xpath('.//w:sectPr',namespaces=NS),1):
      mar=s.find('{%s}pgMar'%W); pg=s.find('{%s}pgSz'%W); pn=s.find('{%s}pgNumType'%W)
      out['sections'].append({'i':si,'pageSize':None if pg is None else {k.split('}')[-1]:v for k,v in pg.attrib.items()},'margins':None if mar is None else {k.split('}')[-1]:v for k,v in mar.attrib.items()},'pageNumType':None if pn is None else {k.split('}')[-1]:v for k,v in pn.attrib.items()},'titlePg':s.find('{%s}titlePg'%W) is not None})
    body=doc.find('.//{%s}body'%W)
    pi=0
    for el in body:
      if el.tag=='{%s}p'%W:
        pi+=1; ppr=el.find('{%s}pPr'%W); st=ppr.find('{%s}pStyle'%W) if ppr is not None else None; sp=ppr.find('{%s}spacing'%W) if ppr is not None else None; ind=ppr.find('{%s}ind'%W) if ppr is not None else None; jc=ppr.find('{%s}jc'%W) if ppr is not None else None
        text=ptext(el)
        if text or (ppr is not None and ppr.find('{%s}sectPr'%W) is not None):
          out['paragraphs'].append({'i':pi,'text':text[:220],'style':val(st,'val'),'spacing':None if sp is None else {k.split('}')[-1]:v for k,v in sp.attrib.items()},'indent':None if ind is None else {k.split('}')[-1]:v for k,v in ind.attrib.items()},'align':val(jc,'val'),'sectBreak':ppr.find('{%s}sectPr'%W) is not None if ppr is not None else False,'pageBreakBefore':ppr.find('{%s}pageBreakBefore'%W) is not None if ppr is not None else False,'brs':[b.get('{%s}type'%W) for b in el.xpath('.//w:br',namespaces=NS)],'outline':val(ppr.find('{%s}outlineLvl'%W),'val') if ppr is not None and ppr.find('{%s}outlineLvl'%W) is not None else None})
    styles=etree.fromstring(z.read('word/styles.xml'))
    for s in styles.xpath('.//w:style',namespaces=NS):
      sid=val(s,'styleId'); name=s.find('{%s}name'%W); pp=s.find('{%s}pPr'%W); rp=s.find('{%s}rPr'%W)
      if sid in ('Normal','Balk1','Balk2','Balk3','T1','T2','AltBilgi','Heading1','Heading2','Heading3','Heading4'):
        out['styles'][sid]={'name':val(name,'val'),'basedOn':val(s.find('{%s}basedOn'%W),'val'),'pPr':etree.tostring(pp,encoding='unicode') if pp is not None else None,'rPr':etree.tostring(rp,encoding='unicode') if rp is not None else None}
    for n in z.namelist():
      if n.startswith('word/footer') and n.endswith('.xml'):
        ft=etree.fromstring(z.read(n)); out['footers'][n]={'paras':[{'text':ptext(p),'pPr':etree.tostring(p.find('{%s}pPr'%W),encoding='unicode') if p.find('{%s}pPr'%W) is not None else None,'runs':etree.tostring(p,encoding='unicode')[:1800]} for p in ft.xpath('.//w:p',namespaces=NS)],'fields':ft.xpath('.//w:instrText/text()',namespaces=NS)}
  return out

def pdf_info(path):
 r=PdfReader(str(path)); pages=[]
 for i,p in enumerate(r.pages):
  txt=p.extract_text() or ''
  chunks=[]
  def visitor(text,cm,tm,font,size):
   if text and text.strip(): chunks.append({'text':text,'tm':[round(float(v),4) for v in tm],'cm':[round(float(v),4) for v in cm],'sizePt':round(float(size),3),'font':str(font.get('/BaseFont','')) if font else ''})
  p.extract_text(visitor_text=visitor)
  pages.append({'page':i+1,'mediaBoxPts':[float(x) for x in p.mediabox],'text':txt[:1800],'chunks':chunks})
 return {'pages':len(r.pages),'pageSummaries':pages}

result={'sourceDocx':read_docx(SOURCE/'isg.docx'),'currentDocx':read_docx(Path('orchestration/validation/aku-isg-independent-2/isg.docx')),'sourcePdf':pdf_info(SOURCE/'isg.pdf'),'editorPdf':pdf_info(Path('orchestration/validation/aku-isg-independent-2/isg.pdf')),'wordPdf':pdf_info(Path('orchestration/validation/aku-isg-independent-2/isg.docx.pdf'))}

def compact_docx(data, is_current=False):
  from collections import Counter
  keys=('Normal','Balk1','Balk2','Balk3','T1','T2','AltBilgi','Heading1','Heading2','Heading3','Heading4')
  sections=data['sections']
  if is_current:
    signatures=Counter(tuple(s['margins'].get(k) for k in ('top','right','bottom','left','footer')) for s in sections)
    sections=[{'signatureTwips':list(sig),'count':count} for sig,count in signatures.items()]
  terms=('GİRİŞ','LİTERATÜR','DEĞERLENDİRME','2.1.','2.1.1.','KAYNAKÇA','ÖRNEK (GEÇİCİ')
  paras=[p for p in data['paragraphs'] if any(t in p['text'].upper() for t in terms)]
  footers={k:{'paragraphCount':len(v['paras']),'fields':v['fields'],'paragraphText':[p['text'] for p in v['paras']], 'paragraphProperties':[p['pPr'] for p in v['paras']]} for k,v in data['footers'].items()}
  return {'sections':sections,'styles':{k:data['styles'][k] for k in keys if k in data['styles']},'matchedParagraphs':paras,'footers':footers}

def compact_pdf(data):
  pages=[]
  terms=('afyonkarahisar','giriş','girişi','literatür','etik','onay','özet','abstract','içindekiler','kaynakça')
  for p in data['pageSummaries'][:14]:
    chunks=[c for c in p['chunks'] if c['text'].strip() in ('i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','1','2','3','4','5','6') or any(t in c['text'].lower() for t in terms)]
    pages.append({'page':p['page'],'mediaBoxPts':p['mediaBoxPts'],'text':p['text'][:500],'evidenceSpans':[{'text':c['text'],'tm':c['tm'],'sizePt':c['sizePt'],'font':c['font']} for c in chunks]})
  return {'pages':data['pages'],'pageSummaries':pages}

compact={'sourceDocx':compact_docx(result['sourceDocx']),'currentDocx':compact_docx(result['currentDocx'],True),'sourcePdf':compact_pdf(result['sourcePdf']),'editorPdf':compact_pdf(result['editorPdf']),'wordPdf':compact_pdf(result['wordPdf'])}
(BASE/'baseline.json').write_text(json.dumps(compact,ensure_ascii=False,indent=2),encoding='utf-8')
print('source sections',len(result['sourceDocx']['sections']),'current unique section signatures',len(compact['currentDocx']['sections']))
print('source/editor/Word PDF pages',result['sourcePdf']['pages'],result['editorPdf']['pages'],result['wordPdf']['pages'])
