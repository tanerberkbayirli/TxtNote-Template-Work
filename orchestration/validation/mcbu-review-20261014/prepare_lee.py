"""Prepare source-located checks; reuse the existing real-editor stress fixture.

This creates test inputs only. It does not change university template values.
Run from the project root with the bundled Python runtime.
"""
import copy
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
specs = root / 'orchestration/specs'
source = 'MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx'
checks = []

def add(variant, name, kind, expected, locator, params=None, evidence='EXPLICIT', tolerance=0.5, **extra):
    checks.append(dict(id=f'{variant}-{name}', kind=kind,
        params=dict(fixture=variant, **(params or {})), expected=expected,
        tolerance=tolerance, source=dict(file=source, locator=locator), evidence=evidence, **extra))

for variant in ('master', 'phd'):
    fixture = json.loads((root / 'orchestration/validation/mcbu-lee/fix-2' / f'fixture-{variant}.json').read_text(encoding='utf-8'))
    thesis = fixture['researchData']['thesis']
    title = 'Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Dijital Okuryazarlık Düzeylerinin İncelenmesi'
    fixture['title'] = title
    thesis['values'].update(UNIVERSITY_NAME='Manisa Celal Bayar Üniversitesi',
        INSTITUTE_NAME='Lisansüstü Eğitim Enstitüsü', THESIS_TITLE=title,
        CITY='Manisa', YEAR='2026', USED_PROGRAMS='TxtNote (biçimlendirme ve belge dışa aktarma)')
    if variant == 'master':
        thesis['enabledSections'] = [s for s in thesis.get('enabledSections', []) if s != 'cv']
    (specs / f'mcbu-lee.fixture.{variant}.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

    add(variant, 'page-size', 'page_size', [210, 297], 'word/document.xml final sectPr pgSz', evidence='MEASURED')
    for edge, value in [('left',40),('right',25),('top',25),('bottom',25)]:
        add(variant, f'docx-margin-{edge}', 'docx_section', value, 'G[330]', {'field':f'margins.{edge}'}, tolerance=0.25)
    for part in ('header','footer'):
        add(variant, f'docx-{part}-distance', 'docx_section', 12.5, 'final sectPr pgMar header=footer=709 twips', {'field':f'margins.{part}'}, evidence='MEASURED', tolerance=0.25)
    add(variant,'docx-font','docx_attr',['Times New Roman'],'G[331], G[345], G[346]',{'tag':'rFonts','attrs':['ascii','hAnsi']})
    add(variant,'docx-single-and-body-spacing-present','docx_attr',['240','360'],'G[331] body 1.5; G[341], G[345] single (presence only)',{'tag':'spacing','attrs':['line'],'mode':'has','numeric_tol':1})
    add(variant,'docx-indent-present','docx_attr',['709'],'G[333] 1.25 cm (presence only)',{'tag':'ind','attrs':['firstLine'],'mode':'has','numeric_tol':1})
    add(variant,'docx-paragraph-gap-present','docx_attr',['120'],'G[333] 6 pt (presence only)',{'tag':'spacing','attrs':['after'],'mode':'has','numeric_tol':1})
    add(variant,'docx-clean-fields','docx_no_undefined',None,'Package integrity; supplemental engineering check',evidence='INFERRED')
    add(variant,'word-opens','word_opens',None,'DOCX must open and render in Microsoft Word',evidence='INFERRED')

    for output in ('pdf','word'):
        params = {'source':output}
        add(variant,f'{output}-fonts','fonts',['TimesNewRomanPSMT','TimesNewRomanPS-BoldMT','TimesNewRomanPS-ItalicMT','TimesNewRomanPS-BoldItalicMT','TimesNewRomanPSMT-Bold','TimesNewRomanPSMT-Italic','TimesNewRomanPSMT-BoldItalic','TimesNewRomanPSBoldMT','TimesNewRomanPSItalicMT','TimesNewRomanPSBoldItalicMT'], 'G[331]; G[346]; scope excludes equation glyphs',dict(params, families=['Times New Roman'], regex='Çevrimiçi|öğrenme|ÖZET|KAYNAKÇA|Anahtar Kelimeler|İÇİNDEKİLER'))
        add(variant,f'{output}-body-size','font_size',12,'G[331]',dict(params,pages={'label':'arabic'},regex='Çevrimiçi öğrenme|okuryazarlık düzeyleri'),tolerance=0.1)
        add(variant,f'{output}-body-pitch','line_pitch',7.3025,'G[331] 1.5 lines; TNR 12 single 13.8 pt, derived pitch 20.7 pt',dict(params,pages={'label':'arabic'}),evidence='INFERRED',tolerance=0.1)
        add(variant,f'{output}-body-left','text_extent',40,'G[330]',dict(params,pages={'label':'arabic'},metric='x0min'),tolerance=0.25)
        add(variant,f'{output}-body-right-bound','text_extent',185,'G[330]',dict(params,pages={'label':'arabic'},metric='x1max'),tolerance=0.25,cmp='le')
        add(variant,f'{output}-cover-no-number','page_labels','','G[342] (each-page label API represents no printed label as empty string)',dict(params,pages=[1,1],each=True))
        add(variant,f'{output}-abstract-start-I','page_labels','I','G[290] example ÖZET I',dict(params,pages={'find':'^ÖZET$'},each=True),evidence='MEASURED')
        add(variant,f'{output}-intro-start-1','page_labels','1','G[290]-G[297] example GİRİŞ 1',dict(params,pages={'find':'^GİRİŞ$'},each=True),evidence='MEASURED')
        add(variant,f'{output}-footer-center','page_number_attr',112.5,'word/footer1.xml jc=center within 40..185 mm text area',dict(params,attr='cx',pages={'label':'arabic'}),evidence='MEASURED',tolerance=0.25)
        add(variant,f'{output}-footnote-size','font_size',10,'G[346]',dict(params,regex='Açıklama dipnotu'),tolerance=0.1)
        add(variant,f'{output}-keyword-year-gap','line_gap',9.7367,'G[100]-G[102]: one blank single line after the last keyword line',dict(params,page={'find':'^ÖZET$'},a='uzaktan eğitim',b='^2026,.*sayfa'),evidence='MEASURED',tolerance=0.25)
        add(variant,f'{output}-chapter-bold','line_attr',1,'G[332]',dict(params,regex='^KURAMSAL ÇERÇEVE$',attr='bold'),tolerance=0)
        add(variant,f'{output}-toc-labels','toc_labels',None,'G[288]-G[318] page references must point to actual headings',dict(params,leader='none'),evidence='INFERRED')
        if variant == 'phd':
            add(variant,f'{output}-cv-size','font_size',14,'G[348]',dict(params,regex='^ÖZGEÇMİŞ$'),tolerance=0.1)
            add(variant,f'{output}-cv-bold','line_attr',1,'G[348]',dict(params,regex='^ÖZGEÇMİŞ$',attr='bold'),tolerance=0)
            add(variant,f'{output}-cv-center','line_attr',112.5,'G[348]',dict(params,regex='^ÖZGEÇMİŞ$',attr='cx'),tolerance=0.25)

    add(variant,'fields-after-word-refresh','fields_refresh_match',None,'Output robustness: PAGE/TOC/PAGEREF/NUMPAGES refresh must preserve layout',evidence='INFERRED')
    add(variant,'cached-fields','fields_cached_match',None,'Output robustness: cached field values must match Word refresh',evidence='INFERRED')

checks.append(dict(id='source-conflicts-required',kind='note',params={'text':'University confirmation pending: abstract single vs 1.5; cover gaps notes vs XML; chapter alignment prose vs TOC example; page count meaning; English degree/institute names. Existing source precedence is an implementation choice, not university approval.'},expected=None,source={'file':source,'locator':'G[96],G[104],G[130]; G[10],G[32]; G[299]-G[300],G[332]; G[102],G[128]'},evidence='UNKNOWN',required=True))
(specs/'mcbu-lee.checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(checks)} checks and two corrected stress fixtures.')
