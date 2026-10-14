import fitz,json
from pathlib import Path
out=[]
for id in ['SRC01','SRC04','SRC05','EDGE_STRUCTURE']:
 editor=fitz.open(f'orchestration/engine-work/mission06/{id}-complete.pdf');native=fitz.open(f'orchestration/engine-work/mission06/{id}-native.refreshed.pdf');exported=fitz.open(f'orchestration/engine-work/mission06/{id}-exported.refreshed.pdf');assert len(editor)==len(native)==len(exported)
 pages=[]
 for i,(x,y,z) in enumerate(zip(editor,native,exported)):
  text=lambda p:' '.join(p.get_text().split());assert text(x)==text(y)==text(z),(id,i,text(x),text(y),text(z))
  assert max(abs(x.rect[j]-y.rect[j]) for j in (2,3))<.1
  assert max(abs(x.rect[j]-z.rect[j]) for j in (2,3))<.1
  selected=lambda p:[s for bl in p.get_text('dict')['blocks'] if 'lines'in bl for l in bl['lines'] for s in l['spans'] if s['text'].strip() in ['i','1'] or '_SECTION_'in s['text']]
  spans=[selected(p)for p in (x,y,z)];assert len(spans[0])==len(spans[1])==len(spans[2]);deltas=[]
  for sx,sy,sz in zip(*spans):
   for label,other in [('nativeWord',sy),('exportedWord',sz)]:
    delta=[round(sx['origin'][j]-other['origin'][j],3) for j in (0,1)];assert max(abs(v)for v in delta)<.5,(id,i,label,sx['text'],delta)
    deltas.append({'text':sx['text'].strip(),'reference':label,'deltaPt':delta})
  pages.append({'page':i+1,'text':text(x),'geometryDeltaPt':deltas})
 out.append({'id':id,'status':'PASS','pages':pages})
Path('orchestration/engine-work/mission06/source-pdf-verification.json').write_text(json.dumps({'status':'PASS','pageDimensionTolerancePt':.1,'textOriginTolerancePt':.5,'references':'Independent source excerpt Word render and actual exported DOCX Word render','results':out},ensure_ascii=False,indent=2),encoding='utf8')
print('PASS: four sources, 16 sections / 17 physical pages, body markers and numbers within 0.5 pt of native and exported Word')
for name,reference in [('geometry-verified','geometry.word'),('parity-conflict-verified','parity-conflict.word'),('even-pad','even-pad.word')]:
 a=fitz.open(f'orchestration/engine-work/mission06/{name}.pdf');b=fitz.open(f'orchestration/engine-work/mission06/{reference}.pdf');assert len(a)==len(b)
 for x,y in zip(a,b):assert ' '.join(x.get_text().split())==' '.join(y.get_text().split());assert max(abs(x.rect[j]-y.rect[j])for j in(2,3))<.1
print('PASS: geometry, even padding and conflicting restart matrices (19 physical pages)')
Path('orchestration/engine-work/mission06/matrix-verification.json').write_text(json.dumps({'status':'PASS','matrices':[{'name':n,'pages':len(fitz.open(f'orchestration/engine-work/mission06/{n}.pdf'))}for n in ['geometry-verified','parity-conflict-verified','even-pad']]},indent=2),encoding='utf8')
