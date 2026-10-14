"""Freeze the completed input/reference contract, then verify it independently.

No current engine export is treated as a golden source. --freeze is one-shot.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import platform
import re
import shutil
import sys
from lxml import etree
import zipfile

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'orchestration/engine-work/mission01'
sys.path.insert(0,str(ROOT/'orchestration/tools'))
from pdfmeasure import open_pdf,visual_lines

def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def asset(p):
    p=Path(p)
    return {'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def write(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
M='http://schemas.openxmlformats.org/officeDocument/2006/math'
NS={'w':W,'m':M,'wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
FEATURES={'paragraph':'.//w:p','table':'.//w:tbl','horizontalMerge':'.//w:gridSpan','verticalMerge':'.//w:vMerge',
    'repeatedTableHeader':'.//w:tblHeader','equation':'.//m:oMath','matrix':'.//m:m','integralOrNary':'.//m:nary',
    'vectorAccent':'.//m:acc','inlineImage':'.//wp:inline','anchoredImage':'.//wp:anchor','croppedImage':'.//a:srcRect',
    'footnoteReference':'.//w:footnoteReference','endnoteReference':'.//w:endnoteReference',
    'field':'.//w:instrText','bookmark':'.//w:bookmarkStart','section':'.//w:sectPr','textBox':'.//w:txbxContent',
    'numberedParagraph':'.//w:numPr'}

def native_index(path):
    result={'counts':Counter(),'features':[],'noteParagraphs':{}}
    with zipfile.ZipFile(path) as z:
        for part in z.namelist():
            if not part.startswith('word/') or not part.endswith('.xml'):continue
            tree=etree.fromstring(z.read(part))
            if part=='word/document.xml':
                result['mainTextSha256']=hashlib.sha256(''.join(tree.xpath('.//w:t/text()',namespaces=NS)).encode()).hexdigest()
            if part not in ['word/document.xml','word/footnotes.xml','word/endnotes.xml'] and not part.startswith(('word/header','word/footer')):continue
            for name,query in FEATURES.items():
                nodes=tree.xpath(query,namespaces=NS)
                result['counts'][name]+=len(nodes)
                if name=='paragraph':continue
                for i,node in enumerate(nodes,1):
                    result['features'].append({'kind':name,'part':part,'ordinal':i,'xpath':tree.getroottree().getpath(node)})
            if part in ['word/footnotes.xml','word/endnotes.xml']:
                result['noteParagraphs'][part]=len(tree.xpath('.//w:p',namespaces=NS))
            if part=='word/document.xml':
                result['nestedTableCount']=len(tree.xpath('.//w:tbl[ancestor::w:tbl]',namespaces=NS))
    result['counts']=dict(result['counts'])
    return result

def page_index(path):
    pages=[]
    with open_pdf(str(path)) as doc:
        for n,page in enumerate(doc,1):
            text=page.get_text()
            pages.append({'physicalPage':n,'widthPt':page.rect.width,'heightPt':page.rect.height,
                'textSha256':hashlib.sha256(text.encode()).hexdigest(),'textCharacters':len(text),
                'openingText':' '.join(text.split())[:180],
                'boundaryMarkers':sorted(set(re.findall(r'FOOTNOTE_\d{3}|BODY_\d{3}|ROW_\d{3}|ENDNOTE_TEXT|MATH_[A-Z]+|BOOKMARK_TARGET|WIDE_\d_\d',text))),
                'fonts':[{'name':row[3],'type':row[2],'embedded':bool(doc.extract_font(row[0])[3]) if row[0] else False} for row in page.get_fonts()],
                'imageCount':len(page.get_images())})
    return {'physicalPages':len(pages),'pages':pages}

MISSION={
 '02':{'development':['SRC01','SRC03','SRC04','SRC05','EDGE_STRUCTURE','EDGE_NOTES'],'probe':'Import/edit/save/reopen: preserve source text, native structure counts, IDs, style choices; retain canonical source hash. No presentation fragments in saved data.'},
 '03':{'development':['SRC01','SRC03','SRC04','SRC05','SRC07','SRC09','SRC11','EDGE_STRUCTURE','EDGE_NOTES'],'probe':'DOCX package/text counts, inherited/direct styles, numbering, native objects and sections; unsupported objects must be located in a report. Legacy DOC conversion is a separate adapter test.'},
 '04':{'development':['SRC02','EDGE_SCAN'],'probe':'Compare PDF page order, text/heading/table/image reading order and scans against recorded source PDF/native DOCX plus scan ground truth; formula ambiguity must be reported.'},
 '05':{'development':['SRC09','EDGE_STRUCTURE','SYN01','SYN02','SYN05'],'probe':'Compare exact line text, font identity, kerning/tab/word placement; retain original J03/J04 results and tolerances.'},
 '06':{'development':['SRC01','SRC04','SRC05','EDGE_STRUCTURE','SYN04'],'probe':'Compare source sections, orientation/margins, physical blank pages, first/even/odd headers, numbering restarts and visible labels in editor/PDF/Word.'},
 '07':{'development':['SRC09','SRC02','EDGE_STRUCTURE','EDGE_NOTES','SYN03','SYN04'],'probe':'Use the 180-page filled research example for cumulative page/line drift; table continuation and spanning footnote use native boundary references. Record insertion/deletion reflow and timing protocol.'},
 '08':{'development':['SRC03','SRC04','SRC05','EDGE_STRUCTURE'],'probe':'Compare long cover title, two advisors and five committee members; inspect original textbox/native positions and authoring boundary expectations.'},
 '09':{'development':['SRC07','SRC09','EDGE_STRUCTURE','SYN04'],'probe':'Preserve table count, nested/merged cells, 47 data rows and repeated headers across pages; compare landscape and geometry to source Word PDF.'},
 '10':{'development':['SRC09','EDGE_STRUCTURE'],'probe':'Four editable OMML equations, matrix/integral/vector and inline/anchored/cropped images. Native structure and Word glyphs must survive; rasterized equation is not acceptance.'},
 '11':{'development':['SRC11','EDGE_NOTES','EDGE_STRUCTURE','SYN03'],'probe':'Native footnote/endnote IDs, reference links and numbering; 40 footnote paragraphs span source physical pages with an independently rendered separator/continuation.'},
 '12':{'development':['SRC01','SRC04','EDGE_STRUCTURE','SYN04'],'probe':'Heading/list fields and REF/PAGEREF/bookmark targets after moves/deletions; Word field refresh and save/reopen must preserve live targets.'},
 '13':{'development':[],'heldOut':['SRC10','SRC08'],'controls':['EDGE_STRUCTURE','EDGE_NOTES','EDGE_SCAN'],'probe':'Final acceptance on reserved 91-page EN filled research example and EN doctoral official template, plus all development controls. Do not tune engine against held-out results before final run; report scope limitations.'}}

def freeze():
    target=OUT/'acceptance-v3.json'
    if target.exists():raise SystemExit('Acceptance contract exists; preserve and version it.')
    base=read(OUT/'corpus.json');edges=read(OUT/'inputs/native-inputs-final.json')
    cases=[]
    for source in base['sources']+edges['sources']:
        cid=source['id'];input_path=ROOT/source['path']
        assert sha(input_path)==source['sha256'],cid+' changed source'
        role=source.get('role','template');partition='held-out' if cid in ['SRC10','SRC08'] else 'development'
        if cid in ['SRC09','SRC10']:role='official-template-with-long-filled-research-example'
        if cid=='SRC11':role='negative-control-existing-broken-field-targets-with-native-footnotes'
        entry={'id':cid,'input':asset(input_path),'partition':partition,'role':role,
            'language':source.get('language','tr/en'),'degree':source.get('degree','boundary'),
            'field':source.get('field','boundary'),'fullDepositedThesisVerified':False,
            'provenance':source.get('provenance'),'references':{}}
        folder=OUT/'references'/cid;folder.mkdir(parents=True,exist_ok=True)
        if input_path.suffix.lower()=='.docx':
            run=ROOT/'orchestration/validation/mission01/source-references'/cid
            record=read(run/'record.json');aligned=(run/'audit-aligned.json').exists()
            audit=read(run/('audit-aligned.json' if aligned else 'audit.json'))
            assert record['status']=='RENDERED' and audit['status']=='AUDITED'
            assert record['sourceSha256']==source['sha256']==audit['sha256']
            for name in ['word.pdf','word.render.json','record.json','audit.json']:
                actual=('audit-aligned.pdf' if name=='word.pdf' else 'audit-aligned.json' if name=='audit.json' else name) if aligned else name
                shutil.copy2(run/actual,folder/name)
            pdf=folder/'word.pdf';index=page_index(pdf)
            if audit['physicalPages']!=index['physicalPages']:
                with open_pdf(str(pdf)) as d: rendered_text='\n'.join(p.get_text() for p in d)
                assert cid=='SRC11' and 'Hata!' in rendered_text and 'tanımlanmamış' in rendered_text,cid+' unexplained reference discrepancy'
                entry['referenceConsistency']={'ruling':'KNOWN_SOURCE_NEGATIVE_CONTROL','wordStatisticsPages':audit['physicalPages'],
                    'exportedPdfPhysicalPages':index['physicalPages'],
                    'reason':'Original source has broken field targets. Exported PDF renders Turkish missing-bookmark errors while Word fields retain shorter cached results. Do not use Word statistics or cached field positions as a PDF geometry PASS oracle.',
                    'expectedHandling':'Report pre-existing broken field targets and preserve native content/note IDs. Valid geometry/field-refresh controls are SRC01 and EDGE_STRUCTURE.',
                    'geometryPassControl':False}
            for feature in audit['features']:
                assert 1<=feature['location']['firstPhysicalPage']<=index['physicalPages'],cid+' invalid page'
            write(folder/'native-index.json',native_index(input_path))
            entry['references']={name:asset(folder/name) for name in ['word.pdf','word.render.json','record.json','audit.json','native-index.json']}
            normalize=lambda text:re.sub(r'[\s\x00-\x1f\u00ad]+','',text).casefold()
            with open_pdf(str(pdf)) as d:page_texts=[normalize(p.get_text()) for p in d]
            locations=[]
            for feature in audit['features']:
                anchor=normalize(feature.get('textPrefix',''))
                matched=[]
                if len(anchor)>=24:
                    for length in [80,40,24]:
                        fragment=anchor[:length]
                        matched=[i+1 for i,text in enumerate(page_texts) if fragment in text]
                        if len(matched)==1:break
                locations.append({'sourceLocator':feature['locator'],'kind':feature['kind'],
                    'wordRange':feature['location'],'pdfPhysicalPageCandidates':matched,
                    'ruling':'UNIQUE_SOURCE_TEXT_ANCHOR' if len(matched)==1 else 'USE_NATIVE_LOCATOR_AND_PDF_REFERENCE; no inferred physical page'})
            write(folder/'feature-page-index.json',{'scope':'Independent PDF text anchors plus native Word collection locations. Ambiguous/cached fields are not silently mapped.', 'features':locations})
            entry['references']['feature-page-index.json']=asset(folder/'feature-page-index.json')
            if aligned:entry['referenceRevision']='Audit and PDF taken in same Word session after earlier 23/21 page discrepancy. record.json retains earlier render history; audit.json describes the selected PDF.'
        else:
            pdf=input_path;index=page_index(pdf)
            entry['references']['source-pdf']=asset(pdf)
        write(folder/'page-index.json',index)
        entry['references']['page-index.json']=asset(folder/'page-index.json')
        entry['physicalPages']=index['physicalPages']
        cases.append(entry)
    scan=OUT/'inputs/edge-synthetic-scans-final.pdf'
    cases.append({'id':'EDGE_SCAN','input':asset(scan),'partition':'development','role':'synthetic-image-only-scan',
        'language':'tr/en','degree':'boundary','field':'boundary','physicalPages':3,
        'references':{'groundTruth':asset(OUT/'inputs/scan-ground-truth-final.json')}})
    native=next(x for x in cases if x['id']=='EDGE_STRUCTURE')
    counts=read(ROOT/native['references']['native-index.json']['path'])
    required={'equation':4,'matrix':1,'integralOrNary':1,'vectorAccent':1,'inlineImage':1,'anchoredImage':1,
              'croppedImage':1,'endnoteReference':1,'repeatedTableHeader':1,'horizontalMerge':1,'verticalMerge':2}
    for key,min_count in required.items():assert counts['counts'].get(key,0)>=min_count,key+' native boundary missing'
    assert counts['nestedTableCount']>=1
    notes=next(x for x in cases if x['id']=='EDGE_NOTES')
    audit=read(ROOT/notes['references']['audit.json']['path'])
    foot=[r for r in audit['features'] if r['kind']=='Footnotes']
    note_pages=[p['physicalPage'] for p in read(ROOT/notes['references']['page-index.json']['path'])['pages'] if any(m.startswith('FOOTNOTE_') for m in p['boundaryMarkers'])]
    assert len(foot)==1 and len(set(note_pages))>1,'Source PDF footnote markers must span pages'
    synthetics=[]
    for row in base['synthetic']:
        synthetics.append({**row,'partition':'development'})
    fonts=[]
    for name in ['times.ttf','timesbd.ttf','timesi.ttf','arial.ttf','arialbd.ttf','ariali.ttf','cambria.ttc','calibri.ttf']:
        p=Path('C:/Windows/Fonts')/name
        if p.exists():fonts.append({'file':str(p),'sha256':sha(p)})
    protocol={'timing':'Before implementation optimization, capture open/save/PDF/DOCX export times and 20 insert/delete input samples on SRC09; record p50/p95, memory and page-settle time.',
        'environment':'Record installed font files, Word build, OS, browser build and renderer settings. Establish numeric acceptance limits from measured baseline before optimization; do not invent measurements.',
        'interaction':'At Mission 13 exercise real OS clipboard, TR/EN IME composition, selections, undo/redo and save/reopen on long and held-out inputs.',
        'laterWorkNotMission01Acceptance':['Implement OCR','Fix engine FAIL rows','Meet long-document latency limits','Certify Word parity on all targets']}
    write(OUT/'validation-protocol.json',protocol)
    data={'schemaVersion':3,'mission':'01','status':'COMPLETE_REFERENCE_PREPARATION','frozenOn':'2026-10-08',
        'scope':'Fixed inputs, native/source Word and PDF references, synthetic boundaries and future-mission mapping. No engine import/export conformance is claimed.',
        'supersedes':['corpus.json','corpus-review-v2.json'],'cases':cases,'syntheticRegressionGroups':synthetics,
        'missionCoverage':MISSION,'validationProtocol':asset(OUT/'validation-protocol.json'),
        'visualReview':asset(OUT/'visual-review.json'),
        'schemas':[asset(OUT/'inputs'/name) for name in ['edge-native-structure-final.schema.json','edge-long-notes-final.schema.json']],
        'environment':{'os':platform.platform(),'python':platform.python_version(),'wordBuild':'16.0.20430','fonts':fonts,
            'packagedRenderer':'render_docx.py attempted; soffice.exe unavailable. Source references use installed Word and page PNGs use PyMuPDF; no LibreOffice equivalence claim.'},
        'partitionRule':'SRC10 and SRC08 reserved before any Mission 02-13 engine changes. Content/reference preparation is allowed; production engine tuning and fixes must use development cases. Final held-out evaluation is Mission 13.',
        'limitations':['Official filled templates/examples have not been authenticated as deposited complete theses; long Word behavior is represented by real source research content.',
            'Master/phd and field coverage includes official format templates; it does not prove filled real research for every combination.',
            'EDGE_SCAN is generated scan-boundary material, not a real scanned thesis. Native mathematical structure is the equation ground truth.',
            'Original sources may contain blank pages, placeholder fields or existing formatting defects; preserve/report them and do not rewrite the source to make the engine pass. SRC11 is an explicit negative control with broken field targets and a 21-word-statistics/23-PDF-page discrepancy; its cached field geometry is not a PASS oracle.',
            'Word Information(3) for note story ranges may return the body anchor page at both ends. For footnote continuation use source PDF marker locations; do not treat note-story endpoint pages as a physical span.',
            'Existing source FAIL/UNKNOWN and J03/J04 checks retain original expected values/tolerances; Mission 01 closes reference preparation only.'],
        'completionChecks':['TR/EN and master/phd/specialist source coverage registered','science/social/health source coverage registered',
            '180-page TR and 91-page EN filled research source references recorded','physical Word feature and native XML locations recorded',
            'native table/math/image/note and scan boundaries prepared','source visual references and complete synthetic-page review recorded',
            'every Mission 02-13 mapped','development and held-out partitions fixed','source and reference SHA256 verification succeeds']}
    write(target,data)

def verify():
    contract=read(OUT/'acceptance-v3.json');failures=[];assets=[]
    for case in contract['cases']:
        assets.append(case['input']);assets.extend(case['references'].values())
        if case.get('provenance'):assets.append(case['provenance'])
    for group in contract['syntheticRegressionGroups']:
        assets.extend(group['fixtures']);assets.append(group['checks'])
    assets.extend([contract['validationProtocol'],contract['visualReview'],*contract['schemas']])
    review=read(ROOT/contract['visualReview']['path'])
    assets.extend(review['images'])
    for item in assets:
        p=ROOT/item['path']
        if not p.is_file() or sha(p)!=item['sha256']:failures.append('hash: '+item['path'])
    ids={row['id'] for row in contract['cases']}|{row['id'] for row in contract['syntheticRegressionGroups']}
    held={row['id'] for row in contract['cases'] if row['partition']=='held-out'}
    for mission,row in contract['missionCoverage'].items():
        for key in ['development','heldOut','controls']:
            if not set(row.get(key,[]))<=ids:failures.append('unknown case: '+mission)
        if held&set(row.get('development',[])):failures.append('held-out used for development: '+mission)
    if set(contract['missionCoverage'])!={f'{n:02d}' for n in range(2,14)}:failures.append('mission coverage incomplete')
    for schema in contract['schemas']:
        row=read(ROOT/schema['path'])
        if row['status']!='PASS' or row['errorCount']!=0:failures.append('synthetic schema: '+schema['path'])
    with open_pdf(str(ROOT/'orchestration/engine-work/mission01/inputs/edge-synthetic-scans-final.pdf')) as scan:
        if len(scan)!=3 or any(p.get_text().strip() or len(p.get_images())!=1 for p in scan):failures.append('scan structure')
    if review['status']!='REVIEWED' or not review['syntheticAllPagesInspected']:failures.append('visual review incomplete')
    result={'status':'PASS' if not failures else 'FAIL','mission01':contract['status'],'cases':len(contract['cases']),
        'heldOut':sorted(held),'syntheticRegressionGroups':len(contract['syntheticRegressionGroups']),
        'assetsChecked':len(assets),'nextMissionsMapped':len(contract['missionCoverage']),'failures':failures}
    write(OUT/'acceptance-verification.json',result)
    print(json.dumps(result,ensure_ascii=False))
    return 1 if failures else 0

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--freeze',action='store_true');args=parser.parse_args()
    if args.freeze:freeze()
    raise SystemExit(verify())
