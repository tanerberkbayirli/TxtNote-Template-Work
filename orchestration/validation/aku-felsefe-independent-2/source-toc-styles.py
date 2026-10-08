from zipfile import ZipFile
from pathlib import Path
from lxml import etree
p=Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx')
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(p) as z:
 styles=etree.fromstring(z.read('word/styles.xml'))
 for id in ['T1','T2']:
  found=styles.xpath('.//w:style[@w:styleId=$id]',namespaces=ns,id=id)
  print(id,etree.tostring(found[0],encoding='unicode') if found else 'missing')
