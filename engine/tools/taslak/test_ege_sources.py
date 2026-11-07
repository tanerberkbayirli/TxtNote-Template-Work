import importlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

measure=importlib.import_module('extract-docx-spec')
rules=importlib.import_module('extract-guide-rules')


class RegionalSourceRegression(unittest.TestCase):
    def test_nonstandard_main_part_and_absolute_relationship(self):
        # The real Bakircay LEE33 source uses /word/document2.xml, which the old
        # reader incorrectly called a broken document.
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'source.docx'
            with zipfile.ZipFile(path,'w') as package:
                package.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="main" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document2.xml"/></Relationships>')
                package.writestr('word/document2.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>')
                package.writestr('word/_rels/document2.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="style" Type="styles" Target="/word/styles.xml"/></Relationships>')
            reader=measure.Package(path)
            self.assertIsNotNone(reader.xml('word/document.xml'))
            self.assertEqual(reader.rels('word/document.xml')['style'],'word/styles.xml')
            reader.zip.close()

    def test_repeated_candidate_does_not_erase_contradiction(self):
        result=rules.Rules()
        for value,sentence in [(10,'Ana metin 10 punto olmalıdır.'),(12,'Ana metin 12 punto olmalıdır.'),(12,'Tüm metin 12 punto yazılmalıdır.'),(12,'12 punto kullanılmalıdır.')]:
            result.add('body.fontSizePt',value,'pt',sentence,'sayfa 1','body')
        rule=result.rules['body.fontSizePt']
        self.assertEqual(rule['status'],'CONFLICT')
        self.assertEqual(set(rule['values']),{10,12})
        self.assertNotIn('majority',rule)


if __name__=='__main__':
    unittest.main()
