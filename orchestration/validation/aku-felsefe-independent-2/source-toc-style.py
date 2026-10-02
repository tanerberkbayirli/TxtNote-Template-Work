from zipfile import ZipFile
from pathlib import Path
from lxml import etree
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'; V='urn:schemas-microsoft-com:vml'; ns={'w':W,'v':V}
pth=Path('Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx')
with ZipFile(pth) as z:
 root=etree.fromstring(z.read('word/document.xml')); p=root.xpath('.//w:body/w:p',namespaces=ns)[131]
 for group in p.xpath('.//v:group',namespaces=ns): print('GROUP',group.get('style'),group.get('coordsize'))
 for shape in p.xpath('.//v:rect|.//v:shape',namespaces=ns):
  txt=''.join(shape.xpath('.//w:t/text()',namespaces=ns))
  if txt: print('SHAPE',shape.get('id'),shape.get('style'),'textlen',len(txt),'sample',repr(txt[:100]))
 boxes=p.xpath('.//w:txbxContent',namespaces=ns)
 for bi,box in enumerate(boxes):
  ps=box.xpath('./w:p',namespaces=ns); print('textbox',bi,'paras',len(ps))
  for i,q in enumerate(ps[:28]):
   text=''.join(q.xpath('.//w:t/text()',namespaces=ns)); ppr=q.find('{'+W+'}pPr'); props=[]
   if ppr is not None:
    for e in ppr:
     if etree.QName(e).localname in ['pStyle','jc','spacing','ind','tabs','keepNext']:
      props.append((etree.QName(e).localname,dict((etree.QName(k).localname,v) for k,v in e.attrib.items())))
   styles=[]
   for r in q.xpath('./w:r',namespaces=ns):
    rt=''.join(r.xpath('.//w:t/text()',namespaces=ns)); rp=r.find('{'+W+'}rPr'); attrs=[]
    if rp is not None:
     for e in rp:
      attrs.append((etree.QName(e).localname,dict((etree.QName(k).localname,v) for k,v in e.attrib.items())))
    if rt: styles.append((rt[:45],attrs))
   print(i,repr(text[:80]),props,styles[:2])
