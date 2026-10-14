"""Author independent native Word boundary inputs, never through TxtEngine."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile
from lxml import etree
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.section import WD_SECTION_START, WD_ORIENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'orchestration/engine-work/mission01/inputs'
TOOLS = Path('C:/Users/CASPER/.codex/plugins/cache/openai-primary-runtime/documents/26.905.11957/skills/documents/scripts')
sys.path.insert(0, str(TOOLS))
import insert_note


def el(tag, **attributes):
    node = OxmlElement(tag)
    for key, value in attributes.items():
        node.set(qn('w:' + key), str(value))
    return node


def field(paragraph, instruction, cached):
    for kind in ['begin', 'code', 'separate', 'text', 'end']:
        run = OxmlElement('w:r')
        if kind in ['begin', 'separate', 'end']:
            run.append(el('w:fldChar', fldCharType=kind))
        else:
            node = OxmlElement('w:instrText' if kind == 'code' else 'w:t')
            node.set(qn('xml:space'), 'preserve')
            node.text = instruction if kind == 'code' else cached
            run.append(node)
        paragraph._p.append(run)


def page(doc, marker, title):
    doc.add_page_break()
    doc.add_heading(marker + ' ' + title, level=1)


def base(title):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.top_margin = sec.bottom_margin = Inches(.8)
    sec.left_margin = sec.right_margin = Inches(.85)
    normal = doc.styles['Normal']
    normal.font.name, normal.font.size = 'Times New Roman', Pt(11)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.15
    for name in ['Title', 'Heading 1', 'Heading 2']:
        doc.styles[name].font.name = 'Times New Roman'
        doc.styles[name].font.color.rgb = __import__('docx').shared.RGBColor(0, 0, 0)
    for border in doc.styles.element.findall('.//' + qn('w:pBdr')):
        border.getparent().remove(border)
    doc.add_paragraph(title, style='Title')
    doc.settings.odd_and_even_pages_header_footer = True
    sec.different_first_page_header_footer = True
    sec.header.paragraphs[0].text = 'EDGE ODD HEADER'
    sec.even_page_header.paragraphs[0].text = 'EDGE EVEN HEADER'
    sec.first_page_header.paragraphs[0].text = 'EDGE FIRST HEADER'
    for footer in [sec.footer, sec.even_page_footer, sec.first_page_footer]:
        field(footer.paragraphs[0], ' PAGE ', '1')
    return doc


def math(paragraph, inner, display=True):
    node = parse_xml('<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">' + inner + '</m:oMath>')
    if display:
        wrapper = OxmlElement('m:oMathPara')
        wrapper.append(node)
        paragraph._p.append(wrapper)
    else:
        paragraph._p.append(node)


def mr(text):
    return '<m:r><m:t>' + text + '</m:t></m:r>'


def table_style(table):
    table.style = 'Table Grid'
    table.autofit = False
    # The Office 2016 SDK accepts the bitmask form of tblLook.
    for look in table._tbl.findall('.//' + qn('w:tblLook')):
        for attribute in list(look.attrib):
            if attribute != qn('w:val'):
                del look.attrib[attribute]
    for row in table.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.space_before = Pt(4)


def insert_notes(path, notes):
    # Reuse the skill's minimal native note-part wiring; mark separator types explicitly.
    with zipfile.ZipFile(path) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    document = etree.fromstring(parts['word/document.xml'])
    rels = etree.fromstring(parts['word/_rels/document.xml.rels'])
    ctypes = etree.fromstring(parts['[Content_Types].xml'])
    for kind, marker, paragraphs in notes:
        note_part = insert_note._make_empty_notes_part(kind)
        for note in note_part:
            ident = note.get(qn('w:id'))
            note.set(qn('w:type'), 'separator' if ident == '-1' else 'continuationSeparator')
        note = etree.SubElement(note_part, qn('w:' + kind))
        note.set(qn('w:id'), '1')
        for i, text in enumerate(paragraphs):
            p = etree.SubElement(note, qn('w:p'))
            props = etree.SubElement(p, qn('w:pPr'))
            spacing = etree.SubElement(props, qn('w:spacing'))
            spacing.set(qn('w:after'), '40')
            if i == 0:
                r = etree.SubElement(p, qn('w:r'))
                etree.SubElement(r, qn('w:' + kind + 'Ref'))
            r = etree.SubElement(p, qn('w:r'))
            t = etree.SubElement(r, qn('w:t'))
            t.text = text
        found = False
        for t in document.findall('.//' + qn('w:t')):
            if marker in (t.text or ''):
                before, after = t.text.split(marker, 1)
                t.text = before
                run = t.getparent()
                ref_run = etree.Element(qn('w:r'))
                props = etree.SubElement(ref_run, qn('w:rPr'))
                etree.SubElement(props, qn('w:vertAlign')).set(qn('w:val'), 'superscript')
                etree.SubElement(ref_run, qn('w:' + kind + 'Reference')).set(qn('w:id'), '1')
                run.addnext(ref_run)
                if after:
                    following = etree.Element(qn('w:r'))
                    etree.SubElement(following, qn('w:t')).text = after
                    ref_run.addnext(following)
                found = True
                break
        if not found:
            raise ValueError('Missing note marker ' + marker)
        insert_note._ensure_note_relationship(rels, kind)
        insert_note._ensure_override(ctypes, '/word/' + kind + 's.xml',
            insert_note.CT_FOOTNOTES if kind == 'footnote' else insert_note.CT_ENDNOTES)
        parts['word/' + kind + 's.xml'] = etree.tostring(note_part, xml_declaration=True, encoding='UTF-8', standalone=True)
    for name, tree in [('word/document.xml', document), ('word/_rels/document.xml.rels', rels), ('[Content_Types].xml', ctypes)]:
        parts[name] = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)


def build_core(filename='edge-native-structure.docx'):
    doc = base('Native thesis boundary reference')
    doc.add_heading('EDGE COVER Long title and two advisors', level=1)
    doc.add_paragraph('Türkçe ve English içeriklerin uzun başlıklar, karmaşık tablolar, düzenlenebilir denklemler ve kalıcı belge referansları ile aktarılmasının incelenmesi')
    for text in ['Researcher Ada Example', 'Advisor Prof Deniz Example', 'Co advisor Dr Ece Example']:
        doc.add_paragraph(text)
    for n in range(1, 6):
        doc.add_paragraph(f'JURY_{n:02d} Committee member {n}')
    page(doc, 'EDGE STYLE', 'Rich runs and stable targets')
    style = doc.styles.add_style('BoundaryInherited', 1)
    style.base_style = doc.styles['Normal']
    style.font.name, style.font.size = 'Arial', Pt(11)
    p = doc.add_paragraph('STYLE_INHERITED ÇĞİÖŞÜ çğıöşü Işık İzmir ', style='BoundaryInherited')
    p.add_run('BOLD_RUN').bold = True
    p.add_run(' ITALIC_RUN').italic = True
    p.add_run(' DIRECT_14').font.size = Pt(14)
    doc.add_paragraph('NBSP_CASE Alpha\u00a0Beta and a long token https://example.invalid/research/' + 'unbrokenToken' * 8)
    p = doc.add_paragraph('TAB_CASE left\tcenter\tright')
    p.paragraph_format.tab_stops.add_tab_stop(Inches(2))
    p.paragraph_format.tab_stops.add_tab_stop(Inches(4))
    doc.add_paragraph('LIST_ONE Ordered item one', style='List Number')
    doc.add_paragraph('LIST_TWO Ordered item two', style='List Number')
    doc.add_paragraph('BULLET_ONE Bullet item', style='List Bullet')
    p = doc.add_paragraph('BOOKMARK_TARGET Native paragraph identity')
    start = el('w:bookmarkStart', id=42, name='BoundaryTarget')
    p._p.insert(0, start)
    p._p.append(el('w:bookmarkEnd', id=42))
    p = doc.add_paragraph('CROSS_REFERENCE ')
    field(p, ' REF BoundaryTarget ', 'BOOKMARK_TARGET Native paragraph identity')
    p = doc.add_paragraph('PAGE_REFERENCE ')
    field(p, ' PAGEREF BoundaryTarget ', '2')
    doc.add_paragraph('ENDNOTE_BODY [[EN]] Native endnote link.')
    page(doc, 'EDGE TABLE', 'Merges nesting and repeated rows')
    table = doc.add_table(rows=4, cols=3)
    for i, row in enumerate(table.rows):
        for j, cell in enumerate(row.cells):
            cell.text = f'MERGE_{i}_{j}'
    table.cell(0, 0).merge(table.cell(0, 1)).text = 'HORIZONTAL_MERGE'
    table.cell(1, 0).merge(table.cell(2, 0)).text = 'VERTICAL_MERGE'
    nested = table.cell(3, 1).add_table(rows=2, cols=2)
    for i, row in enumerate(nested.rows):
        for j, cell in enumerate(row.cells):
            cell.text = f'NESTED_{i}_{j}'
    table_style(table)
    table_style(nested)
    doc.add_paragraph('REPEATING_TABLE Table crossing a physical page')
    long = doc.add_table(rows=1, cols=3)
    for i, text in enumerate(['REPEAT_HEADER ID', 'Description', 'Value']):
        long.rows[0].cells[i].text = text
    long.rows[0]._tr.get_or_add_trPr().append(el('w:tblHeader'))
    for n in range(1, 48):
        cells = long.add_row().cells
        cells[0].text = f'ROW_{n:03d}'
        cells[1].text = 'A wrapped description with Turkish characters şğıöçü and English words.'
        cells[2].text = str(n * 7)
    table_style(long)
    page(doc, 'EDGE MATH', 'Editable native equations')
    doc.add_paragraph('MATH_INLINE Inline square')
    math(doc.add_paragraph(), '<m:sSup><m:e>' + mr('x') + '</m:e><m:sup>' + mr('2') + '</m:sup></m:sSup>', False)
    doc.add_paragraph('MATH_MATRIX Two by two matrix')
    math(doc.add_paragraph(), '<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/></m:dPr><m:e><m:m><m:mr><m:e>' + mr('1') + '</m:e><m:e>' + mr('2') + '</m:e></m:mr><m:mr><m:e>' + mr('3') + '</m:e><m:e>' + mr('4') + '</m:e></m:mr></m:m></m:e></m:d>')
    doc.add_paragraph('MATH_INTEGRAL Integral from zero to one')
    math(doc.add_paragraph(), '<m:nary><m:naryPr><m:chr m:val="∫"/><m:limLoc m:val="subSup"/></m:naryPr><m:sub>' + mr('0') + '</m:sub><m:sup>' + mr('1') + '</m:sup><m:e><m:sSup><m:e>' + mr('x') + '</m:e><m:sup>' + mr('2') + '</m:sup></m:sSup>' + mr('dx') + '</m:e></m:nary>' + mr('=') + '<m:f><m:num>' + mr('1') + '</m:num><m:den>' + mr('3') + '</m:den></m:f>')
    doc.add_paragraph('MATH_VECTOR Vector accent')
    math(doc.add_paragraph(), '<m:acc><m:accPr><m:chr m:val="⃗"/></m:accPr><m:e>' + mr('v') + '</m:e></m:acc>')
    page(doc, 'EDGE IMAGE', 'Inline and anchored cropped image')
    figure = OUT / 'geometry-reference.png'
    im = Image.new('RGB', (600, 300), 'white')
    draw = ImageDraw.Draw(im)
    draw.rectangle((20, 20, 580, 280), outline='black', width=5)
    draw.line((20, 20, 580, 280), fill='blue', width=5)
    draw.line((20, 280, 580, 20), fill='red', width=5)
    draw.ellipse((240, 90, 360, 210), fill='green')
    im.save(figure)
    doc.add_paragraph('INLINE_IMAGE Original proportions')
    doc.add_picture(str(figure), width=Inches(3))
    doc.add_paragraph('ANCHORED_IMAGE Cropped and square wrapped')
    p = doc.add_paragraph()
    inline = p.add_run().add_picture(str(figure), width=Inches(3))._inline
    anchor = OxmlElement('wp:anchor')
    for key, value in {'distT':'0','distB':'0','distL':'114300','distR':'114300','simplePos':'0','relativeHeight':'1','behindDoc':'0','locked':'0','layoutInCell':'1','allowOverlap':'0'}.items():
        anchor.set(key, value)
    pos = OxmlElement('wp:simplePos'); pos.set('x','0'); pos.set('y','0'); anchor.append(pos)
    for tag, relation in [('positionH','column'), ('positionV','paragraph')]:
        node=OxmlElement('wp:'+tag); node.set('relativeFrom',relation)
        offset=OxmlElement('wp:posOffset'); offset.text='0'; node.append(offset); anchor.append(node)
    for child in list(inline):
        if child.tag == qn('wp:docPr'):
            wrap=OxmlElement('wp:wrapSquare'); wrap.set('wrapText','bothSides'); anchor.append(wrap)
        anchor.append(child)
    inline.getparent().replace(inline,anchor)
    fill=anchor.find('.//' + qn('pic:blipFill'))
    crop=OxmlElement('a:srcRect'); crop.set('l','10000'); crop.set('r','10000'); fill.insert(1,crop)
    p.paragraph_format.space_after = Pt(130)
    doc.add_paragraph('IMAGE_AFTER Text following the anchored figure.')
    section = doc.add_section(WD_SECTION_START.NEW_PAGE)
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width, section.page_height = Inches(11), Inches(8.5)
    section.top_margin = section.bottom_margin = Inches(.8)
    section.left_margin = section.right_margin = Inches(.85)
    numbering=el('w:pgNumType', fmt='decimal', start=1)
    section._sectPr.insert_element_before(numbering, 'w:cols', 'w:formProt', 'w:vAlign', 'w:noEndnote', 'w:titlePg', 'w:textDirection', 'w:docGrid')
    doc.add_heading('EDGE LANDSCAPE Wide table and numbering restart',level=1)
    wide=doc.add_table(rows=5,cols=6)
    for i,row in enumerate(wide.rows):
        for j,cell in enumerate(row.cells):cell.text=f'WIDE_{i}_{j}'
    table_style(wide)
    path=OUT/filename
    doc.save(path)
    insert_notes(path,[('endnote','[[EN]]',['ENDNOTE_TEXT Native endnote retained as a linked note.'])])
    return path


def build_notes(filename='edge-long-notes.docx'):
    doc=base('Long note pagination boundary reference')
    doc.add_heading('EDGE LONGNOTE True page spanning footnote',level=1)
    doc.add_paragraph('NOTE_ANCHOR [[FN]] The note below must span physical pages and preserve its link.')
    for n in range(1,9):
        doc.add_paragraph(f'BODY_{n:03d} The body remains editable while the long note reserves page bottom space. Türkçe karakterler: çğıöşü.')
    p=doc.add_paragraph('KEEP_HEADING The following paragraph stays with its heading',style='Heading 2')
    p.paragraph_format.keep_with_next=True
    doc.add_paragraph('KEEP_BODY Paragraph integrity and widow orphan behavior are source properties. ' * 5).paragraph_format.widow_control=True
    path=OUT/filename
    doc.save(path)
    notes=[f'FOOTNOTE_{n:03d} This is native footnote paragraph {n}. The numbered marker and all text must survive import, editing and export. Türkçe: Işık, İzmir, çğıöşü.' for n in range(1,41)]
    insert_notes(path,[('footnote','[[FN]]',notes)])
    return path


if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    repair = '--repair-structure' in sys.argv
    final = '--finalize' in sys.argv
    manifest = OUT / ('native-inputs-final.json' if final else 'native-inputs-v2.json' if repair else 'native-inputs.json')
    if manifest.exists():raise SystemExit('Native inputs already frozen; preserve and version them.')
    paths=([build_core('edge-native-structure-final.docx'), build_notes('edge-long-notes-final.docx')] if final else
        [build_core('edge-native-structure-v2.docx'), OUT/'edge-long-notes.docx'] if repair else [build_core(),build_notes()])
    ids=['EDGE_STRUCTURE','EDGE_NOTES'] if final else ['EDGE01R','EDGE02'] if repair else ['EDGE01','EDGE02']
    data={'schemaVersion':1,'authoring':'Independent Python DOCX and native OOXML; no TxtEngine output is a source.',
        'sources':[{'id':ident,'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
                    'role':'synthetic-boundary','partition':'development'} for ident,p in zip(ids,paths)]}
    if repair:data['revisionReason']='Correct tblLook SDK compatibility and sectPr pgNumType ordering; rejected EDGE01 is preserved.'
    if final:data['revisionReason']='Final input selection; remove inherited decorative title borders. Earlier diagnostic versions preserved.'
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'inputs':len(paths),'ids':ids}))
