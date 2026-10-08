from zipfile import ZipFile
from pathlib import Path
from lxml import etree
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'; V='urn:schemas-microsoft-com:vml'; ns={'w':W,'v':V}
p=Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx')
with ZipFile(p) as z:
 root=etree.fromstring(z.read('word/document.xml')); par=root.xpath('.//w:body/w:p',namespaces=ns)[131]
 for el in par.xpath('.//v:group|.//v:rect|.//v:shape',namespaces=ns):
  t=''.join(el.xpath('.//w:t/text()',namespaces=ns))
  if el.tag==f'{{{V}}}group': print('GROUP',el.get('style'),el.get('coordsize'))
  elif t: print('SHAPE',el.get('id'),el.get('style'),repr(t[:1000]))
 for box in par.xpath('.//w:txbxContent',namespaces=ns): print('TEXTBOX',repr(''.join(box.xpath('.//w:t/text()',namespaces=ns))[:1000]))
