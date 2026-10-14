import zipfile,json,copy
from lxml import etree as E
from pathlib import Path
out=Path('orchestration/engine-work/final-closure/src09-resume/math');out.mkdir(exist_ok=True)
src=json.load(open('orchestration/engine-work/mission01/references/SRC09/record.json',encoding='utf8'))['source']
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';M='http://schemas.openxmlformats.org/officeDocument/2006/math';ns={'w':W,'m':M}
with zipfile.ZipFile(src) as z: files={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(files['word/document.xml']);body=doc.find('w:body',ns);sect=copy.deepcopy(body.find('w:sectPr',ns))
pars=[copy.deepcopy(p) for p in body.findall('.//w:p',ns) if p.findall('.//m:oMath',ns)]
def mark(i,br=False):
 return E.fromstring(f'<w:p xmlns:w="{W}"><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>{"<w:pageBreakBefore/>" if br else ""}</w:pPr><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>MARK{i}</w:t></w:r></w:p>')
for c in list(body):body.remove(c)
rows=[]
for i,p in enumerate(pars):
 body.append(mark(f'{i}A',i>0));body.append(p);body.append(mark(f'{i}B'))
 rows.append({'index':i,'text':''.join(p.itertext()),'xml':E.tostring(p,encoding='unicode')})
body.append(sect);files['word/document.xml']=E.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
with zipfile.ZipFile(out/'excerpt.docx','w',zipfile.ZIP_DEFLATED) as z:
 for n,v in files.items():z.writestr(n,v)
(out/'source-paragraphs.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print(len(rows),'original equation paragraphs')
