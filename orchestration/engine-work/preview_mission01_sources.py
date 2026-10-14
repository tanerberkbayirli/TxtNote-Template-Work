"""Make representative source previews; this is not source-wide conformance QA."""
import json
from pathlib import Path
import sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'orchestration/tools'))
from pdfmeasure import open_pdf
OUT=ROOT/'orchestration/engine-work/mission01'
corpus=json.loads((OUT/'corpus.json').read_text(encoding='utf-8'))
rows=[]
for source in corpus['sources']:
    cid=source['id'];docx=source['path'].endswith('.docx')
    folder=ROOT/'orchestration/validation/mission01/source-references'/cid
    aligned=(folder/'audit-aligned.json').exists()
    pdf=folder/('audit-aligned.pdf' if aligned else 'word.pdf') if docx else ROOT/source['path']
    wanted={1}
    if docx:
        audit=json.loads((folder/('audit-aligned.json' if aligned else 'audit.json')).read_text(encoding='utf-8-sig'))
        seen=set()
        for feature in audit['features']:
            if feature['kind'] not in seen:
                wanted.add(feature['location']['firstPhysicalPage']);seen.add(feature['kind'])
    with open_pdf(str(pdf)) as doc:
        wanted.add(len(doc));wanted.add(max(1,len(doc)//2))
        pages=sorted(wanted);thumbs=[]
        for n in pages:
            page=doc[n-1];pix=page.get_pixmap(dpi=60,alpha=False)
            im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.thumbnail((270,370));thumbs.append((n,im))
    sheet=Image.new('RGB',(len(thumbs[:5])*290,((len(thumbs)+4)//5)*400),'#ddd');draw=ImageDraw.Draw(sheet)
    for i,(n,im) in enumerate(thumbs):
        x,y=(i%5)*290,(i//5)*400;draw.text((x+8,y+4),f'{cid} physical {n}',fill='black');sheet.paste(im,(x+8,y+24))
    output=OUT/'qa'/f'{cid}-samples.png';sheet.save(output)
    rows.append({'id':cid,'sourcePdf':pdf.relative_to(ROOT).as_posix(),'physicalPagesPreviewed':pages,'preview':output.relative_to(ROOT).as_posix()})
(OUT/'source-previews.json').write_text(json.dumps({'scope':'Representative source page previews; full visual references are source PDFs, not these reduced previews.','sources':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'sourcePreviews':len(rows),'pages':sum(len(r['physicalPagesPreviewed']) for r in rows)}))
