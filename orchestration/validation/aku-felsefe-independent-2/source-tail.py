from zipfile import ZipFile
from pathlib import Path
from lxml import etree
for f in Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer').glob('*2019.docx'):
 print('\n',f.name)
 with ZipFile(f) as z:
  root=etree.fromstring(z.read('word/document.xml')); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
  ps=root.xpath('.//w:body/w:p',namespaces=ns)
  for i,p in enumerate(ps):
   s=''.join(p.xpath('.//w:t/text()',namespaces=ns))
   if i>=115 and s: print(i,repr(s[:250]))
