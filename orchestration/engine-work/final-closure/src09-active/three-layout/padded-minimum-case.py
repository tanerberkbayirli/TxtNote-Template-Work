import zipfile,copy
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';a=lambda k:'{'+W+'}'+k
with zipfile.ZipFile('orchestration/engine-work/final-closure/long/table-only-source.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find(a('body'));sect=copy.deepcopy(body.find(a('sectPr')))
for c in list(body):body.remove(c)
def para(parent,text,spacing=None):
 p=E.SubElement(parent,a('p'));pp=E.SubElement(p,a('pPr'))
 E.SubElement(pp,a('spacing'),{a(k):v for k,v in (spacing or {'before':'0','after':'0','line':'240','lineRule':'auto'}).items()})
 rp=E.SubElement(pp,a('rPr'));E.SubElement(rp,a('sz'),{a('val'):'20'})
 r=E.SubElement(p,a('r'));rp=E.SubElement(r,a('rPr'));E.SubElement(rp,a('sz'),{a('val'):'20'});E.SubElement(r,a('t')).text=text
para(body,'FILLER',{'before':'0','after':'0','line':'7100','lineRule':'exact'})
t=E.SubElement(body,a('tbl'));pr=E.SubElement(t,a('tblPr'));E.SubElement(pr,a('tblW'),{a('w'):'5000',a('type'):'pct'})
b=E.SubElement(pr,a('tblBorders'))
for side in ['top','bottom','left','right','insideV']:E.SubElement(b,a(side),{a('val'):'single',a('sz'):'4'})
grid=E.SubElement(t,a('tblGrid'))
for _ in range(2):E.SubElement(grid,a('gridCol'),{a('w'):'6996'})
tr=E.SubElement(t,a('tr'));trpr=E.SubElement(tr,a('trPr'));E.SubElement(trpr,a('trHeight'),{a('val'):'800'})
tc=E.SubElement(tr,a('tc'));pr=E.SubElement(tc,a('tcPr'));m=E.SubElement(pr,a('tcMar'))
for side in ['top','bottom']:E.SubElement(m,a(side),{a('w'):'200',a('type'):'dxa'})
for text in ['PADDED','SECOND','THIRD','FOURTH']:para(tc,text)
tc=E.SubElement(tr,a('tc'));para(tc,'RIGHT')
body.append(sect);files['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/three-layout/padded-minimum.docx','w',zipfile.ZIP_DEFLATED) as z:
 for n,v in files.items():z.writestr(n,v)
