from pathlib import Path
from lxml import etree as E
import zipfile,copy
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';a=lambda k:'{'+W+'}'+k
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/floating-table-cases/blank-0.docx') as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find(a('body'));sect=copy.deepcopy(body.find(a('sectPr')))
out=Path('orchestration/engine-work/final-closure/src09-active/row-height-cases');out.mkdir(exist_ok=True)
for mode in ['exact','atLeast','exactZero','exactTop','exactBottom']:
 r=copy.deepcopy(root);b=r.find(a('body'))
 for c in list(b):b.remove(c)
 t=E.SubElement(b,a('tbl'));pr=E.SubElement(t,a('tblPr'));E.SubElement(pr,a('tblW'),{a('w'):'5000',a('type'):'pct'})
 mar=E.SubElement(pr,a('tblCellMar'))
 for side in ['top','bottom']:E.SubElement(mar,a(side),{a('w'):'0' if mode=='exactZero' or mode=='exactTop' and side=='bottom' or mode=='exactBottom' and side=='top' else '200',a('type'):'dxa'})
 border=E.SubElement(pr,a('tblBorders'))
 for side in ['top','bottom','left','right','insideH','insideV']:E.SubElement(border,a(side),{a('val'):'single',a('sz'):'4'})
 grid=E.SubElement(t,a('tblGrid'));E.SubElement(grid,a('gridCol'),{a('w'):'8000'})
 for i in range(3):
  tr=E.SubElement(t,a('tr'));trpr=E.SubElement(tr,a('trPr'));E.SubElement(trpr,a('trHeight'),{a('val'):'800',a('hRule'):'atLeast' if mode=='atLeast' else 'exact'})
  tc=E.SubElement(tr,a('tc'));p=E.SubElement(tc,a('p'));pp=E.SubElement(p,a('pPr'));E.SubElement(pp,a('spacing'),{a('before'):'0',a('after'):'0',a('line'):'200',a('lineRule'):'exact'})
  rr=E.SubElement(p,a('r'));rp=E.SubElement(rr,a('rPr'));E.SubElement(rp,a('sz'),{a('val'):'20'});E.SubElement(rr,a('t')).text=f'ROW{i+1}'
 b.append(copy.deepcopy(sect));files['word/document.xml']=E.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
 with zipfile.ZipFile(out/f'{mode}.docx','w',zipfile.ZIP_DEFLATED) as z:
  for n,v in files.items():z.writestr(n,v)
