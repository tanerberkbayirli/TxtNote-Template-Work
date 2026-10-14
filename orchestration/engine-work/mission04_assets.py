"""Reproducible inventory of bundled PDF/OCR assets; no runtime downloads."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
PUBLIC=ROOT/'TxtNote/frontend/public'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def package(name):return json.loads((ROOT/'TxtNote/frontend/node_modules'/name/'package.json').read_text())['version']
def main():
    files=[]
    for folder in ['ocr','pdf-assets']:
        for p in sorted((PUBLIC/folder).rglob('*')):
            if not p.is_file():continue
            rel=p.relative_to(PUBLIC).as_posix()
            if folder=='pdf-assets':origin='npm:pdfjs-dist@'+package('pdfjs-dist')
            elif p.name.endswith('.traineddata'):origin='https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/'+p.name
            elif p.name.startswith('tesseract-core'):origin='npm:tesseract.js-core@'+package('tesseract.js-core')
            elif p.name=='LICENSE-tessdata':origin='https://github.com/tesseract-ocr/tessdata_fast/blob/4.1.0/LICENSE'
            elif p.name=='LICENSE-tesseract-core':origin='npm:tesseract.js-core@'+package('tesseract.js-core')
            else:origin='npm:tesseract.js@'+package('tesseract.js')
            assert p.stat().st_size>0,rel
            files.append({'path':rel,'bytes':p.stat().st_size,'sha256':sha(p),'origin':origin})
    result={'status':'PASS','packages':{n:package(n) for n in ['pdfjs-dist','tesseract.js','tesseract.js-core']},'tessdata':'tessdata_fast 4.1.0','runtimeExternalRequests':False,'files':files}
    (ROOT/'orchestration/engine-work/mission04/bundled-assets.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(f'PASS: {len(files)} bundled assets, {sum(f["bytes"] for f in files)} bytes')
if __name__=='__main__':main()
