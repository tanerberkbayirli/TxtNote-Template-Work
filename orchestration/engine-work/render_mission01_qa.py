"""Rasterize source references for inspection; originals are never rewritten."""
from pathlib import Path
import sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'orchestration/tools'))
from pdfmeasure import open_pdf
qa=ROOT/'orchestration/engine-work/mission01/qa'
final='--final' in sys.argv
for ident in ['EDGE_STRUCTURE','EDGE_NOTES','SCAN_FINAL'] if final else ['EDGE01R','EDGE02','SCAN']:
    path=ROOT/f'orchestration/engine-work/mission01/inputs/{"edge-synthetic-scans-final.pdf" if final else "edge-synthetic-scans.pdf"}' if ident.startswith('SCAN') else ROOT/f'orchestration/validation/mission01/source-references/{ident}/word.pdf'
    folder=qa/ident;folder.mkdir(parents=True,exist_ok=True)
    images=[]
    with open_pdf(str(path)) as doc:
        for n,page in enumerate(doc,1):
            target=folder/f'page-{n:02d}.png'
            page.get_pixmap(dpi=110,alpha=False).save(str(target))
            im=Image.open(target).convert('RGB');im.thumbnail((300,400));images.append((n,im.copy()))
    sheet=Image.new('RGB',(4*320,((len(images)+3)//4)*430),'#dddddd');draw=ImageDraw.Draw(sheet)
    for index,(n,im) in enumerate(images):
        x,y=(index%4)*320,(index//4)*430
        draw.text((x+10,y+5),f'{ident} physical page {n}',fill='black')
        sheet.paste(im,(x+10,y+25))
    sheet.save(qa/f'{ident}-contact.png')
    print(f'{ident}: {len(images)} pages rasterized')
