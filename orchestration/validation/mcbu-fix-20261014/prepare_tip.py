"""Correct the stress fixture's structure; retain all existing layout cases."""
import json
from pathlib import Path

root=Path(__file__).resolve().parents[3]
specs=root/'orchestration/specs'
fixture=json.loads((specs/'mcbu-tip-uzmanlik.fixture.json').read_text(encoding='utf-8'))
original=root/'orchestration/validation/mcbu-review-20261014/tip/run/default.layout.json'
# Preserve the pre-fix fixture before changing it.
backup=Path(__file__).parent/'tip-fixture-before.json'
if not backup.exists(): backup.write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if '<h1>Kuramsal Çerçeve</h1>' in fixture['content']:
    fixture['content']=fixture['content'].replace('<h1>Kuramsal Çerçeve</h1>','<h1>Giriş</h1>',1)
    fixture['content']=fixture['content'].replace('<h2>Alt Başlık 1.1</h2>','<h1>Genel Bilgiler</h1><h2>Alt Başlık 1.1</h2>',1)
    fixture['content']=fixture['content'].replace('<h1>Yöntem</h1>','<h1>Gereç ve Yöntem</h1>',1)
    fixture['content']=fixture['content'].replace('(Karasar, 2020, s. 45)','(1)')
thesis=fixture['researchData']['thesis']
thesis['values']['THESIS_TITLE_EN']='Investigation of Digital Literacy Levels in Online Learning Environments'
import re
bib=thesis['sectionContent']['bibliography']
number=[0]
def row(match):
    number[0]+=1
    return match[1]+f'{number[0]}. '+match[2]+match[3]
if not re.search(r'<p[^>]*>1\.',bib):
    thesis['sectionContent']['bibliography']=re.sub(r'(<p\b[^>]*>)(.*?)(</p>)',row,bib,flags=re.S)
# Use the medical guide's own numeric book/chapter examples instead of the
# education fixture's APA entries and invented DOI. This is still test data.
references=[
 'Jugo S. Surgical Atlas of External Rhinoplasty. Hong Kong: Churchill Livingstone, 1995:40.',
 'Önerci M. Endoskopik Sinüs Cerrahisi. Ankara: Kutsan Ofset, 1996:17.',
 'Leinhardt RR, Romo T. Treatment of septal perforation. In: Rees TD, LaTrenta GS, eds. Aesthetic Plastic Surgery, 2nd ed. Philadelphia: W. B. Saunders, 1994:484-96.',
 'Yalçın Ş. Üst solunum yolları infeksiyonları. Felek S, ed; Sistemik İnfeksiyon Hastalıkları (içinde). İstanbul: Nobel Tıp Kitapevleri, 2000:67-94.'
]
thesis['sectionContent']['bibliography']=''.join(f'<p>{index}. {reference}</p>' for index,reference in enumerate(references,1))
(specs/'mcbu-tip-uzmanlik.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

checks=json.loads((specs/'mcbu-tip-uzmanlik.checks.json').read_text(encoding='utf-8'))
for check in checks:
    if check['id']=='h1-to-text-gap':
        check['params']['page']['find']='^I\\. GİRİŞ$'
        check['params']['a']='^I\\. GİRİŞ$'
    if check['id']=='toc-sub-rows-single':
        check['params']['a']='^2\\.1\\.1\\. Alt Başlık 1\\.1\\.1 \\d+$'
        check['params']['b']='^2\\.1\\.1\\.1\\. Alt'
    if check['id']=='toc-main-rows-1.5':
        check['params']['a']='^2\\.2\\. Alt Başlık 1\\.2 \\d+$'
        check['params']['b']='^III\\. GEREÇ VE YÖNTEM'
    if check['id']=='page-labels-front-and-first-chapter':
        check['params']={'pages':{'until':'^I\\. GİRİŞ$'},'each':True}
        check['expected']=''
    if check['id']=='page-labels-back-matter':
        check['params']={'pages':{'find':'^[IVXLCDM]+\\. ÖZET$'},'each':True}
        check['expected']=''
        check['source']['locator']='p.2 §1.4: chapter opening counted but unprinted; semantic ÖZET anchor, no fixture page numbers'
new=[]
source='MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf'
def add(id,kind,expected,params,locator,**extra):
    new.append(dict(id=id,kind=kind,expected=expected,params=params,tolerance=0,source=dict(file=source,locator=locator),evidence='EXPLICIT',**extra))
for output in ['pdf','word','word-refreshed']:
    add(f'{output}-required-chapters','text_sequence',[f'^{roman}\\. {title}$' for roman,title in [('I','GİRİŞ'),('II','GENEL BİLGİLER'),('III','GEREÇ VE YÖNTEM'),('IV','BULGULAR'),('V','TARTIŞMA'),('VI','SONUÇ VE ÖNERİLER')]],dict(source=output),'p.3 VI-XI; Ek-2')
    for section,start,end in [('preface','^ÖNSÖZ$','^İÇİNDEKİLER$'),('abstract','^[IVXLCDM]+\\. ÖZET$','^[IVXLCDM]+\\. İNGİLİZCE ÖZET$')]:
        add(f'{output}-{section}-one-page','section_page_count',1,dict(source=output,start=start,end=end),'p.2 IV and p.3 XII: at most one page',cmp='le')
    add(f'{output}-english-thesis-title','text_sequence',['^Investigation of Digital Literacy Levels'],dict(source=output),'p.3 XIII: English thesis title in English abstract')
    add(f'{output}-numbered-references','text_sequence',['^1\\. Jugo','^2\\. Önerci','^3\\. Leinhardt','^4\\. Yalçın'],dict(source=output),'p.4 XV, Ek-2 numbered reference examples')
    for title in ['GİRİŞ','GENEL BİLGİLER','GEREÇ VE YÖNTEM','BULGULAR','TARTIŞMA','SONUÇ VE ÖNERİLER','ÖZET','İNGİLİZCE ÖZET','KAYNAKLAR']:
        add(f'{output}-opening-no-number-{title}','page_labels','',dict(source=output,pages={'find':f'^[IVXLCDM]+\\. {title}$'},each=True),'p.2 §1.4: no printed number on chapter openings')
for id,kind in [('fields-after-word-refresh','fields_refresh_match'),('cached-fields','fields_cached_match')]:
    new.append(dict(id=id,kind=kind,params={},expected=None,tolerance=0.5,source=dict(file=source,locator='Export robustness; source chapter order and references'),evidence='INFERRED'))
new.append(dict(id='source-currency-and-conflicts',kind='note',params=dict(text='University confirmation required for current medical guide, numbering position and cover name/size conflicts. Live PDF download not verified.'),expected=None,source=dict(file=source,locator='Source provenance; §1.4 and Ek-1'),evidence='UNKNOWN',required=True))
ids={c['id'] for c in new}
checks=[c for c in checks if c['id'] not in ids]+new
(specs/'mcbu-tip-uzmanlik.checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Updated medical fixture and {len(checks)} source-located checks.')
