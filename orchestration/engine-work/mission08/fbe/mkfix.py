import json
TR="Dijital Okuryazarlığın Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Öz Yeterlik Algıları Üzerindeki Etkisinin Karşılaştırmalı Olarak İncelenmesi "
d0=json.load(open('orchestration/specs/aku-fbe.fixture.master.json',encoding='utf8'))
for n in (40,120,250):
    d=json.loads(json.dumps(d0)); t=(TR*10)[:n].rstrip()
    d['researchData']['thesis']['values']['THESIS_TITLE']=t; d['title']=t
    json.dump(d,open(f'orchestration/engine-work/mission08/fbe/master-title{n}.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
