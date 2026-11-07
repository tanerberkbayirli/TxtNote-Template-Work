"""Turn source example values into editable metadata, keeping the source wording.

Never seed an example thesis, a sample student's identity or Word's instructional
content-control prompts into a new thesis. Removed instructional pages remain in
the source audit and are recorded as review points.
"""
import re

IDENTITY = {
 '5c0ea30aecac6e74': {'language':'en'},  # Source cover and text are in English.
 'af95d506aacccec7': {'degreeType':'phd'},  # The source says Doktora Tezi; five jury positions.
 '222344bdc8851210': {'language':'en'},  # The published gastronomic project guide is English.
}

EXAMPLES = {
 '54561234a0b888b8': {
  'HIZLI İYİLEŞME PROTOKOLÜ İLE TOTAL DİZ ARTROPLASTİSİ UYGULANAN HASTALARDA ERKEN DÖNEM TÜM VÜCUT VİBRASYONU VE PROGRESİF DİRENÇLİ EGZERSİZLERİN ETKİNLİĞİNİN KARŞILAŞTIRILMASI:':'{{THESIS_TITLE}}',
  'RANDOMİZE KARŞILAŞTIRMALI ÇALIŞMA':'', 'Gökhan BAYRAK':'{{STUDENT_NAME}}',
  'FİZYOTERAPİ VE REHABİLİTASYON':'{{PROGRAM_NAME}}','Haziran 2022':'{{MONTH_YEAR}}',
 },
 'a526897bf1dc0716': {
  'AKRİLAMİD VERİLEN SIÇANLARDA YÜZME EGZERSİZİNİN KORUYUCU ETKİSİNİN ARAŞTIRILMASI':'{{THESIS_TITLE}}',
  'Damla GÜNDÜZ':'{{STUDENT_NAME}}','Kasım 2021':'{{MONTH_YEAR}}','Prof. Dr. Hülya ÇETİN':'{{ADVISOR_NAME}}',
 },
 '5e99ad2791653efa': {
  'KONFEKSİYON İŞLETMELERİNDE':'{{THESIS_TITLE}}','KISITLI KAYNAK KULLANIM TEKNİĞİYLE':'',
  'ÜRETİM PLANLAMASI':'','Nilgün ULUSOY':'{{STUDENT_NAME}}',
 },
 '5488924a49f3fb21': {
  'TEZ KILAVUZUNUN TEZ YAZIMI VE SUNUMUNA FAYDALARI':'{{THESIS_TITLE}}','HAZİRAN 2025':'{{MONTH_YEAR}}',
  '18/06/2024':'{{DEFENSE_DATE}}','Enformatik Mühendisliği':'{{DEPARTMENT_NAME}}',
 },
 'f9b71cf4652c5c38': {
  'BENEFITS OF THE THESIS GUIDE TO THESIS WRITING AND PRESENTATION':'{{THESIS_TITLE}}',
  'JUNE 2025':'{{MONTH_YEAR}}','18/06/2024':'{{DEFENSE_DATE}}',
 },
 '55476b349c37a3cf': {'07240000000':'{{STUDENT_NUMBER}}','Öğrenci İsim SOYİSİM':'{{STUDENT_NAME}}',
                     'Prof. Dr. İsim SOYİSİM':'{{ADVISOR_NAME}}','İsim SOYİSİM':'{{STUDENT_NAME}}','İzmir, 2025':'{{CITY}}, {{YEAR}}'},
 '10222645f8669640': {'Aaaaa Yazar Adı Bbbbb':'{{STUDENT_NAME}}','Aaaaa Bbbbb':'{{STUDENT_NAME}}',
                     'Prof. Dr. Ccccc Ddddd':'{{ADVISOR_NAME}}','Ocak 2024':'{{MONTH_YEAR}}',
                     'Tez Hazırlama ve Yazım Kılavuzu (Tezin Türkçe Başlığı)':'{{THESIS_TITLE}}','Tezin Türkçe Başlığı':'{{THESIS_TITLE}}'},
 '0f14bff6b2d75c29': {'Aaaaa Author Name Bbbbb':'{{STUDENT_NAME}}','Aaaaa Bbbbb':'{{STUDENT_NAME}}',
                     'Prof. Dr. Ccccc Ddddd':'{{ADVISOR_NAME}}','January 2024':'{{MONTH_YEAR}}'},
}
EXAMPLES['10222645f8669640'].update({'Doç. Dr. Ccccc Ddddd':'{{CO_ADVISOR_NAME}}','Dr. Öğr. Üyesi Ccccc Ddddd':'{{JURY_MEMBER_NAME}}'})
EXAMPLES['0f14bff6b2d75c29'].update({'Aaaaa Author’s Name Bbbbb':'{{STUDENT_NAME}}'})
for source_key in ('ce3d8cd123f4d888','20f4b568dc1605ac','6c9516e99487692d'):
    EXAMPLES.setdefault(source_key,{})['Prof. Dr. Yücel Öztürkoğlu']='{{INSTITUTE_DIRECTOR_NAME}}'
EXAMPLES['fbf6f6688d488890']={'İZMİR-2022 (Tezin sunulduğu yıl yazılmalı)':'{{CITY}}-{{YEAR}}'}


def clean_source_pages(draft,key):
    t=draft['template']
    english=t['language']=='en'
    defaults={
      'THESIS_TITLE':'Thesis title' if english else 'Tez başlığı',
      'STUDENT_NAME':'Student name' if english else 'Öğrenci adı soyadı',
      'ADVISOR_NAME':'Advisor name' if english else 'Danışman adı soyadı',
      'CO_ADVISOR_NAME':'Co-advisor' if english else 'İkinci danışman',
      'DEPARTMENT_NAME':'Department' if english else 'Anabilim dalı',
      'PROGRAM_NAME':'Program','YEAR':'Yıl','DATE':'Tarih','MONTH_YEAR':'Month and year' if english else 'Ay ve yıl',
    }
    t['placeholders'].setdefault('MONTH_YEAR',{'label':'Month and year' if english else 'Ay ve yıl','type':'text'})
    t['placeholders'].setdefault('DEFENSE_DATE',{'label':'Defense date' if english else 'Savunma tarihi','type':'date'})
    for field,label in [('JURY_MEMBER_NAME','Jüri üyesi'),('INSTITUTE_DIRECTOR_NAME','Enstitü müdürü'),('ORCID','ORCID')]:
        t['placeholders'].setdefault(field,{'label':label,'type':'text'})
    degree={('tr','master'):'YÜKSEK LİSANS TEZİ',('tr','phd'):'DOKTORA TEZİ',('en','master'):"MASTER'S THESIS",('en','phd'):'Ph.D. THESIS'}.get((t['language'],t['degreeType']))
    replacements=EXAMPLES.get(key,{})
    removed=[]

    def text(value):
        value=value.replace('Prof. Dr. Muhittin Hakan DEMİR','{{INSTITUTE_DIRECTOR_NAME}}')
        for name in ('Prof. Dr. Abdullah SEÇGİN','Prof. Dr. Özge TÜZÜN ÖZMEN',
                     'Prof. Dr. Ahu ARICIOĞLU','Prof. Dr. Türkan TURAN',
                     'Prof. (PhD) Yücel Öztürkoğlu','Prof. Dr. S. Neşe ATABEY'):
            value=value.replace(name,'{{INSTITUTE_DIRECTOR_NAME}}')
        value=value.replace('Prof. Dr. Ummuhan BAŞ ASLAN','{{ADVISOR_NAME}}')
        if t['universityId']=='tinaztepe':
            value=value.replace('Prof.Dr. Aaaaaa BBBBBB.','{{ADVISOR_NAME}}').replace('Cccccc DDDDDD','{{STUDENT_NAME}}')
            value=re.sub(r'[.…]+\s*Anabilim Dalı','{{DEPARTMENT_NAME}} Anabilim Dalı',value)
            value=re.sub(r'\s*\(\d+\s*(?:punto|aralık)\)','',value,flags=re.I)
            value=re.sub(r'^EK\s*\d+[.\s]*','',value,flags=re.I)
            if degree:
                value=re.sub(r'Yüksek Lisans/Doktora tezi','doktora tezi' if t['degreeType']=='phd' else 'yüksek lisans tezi',value,flags=re.I)
        for pattern,field in [(r'\[(?:Name of )?Program(?: Name| Adı)?\]','PROGRAM_NAME'),
                              (r'\[Name of Department\]','DEPARTMENT_NAME'),
                              (r'\[TITLE, NAME AND SURNAME OF THESIS ADVISOR\]','ADVISOR_NAME'),
                              (r'\[TEZ İKİNCİ DANIŞMANI ÜNVANI, ADI VE SOYADI\]','CO_ADVISOR_NAME')]:
            value=re.sub(pattern,lambda m:'{{'+field+'}}',value,flags=re.I)
        value=re.sub(r'\[Title and Name of Jury Member #(\d+)\]',lambda m:'{{JURY_MEMBER_'+m[1]+'_NAME}}',value,flags=re.I)
        value=re.sub(r'\[Affiliation of Jury Member #(\d+)\]',lambda m:'{{JURY_MEMBER_'+m[1]+'_INSTITUTION}}',value,flags=re.I)
        value=re.sub(r'\[Jüri Üyesi #(\d+) Ünvanı, Adı ve Soyadı\s*\]',lambda m:'{{JURY_MEMBER_'+m[1]+'_NAME}}',value,flags=re.I)
        value=re.sub(r'\[Jüri Üyesi #(\d+) Kurumu\s*\]',lambda m:'{{JURY_MEMBER_'+m[1]+'_INSTITUTION}}',value,flags=re.I)
        for before,after in replacements.items():
            value=value.replace(before,after)
        for pattern,field in [
          (r'WRITE THE NAME OF THE THESIS[^“”\n]*?HERE\.?','THESIS_TITLE'),
          (r'TEZ ADINI BÜYÜK HARFLERLE[^“”\n]*?(?:BURAYA YAZINIZ|YAZINIZ)\.?','THESIS_TITLE'),
          (r'TEZ BAŞLIĞINIZI BURAYA KOYU KARAKTERDE YAZINIZ','THESIS_TITLE'),
          (r'ADINIZI SOYADINIZI KOYU KARAKTERDE YAZINIZ','STUDENT_NAME'),
          (r'TEZ YAZARI BÜYÜK HARFLERLE,\s*12 PUNTO,\s*KOYU','STUDENT_NAME'),
          (r'THESIS AUTHOR IN CAPITAL,\s*12 POINT,\s*BOLD','STUDENT_NAME'),
          (r'(?:UNVAN SEÇİNİZ\.\s*)?DANIŞMAN ADINI BÜYÜK HARFLERLE[^“”\n]*?BURAYA YAZINIZ\.?','ADVISOR_NAME'),
          (r'(?:SELECT TITLE\.\s*)?WRITE THE NAME OF THE SUPERVISOR[^“”\n]*?HERE\.?','ADVISOR_NAME'),
          (r'ANABİLİM DALINIZI SEÇİNİZ','DEPARTMENT_NAME'),(r'PROGRAMINIZI SEÇİNİZ','PROGRAM_NAME'),
          (r'Tarih girmek için burayı tıklatın','DEFENSE_DATE'),
          (r'“[. …\-]{3,}”','THESIS_TITLE'),
        ]:
            value=re.sub(pattern,lambda m:'{{'+field+'}}',value,flags=re.I)
        if degree and re.fullmatch(r'(?:YÜKSEK LİSANS\s*(?:/|YA DA)\s*DOKTORA TEZİ|MASTER.S/PHD THESIS|Yüksek Lisans / Doktora Tezi)',value,re.I):
            value=degree
        return value

    def blocks(items,section):
        result=[]
        for original in items:
            b=dict(original)
            if b['type']=='group':
                b['blocks']=blocks(b['blocks'],section)
                if b['blocks']:
                    result.append(b)
                continue
            if b['type']=='metadata':
                if b['field']=='PROGRAM_NAME' and re.fullmatch(r'DOKTORA PROGRAMI|YÜKSEK LİSANS PROGRAMI',b.get('fallback',''),re.I):
                    result.append({k:v for k,v in {**b,'type':'text','value':b['fallback']}.items() if k not in ('field','fallback','suffix','prefix')});continue
                b['fallback']=defaults.get(b['field'],b['field'].replace('_',' ').title())
                result.append(b);continue
            if b['type']!='text':
                result.append(b);continue
            value=text(b.get('value','')).strip()
            if re.fullmatch(r'\[[^\[\]]+\]',value):
                value=value[1:-1].strip()
            if not value and original.get('value','').strip():
                continue
            upper=value.upper() if english else converter_upper(value)
            if re.match(r'^(?:TEZ BAŞLIĞI (?:İKİNCİ|ÜÇÜNCÜ) SATIR|SECOND LINE OF THE TITLE|THIRD LINE OF THE TITLE)',upper):
                removed.append(value);continue
            standalone=None
            if len(value)<240:
                for field,pattern in [
                    ('THESIS_TITLE',r'^(?:TEZ(?:İN)? (?:BAŞLIĞI|ADI)|YÜKSEK LİSANS YA DA DOKTORA TEZİNİN BAŞLIĞI|WRITE THE NAME OF THE THESIS|TITLE OF (?:THE )?THESIS|THESIS TITLE)'),
                    ('STUDENT_NAME',r'^(?:AD SOYAD$|ADI SOYADI$|NAME SURNAME$|TEZ YAZARI|TEZİ HAZIRLAYAN(?:IN)? ADI|ÖĞRENCİNİN ADI|ÖĞRENCİ AD|STUDENT.S NAME|NAME AND SURNAME OF THE WRITER|FULL NAME)'),
                    ('ADVISOR_NAME',r'^(?:AKADEMİK UNVANI ADI|ACADEMIC TITLE, NAME|THESIS SUPERVISOR.S TITLE|TITLE NAME SURNAME|PROF\. DR\. İSİM|UNVAN SEÇİNİZ\. DANIŞMAN)'),
                    ('DEPARTMENT_NAME',r'^(?:ANABİLİM DALINI SEÇİNİZ|DEPARTMENT OF [.…]+)'),
                    ('MONTH_YEAR',r'^(?:TEZ BASIM TARİHİNİ AY VE YIL|WRITE THE THESIS PUBLICATION DATE|YILI SEÇİN)')]:
                    if re.search(pattern,upper):
                        standalone=field;break
            token=re.fullmatch(r'\{\{([A-Z_]+)\}\}',value)
            if token:
                standalone=token[1]
            if standalone:
                metadata={k:v for k,v in {**b,'type':'metadata','field':standalone,'fallback':defaults.get(standalone,standalone)}.items() if k not in ('value','runs','markup')}
                if standalone=='DEPARTMENT_NAME' and upper.startswith('DEPARTMENT OF '):
                    metadata['prefix']='DEPARTMENT OF '
                result.append(metadata)
                continue
            instruction=(re.fullmatch(r'\(?\s*(?:FONT SIZE|FONT SIZE:|IN ALPHABETICAL ORDER|SOYADI BÜYÜK|VARSA)[\s\S]*',upper)
                         or (len(value)<240 and re.search(r'BURAYA YAZINIZ|ORTALANMIŞ OLARAK|BOLD AND CENTERED HERE|WRITE .* HERE',upper)))
            if instruction:
                removed.append(value);continue
            b['value']=value
            if value!=original.get('value'):
                b.pop('runs',None);b.pop('markup',None)
            result.append(b)
        return result

    sections=[]
    discard_abstract_continuation=False
    for section in t['sections']:
        if not section.get('blocks'):
            sections.append(section);continue
        flattened=[]
        def collect(items):
            for b in items:
                if b['type']=='group':collect(b['blocks'])
                elif b['type']=='text' and b.get('value','').strip():flattened.append(b['value'].strip())
        collect(section['blocks'])
        opening=' '.join(flattened[:2])
        if key=='5e99ad2791653efa' and ('Bu belge' in opening or 'bölüm başlıklarının sırayla' in opening):
            removed.append(opening);continue
        content_kind=next(((kind,title) for kind,title,pattern in [
          ('preface','ÖNSÖZ',r'^ÖN\s*SÖZ'),('acknowledgements','TEŞEKKÜR',r'^TEŞEKKÜR'),
          ('abstract','ÖZET',r'^(?:ÖZET|ÖZ)$'),('englishAbstract','ABSTRACT',r'^(ABSTRACT|SUMMARY)\b'),
          ('tableOfContents','İÇİNDEKİLER',r'^İÇİNDEKİLER\b'),
          ('listOfTables','TABLOLAR DİZİNİ',r'^(?:TABLOLAR|ÇİZELGE LİSTESİ)\b'),
          ('listOfFigures','ŞEKİLLER DİZİNİ',r'^(?:ŞEKİLLER|ŞEKİL LİSTESİ)\b'),
          ('listOfAbbreviations','SİMGELER VE KISALTMALAR',r'^(?:SİMGE|SİMGELER) VE KISALTMALAR'),
          ('curriculumVitae','ÖZGEÇMİŞ',r'^ÖZ\s*GEÇMİŞ\b'),('mainContent','Ana metin',r'^GİRİŞ\b')]
          if any(re.search(pattern,converter_upper(line)) for line in flattened[:3])),None)
        if content_kind:
            kind,title=content_kind
            discard_abstract_continuation=kind in ('abstract','englishAbstract')
            if any(s['type']==kind and not s.get('blocks') for s in t['sections']):
                removed.append(opening);continue
            generated={'tableOfContents':'toc','listOfTables':'tables','listOfFigures':'figures'}.get(kind)
            section={**section,'type':kind,'title':title,'mode':'generated' if generated else 'editable','showTitle':kind!='mainContent','group':'body' if kind=='mainContent' else 'back' if kind=='curriculumVitae' else 'front'}
            section.pop('blocks',None);section.pop('layoutMode',None)
            section['overrides'].get('page',{}).pop('numbering',None)
            if generated:
                section['generatedIndex']={'kind':generated,'title':title,'includePageNumbers':True,'leader':'dots'}
            sections.append(section);continue
        if section['type']=='custom':
            if re.search(r'THESIS EXAMINATION RESULT FORM|JURY CONFIRMATION PAGE',opening,re.I):
                section['type']='approval';section['title']='Approval'
            elif re.search(r'Declaration of Authorship',opening,re.I):
                section['type']='declaration';section['title']='Declaration of Authorship'
            elif re.search(r'TEZ ÇALIŞMASI ORJİNALLİK RAPORU',opening,re.I):
                section.pop('blocks',None);section.pop('layoutMode',None)
                section.update(mode='editable',showTitle=True,title='TEZ ÇALIŞMASI ORJİNALLİK RAPORU')
                sections.append(section);continue
            elif key=='5e99ad2791653efa' and 'BİTİRME TEZİ' in opening:
                section['type']='outerCover';section['title']='Dış Kapak';section['group']='cover'
            elif discard_abstract_continuation or not opening.strip() or key=='5e99ad2791653efa' or opening.strip()=='Yazı' or re.match(r'^2\.6\.1',opening):
                removed.append(opening);continue
        section['blocks']=blocks(section['blocks'],section)
        sections.append(section)
    order={'cover':0,'front':1,'body':2,'back':3}
    t['sections']=sorted(sections,key=lambda s:order.get(s.get('group'),1))
    def declare_fields(items):
        for item in items:
            if item['type']=='group':declare_fields(item['blocks'])
            for field in re.findall(r'\{\{([A-Z][A-Z0-9_]*)\}\}',item.get('value',''))+([item['field']] if item['type']=='metadata' else []):
                t['placeholders'].setdefault(field,{'label':field.replace('_',' ').title(),'type':'text'})
    for section in t['sections']:
        declare_fields(section.get('blocks',[]))
    if removed:
        draft.setdefault('inferred',[]).append({'field':'sections.sourceInstructions','value':len(removed),
          'reasoning':'Şablonun kullanım yönergeleri ve örnek önsöz açıklamaları yeni tezin içeriği olarak basılmaması için çıkarıldı; özgün dosya korundu.'})
    draft.setdefault('inferred',[]).append({'field':'sections.metadata','value':'kaynak örnekleri yer tutucuya dönüştürüldü',
      'reasoning':'Örnek öğrenci, tez adı, danışman ve tarih yeni tezin gerçek bilgileri değildir; düzenlenebilir alanlara çevrildi.'})


def converter_upper(value):
    return value.replace('i','İ').replace('ı','I').upper()
