"""Render review sheets only; numerical checks remain in the shared checker."""
import hashlib
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from pdfmeasure import open_pdf
from PIL import Image, ImageDraw

review = Path(__file__).resolve().parent
root = review.parents[2]
out = review / 'visual'
out.mkdir(exist_ok=True)

def sheet(pdf, pages, name, columns=3, width=420):
    doc = open_pdf(pdf)
    height = round(width*297/210)
    panel = Image.new('RGB',(columns*(width+16)+16,((len(pages)+columns-1)//columns)*(height+40)+16),'#e9e9e9')
    draw = ImageDraw.Draw(panel)
    for index, number in enumerate(pages):
        page = doc[number-1]
        import pymupdf
        pix = page.get_pixmap(matrix=pymupdf.Matrix(width/page.rect.width,width/page.rect.width),alpha=False)
        img = Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        x = 16+(index%columns)*(width+16)
        y = 16+(index//columns)*(height+40)
        draw.text((x,y),f'{name} / physical page {number}',fill='black')
        panel.paste(img,(x,y+22))
    panel.save(out/f'{name}.png')

run = review/'lee-final/run'
sheet(run/'master.pdf',list(range(1,11))+[12,24],'master-overview')
sheet(run/'master.word.pdf',[1,3,9,10,24,34],'master-word')
sheet(run/'master.word-refreshed.pdf',[9,10],'toc-after-refresh',columns=2,width=700)
sheet(review/'tip/run/default.pdf',[1,3,4,5,6,30],'tip-overview')
sheet(run/'phd.pdf',[34,35],'phd-end',columns=2,width=580)
if (review/'official-live-lee.pdf').exists():
    doc = open_pdf(review/'official-live-lee.pdf')
    sheet(review/'official-live-lee.pdf',[1,3,4,len(doc)-2,len(doc)-1,len(doc)],'official-guide')

files = list((root/'engine/src').rglob('*.js'))
files += [root/'Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx',root/'Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf']
snapshot = {str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}
(review/'engine-and-sources.sha256.json').write_text(json.dumps(snapshot,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Saved five review sheets and an explicit production-engine/source hash snapshot.')
