import json,re,unicodedata
from pathlib import Path
from html.parser import HTMLParser
import fitz

class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.current=None
    def handle_starttag(self,tag,attrs):
        if tag in ['p','h1','h2','h3','h4']:
            self.current=[]
    def handle_data(self,data):
        if self.current is not None:self.current.append(data)
    def handle_endtag(self,tag):
        if tag in ['p','h1','h2','h3','h4'] and self.current is not None:
            self.parts.append(''.join(self.current));self.current=None

def norm(text):
    return ''.join(c for c in unicodedata.normalize('NFKC',text).lower().replace('ı','i') if c.isalnum())

base=Path('orchestration/engine-work/final-closure/final-2026-10-12b/all-word/aku-isg-tezsiz-proje/run')
fixture=json.loads(Path('orchestration/specs/aku-isg-tezsiz-proje.fixture.json').read_text(encoding='utf-8-sig'))
parser=Blocks();parser.feed(fixture['content'])
report={}
for label,name in [('pdf','default.pdf'),('word','default.word.pdf')]:
    doc=fitz.open(base/name)
    text=''.join(page.get_text(clip=fitz.Rect(0,0,page.rect.width,270*72/25.4)) for page in doc)
    normalized=norm(text)
    checks=[];cursor=0
    for i,part in enumerate(parser.parts):
        needle=norm(part)
        at=normalized.find(needle,cursor)
        checks.append({'index':i,'characters':len(needle),'foundInOrder':at>=0,'sample':part[:50]})
        if at>=0:cursor=at+len(needle)
    report[label]={'pages':len(doc),'blocks':len(checks),'foundInOrder':sum(x['foundInOrder'] for x in checks),'missing':[x for x in checks if not x['foundInOrder']]}
output=Path('orchestration/engine-work/final-closure/resumed-20261012/isg-label-evidence.json')
output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
