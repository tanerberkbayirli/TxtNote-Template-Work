import re, json, sys
from lxml import etree
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns={'w':W,'wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing','a':'http://schemas.openxmlformats.org/drawingml/2006/main','v':'urn:schemas-microsoft-com:vml','mc':'http://schemas.openxmlformats.org/markup-compatibility/2006','wps':'http://schemas.microsoft.com/office/word/2010/wordprocessingShape'}
base='/home/user/TxtNote-Template-Work/orchestration/artifacts/aku-fbe/source/docx_xml/word/'
doc=etree.parse(base+'document.xml')
body=doc.getroot().find('w:body',ns)
def q(t): return '{%s}%s'%(W,t)
def attrs(el):
    return {k.split('}')[1]:v for k,v in el.attrib.items() if 'rsid' not in k}
def ppr(p):
    pp=p.find('w:pPr',ns); d={}
    if pp is None: return d
    for ch in pp:
        tag=ch.tag.split('}')[1]
        if tag in ('rPr','sectPr'): continue
        if tag=='tabs': d['tabs']=[attrs(t) for t in ch]
        elif tag=='numPr': d['numPr']={c.tag.split('}')[1]:c.get(q('val')) for c in ch}
        elif tag=='pBdr': d['pBdr']={c.tag.split('}')[1]:attrs(c) for c in ch}
        else: d[tag]=attrs(ch) or True
    return d
def rpr(r):
    rp=r.find('w:rPr',ns); d={}
    if rp is None: return d
    for ch in rp:
        tag=ch.tag.split('}')[1]
        a=attrs(ch)
        if tag=='rFonts': d['font']=a.get('ascii') or a.get('hAnsi') or a
        elif tag in('sz',): d['sz']=int(a['val'])/2
        elif tag in ('b','i','caps','u','vanish','smallCaps'): d[tag]=a.get('val',True)
        elif tag in ('szCs','bCs','iCs','lang','noProof','color','rStyle','spacing','position','vertAlign','kern','w'): 
            if tag in('rStyle','color','spacing','position','vertAlign'): d[tag]=a.get('val')
        else: d[tag]=a or True
    return d
out=[]; sec=1; idx=0
def para(p, ctx=''):
    global sec
    runs=[]
    for r in p.iter(q('r')):
        # skip runs inside textboxes for main text
        anc=r.getparent()
        inbox=False
        while anc is not None and anc is not p:
            if anc.tag.endswith('txbxContent'): inbox=True;break
            anc=anc.getparent()
        if inbox: continue
        t=''.join((x.text or '') if x.tag==q('t') else ('\t' if x.tag==q('tab') else ('\n' if x.tag==q('br') and x.get(q('type')) is None else ('[PAGEBREAK]' if x.tag==q('br') else ''))) for x in r if x.tag in (q('t'),q('tab'),q('br')))
        fld=[x.text for x in r.findall('w:instrText',ns)]
        if fld: t+='{FIELD:'+''.join(fld)+'}'
        if t or r.find('.//w:drawing',ns) is not None or r.find('.//w:pict',ns) is not None:
            runs.append((t,rpr(r)))
    text=''.join(t for t,_ in runs)
    st=p.find('w:pPr/w:pStyle',ns)
    e={'i':None,'sec':sec,'ctx':ctx,'style':st.get(q('val')) if st is not None else 'Normal','ppr':ppr(p),'text':text,
       'runs':[ [t[:40],r] for t,r in runs]}
    prr=p.find('w:pPr/w:rPr',ns)
    if prr is not None: e['pmark']=rpr(p.find('w:pPr',ns))
    dr=[]
    for d in p.iter('{%s}anchor'%ns['wp'],'{%s}inline'%ns['wp']):
        x={'kind':d.tag.split('}')[1]}
        ext=d.find('wp:extent',ns); x['extentMm']=[round(int(ext.get('cx'))/36000,2),round(int(ext.get('cy'))/36000,2)]
        for tag in ('positionH','positionV'):
            ph=d.find('wp:'+tag,ns)
            if ph is not None:
                off=ph.find('wp:posOffset',ns); al=ph.find('wp:align',ns)
                x[tag]={'relativeFrom':ph.get('relativeFrom'),'offsetMm':round(int(off.text)/36000,2) if off is not None else None,'align':al.text if al is not None else None}
        dp=d.find('wp:docPr',ns); x['name']=dp.get('name') if dp is not None else None
        blip=d.find('.//a:blip',ns)
        if blip is not None: x['blip']=blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
        tb=[''.join(t.itertext()) for t in d.iter('{%s}txbxContent'%W)]
        if tb: x['textbox']=tb[:1]
        dr.append(x)
    for pic in p.iter('{%s}pict'%W):
        for shp in pic:
            x={'kind':'vml:'+shp.tag.split('}')[1],'style':shp.get('style'),'id':shp.get('id')}
            tb=[''.join(t.itertext()) for t in shp.iter('{%s}txbxContent'%W)]
            if tb: x['textbox']=tb[:1]
            dr.append(x)
    if dr: e['drawings']=dr
    sp=p.find('w:pPr/w:sectPr',ns)
    if sp is not None: e['SECTION_END']=sec; sec+=1
    return e
for el in body:
    tag=el.tag.split('}')[1]
    if tag=='p':
        e=para(el); e['i']=idx; out.append(e); idx+=1
    elif tag=='tbl':
        tp=el.find('w:tblPr',ns)
        grid=[int(g.get(q('w'))) for g in el.findall('w:tblGrid/w:gridCol',ns)]
        out.append({'i':idx,'sec':sec,'TABLE':True,'tblPr':etree.tostring(tp).decode()[:800] if tp is not None else None,'gridTw':grid}); idx+=1
        for ri,tr in enumerate(el.findall('w:tr',ns)):
            trp=tr.find('w:trPr',ns)
            for ci,tc in enumerate(tr.findall('w:tc',ns)):
                tcw=tc.find('w:tcPr/w:tcW',ns)
                for p in tc.findall('w:p',ns):
                    e=para(p,ctx=f'tbl r{ri} c{ci} w={tcw.get(q("w")) if tcw is not None else None} trH={etree.tostring(trp.find("w:trHeight",ns)).decode() if trp is not None and trp.find("w:trHeight",ns) is not None else ""}'); e['i']=idx; out.append(e); idx+=1
    elif tag=='sectPr':
        out.append({'i':idx,'FINAL_SECTPR':sec})
json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False,indent=0)
print(len(out))
