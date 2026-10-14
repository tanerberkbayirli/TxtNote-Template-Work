"""Freeze Mission 05 sources and deterministic text/run excerpts before testing."""
from pathlib import Path
from xml.etree import ElementTree as ET
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'orchestration/engine-work/mission05'
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    contract=read(ROOT/'orchestration/engine-work/mission01/acceptance-v3.json');ids=contract['missionCoverage']['05']['development']
    corpus=read(ROOT/'orchestration/engine-work/mission01/corpus.json');cases={c['id']:c for c in contract['cases']};synthetic={c['id']:c for c in corpus['synthetic']}
    inputs=[];samples={}
    for key in ids:
        row=cases.get(key) or synthetic[key]
        refs=[row['input'],*row['references'].values()] if key in cases else [*row['fixtures'],row['checks']]
        for ref in refs:assert sha(ROOT/ref['path'])==ref['sha256'],ref['path']
        inputs.append({'id':key,'sources':refs,'partition':'development'})
        if key not in cases:continue
        with zipfile.ZipFile(ROOT/row['input']['path']) as z:xml=ET.fromstring(z.read('word/document.xml'))
        candidates=[]
        for ordinal,p in enumerate(xml.iter(W+'p'),1):
            runs=[]
            for r in p.findall(W+'r'):
                text=''.join(t.text or '' for t in r.findall(W+'t'))
                if not text:continue
                pr=r.find(W+'rPr');bold=pr is not None and pr.find(W+'b') is not None;italic=pr is not None and pr.find(W+'i') is not None
                runs.append({'text':text,'bold':bold,'italic':italic})
            text=''.join(r['text'] for r in runs)
            if (300 if key=='SRC09' else 20)<=len(text)<=1600 and not any(p.find('.//'+W+t) is not None for t in ['drawing','fldChar','tab','br']):
                candidates.append({'paragraphOrdinal':ordinal,'xmlLocator':f'word/document.xml//w:p[{ordinal}]','runs':runs,'text':text})
        # Fixed first four eligible paragraphs: no selecting by test outcome.
        assert len(candidates)>=4,(key,len(candidates));samples[key]=candidates[:4]
    OUT.mkdir(exist_ok=True)
    (OUT/'inputs.json').write_text(json.dumps({'coverage':ids,'inputs':inputs,'samplingRule':'First four direct-run paragraphs of 300–1600 (SRC09) / 20–1600 (EDGE_STRUCTURE) characters without drawing/field/tab/br. Excerpts test typography, not original full-document pagination.','samples':samples},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PASS: frozen Mission 05 sources and eight deterministic source excerpts')
if __name__=='__main__':main()
