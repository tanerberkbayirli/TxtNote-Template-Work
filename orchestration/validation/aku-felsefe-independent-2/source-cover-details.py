import json
from zipfile import ZipFile
from pathlib import Path
from lxml import etree
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
V='{urn:schemas-microsoft-com:vml}'
base=Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer')
out={}
for path in base.glob('*2019.docx'):
 key='thesis' if 'Tezi' in path.name else 'seminar'
 idx=130 if key=='thesis' else 124
 with ZipFile(path) as z:
  root=etree.fromstring(z.read('word/document.xml')); ps=root.xpath('.//w:body/w:p',namespaces={'w':W[1:-1]}); p=ps[idx]
  drawings=[]
  for v in p.xpath('.//v:group|.//v:rect|.//v:shape',namespaces={'v':V[1:-1]}):
   tx=''.join(v.xpath('.//w:t/text()',namespaces={'w':W[1:-1]}))
   if v.tag==V+'group':
    drawings.append({'kind':'group','style':v.get('style'),'coordsize':v.get('coordsize')})
   elif tx:
    drawings.append({'kind':etree.QName(v).localname,'id':v.get('id'),'style':v.get('style'),'text':tx})
  paras=[]
  for q in p.xpath('.//w:txbxContent/w:p',namespaces={'w':W[1:-1]}):
   t=''.join(q.xpath('.//w:t/text()',namespaces={'w':W[1:-1]})); ppr=q.find(W+'pPr'); jc=ppr.find(W+'jc') if ppr is not None else None
   pprops={}
   if ppr is not None:
    for el in ppr:
     if etree.QName(el).localname in ('pStyle','spacing','ind','tabs','keepNext','keepLines','pageBreakBefore'):
      pprops[etree.QName(el).localname]={etree.QName(k).localname:v for k,v in el.attrib.items()}
   runs=[]
   for r in q.xpath('./w:r',namespaces={'w':W[1:-1]}):
    rt=''.join(r.xpath('.//w:t/text()',namespaces={'w':W[1:-1]})); rp=r.find(W+'rPr'); props={}
    if rp is not None:
     for el in rp:
      props[etree.QName(el).localname]={etree.QName(k).localname:v for k,v in el.attrib.items()}
    if rt: runs.append({'text':rt,'rPr':props})
   if t: paras.append({'text':t,'alignment':jc.get(W+'val') if jc is not None else None,'paragraphProperties':pprops,'runs':runs})
  outer=etree.tostring(p.find(W+'pPr'),encoding='unicode') if p.find(W+'pPr') is not None else None
  out[key]={'source':path.name,'paragraphIndex':idx,'outsideParagraphPPr':outer,'drawings':drawings,'textBoxParagraphs':paras,'guideSectionMargins':None}
  sec=root.find('.//w:sectPr',{'w':W[1:-1]}); mar=sec.find(W+'pgMar') if sec is not None else None
  if mar is not None: out[key]['guideSectionMarginsTwips']={k:mar.get(W+k) for k in ('top','bottom','left','right','header','footer')}
Path('orchestration/validation/aku-felsefe-independent-2/source-cover-details.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
