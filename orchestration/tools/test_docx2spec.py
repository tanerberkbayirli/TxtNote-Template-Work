"""Source extraction regression tests; no Word or PDF runtime required."""
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from docx2spec import extract

NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)

    def package(self, body, extra=None):
        path = Path(self.temp.name) / 'official.docx'
        with zipfile.ZipFile(path, 'w') as package:
            package.writestr('word/document.xml', f'<w:document {NS}><w:body>{body}</w:body></w:document>')
            for name, text in (extra or {}).items():
                package.writestr(name, text)
        return path

    def test_source_units_zero_flags_and_historical_sections(self):
        path = self.package('''<w:p><w:pPr><w:sectPr><w:pgMar w:left="1440"/>
          <w:sectPrChange><w:sectPr><w:pgMar w:left="9999"/></w:sectPr></w:sectPrChange>
          </w:sectPr></w:pPr></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="-144" w:header="720"/><w:pgNumType w:start="0" w:fmt="lowerRoman"/>
          <w:titlePg w:val="0"/></w:sectPr>''')
        result = extract(path, 'test')
        self.assertEqual(len(result['sections']), 2)
        first, last = result['sections']
        self.assertEqual(first['measurements']['pgMar']['left']['value'], 25.4)
        self.assertEqual(last['measurements']['pgMar']['top']['value'], -2.54)
        self.assertNotIn('left', last['measurements']['pgMar'])
        self.assertTrue(last['measurements']['pgSz']['w']['locator'].endswith('/w:pgSz[1]/@w:w'))
        props = {p['tag']: p for p in last['properties']['children']}
        self.assertEqual(props['w:titlePg']['attributes']['w:val'], '0')
        self.assertEqual(props['w:pgNumType']['attributes']['w:start'], '0')

    def test_style_defaults_inheritance_theme_and_conditional_properties_preserved(self):
        path = self.package('<w:sectPr/>', {'word/styles.xml': f'''<w:styles {NS}>
          <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/></w:rPr></w:rPrDefault></w:docDefaults>
          <w:style w:type="paragraph" w:styleId="HeadingCustom"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
          <w:rPr><w:sz w:val="25"/><w:b w:val="0"/></w:rPr><w:pPr><w:spacing w:line="360" w:lineRule="auto"/>
          <w:numPr><w:numId w:val="3"/></w:numPr></w:pPr></w:style>
          <w:style w:type="table" w:styleId="Table"><w:tblStylePr w:type="firstRow"><w:tcPr><w:tcMar><w:left w:w="120" w:type="dxa"/></w:tcMar></w:tcPr></w:tblStylePr></w:style>
          </w:styles>'''})
        result = extract(path, 'test')
        self.assertEqual(result['styles'][0]['fontSizes'][0]['value'], 12.5)
        serialized = json.dumps(result)
        for expected in ['minorHAnsi', 'Normal', 'firstRow', 'w:tcMar', 'w:numPr']:
            self.assertIn(expected, serialized)
        self.assertEqual(extract(path, 'test'), result)

    def test_page_field_split_runs_nested_and_simple_alignment(self):
        path = self.package('''<w:p><w:pPr><w:jc w:val="right"/></w:pPr>
          <w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText>PA</w:instrText></w:r>
          <w:r><w:instrText>GE \\* MERGEFORMAT</w:instrText></w:r>
          <w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>2</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>
          <w:fldSimple w:instr=" NUMPAGES "/><w:fldSimple w:instr=" PAGE "/></w:p>''')
        result = extract(path, 'test')
        self.assertEqual(len(result['pageFields']), 2)
        self.assertIn('right', json.dumps(result['pageFields'][0]['paragraphProperties']))
        self.assertEqual(result['pageFields'][1]['instruction'], 'PAGE')

    def test_relationship_targets_and_table_geometry(self):
        path = self.package('''<w:tbl><w:tblPr><w:tblCellMar><w:top w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr>
          <w:tr><w:trPr><w:trHeight w:val="280" w:hRule="exact"/></w:trPr><w:tc><w:tcPr><w:tcBorders><w:bottom w:val="single"/></w:tcBorders></w:tcPr><w:p/></w:tc></w:tr></w:tbl>''', {
            'word/_rels/document.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="/word/footer7.xml"/></Relationships>',
            'word/footer7.xml': f'<w:ftr {NS}><w:p><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>'})
        result = extract(path, 'test')
        self.assertEqual(result['headerFooterRelationships'][0]['part'], 'word/footer7.xml')
        self.assertTrue(result['pageFields'][0]['locator'].startswith('word/footer7.xml#'))
        self.assertIn('exact', json.dumps(result['tables']))
        self.assertIn('w:tcBorders', json.dumps(result['tables']))

    def test_nested_fields_do_not_merge_instructions(self):
        path = self.package('''<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r>
          <w:r><w:instrText> IF </w:instrText></w:r>
          <w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r>
          <w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r>
          <w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:instrText> = 1 </w:instrText></w:r>
          <w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>''')
        result = extract(path, 'test')
        self.assertEqual([f['instruction'] for f in result['pageFields']], ['PAGE'])

    def test_invalid_relationship_and_legacy_doc_fail(self):
        path = self.package('<w:sectPr/>', {'word/_rels/document.xml.rels': '<Relationships><Relationship Id="r" Type="x/footer" Target="missing.xml"/></Relationships>'})
        with self.assertRaisesRegex(ValueError, 'Missing header/footer'):
            extract(path, 'test')
        with self.assertRaisesRegex(ValueError, 'convert legacy DOC'):
            extract(path.with_suffix('.doc'), 'test')


if __name__ == '__main__':
    unittest.main()
