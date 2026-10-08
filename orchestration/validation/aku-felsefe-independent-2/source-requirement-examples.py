from zipfile import ZipFile
from pathlib import Path
from lxml import etree
for f in Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer').glob('*2019.docx'):
 print('\n'+f.name)
 with ZipFile(f) as z:
  root=etree.fromstring(z.read('word/document.xml')); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
  ps=root.xpath('.//w:body/w:p',namespaces=ns)
  for i,p in enumerate(ps):
   if 61<=i<=130 if 'Tezi' in f.name else 53<=i<=124:
    s=''.join(p.xpath('.//w:t/text()',namespaces=ns))
    if s: print(i,s[:400])
