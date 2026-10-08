import pymupdf as f
from pathlib import Path
for pdf in Path('orchestration/validation/aku-felsefe-independent-2/official-guides').glob('*.pdf'):
 d=f.open(pdf); print('\n',pdf.name,'pages',len(d),'rect',d[0].rect)
 for pn,p in enumerate(d,1):
  txt=p.get_text().replace('\n',' | ')
  if 'ÖRNEĞİ' in txt or 'İÇİNDEKİLER ÖRNEĞİ' in txt or 'KAPAK ÖRNEĞİ' in txt:
   print('page',pn,'text',txt[:650])
   for b in p.get_text('dict')['blocks']:
    for ln in b.get('lines',[]):
     for s in ln.get('spans',[]):
      if s['text'].strip(): print(' ',tuple(round(x*25.4/72,2) for x in s['bbox']),round(s['size'],2),s['font'],repr(s['text'][:100]))
