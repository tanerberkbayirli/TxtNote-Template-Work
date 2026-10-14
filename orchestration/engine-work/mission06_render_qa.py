import fitz
from PIL import Image,ImageDraw
pairs=[('SRC04',3),('SRC05',0),('EDGE_STRUCTURE',2)]
canvas=Image.new('RGB',(900,640*len(pairs)), '#dddddd');draw=ImageDraw.Draw(canvas)
for row,(id,page)in enumerate(pairs):
 for col,suffix in enumerate(['complete','native.refreshed']):
  d=fitz.open(f'orchestration/engine-work/mission06/{id}-{suffix}.pdf');pix=d[page].get_pixmap(matrix=fitz.Matrix(.7,.7));im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.thumbnail((430,600));canvas.paste(im,(col*450+10,row*640+25));draw.text((col*450+10,row*640+5),id+' '+suffix,fill='#000000')
canvas.save('orchestration/engine-work/mission06/source-visual.png')
