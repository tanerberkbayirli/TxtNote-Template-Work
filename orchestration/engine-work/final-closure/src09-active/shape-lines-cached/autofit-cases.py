import zipfile,copy,json
from lxml import etree as E
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'; WP='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'; A='http://schemas.openxmlformats.org/drawingml/2006/main';W14='http://schemas.microsoft.com/office/word/2010/wordml'
case=next(c for c in json.load(open('orchestration/engine-work/mission01/acceptance-v3.json',encoding='utf8'))['cases'] if c['id']=='SRC09')
with zipfile.ZipFile(case['input']['path']) as z:files={n:z.read(n) for n in z.namelist()}
root=E.fromstring(files['word/document.xml']);body=root.find('{'+W+'}body');p=next(p for p in body if p.get('{'+W14+'}paraId')=='0122B31B')
start=list(body).index(p);sect=next(n.find('{'+W+'}pPr/{'+W+'}sectPr') for n in list(body)[start:] if n.find('{'+W+'}pPr/{'+W+'}sectPr') is not None)
for mode in ['source','no-picture','fixed','source-tail']:
 r=copy.deepcopy(root);b=r.find('{'+W+'}body');q=copy.deepcopy(p);s=copy.deepcopy(sect)
 for c in list(b):b.remove(c)
 for c in list(s):
  if c.tag in ['{'+W+'}headerReference','{'+W+'}footerReference']:s.remove(c)
 if mode=='no-picture':
  for drawing in q.findall('.//{'+W+'}drawing'):
   if drawing.find('.//{http://schemas.openxmlformats.org/drawingml/2006/picture}pic') is not None:drawing.getparent().remove(drawing)
 if mode=='fixed':
  for fit in q.findall('.//{'+A+'}spAutoFit'):fit.tag='{'+A+'}noAutofit'
 if mode=='source-tail':
  lead=E.SubElement(b,'{'+W+'}p');pr=E.SubElement(lead,'{'+W+'}pPr');E.SubElement(pr,'{'+W+'}spacing',{'{'+W+'}before':'0','{'+W+'}after':'0','{'+W+'}line':'13000','{'+W+'}lineRule':'exact'});run=E.SubElement(lead,'{'+W+'}r');E.SubElement(run,'{'+W+'}t').text='FILLER'
 b.append(q)
 end=E.SubElement(b,'{'+W+'}p');pr=E.SubElement(end,'{'+W+'}pPr');E.SubElement(pr,'{'+W+'}spacing',{'{'+W+'}before':'0','{'+W+'}after':'0','{'+W+'}line':'240','{'+W+'}lineRule':'auto'});run=E.SubElement(end,'{'+W+'}r');E.SubElement(run,'{'+W+'}t').text='END';b.append(s)
 files['word/document.xml']=E.tostring(r,encoding='UTF-8',xml_declaration=True,standalone=True)
 with zipfile.ZipFile('orchestration/engine-work/final-closure/src09-active/shape-lines-cached/autofit-'+mode+'.docx','w',zipfile.ZIP_DEFLATED) as z:
  for n,v in files.items():z.writestr(n,v)
