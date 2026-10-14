from pathlib import Path
from lxml import etree as E
import zipfile,copy
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';a=lambda k:'{'+W+'}'+k
with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/floating-table-cases/blank-0.docx') as z:files={n:z.read(n) for n in z.namelist()}
r=E.fromstring(files['word/document.xml']);b=r.find(a('body'));sect=copy.deepcopy(b.find(a('sectPr')))
for c in list(b):b.remove(c)
for size in [12,18]:
 for multiple in [1,1.5]:
  for mode in ['normal','subscript','superscript']:
   p=E.SubElement(b,a('p'));pr=E.SubElement(p,a('pPr'));E.SubElement(pr,a('spacing'),{a('before'):'0',a('after'):'0',a('line'):str(int(240*multiple)),a('lineRule'):'auto'})
   for text,script in [(f'{size}-{multiple}-{mode} W',''),('ia',mode if mode!='normal' else ''),(' END','')]:
    rr=E.SubElement(p,a('r'));rp=E.SubElement(rr,a('rPr'));E.SubElement(rp,a('rFonts'),{a('ascii'):'Times New Roman',a('hAnsi'):'Times New Roman'});E.SubElement(rp,a('sz'),{a('val'):str(size*2)})
    if script:E.SubElement(rp,a('vertAlign'),{a('val'):script})
    E.SubElement(rr,a('t'),{'{http://www.w3.org/XML/1998/namespace}space':'preserve'}).text=text
b.append(sect);files['word/document.xml']=E.tostring(r,encoding='UTF-8',xml_declaration=True,standalone=True)
out=Path('orchestration/engine-work/final-closure/src09-active/script-cases');out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/'scripts.docx','w',zipfile.ZIP_DEFLATED) as z:
 for n,v in files.items():z.writestr(n,v)
