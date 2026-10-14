import zipfile,copy
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q=lambda n:'{'+W+'}'+n
with zipfile.ZipFile('orchestration/engine-work/final-closure/long/table-only-source.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find(q('body'))
for c in list(body):body.remove(c)
sect=E.fromstring('<w:sectPr xmlns:w="%s"><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="2268" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/><w:cols w:space="708"/></w:sectPr>'%W)
def para(parent,text,before=0,after=0,line=240,rule='auto',pbb=False):
    p=E.SubElement(parent,q('p'));pp=E.SubElement(p,q('pPr'))
    if pbb:E.SubElement(pp,q('pageBreakBefore'))
    E.SubElement(pp,q('spacing'),{q('before'):str(int(before*20)),q('after'):str(int(after*20)),q('line'):str(int(line)),q('lineRule'):rule})
    r=E.SubElement(p,q('r'));rp=E.SubElement(r,q('rPr'));E.SubElement(rp,q('sz'),{q('val'):'20'})
    if text:E.SubElement(r,q('t')).text=text
    return p
cases=list(range(0,49))
for ci,s in enumerate(cases):
    para(body,'',0,0,max(1,int(s*0.25*20)),'exact',pbb=True)
    t=E.SubElement(body,q('tbl'));pr=E.SubElement(t,q('tblPr'));E.SubElement(pr,q('tblW'),{q('w'):'5000',q('type'):'pct'})
    bd=E.SubElement(pr,q('tblBorders'))
    for side in ('top','left','bottom','right','insideH','insideV'):E.SubElement(bd,q(side),{q('val'):'single',q('sz'):'4',q('space'):'0',q('color'):'auto'})
    grid=E.SubElement(t,q('tblGrid'));E.SubElement(grid,q('gridCol'),{q('w'):'13000'})
    for r in range(22):
        tr=E.SubElement(t,q('tr'));trp=E.SubElement(tr,q('trPr'));E.SubElement(trp,q('trHeight'),{q('val'):'454',q('hRule'):'exact'});tc=E.SubElement(tr,q('tc'));tcp=E.SubElement(tc,q('tcPr'));E.SubElement(tcp,q('tcW'),{q('w'):'13000',q('type'):'dxa'})
        para(tc,'c%03dr%02d'%(ci,r),6,6,360,'auto')
body.append(sect);files['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/ek2-agent/fit/fitx.docx','w',zipfile.ZIP_DEFLATED) as z:
    for n,v in files.items():z.writestr(n,v)
