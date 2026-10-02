import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET
from pypdf import PdfReader

base = Path('orchestration/validation/aku-optional-audit')
prefixes = ['aku-sosyoloji-readiness-1', 'aku-sosyoloji-readiness-rerun']
layouts = [json.loads((base / f'{name}.layout.json').read_text(encoding='utf-8')) for name in prefixes]
assert all(item['pagination']['ready'] == 'true' and item['pagination']['targetCount'] == 33 and not item['pagination']['missingTargets'] and not item['pagination']['mismatchedLabels'] for item in layouts)
expected = [row['label'] for row in layouts[0]['pagination']['targets']]
assert layouts[0]['pagination']['targets'] == layouts[1]['pagination']['targets']
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
field_values = []
section_summaries = []
for name in prefixes:
    with zipfile.ZipFile(base / f'{name}.docx') as docx:
        root = ET.fromstring(docx.read('word/document.xml'))
    values = []
    for field in root.iter(f'{W}fldSimple'):
        instruction = field.attrib.get(f'{W}instr', '')
        if instruction.strip().startswith('PAGEREF '):
            values.append(''.join(node.text or '' for node in field.iter(f'{W}t')).strip())
    field_values.append(values)
    sections = []
    for section in root.iter(f'{W}sectPr'):
        page_size = section.find(f'{W}pgSz')
        margins = section.find(f'{W}pgMar')
        sections.append((page_size.attrib if page_size is not None else {}, margins.attrib if margins is not None else {}))
    section_summaries.append(sections)
    assert len(values) == 33, f'{name}: expected 33 PAGEREF fields, found {len(values)}'
    assert all(values), f'{name}: cached PAGEREF fields contain blanks: {[i for i,v in enumerate(values) if not v]}'
    assert Counter(values) == Counter(expected), f'{name}: cached PAGEREF values disagree with measured DOM target labels'
assert field_values[0] == field_values[1], 'DOCX field sequence differs between identical exports'
assert section_summaries[0] == section_summaries[1], 'DOCX section page/margin structures differ'

pdf_summaries=[]
for name in prefixes:
    reader = PdfReader(str(base / f'{name}.pdf'))
    pages=[]
    for page in reader.pages:
        media = page.mediabox
        items=[]
        def visitor(text, cm, tm, font, size):
            if text.strip():
                items.append((text, round(float(tm[4]), 4), round(float(tm[5]), 4), round(float(size or 0), 3)))
        page.extract_text(visitor_text=visitor)
        pages.append({'box': tuple(round(float(value), 4) for value in (media.left,media.bottom,media.right,media.top)), 'items':items, 'text':page.extract_text() or ''})
    pdf_summaries.append(pages)
assert len(pdf_summaries[0]) == len(pdf_summaries[1]) == 35
assert len(pdf_summaries[0]) == len(layouts[0]['sheets']) == len(layouts[1]['sheets'])
assert all(a['box'] == b['box'] for a,b in zip(*pdf_summaries)), 'PDF page dimensions differ'
assert all(a['items'] == b['items'] for a,b in zip(*pdf_summaries)), 'PDF text content/position/font-size records differ'
print(json.dumps({
 'pages': len(pdf_summaries[0]),
 'targets': len(expected),
 'cachedPagerefFields': [len(values) for values in field_values],
 'cachedPagerefBlank': [sum(not value for value in values) for values in field_values],
 'cachedPagerefLabelsMatchMeasuredTargets': True,
 'docxSections': [len(value) for value in section_summaries],
 'pdfPageDimensionsEqual': True,
 'pdfTextPositionFontRecordsEqual': True,
 'pdfTextRecords': sum(len(page['items']) for page in pdf_summaries[0]),
 'pdfExtractedTextEqual': all(a['text'] == b['text'] for a,b in zip(*pdf_summaries)),
}, ensure_ascii=False, indent=2))
