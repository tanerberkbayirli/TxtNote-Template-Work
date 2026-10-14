import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from pdfmeasure import open_pdf
import pymupdf
from PIL import Image,ImageDraw

root=Path(__file__).resolve().parents[3]
final=root/'orchestration/validation/mcbu-final2-20261015'
out=final/'visual'
out.mkdir(exist_ok=True)

def render(pdf,pages,name,width=570):
    doc=open_pdf(pdf)
    height=round(width*297/210)
    image=Image.new('RGB',(2*(width+12)+12,((len(pages)+1)//2)*(height+30)+12),'#ececec')
    draw=ImageDraw.Draw(image)
    for index,number in enumerate(pages):
        page=doc[number-1]
        pix=page.get_pixmap(matrix=pymupdf.Matrix(width/page.rect.width,width/page.rect.width),alpha=False)
        x=12+(index%2)*(width+12);y=12+(index//2)*(height+30)
        draw.text((x,y),f'{name} / page {number}',fill='black')
        image.paste(Image.frombytes('RGB',[pix.width,pix.height],pix.samples),(x,y+20))
    image.save(out/f'{name}.png')

lee=final/'mcbu-lee/run'
tip=final/'mcbu-tip-uzmanlik/run'
render(lee/'master.word.pdf',[9,10],'lee-before-refresh')
render(lee/'master.word-refreshed.pdf',[9,10],'lee-after-refresh')
render(lee/'master.pdf',[1,3,12,24],'lee-pages')
render(lee/'phd.word-refreshed.pdf',[34,35],'phd-end')
doc=open_pdf(tip/'default.word-refreshed.pdf')
selected=[1,4,5]
for i,page in enumerate(doc,1):
    text=page.get_text()
    if 'Investigation of Digital' in text or ('Jugo' in text and 'Önerci' in text): selected.append(i)
render(tip/'default.word-refreshed.pdf',selected,'tip-pages')

# Use the shared measurement check for saved/reopened Word copies too.
from conformance import k_fields_refresh_match,k_line_words_match,k_line_attr,compare
roundtrips=[]
for folder,variant in [('mcbu-lee','master'),('mcbu-lee','phd'),('mcbu-tip-uzmanlik','default')]:
    run=final/folder/'run'
    record=run/f'{variant}.roundtrip.json'
    if not record.exists(): continue
    state=json.loads(record.read_text(encoding='utf-8-sig'))
    ctx={'variants':{'default':{'wordPdf':str(run/f'{variant}.word-refreshed.pdf'),'wordRefreshedPdf':str(run/f'{variant}.roundtrip.pdf')}}}
    result=k_fields_refresh_match(ctx,{'params':{}})
    geometry_ctx={'variants':{'default':{'pdf':str(run/f'{variant}.word-refreshed.pdf'),'wordPdf':str(run/f'{variant}.roundtrip.pdf')}}}
    geometry=k_line_words_match(geometry_ctx,{'params':{'regex':'.'},'tolerance':0.25})
    baselines=[k_line_attr(geometry_ctx,{'params':{'source':source,'regex':'.','attr':'baseline','agg':'all'},'expected':None})['actual'] for source in ('pdf','word')]
    equal,delta=compare(baselines[0],baselines[1],0.25)
    roundtrips.append({'target':folder,'variant':variant,'wordOperations':state,'renderedContentAfterSaveReopen':result,'wordExtentsAfterSaveReopen':geometry,'baselinesAfterSaveReopen':{'pass':equal,'delta':delta,'lineCounts':[len(values) for values in baselines]}})
(final/'word-roundtrip-results.json').write_text(json.dumps(roundtrips,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps([{'target':r['target'],'variant':r['variant'],'operations':r['wordOperations']['status'],'samePrintedContent':r['renderedContentAfterSaveReopen']['pass'],'wordGeometry':r['wordExtentsAfterSaveReopen']['pass']} for r in roundtrips]))
