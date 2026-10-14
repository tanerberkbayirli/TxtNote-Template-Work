import zipfile,copy
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
with zipfile.ZipFile('orchestration/engine-work/final-closure/long/table-only-source.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);table=root.find('.//{'+W+'}tbl');rows=table.findall('{'+W+'}tr')
for i,r in enumerate(rows):
 if i not in [24,25]:table.remove(r)
for mode in ['exact','minimum','none']:
 r=copy.deepcopy(root);t=r.find('.//{'+W+'}tbl')
 if mode!='exact':
  h=t.find('{'+W+'}tr/{'+W+'}trPr/{'+W+'}trHeight');h.attrib.pop('{'+W+'}hRule',None)
 if mode=='none':
  for tr in t.findall('{'+W+'}tr'):
   pr=tr.find('{'+W+'}trPr');h=pr.find('{'+W+'}trHeight');pr.remove(h)
 files['word/document.xml']=E.tostring(r,encoding='UTF-8',xml_declaration=True,standalone=True)
 with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/three-layout/table-merge-'+mode+'.docx','w',zipfile.ZIP_DEFLATED) as z:
  for n,v in files.items():z.writestr(n,v)
