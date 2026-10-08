from zipfile import ZipFile
from pathlib import Path
from lxml import etree
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','v':'urn:schemas-microsoft-com:vml'}
for f in Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer').glob('*2019.docx'):
 print('\n',f.name)
 with ZipFile(f) as z:
  doc=etree.fromstring(z.read('word/document.xml'))
  pidx=130 if 'Tezi' in f.name else 124
  p=doc.xpath('.//w:body/w:p',namespaces=ns)[pidx]
  for g in p.xpath('.//v:group',namespaces=ns): print('GROUP',g.get('style'),g.get('coordsize'))
  for tag in ('rect','shape','textbox'):
   for n in p.xpath('.//v:'+tag,namespaces=ns):
    tx=''.join(n.xpath('.//w:t/text()',namespaces=ns))
    if tx or tag=='rect': print(tag,n.get('id'),n.get('style'),'TEXT',repr(tx[:100]))
