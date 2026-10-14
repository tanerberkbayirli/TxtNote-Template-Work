import zipfile,copy
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q=lambda n:'{'+W+'}'+n
with zipfile.ZipFile('orchestration/engine-work/final-closure/long/table-only-source.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find(q('body'));sect=copy.deepcopy(body.find(q('sectPr')))
for c in list(body):body.remove(c)
def para(parent,text,before=0,after=12,ctx=False,line=240,rule='auto'):
    p=E.SubElement(parent,q('p'));pp=E.SubElement(p,q('pPr'))
    E.SubElement(pp,q('spacing'),{q('before'):str(before*20),q('after'):str(after*20),q('line'):str(line),q('lineRule'):rule})
    if ctx:E.SubElement(pp,q('contextualSpacing'))
    r=E.SubElement(p,q('r'));rp=E.SubElement(r,q('rPr'));E.SubElement(rp,q('sz'),{q('val'):'20'})
    if text:E.SubElement(r,q('t')).text=text
cases=[('A-ctx',[('x',0,12,True)]),('B-noctx',[('x',0,12,False)]),('C-ctx-2',[('x',0,12,True),('y',0,12,True)]),('D-noctx-2',[('x',0,12,False),('y',0,12,False)]),('E-ctx-before',[('x',12,0,True)]),('F-noctx-before',[('x',12,0,False)]),('G-ctx-emptylast',[('x',0,12,True),('',0,12,True)]),('H-noctx-emptylast',[('x',0,12,False),('',0,12,False)])]
t=E.SubElement(body,q('tbl'));pr=E.SubElement(t,q('tblPr'));E.SubElement(pr,q('tblW'),{q('w'):'5000',q('type'):'pct'})
bd=E.SubElement(pr,q('tblBorders'))
for side in ('top','left','bottom','right','insideH','insideV'):E.SubElement(bd,q(side),{q('val'):'single',q('sz'):'4',q('space'):'0',q('color'):'auto'})
grid=E.SubElement(t,q('tblGrid'));E.SubElement(grid,q('gridCol'),{q('w'):'9000'})
for name,ps in cases:
    tr=E.SubElement(t,q('tr'));tc=E.SubElement(tr,q('tc'));tcp=E.SubElement(tc,q('tcPr'));E.SubElement(tcp,q('tcW'),{q('w'):'9000',q('type'):'dxa'})
    para(tc,name,0,0,False)  # label row? keep label inside separate row instead
    tc.remove(tc[-1])
    for (txt,b,a,c) in ps:para(tc,txt,b,a,c)
body.append(sect);files['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/ctx.docx','w',zipfile.ZIP_DEFLATED) as z:
    for n,v in files.items():z.writestr(n,v)
