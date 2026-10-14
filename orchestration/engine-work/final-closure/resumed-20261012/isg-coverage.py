import json,re,unicodedata,hashlib,zipfile,xml.etree.ElementTree as E
from pathlib import Path
from html.parser import HTMLParser
import fitz
class Text(HTMLParser):
 def __init__(self):super().__init__();self.stack=[];self.parts=[];self.skip=0;self.notes=[]
 def handle_starttag(self,t,a):
  if t=='sup' and 'academic-footnote' in dict(a).get('class',''):self.skip+=1;self.notes.append(dict(a).get('data-fn-text',''));return
  if t in ['p','h1','h2','h3','h4','td','th']:self.stack.append([t,[]])
 def handle_data(self,s):
  if self.stack and not self.skip:self.stack[-1][1].append(s)
 def handle_endtag(self,t):
  if t=='sup' and self.skip:self.skip-=1;return
  if self.stack and self.stack[-1][0]==t:
   _,s=self.stack.pop();v=''.join(s)
   if self.stack:self.stack[-1][1].append(v)
   elif v.strip():self.parts.append(v)
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKC',s).casefold().replace('ı','i') if c.isalnum())
def footer(pg):
 return ''.join(s['text']for block in pg.get_text('dict')['blocks']if 'lines'in block for line in block['lines']for s in line['spans']if 10.8<s['size']<11.2 and s['bbox'][1]>760).strip()or'none'
b=Path('orchestration/engine-work/final-closure/final-2026-10-12b/all-word/aku-isg-tezsiz-proje/run');fixture=Path('orchestration/specs/aku-isg-tezsiz-proje.fixture.json');f=json.loads(fixture.read_text(encoding='utf8'));t=Text();t.feed(f['content']);print('parts',len(t.parts))
report={'fixtureSha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),'sourceBlocks':len(t.parts)}
for name in ['default.pdf','default.word.pdf']:
 d=fitz.open(b/name);pages=[''.join(s['text'] for block in p.get_text('dict')['blocks'] if 'lines' in block for line in block['lines'] for s in line['spans'] if s['size']>11.5 and s['bbox'][1]<270*72/25.4)for p in d];s=norm(''.join(pages));rows=[];cursor=0
 for i,p in enumerate(t.parts):
  v=norm(p);at=s.find(v,cursor);anyat=s.find(v);rows.append({'i':i,'len':len(v),'ordered':at>=0,'anywhere':anyat>=0,'sample':p[:65]});
  if at>=0:cursor=at+len(v)
 notes=norm(''.join(s['text'] for p in d for block in p.get_text('dict')['blocks'] if 'lines' in block for line in block['lines'] for s in line['spans'] if 8.8<s['size']<9.2))
 report[name]={'sha256':hashlib.sha256((b/name).read_bytes()).hexdigest(),'pages':len(d),'ordered':sum(r['ordered']for r in rows),'anywhere':sum(r['anywhere']for r in rows),'missing':[r for r in rows if not r['ordered']], 'footnoteTextOccurrences':[notes.count(norm(n))for n in t.notes], 'footerLabels':[footer(pg) for pg in d]};Path('orchestration/engine-work/final-closure/resumed-20261012/isg-'+name+'.txt').write_text('\n'.join(pages),encoding='utf8')
with zipfile.ZipFile(b/'default.docx')as z:
 root=E.fromstring(z.read('word/document.xml'));s=norm(''.join(root.itertext()));cursor=0;rows=[]
 for i,p in enumerate(t.parts):
  at=s.find(norm(p),cursor);rows.append({'i':i,'ordered':at>=0,'sample':p[:65]});
  if at>=0:cursor=at+len(norm(p))
 report['docx']={'ordered':sum(r['ordered']for r in rows),'missing':[r for r in rows if not r['ordered']]}
original=fitz.open('orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.pdf');report['originalTemplate']={'sha256':hashlib.sha256(Path('orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.pdf').read_bytes()).hexdigest(),'pages':len(original),'footerLabels':[footer(pg)for pg in original]};report['normalization']='Unicode NFKC/casefold/TurkishI; alphanumeric sequence. Complete paragraph/cell text matched in order. Footnote reference glyphs excluded; all5 authored footnote bodies independently checked exactly once in9ptstream.12ptbody measured separately from9ptnotes and11ptPAGE footers; no source text removed.'
Path('orchestration/engine-work/final-closure/resumed-20261012/isg-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False))
expected=['none','none','ii','iii','iv','v','vi','vii','viii','ix','x']+list(map(str,range(1,22)))
assert all(report[n]['ordered']==report['sourceBlocks']and not report[n]['missing']for n in ['docx','default.pdf','default.word.pdf'])
assert all(report[n]['footnoteTextOccurrences']==[1]*5 and report[n]['footerLabels']==expected for n in ['default.pdf','default.word.pdf'])

