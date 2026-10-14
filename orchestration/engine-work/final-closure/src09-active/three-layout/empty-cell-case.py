import zipfile,copy
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
with zipfile.ZipFile('orchestration/engine-work/final-closure/long/table-only-source.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find('{'+W+'}body');sect=copy.deepcopy(body.find('{'+W+'}sectPr'))
for c in list(body):body.remove(c)
t=E.SubElement(body,'{'+W+'}tbl');pr=E.SubElement(t,'{'+W+'}tblPr');E.SubElement(pr,'{'+W+'}tblW',{'{'+W+'}w':'5000','{'+W+'}type':'pct'})
grid=E.SubElement(t,'{'+W+'}tblGrid');E.SubElement(grid,'{'+W+'}gridCol',{'{'+W+'}w':'13992'})
tr=E.SubElement(t,'{'+W+'}tr');tc=E.SubElement(tr,'{'+W+'}tc')
for i,text in enumerate(['START']+['']*20+['END']):
 p=E.SubElement(tc,'{'+W+'}p');pp=E.SubElement(p,'{'+W+'}pPr');rp=E.SubElement(pp,'{'+W+'}rPr');E.SubElement(rp,'{'+W+'}sz',{'{'+W+'}val':'20'})
 if text:
  r=E.SubElement(p,'{'+W+'}r');rp=E.SubElement(r,'{'+W+'}rPr');E.SubElement(rp,'{'+W+'}sz',{'{'+W+'}val':'20'});E.SubElement(r,'{'+W+'}t').text=text
body.append(sect);files['word/document.xml']=E.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/three-layout/empty-cell.docx','w',zipfile.ZIP_DEFLATED) as z:
 for n,v in files.items():z.writestr(n,v)
