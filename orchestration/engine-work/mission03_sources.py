"""Independent lxml/ZIP oracle for the frozen Mission 03 development documents."""
from pathlib import Path
from lxml import etree
import collections, hashlib, json, zipfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'orchestration/engine-work/mission03'; OUT.mkdir(exist_ok=True)
contract = json.loads((ROOT/'orchestration/engine-work/mission01/acceptance-v3.json').read_text(encoding='utf-8'))
cases = {c['id']: c for c in contract['cases']}
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
M = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
N = {'w': W, 'm': M}
K = ['p', 'r', 't', 'tbl', 'tr', 'tc', 'tab', 'br', 'drawing', 'pict', 'footnoteReference', 'endnoteReference', 'bookmarkStart', 'bookmarkEnd']

def story(root):
    return {'counts': {k: len(root.findall('.//w:r/w:tab' if k == 'tab' else './/w:'+k, N)) for k in K},
            'text': [n.text or '' for n in root.findall('.//w:t', N)],
            'paragraphStyles': [n.get('{'+W+'}val') for n in root.findall('.//w:pPr/w:pStyle', N)],
            'paragraphDirect': [direct(n, False) for n in root.findall('.//w:p', N)],
            'runDirect': [direct(n, True) for n in root.findall('.//w:r', N)],
            'equations': len(root.xpath('.//m:oMath[not(ancestor::m:oMathPara)] | .//m:oMathPara', namespaces=N))}

def direct(node, run):
    pr = node.find('w:rPr' if run else 'w:pPr', N); result = {}
    if pr is None: return result
    def v(name):
        n=pr.find('w:'+name, N); return n.get('{'+W+'}val', '') if n is not None else None
    if run:
        if v('sz') is not None: result['fontSizePt']=float(v('sz'))/2
        for tag,key in [('b','bold'),('i','italic')]:
            if v(tag) is not None: result[key]=v(tag).lower() not in ['0','false','off']
    else:
        if v('jc') is not None: result['align']={'both':'justify','start':'left','end':'right'}.get(v('jc'),v('jc'))
    return result

rows = []
for key in contract['missionCoverage']['03']['development']:
    c = cases[key]; assert c['partition'] != 'held-out'
    path = ROOT/c['input']['path']; data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == c['input']['sha256']
    with zipfile.ZipFile(path) as z:
        doc = etree.fromstring(z.read('word/document.xml'))
        properties = doc.xpath('./w:body/w:p/w:pPr/w:sectPr | ./w:body/w:sectPr', namespaces=N)
        source_sections = []
        for s in properties:
            size = s.find('w:pgSz', N); margin = s.find('w:pgMar', N)
            source_sections.append({'size': {etree.QName(k).localname:v for k,v in size.attrib.items()} if size is not None else {},
                                    'margins': {etree.QName(k).localname:v for k,v in margin.attrib.items()} if margin is not None else {}})
        stories = {p: story(etree.fromstring(z.read(p))) for p in z.namelist()
                   if p in ['word/document.xml', 'word/footnotes.xml', 'word/endnotes.xml'] or p.startswith(('word/header','word/footer')) and p.endswith('.xml')}
        styles = etree.fromstring(z.read('word/styles.xml')) if 'word/styles.xml' in z.namelist() else None
        style_nodes = styles.findall('w:style', N) if styles is not None else []
        style_ids = [n.get('{'+W+'}styleId') for n in style_nodes]
        inheritance = {n.get('{'+W+'}styleId'): (n.find('w:basedOn',N).get('{'+W+'}val') if n.find('w:basedOn',N) is not None else '') for n in style_nodes}
        rows.append({'id': key, 'input': c['input'], 'stories': stories, 'sections': source_sections, 'styleIds': style_ids,
                     'styleInheritance': inheritance, 'parts': {p: hashlib.sha256(z.read(p)).hexdigest() for p in z.namelist()}})
(OUT/'source-oracle.json').write_text(json.dumps({'oracle':'Python lxml/zipfile; independent of production JavaScript adapter','cases':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cases':len(rows),'status':'ORACLE_READY'}))
