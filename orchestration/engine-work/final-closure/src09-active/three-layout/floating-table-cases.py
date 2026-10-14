import json,copy,zipfile
from pathlib import Path
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';a=lambda k:'{'+W+'}'+k
src=next(c for c in json.load(open('orchestration/engine-work/mission01/acceptance-v3.json',encoding='utf8'))['cases'] if c['id']=='SRC09')['input']['path']
with zipfile.ZipFile(src) as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find(a('body'))
table=next(t for t in body if t.tag==a('tbl') and t.find(a('tblPr')+'/'+a('tblpPr')) is not None and t.find(a('tblPr')+'/'+a('tblpPr')).get(a('tblpXSpec'))=='center' and t.find(a('tblPr')+'/'+a('tblpPr')).get(a('tblpY'))=='89')
i=list(body).index(table);blank=body[i+1];caption=body[i-1]
sect=next(n.find(a('pPr')+'/'+a('sectPr')) for n in list(body)[i:] if n.find(a('pPr')+'/'+a('sectPr')) is not None)
out=Path('orchestration/engine-work/final-closure/src09-active/floating-table-cases');out.mkdir(exist_ok=True)
for count in [0,2,4,8]:
 r=copy.deepcopy(root);b=r.find(a('body'));s=copy.deepcopy(sect)
 for c in list(b):b.remove(c)
 for c in list(s):
  if c.tag in [a('headerReference'),a('footerReference')]:s.remove(c)
 lead=E.SubElement(b,a('p'));pr=E.SubElement(lead,a('pPr'));E.SubElement(pr,a('spacing'),{a('before'):'0',a('after'):'0',a('line'):'360',a('lineRule'):'auto'});rr=E.SubElement(lead,a('r'));E.SubElement(rr,a('t')).text='MARKER'
 b.append(copy.deepcopy(caption));b.append(copy.deepcopy(table))
 for _ in range(count):b.append(copy.deepcopy(blank))
 p=E.SubElement(b,a('p'));pr=E.SubElement(p,a('pPr'));E.SubElement(pr,a('spacing'),{a('before'):'120',a('after'):'120',a('line'):'360',a('lineRule'):'auto'});rr=E.SubElement(p,a('r'));E.SubElement(rr,a('t')).text='END'
 b.append(s);files['word/document.xml']=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
 with zipfile.ZipFile(out/f'blank-{count}.docx','w',zipfile.ZIP_DEFLATED) as z:
  for n,v in files.items():z.writestr(n,v)
