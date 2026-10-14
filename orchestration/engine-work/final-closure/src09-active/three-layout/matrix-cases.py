import zipfile, copy
from lxml import etree as E
from pathlib import Path
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
M='http://schemas.openxmlformats.org/officeDocument/2006/math'
src=Path('orchestration/engine-work/final-closure/src09-resume/math/excerpt.docx')
with zipfile.ZipFile(src) as z: files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find('{'+W+'}body')
p=next(p for p in body if p.tag=='{'+W+'}p' and p.find('.//{'+M+'}m') is not None)
sect=copy.deepcopy(body.find('{'+W+'}sectPr'))
for c in list(body):body.remove(c)
def marker(label):
 q=E.Element('{'+W+'}p');pp=E.SubElement(q,'{'+W+'}pPr')
 E.SubElement(pp,'{'+W+'}spacing',{'{'+W+'}before':'0','{'+W+'}after':'0','{'+W+'}line':'240','{'+W+'}lineRule':'auto'})
 if label.endswith('A'):E.SubElement(pp,'{'+W+'}pageBreakBefore')
 r=E.SubElement(q,'{'+W+'}r');pr=E.SubElement(r,'{'+W+'}rPr')
 E.SubElement(pr,'{'+W+'}rFonts',{'{'+W+'}ascii':'Times New Roman','{'+W+'}hAnsi':'Times New Roman'})
 E.SubElement(pr,'{'+W+'}sz',{'{'+W+'}val':'24'})
 E.SubElement(r,'{'+W+'}t').text=label
 return q
for n in range(1,6):
 q=copy.deepcopy(p);m=q.find('.//{'+M+'}m');rows=m.findall('{'+M+'}mr')
 for r in rows:m.remove(r)
 for i in range(n):m.append(copy.deepcopy(rows[min(i,len(rows)-1)]))
 body.append(marker('MATRIX'+str(n)+'A'));body.append(q);body.append(marker('MATRIX'+str(n)+'B'))
body.append(sect);files['word/document.xml']=E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/three-layout/matrix-cases.docx','w',zipfile.ZIP_DEFLATED) as z:
 for n,v in files.items():z.writestr(n,v)
