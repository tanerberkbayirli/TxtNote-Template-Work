from zipfile import ZipFile
from pathlib import Path
from lxml import etree
terms=['Tablo','Şekil','Resim','başlık','BİRİNCİ BÖLÜM','KAYNAKÇA']
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for f in Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer').glob('*2019.docx'):
 print('\n'+f.name)
 with ZipFile(f) as z:
  root=etree.fromstring(z.read('word/document.xml'))
  ps=root.xpath('.//w:body/w:p',namespaces=ns)
  for term in terms:
   found=[]
   for i,p in enumerate(ps):
    text=''.join(p.xpath('.//w:t/text()',namespaces=ns))
    if term.lower() in text.lower(): found.append((i,text[:180]))
   print(term,found[:10])
