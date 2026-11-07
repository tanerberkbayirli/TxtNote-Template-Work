"""Rebuild regional drafts from individual source packages, with strict scope boundaries.

No university-wide guide guessing, no majority vote, no borrowed template. Existing
hand-reviewed layouts are retained; a regex candidate is never promoted to official.
Run ege-source-audit.py first. Drafts and a coverage ledger go to engine/output/ege-rebuild.
"""
from __future__ import annotations

import argparse
import copy
import importlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
converter = importlib.import_module('docx-spec-to-template')
reviewed_decisions = importlib.import_module('ege-reviewed-decisions')
cleanup = importlib.import_module('ege-template-cleanup')
shapes = importlib.import_module('ege-source-shapes')
OUT = ROOT / 'engine/output/ege-rebuild'
ARCHIVE = ROOT / 'Butun-Sablonlar/Ege'

SCOPES = {
 'Fen_Bilimleri_Enstitusu_Tez': ('fbe','Fen Bilimleri Enstitüsü','master'),
 'Sosyal_Bilimler_Enstitusu_Tez': ('sbe','Sosyal Bilimler Enstitüsü','master'),
 'Saglik_Bilimleri_Enstitusu_Tez': ('sagbe','Sağlık Bilimleri Enstitüsü','master'),
 'Egitim_Bilimleri_Enstitusu_Tez': ('ebe','Eğitim Bilimleri Enstitüsü','master'),
 'Lisansustu_Egitim_Enstitusu_Tez': ('lee','Lisansüstü Eğitim Enstitüsü','master'),
 'Lisansustu_Egitim_Enstitusu_Donem_Projesi': ('lee-proje','Lisansüstü Eğitim Enstitüsü · Dönem Projesi','master'),
 'Lisansustu_Tezsiz_Donem_Projesi': ('lee-proje','Lisansüstü Eğitim Enstitüsü · Dönem Projesi','master'),
 'Lisansustu_Fen_Saglik_Alanlari_Tez': ('lee-fen-saglik','Lisansüstü Eğitim Enstitüsü · Fen ve Sağlık Alanları','master'),
 'Lisansustu_Sosyal_Alanlar_Tez': ('lee-sosyal','Lisansüstü Eğitim Enstitüsü · Sosyal Alanlar','master'),
 'Tip_Fakultesi_Uzmanlik_Tezi': ('tip','Tıp Fakültesi','specialization'),
 'Dis_Hekimligi_Uzmanlik_Tezi': ('dhf','Diş Hekimliği Fakültesi','specialization'),
 'Dis_Hekimligi_Fakultesi_Uzmanlik_Tezi': ('dhf','Diş Hekimliği Fakültesi','specialization'),
 'Dis_Hekimligi_Fakultesi_Tez': ('dhf','Diş Hekimliği Fakültesi','specialization'),
 'Guzel_Sanatlar_Enstitusu_Tez': ('gse','Güzel Sanatlar Enstitüsü','master'),
 'Ataturk_Ilkeleri_Enstitusu_Tez': ('ataturk','Atatürk İlkeleri ve İnkılap Tarihi Enstitüsü','master'),
 'Arkeoloji_Enstitusu_Tez': ('arkeoloji','Arkeoloji Enstitüsü','master'),
 'iBG_Enstitusu_Tez': ('ibg','İzmir Biyotıp ve Genom Enstitüsü','master'),
}
DEPARTMENTS = {
 'Cografya_Bolumu_Bitirme_Tezi': ('fef-cografya','Fen Edebiyat Fakültesi · Coğrafya Bölümü'),
 'Felsefe_Bolumu_Tez_ve_Seminer': ('fef-felsefe','Fen Edebiyat Fakültesi · Felsefe Bölümü'),
 'Kimya_Bolumu_Bitirme_Tezi': ('fef-kimya','Fen Edebiyat Fakültesi · Kimya Bölümü'),
 'Matematik_Bolumu_Bitirme_Tezi': ('fef-matematik','Fen Edebiyat Fakültesi · Matematik Bölümü'),
 'MBG_Lisans_Bitirme_Tezi': ('fef-mbg','Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü'),
 'Sosyoloji_Bolumu_Bitirme_Tezi': ('fef-sosyoloji','Fen Edebiyat Fakültesi · Sosyoloji Bölümü'),
 'Muhendislik_Fakultesi_Lisans_Bitirme_Tezi': ('muhendislik','Mühendislik Fakültesi · Bitirme Tezi'),
 'Ziraat_Fakultesi_Lisans_Tezi': ('ziraat-fakultesi','Ziraat Fakültesi'),
 'Endustri_Muhendisligi_Bitirme': ('endustri','Endüstri Mühendisliği · Bitirme Projesi'),
 'Makina_Muhendisligi_Bitirme': ('makina','Makina Mühendisliği · Bitirme Projesi'),
 'Makine_Muhendisligi_Bitirme': ('makine','Makine Mühendisliği · Bitirme Projesi'),
 'Elektrik_Elektronik_Muhendisligi_Bitirme': ('eee','Elektrik-Elektronik Mühendisliği · Bitirme Projesi'),
 'Simav_Teknoloji_Fakultesi_Bitirme': ('simav','Simav Teknoloji Fakültesi · Bitirme Projesi'),
 'Insaat_Muhendisligi_Bitirme_Tezi': ('insaat','İnşaat Mühendisliği · Bitirme Tezi'),
 'Dis_Hekimligi_Bitirme_Projesi': ('dis-bitirme','Diş Hekimliği Fakültesi · Mezuniyet Tezi'),
 'Iletisim_Fakultesi_Gazetecilik_Bitirme_Projesi': ('gazetecilik','İletişim Fakültesi · Gazetecilik Bitirme Projesi'),
 'Iletisim_Fakultesi_HIT_Bitirme_Tezi': ('hit','İletişim Fakültesi · Halkla İlişkiler ve Tanıtım Bitirme Tezi'),
 'Iletisim_Fakultesi_Reklamcilik_Bitirme_Projesi': ('reklamcilik','İletişim Fakültesi · Reklamcılık Bitirme Projesi'),
 'Iletisim_Fakultesi_RTS_Bitirme_Tezi': ('rts','İletişim Fakültesi · Radyo Televizyon ve Sinema Bitirme Tezi'),
 'Muhendislik_Fakultesi_Deri_Bitirme_Tezi': ('deri','Deri Mühendisliği · Bitirme Tezi'),
 'Su_Urunleri_Fakultesi_Lisans_Tez': ('su-urunleri','Su Ürünleri Fakültesi · Lisans Tezi'),
 'Su_Urunleri_Fakultesi_Bitirme_Tezi': ('su-urunleri','Su Ürünleri Fakültesi · Bitirme Tezi'),
 'Tarih_Bolumu_Bitirme_Tezi': ('tarih','Tarih Bölümü · Bitirme Tezi'),
 'Gastronomi_ve_Mutfak_Sanatlari_Bitirme_Projesi': ('gastronomi','Gastronomi ve Mutfak Sanatları · Bitirme Projesi'),
 'Ekonometri_Bolumu': ('ekonometri','Ekonometri Bölümü'),
}
for key,(identifier,name) in DEPARTMENTS.items():
    SCOPES[key]=(identifier,name,'undergraduate')


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def language(name):
    return 'en' if re.search(r'(?:^|_)EN(?:_|\.|$)|English|BSc_Project',name,re.I) else 'tr'


def primary_guide(rows, lang):
    candidates=[r for r in rows if re.search(r'Kilavuz|Klavuz|Kurallari|Yonerge|Guidelines|Thesis_Guide',Path(r['path']).name,re.I)
                and not re.search(r'APA|Kaynak|Referans|Senato|Senate|Makale|Articles|LaTeX|Onerisi|Basvuru',Path(r['path']).name,re.I)
                and r['status']=='extracted']
    same=[r for r in candidates if language(Path(r['path']).name)==lang]
    return sorted(same,key=lambda r: (not bool(re.search(r'Tez_Yazim|Thesis_Guide',r['path'],re.I)),r['path']))[0] if same else None


def guide_rules(row):
    return load(OUT/row['key']/'rules.json')['rules'] if row else {}


def safe_rules(row):
    # Candidates with multiple values remain conflicts even if the old extractor voted.
    return {k:r for k,r in guide_rules(row).items() if r['status']=='EXPLICIT' and 'values' not in r and 'majority' not in r}


def evidence(rule,row):
    return {'status':'EXTRACTED_CANDIDATE','value':rule['value'],'source':row['path'],
            'locations':copy.deepcopy(rule['evidence'])}


def apply_rules(draft, guide, measured):
    if not guide:
        return
    template=draft['template']
    rules=safe_rules(guide)
    mappings={**{f'page.margins.{side}':f'page.margins.{side}Mm' for side in ('top','bottom','left','right')},
       **{f'body.{f}':f'typography.body.{f}' for f in ('fontFamily','fontSizePt','lineHeight','align')},
       **{f'body.{f}':f'typography.paragraph.{f}' for f in ('firstLineIndentMm','spaceBeforePt','spaceAfterPt')},
       'footnote.fontSizePt':'typography.footnotes.fontSizePt', 'footnote.lineHeight':'typography.footnotes.lineHeight',
       'page.numbering.position':'page.numbering.position','page.numbering.align':'page.numbering.align'}
    for key,target in mappings.items():
        if key not in rules:
            continue
        rule=rules[key]
        # Body rules in a measured template must come from a reviewed decision, not a
        # regex hit in a page-number sample or a guide's own typesetting.
        if measured and key.startswith('body.'):
            continue
        obj=template
        parts=target.split('.')
        for part in parts[:-1]:
            obj=obj.setdefault(part,{})
        current=obj.get(parts[-1])
        value=rule['value']
        if current is not None and current!=value and not (isinstance(current,(int,float)) and isinstance(value,(int,float)) and abs(current-value)<=0.5):
            draft.setdefault('conflicts',[]).append({'field':target,'measured':current,'guide':value,'guideSource':guide['path']+' '+rule['evidence'][0]['location']})
            if measured:
                continue
        obj[parts[-1]]=value
        draft.setdefault('evidence',{})[target]=evidence(rule,guide)
        draft.setdefault('unknown',[]).append({'field':target,'reason':'Metinden otomatik çıkarılan aday; bağlamıyla birlikte doğrulanmalı.'})
    # Caption positions and sizes are independent; absent numbering is an engine default,
    # never an invented chapter counter attached to an official source.
    for kind in ():  # Guide caption candidates need a scoped, reviewed decision.
        for prop,key in [('position',f'{kind}.position'),('style.fontSizePt','caption.fontSizePt'),('style.lineHeight','caption.lineHeight'),('style.align','caption.align')]:
            if key not in rules:
                continue
            rule=rules[key]
            caption=template.setdefault(kind,{})
            if caption is None:
                caption={};template[kind]=caption
            obj=caption
            parts=prop.split('.')
            for part in parts[:-1]:
                obj=obj.setdefault(part,{})
            if prop.split('.')[-1] not in obj:
                obj[parts[-1]]=rule['value']
                draft.setdefault('evidence',{})[f'{kind}.{prop}']=evidence(rule,guide)
    draft['guideMerge']={'guide':Path(guide['path']).name}
    template['source']['guideDocumentName']=Path(guide['path']).name


def apply_reviewed(draft, sources):
    for source in sources:
        decisions=[r for r in reviewed_decisions.decisions() if r[0]==source['key']]
        if not decisions:
            continue
        units=load(OUT/source['key']/'text.json')
        for key,location,needle,patch,note in decisions:
            unit=next((u for u in units if u['location']==location),None)
            normalize=lambda text: re.sub(r'\s+',' ',text).strip()
            if unit is None or normalize(needle) not in normalize(unit['text']):
                raise ValueError(f'Decision evidence missing: {key} {location} {needle}')
            for target,value in patch.items():
                obj=draft['template']
                parts=target.split('.')
                for part in parts[:-1]:
                    obj=obj.setdefault(part,{})
                before=obj.get(parts[-1])
                obj[parts[-1]]=value
                draft.setdefault('evidence',{})[target]={'status':'REVIEWED_SOURCE','value':value,'source':source['path'],
                    'location':location,'passage':normalize(unit['text']),'decision':note}
                draft['unknown']=[u for u in draft.get('unknown',[]) if u['field']!=target]
                draft['inferred']=[u for u in draft.get('inferred',[]) if u['field']!=target]
                if before is not None and before!=value:
                    draft.setdefault('resolvedConflicts',[]).append({'field':target,'previous':before,'value':value,'decision':note})
                draft['conflicts']=[c for c in draft.get('conflicts',[]) if c['field']!=target]


def core_skeleton(row,university,institute,degree,lang,identifier):
    # No fake official cover or compulsory page list. These must be read from a
    # source template or supplied by a reviewed source decision.
    return {'template':{'schemaVersion':1,'templateVersion':'0.2.0-source-rebuild','id':identifier,
        'universityId':university['id'],'universityName':university['name'],
        'instituteId':institute[0],'instituteName':institute[1],'degreeType':degree,'language':lang,'status':'generic',
        'source':{'type':'official','documentName':Path(row['path']).name,'verifiedAt':'2026-10-23',
                  'notes':['Kaynak metninden üretilen taslak; özgün kapak geometrisi ve tam sayfa sırası doğrulanmadı.']},
        'page':{'size':'A4','widthMm':210,'heightMm':297,'margins':{},'numbering':{'enabled':True,'position':'bottom','align':'right','format':'arabic','startAt':1,'restart':False}},
        'typography':{'body':{},'headings':{}},'placeholders':copy.deepcopy(converter.STANDARD_PLACEHOLDERS),
        'sections':[{'id':'main-content','type':'mainContent','title':'Main text' if lang=='en' else 'Ana metin','status':'required','group':'body','mode':'editable','showTitle':False}]},
        'unknown':[{'field':'sections','reason':'Kılavuzdaki ön ve arka sayfalar ile kapak düzeni ayrıca doğrulanmalı.'}],
        'inferred':[{'field':'page.size','value':'A4','reasoning':'Çalışma taslağı; kaynakta A4 ifadesi ayrıca doğrulanmalı.'},
                    {'field':'page.numbering','value':'arabic / bottom / right','reasoning':'Kaynağın belirtmediği özellikler çalışma taslağı varsayılanıdır.'}],
        'conflicts':[],'evidence':{}}


def guide_sections(draft,guide):
    """Offer only sections named by this source; requirement/order stays open for review."""
    t=draft['template'];english=t['language']=='en'
    text=' '.join(u['text'] for u in load(OUT/guide['key']/'text.json'))
    front=[];back=[]
    for kind,title_tr,title_en,pattern in [
       ('abstract','ÖZET','ÖZET',r'özet'),('englishAbstract','ABSTRACT','ABSTRACT',r'abstract|summary'),
       ('preface','ÖNSÖZ','PREFACE',r'ön\s*söz|preface'),
       ('acknowledgements','TEŞEKKÜR','ACKNOWLEDGMENTS',r'teşekkür|acknowledg'),
       ('tableOfContents','İÇİNDEKİLER','TABLE OF CONTENTS',r'içindekiler|table of contents'),
       ('listOfFigures','ŞEKİLLER DİZİNİ','LIST OF FIGURES',r'şekiller (?:dizini|listesi)|list of figures'),
       ('listOfTables','TABLOLAR DİZİNİ','LIST OF TABLES',r'tablolar (?:dizini|listesi)|çizelgeler dizini|list of tables'),
       ('listOfAbbreviations','SİMGELER VE KISALTMALAR','LIST OF ABBREVIATIONS',r'kısaltmalar|abbreviations'),
       ('bibliography','KAYNAKLAR','REFERENCES',r'kaynakça|kaynaklar|references|bibliography'),
       ('appendices','EKLER','APPENDICES',r'ekler|appendices'),
       ('curriculumVitae','ÖZGEÇMİŞ','CURRICULUM VITAE',r'öz\s*geçmiş|curriculum vitae')]:
        if not re.search(pattern,text,re.I):
            continue
        generated={'tableOfContents':'toc','listOfFigures':'figures','listOfTables':'tables'}.get(kind)
        group='back' if kind in ('bibliography','appendices','curriculumVitae') else 'front'
        section={'id':re.sub(r'(?<!^)(?=[A-Z])','-',kind).lower(),'type':kind,'title':title_en if english else title_tr,
                 'status':'optional','group':group,'mode':'generated' if generated else 'editable','showTitle':True}
        if generated:
            section['generatedIndex']={'kind':generated,'title':section['title'],'includePageNumbers':True,'leader':'dots'}
        (front if group=='front' else back).append(section)
    t['sections']=front+t['sections']+back
    draft.setdefault('unknown',[]).append({'field':'sections.orderAndRequirement','reason':'Bölüm adları bu kaynakta var; isteğe bağlı sunulan bölümlerin kesin sırası ve zorunluluğu ayrıca doğrulanmalı.'})


def attach_source_forms(draft,sources):
    """Use separately distributed Word covers and forms as actual template sections."""
    t=draft['template'];degree=t['degreeType'];lang=t['language'];forms=[]
    for row in sources:
        name=Path(row['path']).name
        spec_path=OUT/row['key']/'spec.json'
        if not name.endswith('.docx') or not spec_path.exists() or language(name)!=lang:
            continue
        kind=None
        if 'TINAZTEPE_Lisansustu_Ek1_Dis_Kapak' in name:
            kind='outerCover'
        elif 'TINAZTEPE_Lisansustu_Ek4_Kabul_Onay' in name:
            kind='approval'
        elif 'TINAZTEPE_Lisansustu_Ek5_Etik_Beyan' in name:
            kind='declaration'
        elif 'TINAZTEPE_Lisansustu_Ek6_Kilavuza_Uygunluk' in name:
            kind='custom'
        elif 'Bakircay_Lisansustu_Tez_Kapak_' in name and '_Dijital' in name:
            if ('Doktora' in name)!=(degree=='phd'):
                continue
            kind='outerCover'
        elif 'EGE_Fen_Bilimleri_Dis_Kapak_Ornekleri' in name:
            kind='outerCover'
        elif 'EGE_Fen_Bilimleri_Ic_Kapak_Ornekleri' in name:
            kind='innerCover'
        elif 'EGE_Sosyal_Bilimler_Doktora_Tez_Kapagi' in name and degree=='phd':
            kind='outerCover'
        if kind is None:
            continue
        spec=load(spec_path)
        helper=converter.Draft(spec,SimpleNamespace())
        helper.template_notes=[]
        extracted=helper.front_sections(t['typography']['body'])
        if not extracted:
            draft['unknown'].append({'field':'sections.sourceForm','reason':f'{name}: ölçülebilir kapak/form sayfası bulunamadı.'})
            continue
        chosen=0
        for index,page in enumerate(p for p in spec.get('frontPages',[]) if p.get('records')):
            text=' '.join(r.get('text','') for r in page['records'])
            if ('DOKTORA' if degree=='phd' else 'YÜKSEK LİSANS') in converter.tr_upper(text):
                chosen=index;break
        section=extracted[min(chosen,len(extracted)-1)]
        if row['key']=='4043882154879e05':
            # EK 1 is an annotated spine/front-cover illustration, not a ready-to-print page.
            # Keep the front-cover column, apply its printed font/spacing directions,
            # and remove the spine column and example captions.
            column=section['blocks'][0]['blocks'][1]['blocks']
            cleaned=[]
            for block in column:
                value=block.get('value','')
                if value.startswith('14 punto'):
                    continue
                if '(5 aralık)' in value:
                    cleaned.append({'type':'spacer','heightMm':round(5*14*1.5*1.15*25.4/72,2)});continue
                fields=[('LİSANSÜSTÜ TEZ BAŞLIĞI','THESIS_TITLE',16),('Adı SOYADI','STUDENT_NAME',14),
                        ('ANABİLİM DALI','DEPARTMENT_NAME',14),('Yıl','YEAR',12)]
                found=next(((f,size) for phrase,f,size in fields if phrase in value),None)
                style={**block.get('style',{}),'align':'center','lineHeight':1.5}
                if found:
                    field,size=found
                    # The source cell contains two empty paragraphs before the name,
                    # and one before the department. The table summary omits them.
                    blanks={'STUDENT_NAME':2,'DEPARTMENT_NAME':1}.get(field,0)
                    if blanks:
                        cleaned.append({'type':'spacer','heightMm':round(blanks*(11*1.079*1.15+8)*25.4/72,2)})
                    if field=='THESIS_TITLE':
                        style['textTransform']='uppercase'
                    cleaned.append({'type':'metadata','field':field,'style':{**style,'fontSizePt':size},**({'suffix':' ANABİLİM DALI'} if field=='DEPARTMENT_NAME' else {})});continue
                if 'YÜKSEK LİSANS/DOKTORA' in value:
                    value='DOKTORA TEZİ' if degree=='phd' else 'YÜKSEK LİSANS TEZİ'
                if value.startswith('İZMİR (12 punto)'):
                    cleaned.append({'type':'spacer','heightMm':round(3*(11*1.079*1.15+8)*25.4/72,2)})
                    value='İZMİR';style['fontSizePt']=12
                cleaned.append({**block,'value':value,'style':style})
            section['blocks']=cleaned
            draft.setdefault('inferred',[]).append({'field':'sections.cover.illustration','value':'ön kapak sütunu',
                'reasoning':'EK 1 omurga ve ön kapağı birlikte gösterir. Ön kapak ayrıldı; açık 5 aralık notu 14 punto × 1,5 Word satırı olarak uygulandı.'})
        section.update(id=f"source-form-{row['key'][:6]}",type=kind,group='cover' if kind in ('outerCover','innerCover') else 'front',
                       title={'outerCover':'Dış Kapak','innerCover':'İç Kapak','approval':'Kabul ve Onay','declaration':'Etik Beyan'}.get(kind,'Kılavuza Uygunluk'))
        page=spec['sections'][0]
        section['overrides']['page']['margins']={side+'Mm':page['marginsMm'][side] for side in ('top','bottom','left','right')}
        forms.append(section)
        draft.setdefault('evidence',{})[f"sections.{section['id']}"]={'status':'MEASURED','source':row['path'],'sourceSha256':row['sha256'],
                'location':f'ön sayfa {chosen+1}','value':kind}
        draft['unknown'].extend(helper.unknown)
    if forms:
        t['sections']=forms+[s for s in t['sections'] if not s['id'].startswith('source-form-')]
        cleanup.clean_source_pages(draft,'guide-forms')


def clean(draft):
    t=draft['template']
    for field,default in [('fontFamily','Times New Roman'),('fontSizePt',12)]:
        if field not in t['typography']['body']:
            t['typography']['body'][field]=default
            target=f'typography.body.{field}'
            reason='Kaynak bu gövde özelliğini belirtmiyor; yalnızca taslağı açabilmek için genel motor seçimi. Üniversite kuralı değildir.'
            draft.setdefault('unknown',[]).append({'field':target,'reason':reason})
            draft.setdefault('inferred',[]).append({'field':target,'value':default,'reasoning':reason})
    for k in ('tables','figures'):
        if t.get(k) is None:
            t.pop(k,None)
        elif 'style' in t[k]:
            t[k]['style']={**{f:v for f,v in t['typography']['body'].items() if f in ('fontFamily','fontSizePt')},**t[k]['style']}
        if k in t and not t[k].get('label'):
            t[k]['label']=('Table' if k=='tables' else 'Figure') if t['language']=='en' else ('Tablo' if k=='tables' else 'Şekil')
            draft.setdefault('inferred',[]).append({'field':f'{k}.label','value':t[k]['label'],'reasoning':'Motorun dil etiketidir; kaynakta birincil etiket ayrıca doğrulanmalı.'})
    for style in t['typography'].get('headings',{}).values():
        for k in [k for k,v in style.items() if v is None]:
            del style[k]
    if not t['typography'].get('headings'):
        t['typography'].pop('headings',None)
        draft.setdefault('unknown',[]).append({'field':'typography.headings','reason':'Başlık düzeni kaynakta doğrulanmadı; uygulamanın genel başlık biçimi kullanılır.'})
        for s in t['sections']:
            if s.get('generatedIndex',{}).get('kind')=='toc':
                s['generatedIndex'].pop('levels',None)
    for kind in ('tables','figures','bibliography'):
        if kind not in t:
            draft.setdefault('unknown',[]).append({'field':kind,'reason':'Bu özellik bu taslakta kaynak kuralı olarak belirlenmedi; uygulama varsayılanı kullanılır.'})
    if not t.get('toc'):
        t['toc']={'heading':'CONTENTS' if t['language']=='en' else 'İÇİNDEKİLER','levels':[1,2,3],'showPageNumbers':True}
        draft.setdefault('inferred',[]).append({'field':'toc','value':'1,2,3','reasoning':'Motorun içindekiler varsayılanı; resmî dizin düzeni değildir.'})
    if t.get('bibliography',{}).get('style')=={}:
        t['bibliography'].pop('style')
    # Keep unresolved fields visible; delete only unknowns actually established by evidence.
    draft['unknown']=[u for u in draft.get('unknown',[]) if draft.get('evidence',{}).get(u['field'],{}).get('status') not in ('REVIEWED_SOURCE','MEASURED')]
    t['status']='generic'
    t['templateVersion']='0.2.0-source-rebuild'
    return draft


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--runtime',type=Path)
    args=parser.parse_args()
    rows=load(OUT/'sources.json')
    config=load(ROOT/'engine/tools/kaynak/ege-universities.json')['universities']
    by_name={u['name']:u for u in config}
    groups=defaultdict(list)
    for row in rows:
        groups[(row['university'],row['scope'])].append(row)
    existing=[(p,load(p)) for p in ARCHIVE.glob('*/*.json')]
    for university in config:
        current=sorted((t for p,t in existing if t.get('universityName')==university['name']),key=lambda t:t['status']!='official')
        if current:
            university['id']=current[0]['universityId']
    represented=set()
    retained=[]
    for path,t in existing:
        names=t.get('source',{}).get('documentName','')
        for row in rows:
            if row['university']==t.get('universityName') and Path(row['path']).name in names:
                if t['status']=='official':
                    represented.add(row['path'])
        if t['status']=='official':
            retained.append(t['id'])
    drafts=[];coverage=[]
    for (name,scope),sources in groups.items():
        if scope not in SCOPES:
            coverage.append({'university':name,'scope':scope,'status':'existing-special-layout','sources':[s['path'] for s in sources]})
            continue
        university=by_name[name]
        institute=SCOPES[scope]
        if university['id']=='ege' and institute[0]=='ebe':
            institute=('egitim-bilimleri',institute[1],institute[2])
        candidates=[r for r in sources if r['path'].endswith('.docx') and (OUT/r['key']/'spec.json').exists()
                    and re.search(r'Sablon|Template|Ornek_Tez|Final_Report_Format|Oncul_Sayfalar',Path(r['path']).name,re.I)
                    and not re.search(r'Kapak|Onay|Kontrol|Formlar|Ozet|Kaynak|Ozgecmis|Dizin',Path(r['path']).name,re.I)
                    and not re.search(r'Kilavuz|Klavuz|Kurallari',Path(r['path']).name,re.I)]
        if university['id'] in ('ikcu','ikc') and institute[0] in ('su-urunleri','tip'):
            candidates=[r for r in sources if r['path'].endswith('.docx') and (OUT/r['key']/'spec.json').exists()]
        # Identical official packages with different archive names are one source template.
        seen=set();candidates=[r for r in candidates if not (r['sha256'] in seen or seen.add(r['sha256']))]
        for source in candidates:
            if source['path'] in represented:
                continue
            lang=language(Path(source['path']).name)
            degree='phd' if re.search(r'Doktora|Doctoral',Path(source['path']).name,re.I) else institute[2]
            identity=cleanup.IDENTITY.get(source['key'],{})
            lang=identity.get('language',lang)
            degree=identity.get('degreeType',degree)
            reviewed=next((t for p,t in existing if t['status']=='official' and t['universityName']==name and t['language']==lang
                           and t['degreeType']==degree and t.get('instituteId')==institute[0]),None)
            if reviewed:
                represented.add(source['path'])
                continue
            info=institute
            if 'Hukuk' in source['path']:
                info=('lee-hukuk',institute[1]+' · Hukuk Programları',degree)
            if 'Ikinci_Danisman' in source['path']:
                info=(institute[0]+'-es-danisman',institute[1]+' · İkinci danışmanlı',degree)
            if re.search(r'Doktora|Doctoral',Path(source['path']).name,re.I):
                degree='phd'
            match=next((t for p,t in existing if t['status']!='official' and t['universityName']==name and t.get('source',{}).get('documentName')==Path(source['path']).name),None)
            identifier=match['id'] if match else f"{university['id']}-{info[0]}-{degree}-{lang}-kaynak-{source['key'][:6]}"
            opts=SimpleNamespace(template_id=identifier,university_id=university['id'],university_name=name,
                 institute_id=info[0],institute_name=info[1],degree=degree,language=lang,source_url=None)
            try:
                draft=converter.Draft(load(OUT/source['key']/'spec.json'),opts).build()
                # Stable university IDs already used by the application's catalog.
                if match:
                    draft['template']['universityId']=match['universityId']
                guide=primary_guide(sources,lang)
                apply_rules(draft,guide,True)
                apply_reviewed(draft,[guide] if guide else [])
                shapes.restore_front_textboxes(draft,load(OUT/source['key']/'spec.json'),source)
                cleanup.clean_source_pages(draft,source['key'])
                draft['template']['source']['archivePath']=source['path']
                draft['template']['source']['rebuildKind']='docx-template'
                draft['template']['source']['archiveSha256']=source['sha256']
                draft['template']['source']['evidence']=draft.get('evidence',{})
                draft['template']['source']['relatedDocuments']=[{'path':r['path'],'sha256':r['sha256']} for r in sources]
                draft=clean(draft)
                file=OUT/'drafts'/f'{identifier}.json';file.parent.mkdir(exist_ok=True)
                file.write_text(json.dumps(draft,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
                drafts.append({'id':identifier,'draft':file.relative_to(ROOT).as_posix(),'source':source['path'],'guide':guide['path'] if guide else None})
            except Exception as error:
                coverage.append({'source':source['path'],'status':'draft-error','error':str(error)})
        # Guide-only programs are separate by scope and language, even in a university
        # that already has a template for another institute.
        retained_scope=any(t['status']=='official' and t['universityName']==name and t.get('instituteId')==institute[0] for p,t in existing)
        if not candidates and not retained_scope and not any(r['path'] in represented for r in sources):
            for lang in sorted({language(Path(r['path']).name) for r in sources}):
                guide=primary_guide(sources,lang)
                if not guide:
                    continue
                lang=cleanup.IDENTITY.get(guide['key'],{}).get('language',lang)
                identifier=f"{university['id']}-{institute[0]}-{institute[2]}-{lang}-kaynak"
                if university['id']=='ksbu' and institute[0]=='lee' and lang=='tr':
                    identifier='ksbu-lee-master-tr-kilavuz'
                draft=core_skeleton(guide,university,institute,institute[2],lang,identifier)
                apply_rules(draft,guide,False)
                apply_reviewed(draft,[guide])
                guide_sections(draft,guide)
                attach_source_forms(draft,sources)
                draft['template']['source']['archivePath']=guide['path']
                draft['template']['source']['rebuildKind']='guide-rules'
                draft['template']['source']['archiveSha256']=guide['sha256']
                draft['template']['source']['evidence']=draft.get('evidence',{})
                draft['template']['source']['relatedDocuments']=[{'path':r['path'],'sha256':r['sha256']} for r in sources]
                draft=clean(draft)
                file=OUT/'drafts'/f'{identifier}.json';file.parent.mkdir(exist_ok=True)
                file.write_text(json.dumps(draft,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
                drafts.append({'id':identifier,'draft':file.relative_to(ROOT).as_posix(),'source':guide['path'],'guide':guide['path']})
        coverage.append({'university':name,'scope':scope,'sources':len(sources),'measuredTemplates':len(candidates),
                         'retained':any(r['path'] in represented for r in sources),'status':'processed'})
    # Doctoral front covers are explicit source variants, not a guessed degree clone.
    doctoral=[]
    for row in drafts:
        draft=load(ROOT/row['draft']);t=draft['template']
        if t['source'].get('rebuildKind')!='guide-rules' or t['degreeType']!='master':
            continue
        scope_sources=next((ss for (name,scope),ss in groups.items() if any(s['path']==row['source'] for s in ss)),[])
        if not any('Doktora' in Path(s['path']).name and re.search(r'Kapak|Kapag',Path(s['path']).name) and s['path'].endswith('.docx') and language(Path(s['path']).name)==t['language'] for s in scope_sources):
            continue
        t['id']=re.sub(r'-master-', '-phd-',t['id'],count=1);t['degreeType']='phd'
        t['sections']=[s for s in t['sections'] if not s['id'].startswith('source-form-')]
        attach_source_forms(draft,scope_sources)
        file=OUT/'drafts'/f"{t['id']}.json"
        file.write_text(json.dumps(clean(draft),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
        doctoral.append({**row,'id':t['id'],'draft':file.relative_to(ROOT).as_posix()})
    drafts.extend(doctoral)
    (OUT/'rebuild-plan.json').write_text(json.dumps({'drafts':drafts,'coverage':coverage,'retained':retained},ensure_ascii=False,indent=1),encoding='utf-8')
    print(f'{len(drafts)} drafts; {len(retained)} existing reviewed layouts; {len(groups)} source scopes')


if __name__=='__main__':
    main()
