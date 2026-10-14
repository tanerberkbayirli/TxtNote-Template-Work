import fitz,re,json,zipfile,xml.etree.ElementTree as E
from pathlib import Path
base=Path('orchestration/engine-work/final-closure/final-2026-10-12b/all-word/afsu-lee/run');report={}
for name in ['default.pdf','default.word.pdf']:
 d=fitz.open(base/name);rows=[]
 for i,p in enumerate(d):
  spans=[s for b in p.get_text('dict')['blocks']if 'lines'in b for l in b['lines']for s in l['spans']]
  for s in spans:
   if re.fullmatch(r'Madde \d+\s*',s['text']):rows.append({'page':i+1,'text':s['text'].strip(),'baseline':s['origin'][1],'size':s['size'],'bbox':s['bbox']})
 report[name]=rows
 print(name,[(r['page'],r['text'],round(r['baseline'],3),r['size'])for r in rows if r['page']in[24,25,26]])
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
with zipfile.ZipFile(base/'default.docx')as z:
 r=E.fromstring(z.read('word/document.xml'));ts=r.findall('.//'+W+'tbl');
 for t in ts:
  if 'Madde 45' in ''.join(t.itertext()):
   rows=t.findall(W+'tr');print('XMLTABLE',len(rows));print(E.tostring(rows[1],encoding='unicode')[:3500]);report['xmlRow']=E.tostring(rows[1],encoding='unicode')
Path('orchestration/engine-work/final-closure/resumed-20261012/afsu-row-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
