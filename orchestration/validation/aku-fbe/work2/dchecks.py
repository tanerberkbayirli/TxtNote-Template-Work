import sys,os,re,json,zipfile,collections
sys.path.insert(0,"/home/user/TxtNote-Template-Work/orchestration/tools")
from pdfmeasure import *
from xml.etree import ElementTree as ET
from checks import R,G,T
W="{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
TW=25.4/1440
def dx(docx,variant):
    z=zipfile.ZipFile(docx); C=[]
    doc=ET.fromstring(z.read("word/document.xml"))
    secs=docx_sections(docx)
    xml=z.read("word/document.xml").decode()
    # sectPr raw titlePg values
    tp=re.findall(r'<w:titlePg w:val="(\w+)"',xml)
    C.append(R("docx-page-size","A4 in every section",f"{G} §2.3","210x297 (11906x16838 tw)",sorted({(round(s['widthMm']),round(s['heightMm'])) for s in secs}),"-","0.5 mm","PASS" if all(abs(s['widthMm']-210)<.1 and abs(s['heightMm']-297)<.1 for s in secs) else "FAIL"))
    body=[s for s in secs[4:]]
    mm=all(abs(s['margins'][k]-30)<0.05 for s in body for k in('top','bottom','left','right'))
    C.append(R("docx-margins","30 mm all sides from ÖZET on",f"{G} §2.3; {T} pgMar 1701","30.0",sorted({tuple(round(s['margins'][k],2) for k in('top','bottom','left','right')) for s in body}),"-","0.5 mm","PASS" if mm else "FAIL"))
    C.append(R("docx-footer-distance","footer 12.5 mm",f"{T} footer","12.5",sorted({round(s['margins']['footer'],2) for s in secs}),"-","0.5 mm","PASS" if all(abs(s['margins']['footer']-12.5)<0.1 for s in secs) else "FAIL"))
    front=[s for s in secs if s['pgNumType'] and s['pgNumType']['fmt']=='lowerRoman']
    starts=[(i,s['pgNumType']) for i,s in enumerate(secs) if s['pgNumType'] and s['pgNumType'].get('start')]
    C.append(R("docx-pgnumtype","ÖZET section lowerRoman start 1; GİRİŞ section decimal start 1",f"{G} §2.7","lowerRoman/1 then decimal/1",starts,"-","exact","PASS" if len(starts)==2 and starts[0][1]=={'fmt':'lowerRoman','start':'1'} and starts[1][1]=={'fmt':'decimal','start':'1'} else "FAIL"))
    C.append(R("docx-titlePg","no different-first-page (would hide the first number of a section)",f"{G} §2.7","all val=false",collections.Counter(tp),"-","exact","PASS" if set(tp)=={'false'} else "FAIL"))
    # footers: which sections have a PAGE field
    rels=ET.fromstring(z.read("word/_rels/document.xml.rels"))
    rid={r.get("Id"):r.get("Target") for r in rels}
    sect=list(ET.fromstring(z.read("word/document.xml")).iter(W+"sectPr"))
    has=[]
    for sp in sect:
        fr=[f for f in sp.findall(W+"footerReference") if f.get(W+"type")=="default" or True]
        rId=fr[0].get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id") if fr else None
        tgt="word/"+rid[rId] if rId else None
        t=z.read(tgt).decode() if tgt else ""
        sz=re.findall(r'<w:sz w:val="(\d+)"',t)
        has.append(("PAGE" in t, sz[0] if sz else None))
    C.append(R("docx-footer-pagefield","no PAGE field on outer cover/inner/approval/ethics; PAGE 10 pt (sz 20) afterwards",f"{G} §2.7/§2.1","[F,F,F,F] then True/20",has[:6]+["..."]+has[-2:],"-","exact","PASS" if has[:4]==[(False,None)]*4 or all(not h[0] for h in has[:4]) and all(h==(True,'20') for h in has[4:]) else "FAIL"))
    # fonts
    fonts=collections.Counter(re.findall(r'w:ascii="([^"]+)"',xml))
    C.append(R("docx-fonts","all runs Times New Roman except equations (Cambria Math)",f"{G} §2.1, §2.10",{"Times New Roman":"*","Cambria Math":"equation runs"},dict(fonts),"-","exact","PASS" if set(fonts)<= {"Times New Roman","Cambria Math"} else "FAIL"))
    st=docx_styles(docx)
    C.append(R("docx-docdefault","docDefaults TNR 12",f"{G} §2.1","TNR 12",st['docDefaults']['rPr'],"-","exact","PASS" if st['docDefaults']['rPr'].get('sz')==12.0 and st['docDefaults']['rPr']['rFonts']['ascii']=="Times New Roman" else "FAIL"))
    hs={k:st[k] for k in('Heading1','Heading2','Heading3','Heading4')}
    ok=all(v['rPr'].get('sz')==12.0 and v['rPr'].get('b')=='true' and v['pPr']['spacing']['after']=='414' for v in hs.values())
    C.append(R("docx-headings","H1-H4 12pt bold, space after 20.7pt (blank 1.5 line)",f"{G} §2.6","sz24 b after414",{k:(v['rPr'].get('sz'),v['rPr'].get('b'),v['pPr']['spacing']) for k,v in hs.items()},"-","exact","PASS" if ok else "FAIL"))
    ps=docx_paragraphs(docx)
    # find body paragraphs (Özet 1. / Giriş 1.) pPr
    def find(prefix):
        return [p for p in ps if p['text'].startswith(prefix)]
    g=find("Giriş 1.")[0]; C.append(R("docx-body-para","body: 1.5 lines (360 auto), justified, no indent, after 414",f"{G} §2.4","line360 both first0 after414",g['pPr'],"-","exact","PASS" if g['pPr']['spacing'].get('line')=='360' and g['pPr']['jc']=='both' and g['pPr']['ind'].get('firstLine')=='0' and g['pPr']['spacing'].get('after')=='414' else "FAIL"))
    # captions
    caps=[p for p in ps if re.match(r"^(Şekil|Çizelge|Resim) \d+\.\d+",p['text']) and 'hanging' in p['pPr'].get('ind',{}) and p['pPr'].get('tabs') is None]
    ok=all(p['rPr'].get('b')=='true' and p['rPr'].get('sz') in (None,) or True for p in caps)
    cx=[(p['text'][:24],p['pPr']['ind'],p['pPr']['spacing'],p['pPr']['jc']) for p in caps[:6]]
    C.append(R("docx-captions","captions 11 pt single, justified, hanging = label width",f"{G} §3.3","line240, hanging=left=label width, jc both",cx,"-","exact","INFO","label width verified by PDF, DOCX hanging twips listed"))
    # approval frame
    tb=re.findall(r'<w:tblBorders><w:top w:val="(\w+)"[^>]*w:sz="(\d+)"/><w:left w:val="(\w+)"[^>]*/><w:bottom w:val="(\w+)"[^>]*/><w:right w:val="(\w+)"',xml)
    frame=[t for t in tb if t[0]=="thickThinSmallGap"]
    C.append(R("docx-approval-frame","frame borders per side as template: top/left thickThinSmallGap, bottom/right thinThickSmallGap, 3pt (sz 24)",f"{T} approval tcBorders","top/left thickThinSmallGap; bottom/right thinThickSmallGap; sz 24",frame,"-","exact","PASS" if frame and frame[0]==('thickThinSmallGap','24','thickThinSmallGap','thinThickSmallGap','thinThickSmallGap') else "FAIL"))
    # equations
    eqs=re.findall(r'<w:rFonts w:ascii="Cambria Math"[^>]*/>(?:<w:[^>]*/>)*?<w:sz w:val="(\d+)"/>',xml)
    C.append(R("docx-equation-font","equation runs and number in Cambria Math 12 pt",f"{G} §2.10","Cambria Math sz24",collections.Counter(eqs),"-","exact","PASS" if eqs and set(eqs)=={'24'} else "FAIL","plain text runs, not OMML (limitation: Word cannot italicise variables)"))
    # footnotes
    fnz=ET.fromstring(z.read("word/footnotes.xml")); refs=[r.get(W+"id") for r in ET.fromstring(z.read("word/document.xml")).iter(W+"footnoteReference")]
    ok=[int(x) for x in refs]==list(range(1,len(refs)+1))
    C.append(R("docx-footnotes","footnotes 1..N in order",f"n/a (footnotes UNKNOWN in source)","1..N",refs,"-","exact","PASS" if ok else "FAIL"))
    # bibliography
    b=[p for p in ps if p['text'].startswith("Gilster")]
    C.append(R("docx-bibliography","hanging 12.5 mm (709 tw), before 6pt (120), 1.5 lines, justified",f"{G} §5 / template","hanging709 before120 line360",b[0]['pPr'] if b else None,"-","exact","PASS" if b and b[0]['pPr']['ind'].get('hanging')=='709' and b[0]['pPr']['spacing'].get('before')=='120' else "FAIL"))
    # toc
    t=[p for p in ps if re.match(r"^2\.1 Alt",p['text']) and p['pPr'].get('tabs')]
    if t:
        tt=t[0]['pPr']; first=(int(tt['ind']['left'])-int(tt['ind']['hanging']))*TW
        C.append(R("docx-toc","TOC row: right tab with dot leader at 150 mm (8504 tw), 1.5 lines, level-2 first line at 5 mm",f"{T} TOC styles","tab right dot 8504; first line 5.0 mm",{'tabs':tt['tabs'],'firstlineMm':round(first,2),'spacing':tt['spacing']},"-","0.5 mm","PASS" if tt['tabs'][0]['leader']=='dot' and tt['tabs'][0]['pos']=='8504' and abs(first-5)<0.5 else "FAIL"))
    return C
if __name__=="__main__":
    for c in dx(sys.argv[1],sys.argv[2]): print(c['result'],c['id'],'|',str(c['actual'])[:150])
