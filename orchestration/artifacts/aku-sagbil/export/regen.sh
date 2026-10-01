#!/bin/bash
# regenerates fixtures (deterministic) and restructures the main body to the guide's chapter order
cd /c/Users/CASPER/Desktop/TxtNote-Template-Work
for v in master phd; do
  f=orchestration/artifacts/aku-sagbil/export/aku-sagbil-$v-tr-v1.fixture.json
  node orchestration/tools/make-fixture.mjs aku-sagbil-$v-tr-v1 $f orchestration/artifacts/aku-sagbil/export/overrides.json >/dev/null
  PYTHONIOENCODING=utf-8 python - "$f" <<'P'
import json,sys,re
f=sys.argv[1]; d=json.load(open(f,encoding='utf-8'))
c=d['content']
# split chapters on <h1>
parts=re.split(r'(?=<h1>)',c); head=parts[0]; chs=parts[1:]
names=["Kuramsal Çerçeve","Yöntem","Bulgular","Tartışma","Sonuç ve Öneriler"]
new=["MATERYAL ve METOT","BULGULAR","TARTIŞMA","SONUÇ ve ÖNERİLER"]
# drop 'Kuramsal Çerçeve' wrapper title but keep its rich content under Materyal ve Metot; drop last chapter
out=head
idx=[0,1,2,3]
for i,ch in zip(idx,chs[:4]):
    out+=re.sub(r'^<h1>[^<]*</h1>','<h1>'+new[i].title().replace(' Ve ',' ve ') if False else '<h1>'+new[i]+'</h1>',ch)
d['content']=out
json.dump(d,open(f,'w',encoding='utf-8'),ensure_ascii=False)
P
done
