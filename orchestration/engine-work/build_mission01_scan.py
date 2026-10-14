"""Make a clearly labelled synthetic image-only scan with independent ground truth."""
import io
import json
import hashlib
from pathlib import Path
import sys
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'orchestration/tools'))
from pdfmeasure import open_pdf,pymupdf

OUT=ROOT/'orchestration/engine-work/mission01/inputs'
final='--finalize' in sys.argv
source=ROOT/f'orchestration/validation/mission01/source-references/{"EDGE_STRUCTURE" if final else "EDGE01R"}/word.pdf'
pdf_path=OUT/('edge-synthetic-scans-final.pdf' if final else 'edge-synthetic-scans.pdf')
if pdf_path.exists():raise SystemExit('Scan input already exists; preserve/version it.')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ground=[]
with open_pdf(str(source)) as src, pymupdf.open() as result:
    for marker,angle,dpi,blur in [('EDGE STYLE',0,150,0),('EDGE TABLE',0,100,.45),('EDGE MATH',90,150,0)]:
        matches=[(i,p) for i,p in enumerate(src) if marker in p.get_text()]
        if len(matches)!=1:raise ValueError(f'Ambiguous source marker {marker}')
        index,page=matches[0]
        pix=page.get_pixmap(dpi=dpi,alpha=False)
        image=Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
        if blur:image=image.convert('L').filter(ImageFilter.GaussianBlur(blur))
        if angle:image=image.rotate(angle,expand=True)
        data=io.BytesIO();image.save(data,format='PNG')
        width,height=(page.rect.height,page.rect.width) if angle else (page.rect.width,page.rect.height)
        target=result.new_page(width=width,height=height)
        target.insert_image(target.rect,stream=data.getvalue())
        ground.append({'scanPhysicalPage':len(result),'sourcePhysicalPage':index+1,'sourceMarker':marker,
            'dpi':dpi,'rotationCounterclockwise':angle,'grayscale':bool(blur),'gaussianBlurPx':blur,
            'sourceText':page.get_text(),'sourceWords':[{'text':w[4],'sourceBoxPt':list(w[:4])} for w in page.get_text('words')],
            'readingOrder':'Source Word PDF text order; verify table cells and equation structures separately against native DOCX.',
            'equationRule':'Native OMML is the equation ground truth; source PDF text does not encode mathematical structure.'})
    result.save(str(pdf_path),deflate=True)
with open_pdf(str(pdf_path)) as scan:
    assert len(scan)==3 and all(not p.get_text().strip() and len(p.get_images())==1 for p in scan)
data={'schemaVersion':1,'role':'synthetic-scan-boundary-not-a-real-scanned-thesis',
      'pdf':{'path':pdf_path.relative_to(ROOT).as_posix(),'sha256':sha(pdf_path)},
      'sourcePdf':{'path':source.relative_to(ROOT).as_posix(),'sha256':sha(source)},
      'pages':ground,'checks':{'physicalPages':3,'textLayerCharacters':0,'imagesPerPage':1},
      'acceptance':'Prepared input and known content only; OCR implementation and accuracy are Mission 04.'}
(OUT/('scan-ground-truth-final.json' if final else 'scan-ground-truth.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'scanPages':3,'textLayerCharacters':0,'groundTruth':'recorded'}))
