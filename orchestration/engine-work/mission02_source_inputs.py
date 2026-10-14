"""Test-only native admission fixtures, not the production DOCX importer.

Every OOXML element/attribute and every original ZIP member is retained so the
Mission 02 storage/edit gate cannot pass by testing only flattened Mammoth HTML.
Production interpretation of Word properties belongs to Mission 03.
"""
from pathlib import Path
import base64
import hashlib
import html
import json
import zipfile
from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'orchestration/engine-work/mission02/inputs'
contract = json.loads((ROOT/'orchestration/engine-work/mission01/acceptance-v3.json').read_text(encoding='utf-8'))
selected = contract['missionCoverage']['02']['development']
held = {c['id'] for c in contract['cases'] if c['partition'] == 'held-out'}
assert not held.intersection(selected)
OUT.mkdir(parents=True, exist_ok=True)
manifest = []
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
M = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
types = {'p':'paragraph','r':'run','tbl':'table','tr':'row','tc':'cell','sectPr':'sectionBreak',
    'drawing':'image','footnoteReference':'footnoteReference','endnoteReference':'endnoteReference',
    'bookmarkStart':'bookmark','bookmarkEnd':'bookmarkEnd','fldChar':'field','instrText':'fieldInstruction'}
for case in contract['cases']:
    if case['id'] not in selected: continue
    path = ROOT/case['input']['path']
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == case['input']['sha256']
    counter = [0]
    def convert(element):
        name = etree.QName(element).localname
        namespace = etree.QName(element).namespace
        counter[0] += 1
        node_id = case['id']+'-'+str(counter[0])
        kind = 'equation' if namespace == M and name == 'oMath' else types.get(name, 'nativeObject')
        children = []
        if element.text: children.append({'type':'text','text':html.escape(element.text,quote=False)})
        for child in element:
            if not isinstance(child.tag,str):continue
            children.append(convert(child))
            if child.tail:children.append({'type':'text','text':html.escape(child.tail,quote=False)})
        return {'id':node_id,'type':kind,'tag':'span',
            'attributes':{'data-native-object':kind},'children':children,
            'properties':{'nativeName':element.tag,'nativeAttributes':dict(element.attrib)}}
    with zipfile.ZipFile(path) as archive:
        parts = {name:{'base64':base64.b64encode(archive.read(name)).decode('ascii'),
            'sha256':hashlib.sha256(archive.read(name)).hexdigest()} for name in archive.namelist() if not name.endswith('/')}
        tree = etree.fromstring(archive.read('word/document.xml'))
        body = tree.find('{'+W+'}body')
        nodes = [convert(child) for child in body if isinstance(child.tag,str)]
        notes = {}
        for part,kind in [('word/footnotes.xml','footnote'),('word/endnotes.xml','endnote')]:
            if part in archive.namelist():
                for note in etree.fromstring(archive.read(part)):
                    if not isinstance(note.tag,str):continue
                    notes[kind+':'+note.get('{'+W+'}id','')] = {'kind':kind,'nodes':[convert(note)]}
        styles = {}
        if 'word/styles.xml' in archive.namelist():
            for style in etree.fromstring(archive.read('word/styles.xml')).findall('{'+W+'}style'):
                key = style.get('{'+W+'}styleId')
                based = style.find('{'+W+'}basedOn')
                styles[key] = {'properties':{},'ooxml':etree.tostring(style,encoding='unicode')}
                if based is not None:styles[key]['basedOn'] = based.get('{'+W+'}val')
        resources = {name:value for name,value in parts.items() if name.startswith('word/media/') or name.endswith('.rels')}
        document = {'version':1,'nextId':counter[0]+1,'mainSectionId':'main','formatMode':'source',
            'sections':[{'id':'main','type':'mainContent','nodes':nodes,'properties':{'originPart':'word/document.xml'}}],
            'styles':styles,'notes':notes,'resources':resources,'references':{},
            'numbering':{'ooxml':archive.read('word/numbering.xml').decode('utf-8')} if 'word/numbering.xml' in archive.namelist() else {},
            'source':{'format':'docx','sha256':digest,'parts':parts,'testOnlyAdmissionAdapter':True}}
    output = OUT/(case['id']+'.json')
    output.write_text(json.dumps(document,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    manifest.append({'id':case['id'],'input':case['input'],'modelFixture':output.relative_to(ROOT).as_posix(),
        'nativeElements':counter[0],'originalPackageParts':len(parts)})
(OUT.parent/'source-inputs.json').write_text(json.dumps({'scope':'Test-only lossless native admission, not production DOCX import or rendering acceptance','cases':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cases':len(manifest),'nativeElements':sum(c['nativeElements'] for c in manifest)}))
