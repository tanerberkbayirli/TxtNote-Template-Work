"""Read-only source inventory for Mission 01; no engine acceptance is inferred.

Run from the repository root with the checker's Python environment.
DOCX locators are XML element ordinals, NOT rendered Word page numbers.
"""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'orchestration/tools'))
from pdfmeasure import open_pdf, pymupdf

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math'}


def inspect(path):
    pymupdf.TOOLS.mupdf_warnings(reset=True)
    result = {'path': path.relative_to(ROOT).as_posix(),
              'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
              'bytes': path.stat().st_size, 'features': {}}
    def feature(name, locator):
        result['features'].setdefault(name, [])
        if len(result['features'][name]) < 4:
            result['features'][name].append(locator)
    texts = []
    if path.suffix.lower() == '.docx':
        with zipfile.ZipFile(path) as archive:
            for part in archive.namelist():
                if not re.match(r'word/(document|footnotes|endnotes|header\d+|footer\d+)\.xml$', part):
                    continue
                tree = ET.fromstring(archive.read(part))
                for i, p in enumerate(tree.findall('.//w:p', NS), 1):
                    text = ''.join(t.text or '' for t in p.findall('.//w:t', NS))
                    if part == 'word/document.xml':
                        texts.append(text)
                    loc = f'{part}#paragraph[{i}]'
                    for label, query in [('equation', './/m:oMath'), ('image', './/w:drawing'),
                                         ('legacyImage', './/w:pict'), ('footnote', './/w:footnoteReference'),
                                         ('endnote', './/w:endnoteReference'), ('numberedParagraph', './/w:numPr'),
                                         ('tab', './/w:tab'), ('field', './/w:instrText')]:
                        if p.find(query, NS) is not None:
                            feature(label, loc)
                    if re.search(r'İÇİNDEKİLER|CONTENTS|KAYNAKLAR|REFERENCES|ABSTRACT|ÖZET', text):
                        feature('sectionHeadingCandidate', loc + ':' + text[:90])
                for tag, label in [('tbl', 'table'), ('sectPr', 'section'), ('txbxContent', 'textBox'),
                                   ('vMerge', 'verticalMerge'), ('gridSpan', 'horizontalMerge'),
                                   ('tblHeader', 'repeatedTableHeader')]:
                    for i, _ in enumerate(tree.findall('.//w:' + tag, NS), 1):
                        feature(label, f'{part}#{tag}[{i}]')
            result['counts'] = {'paragraphs': len(texts), 'words': len(' '.join(texts).split())}
            result['renderedPageCount'] = None
            result['pageCountEvidence'] = 'UNKNOWN: requires independent Word render; app.xml not trusted'
    else:
        with open_pdf(str(path)) as doc:
            result['renderedPageCount'] = len(doc)
            result['pageCountEvidence'] = 'MEASURED: source PDF physical pages'
            for i, page in enumerate(doc, 1):
                text = page.get_text()
                texts.append(text)
                if page.get_images():
                    feature('image', f'page[{i}]')
                if len(text.strip()) < 30:
                    feature('lowTextPageCandidate', f'page[{i}]')
                for label, pattern in [('sectionHeadingCandidate', r'İÇİNDEKİLER|CONTENTS|KAYNAKLAR|REFERENCES|ABSTRACT|ÖZET'),
                                       ('tableCaptionCandidate', r'Tablo\s+\d|Table\s+\d'),
                                       ('figureCaptionCandidate', r'Şekil\s+\d|Figure\s+\d')]:
                    if re.search(pattern, text):
                        feature(label, f'page[{i}]')
            result['counts'] = {'words': len(' '.join(texts).split())}
    result['pdfDiagnostics'] = pymupdf.TOOLS.mupdf_warnings(reset=True) if path.suffix.lower() == '.pdf' else ''
    result['openingText'] = ' '.join(' '.join(texts).split())[:600]
    name = path.name.lower()
    result['sourceRoleCandidate'] = ('guide' if any(s in name for s in ['kilavuz', 'guide', 'kurallar', 'yonerge'])
        else 'template' if any(s in name for s in ['sablon', 'template', 'format'])
        else 'example-needs-review' if any(s in name for s in ['ornek', 'örnek']) else 'unclassified')
    result['realCompletedThesisVerified'] = False
    return result


def main():
    pymupdf.TOOLS.mupdf_display_errors(False)
    pymupdf.TOOLS.mupdf_display_warnings(False)
    rows = []
    for path in sorted((ROOT / 'Butun-Sablonlar').rglob('*')):
        if path.suffix.lower() not in {'.docx', '.pdf'} or path.name.startswith('~$'):
            continue
        try:
            rows.append(inspect(path))
        except Exception as error:
            rows.append({'path': path.relative_to(ROOT).as_posix(), 'error': str(error)})
    output = ROOT / 'orchestration/engine-work/mission01/source-inventory.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'schemaVersion': 1, 'scope': 'Butun-Sablonlar/**/*.pdf,docx',
        'limitations': ['Filename roles are candidates; content review is required.',
                       'PDF caption matches do not prove editable tables or equations.',
                       'Legacy DOC and archives are listed separately in the acceptance manifest.'],
        'sources': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'sources': len(rows), 'errors': sum('error' in row for row in rows),
        'pdfsWithDiagnostics': sum(bool(row.get('pdfDiagnostics')) for row in rows)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
