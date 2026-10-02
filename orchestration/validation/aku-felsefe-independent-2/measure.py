"""Compact independent PDF/DOCX evidence extractor for the AKÜ Felsefe fixtures.
Run with the bundled Python and PyMuPDF/lxml on PYTHONPATH.
"""
import json, re, zipfile
from pathlib import Path
from collections import Counter
import pymupdf
from lxml import etree

ROOT=Path(__file__).resolve().parent
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
MM=lambda pt: pt*25.4/72
TWMM=lambda tw: tw*25.4/1440

def pdf_summary(path):
    d=pymupdf.open(path); fonts=Counter(); body=[]; quote=[]; page_numbers=[]
    for pn,p in enumerate(d,1):
        for xref,ext,ft,*_ in p.get_fonts(full=True):
            fonts[ft]=ext
        for b in p.get_text('dict')['blocks']:
            for ln in b.get('lines',[]):
                for s in ln.get('spans',[]):
                    t=s['text'].strip()
                    if not t: continue
                    box=[round(MM(v),3) for v in s['bbox']]
                    item={'page':pn,'text':t[:48],'bboxMm':box,'pt':round(s['size'],3),'font':s['font']}
                    if 'Felsefe araştırmalarında' in t and len(body)<4: body.append(item)
                    if 'Bir düşüncenin anlamı' in t and len(quote)<4: quote.append(item)
                    if pn==1 and re.fullmatch(r'\d+',t) and box[1]>260: page_numbers.append(item)
    return {'pages':len(d),'pageMm':[round(MM(d[0].rect.width),3),round(MM(d[0].rect.height),3)],'fonts':dict(fonts),'bodySamples':body,'quoteSamples':quote,'firstPageNumber':page_numbers[:1]}

def docx_summary(path):
    with zipfile.ZipFile(path) as z:
        root=etree.fromstring(z.read('word/document.xml')); styles=etree.fromstring(z.read('word/styles.xml'))
        sec=root.find('.//w:sectPr',NS); sz=sec.find('w:pgSz',NS); mar=sec.find('w:pgMar',NS)
        spacings=Counter(); quote=None; first_body=None; references=[]; page_fields=0; pageref=[]
        for p in root.xpath('.//w:body/w:p',namespaces=NS):
            text=''.join(p.xpath('.//w:t/text()',namespaces=NS)); pp=p.find('w:pPr',NS)
            if pp is not None:
                sp=pp.find('w:spacing',NS); ind=pp.find('w:ind',NS)
                if sp is not None and text:
                    key=(sp.get('{%s}before'%NS['w']),sp.get('{%s}after'%NS['w']),sp.get('{%s}line'%NS['w']),sp.get('{%s}lineRule'%NS['w']))
                    if 'Felsefe araştırmalarında' in text: spacings[str(key)]+=1
                    if 'Bir düşüncenin anlamı' in text:
                        quote={'spacingTwips':key,'indTwips':(ind.get('{%s}left'%NS['w']),ind.get('{%s}right'%NS['w']),ind.get('{%s}firstLine'%NS['w'])) if ind is not None else None}
            if text.startswith(('Arslan,','Özkan,','Turhan,')): references.append(text[:64])
        for name in z.namelist():
            if re.fullmatch(r'word/footer\d+\.xml',name):
                ft=etree.fromstring(z.read(name))
                for p in ft.xpath('.//w:p',namespaces=NS):
                    jc=p.find('w:pPr/w:jc',NS)
                    if jc is not None and jc.get('{%s}val'%NS['w'])=='center': page_fields+=len(p.xpath('.//w:instrText[contains(.,"PAGE")]',namespaces=NS))
            if name=='word/document.xml':
                for p in root.xpath('.//w:p',namespaces=NS):
                    for field in p.xpath('.//w:fldSimple',namespaces=NS):
                        instr=field.get('{%s}instr'%NS['w'],'')
                        if 'PAGEREF' in instr: pageref.append({'field':instr,'cached':''.join(field.xpath('.//w:t/text()',namespaces=NS))})
        return {'sectionTwips':{'page':(sz.get('{%s}w'%NS['w']),sz.get('{%s}h'%NS['w'])),'margins':{k:mar.get('{%s}%s'%(NS['w'],k)) for k in ('top','bottom','left','right','header','footer')}},'sectionMm':{'page':[round(TWMM(int(sz.get('{%s}%s'%(NS['w'],k)))),3) for k in ('w','h')],'margins':{k:round(TWMM(int(mar.get('{%s}%s'%(NS['w'],k)))),3) for k in ('top','bottom','left','right','header','footer')}},'bodySpacingTwips':dict(spacings),'quote':quote,'centeredPageFields':page_fields,'tocPAGEREFCount':len(pageref),'tocFirstFields':pageref[:8],'references':references}

out={}
for stem in ('thesis','seminar'):
    out[stem]={'editorPdf':pdf_summary(ROOT/(stem+'.pdf')),'docx':docx_summary(ROOT/(stem+'.docx'))}
    wp=ROOT/(stem+'.docx.pdf')
    if wp.exists(): out[stem]['wordPdf']=pdf_summary(wp)
print(json.dumps(out,ensure_ascii=False,indent=2))
