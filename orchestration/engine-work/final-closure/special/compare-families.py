import sys,pathlib,json,zipfile,re,collections,os,xml.etree.ElementTree as ET
sys.path.insert(0,'orchestration/tools/measurement-packages')
import pymupdf
directory=pathlib.Path(os.environ.get('SPECIAL_FAMILY_OUT','orchestration/engine-work/final-closure/special/families'))
reports=[]
for path in sorted(directory.glob('*.docx')):
    tag=path.stem;pdf=directory/(tag+'.pdf');word=directory/(tag+'.word.pdf')
    if not word.exists():reports.append(dict(id=tag,status='missing-word'));continue
    browser=pymupdf.open(pdf);native=pymupdf.open(word)
    text=''.join(page.get_text() for page in browser);wordtext=''.join(page.get_text() for page in native)
    # Independent content check: every letter is accounted for even where Word
    # orders adjacent table cells differently. Page labels/dates are numeric.
    letters=lambda value:collections.Counter(char for char in value.casefold() if char.isalpha())
    missing=letters(text)-letters(wordtext);extra=letters(wordtext)-letters(text)
    with zipfile.ZipFile(path) as package:
        document=ET.fromstring(package.read('word/document.xml'))
        editable=''.join(node.text or '' for node in document.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
    fixture=json.loads((directory/(tag+'.json')).read_text(encoding='utf8'))
    titles=[value for key,value in fixture['researchData']['thesis']['values'].items() if key in ['THESIS_TITLE','THESIS_TITLE_TR','THESIS_TITLE_EN','PROJECT_TITLE','PROJECT_TITLE_EN']]
    compact=lambda value:re.sub(r'\s+','',value).upper()
    # Source textTransform uppercase is applied with Turkish locale in DOCX.
    titleEditable=bool(titles) and all(compact(title) in compact(editable) or compact(title.replace('i','İ')) in compact(editable) for title in titles)
    row=dict(id=tag,pdfPages=len(browser),wordPages=len(native),editableTitle=titleEditable,missingLetters=dict(missing),extraLetters=dict(extra),docxTextRuns=sum(1 for _ in document.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')))
    row['status']='PASS' if len(browser)==len(native) and titleEditable and not missing and not extra else 'INSPECT'
    reports.append(row)
print(json.dumps(reports,ensure_ascii=False,indent=2))
(directory/'comparison.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf8')
if len(reports)!=7 or any(row['status']!='PASS' for row in reports):sys.exit(1)

