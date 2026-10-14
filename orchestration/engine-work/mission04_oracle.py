"""Independent PDF page/text/geometry checks, never renderer-generated expected data."""
from pathlib import Path
import base64,collections,hashlib,json,re,unicodedata,sys
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'orchestration/engine-work/mission04'
sys.path.insert(0,str(ROOT/'orchestration/tools/measurement-packages'))
import pymupdf as fitz
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def chars(text):return collections.Counter(c for c in unicodedata.normalize('NFKC',text) if not c.isspace() and c!='\xad')
def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.get('children',[]))
def main():
    results=[]
    for source in read(OUT/'inputs.json'):
        data=(ROOT/source['input']['path']).read_bytes();assert hashlib.sha256(data).hexdigest()==source['input']['sha256']
        model=read(OUT/(source['id']+'-model.json'));pdf=fitz.open(stream=data,filetype='pdf')
        assert len(pdf)==len(model['sections'])==len(model['source']['pages'])==source['physicalPages']
        assert base64.b64decode(model['source']['packageBase64'])==data
        pages=[]
        for index,(native,p) in enumerate(zip(pdf,model['source']['pages'])):
            expected=collections.Counter(t['id'] for t in p['tokens'])
            stories=model['sections'][index]['nodes']+p['margins']['header']+p['margins']['footer']
            actual=collections.Counter(n['properties']['pdf']['tokenId'] for n in walk(stories) if n.get('properties',{}).get('pdf',{}).get('tokenId'))
            assert expected==actual, (source['id'],p['number'],'lost/duplicated tokens',expected-actual,actual-expected)
            source_chars=chars(native.get_text());imported_chars=chars(p['sourceText']);common=sum((source_chars&imported_chars).values())
            if source['id']=='SRC02':
                assert common==sum(source_chars.values()),(source['id'],p['number'],'native source characters missing')
            tables=native.find_tables().tables
            pages.append({'page':p['number'],'method':p['method'],'tokens':len(p['tokens']),
                'nativeTextCharacters':sum(source_chars.values()),'independentCharacterRecall':common/sum(source_chars.values()) if source_chars else None,
                'nativeTableBoxes':[list(t.bbox) for t in tables],
                'importedTableBoxes':[{k:i[k] for k in ['x','y','width','height','rows','columns']} for i in p['items'] if i['kind']=='table'],
                'nativeImages':len(native.get_image_info()),'importedImages':sum(i['kind']=='image' for i in p['items']),
                'ocrConfidence':p['ocrConfidence'],'ocrRotation':p.get('ocrRotation',0)})
        result={'id':source['id'],'status':'PASS','pages':pages,'exactOriginalPdfPreserved':True,'allExtractedTokensPreservedExactlyOnce':True}
        if source['id']=='EDGE_SCAN':
            truth=read(ROOT/'orchestration/engine-work/mission01/inputs/scan-ground-truth-final.json');metrics=[]
            for expected,p in zip(truth['pages'],model['source']['pages']):
                e=chars(expected['sourceText']);a=chars(p['sourceText']);recall=sum((e&a).values())/sum(e.values())
                marker=expected['sourceMarker'];assert marker in p['sourceText'],(p['number'],marker)
                assert p['method']=='ocr'
                assert any(i['code']=='ocr-review' and i['page']==p['number'] for i in model['source']['unsupported'])
                metrics.append({'page':p['number'],'marker':marker,'markerPresent':True,'characterBagRecall':recall,'confidence':p['ocrConfidence']})
            result['scanGroundTruth']=metrics
        results.append(result)
    summary={'status':'PASS','cases':results,'scope':'Page and token preservation exact; independent PyMuPDF text/table metrics and scan markers. OCR accuracy is measured, not claimed perfect.'}
    (OUT/'oracle-verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':'PASS','cases':[{k:r[k] for k in ['id','status']} for r in results]}))
if __name__=='__main__':main()
