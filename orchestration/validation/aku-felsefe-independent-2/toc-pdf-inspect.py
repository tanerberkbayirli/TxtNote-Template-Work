import pymupdf as f
from pathlib import Path
p=f.open('orchestration/validation/aku-felsefe-independent-2/official-guides/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx.pdf')[7]
print(repr(p.get_text()[:500]))
for b in p.get_text('dict')['blocks']:
 for l in b.get('lines',[]):
  for s in l.get('spans',[]):
   if s['text'].strip(): print(tuple(round(x*25.4/72,1) for x in s['bbox']),round(s['size'],2),s['font'],repr(s['text'][:80]))
