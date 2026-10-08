from zipfile import ZipFile
from pathlib import Path
from lxml import etree
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for f in Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer').glob('*Tezi*2019.docx'):
 with ZipFile(f) as z:
  root=etree.fromstring(z.read('word/document.xml')); ps=root.xpath('.//w:body/w:p',namespaces=ns)
  for i in (130,131): print(i,repr(''.join(ps[i].xpath('.//w:t/text()',namespaces=ns))))
