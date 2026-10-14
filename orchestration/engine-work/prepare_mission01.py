"""Freeze an explicit Mission 01 corpus once, or verify its hashes (default).

Selection/inspection is not a successful import or visual conformance result.
Use --freeze only for the first creation. Changes require a reviewed new version.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'orchestration/engine-work/mission01'
sys.path.insert(0, str(ROOT / 'orchestration/tools'))
from pdfmeasure import open_pdf

W = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

SELECTION = [
    ('SRC01', 'AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx', 'tr', 'master/phd', 'science', 'development', 'template'),
    ('SRC02', 'AKU_Sosyal_Bilimler_Ornek_Tez_Metni_2026.pdf', 'tr', 'master', 'social', 'development', 'filled-official-example'),
    ('SRC03', 'ADU_Saglik_Bilimleri_Tez_Sablonu_2026.docx', 'tr', 'master', 'health', 'development', 'template-with-example-content'),
    ('SRC04', 'AFSU_Lisansustu_Yuksek_Lisans_Tez_Sablonu_2026.docx', 'tr', 'master', 'health', 'development', 'template'),
    ('SRC05', 'AFSU_Lisansustu_Doktora_Tez_Sablonu_2026.docx', 'tr', 'phd', 'health', 'development', 'template'),
    ('SRC06', 'MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf', 'tr', 'specialist', 'health', 'development', 'guide-only'),
    ('SRC07', 'DEU_Fen_Bilimleri_Yuksek_Lisans_Thesis_Template_EN_2025-09-04.docx', 'en', 'master', 'science', 'reserved-template', 'template'),
    ('SRC08', 'DEU_Fen_Bilimleri_Doktora_Thesis_Template_EN_2025-09-04.docx', 'en', 'phd', 'science', 'reserved-template', 'template'),
    ('SRC09', 'Yasar_Lisansustu_Tez_Sablonu_TR_2024-11-19.docx', 'tr', 'master/phd', 'mixed', 'development', 'template'),
    ('SRC10', 'Yasar_Lisansustu_Tez_Sablonu_EN_2024-11-19.docx', 'en', 'master/phd', 'mixed', 'development', 'template'),
    ('SRC11', 'Yasar_Hukuk_Programlari_Tez_Sablonu_TR_2025-07.docx', 'tr', 'master/phd', 'social-law', 'development', 'template'),
]

SYNTHETIC = [
    ('SYN01', 'engine-word-parity', ['engine-word-parity.fixture.json'], 'Line spacing and paragraph spacing; explicit Word-semantic inputs'),
    ('SYN02', 'engine-word-justify', ['engine-word-justify.fixture.json'], 'J01-J08; retain J03/J04 failures and original tolerances'),
    ('SYN03', 'engine-word-pagefit', ['engine-word-pagefit.fixture.json', 'engine-word-pagefit.fixture.styles.json', 'engine-word-pagefit.fixture.notes.json', 'engine-word-pagefit.fixture.tab.json'], 'Long flow, style boundaries, notes, tab positioning'),
    ('SYN04', 'engine-word-structure', ['engine-word-structure.fixture.json', 'engine-word-structure.fixture.fields.json', 'engine-word-structure.fixture.footer.json'], 'Table row/repeating header, keep/widow, sections/landscape, fields/footer'),
    ('SYN05', 'engine-word-style-precedence', ['engine-word-style-precedence.fixture.base.json', 'engine-word-style-precedence.fixture.direct.json', 'engine-word-style-precedence.fixture.named.json', 'engine-word-style-precedence.fixture.section.json'], 'Direct/named/section style precedence'),
]

GAPS = [
    {'id': 'G01', 'status': 'MISSING', 'missions': ['01', '03', '05', '07', '13'],
     'need': 'Complete real long-thesis DOCX plus independently rendered Word PDF, TR/EN master/phd across science/social/health. Filled example and long templates do not satisfy this.',
     'acceptance': 'At least one complete real thesis >=100 physical pages; all six language/degree/field labels covered by the combined real corpus; source provenance and page/feature references verified.'},
    {'id': 'G02', 'status': 'MISSING', 'missions': ['01', '13'],
     'need': 'Separate real full theses reserved before engine implementation; reserved DEU templates are template controls only.',
     'acceptance': 'At least two new full theses, one TR and one EN, hash-frozen and excluded from implementation tuning.'},
    {'id': 'G03', 'status': 'MISSING', 'missions': ['04'],
     'need': 'Real scanned thesis pages and text/image/table/formula ground truth; OCR engine availability is unverified.',
     'acceptance': 'Human-reviewed reading order and transcription, low-quality and rotated scan cases, preserved source images.'},
    {'id': 'G04', 'status': 'REFERENCE_PENDING', 'missions': ['09', '10', '11'],
     'need': 'Standalone independently authored boundary DOCX with nested/merged tables, anchored/cropped images, OMML matrix/integral/vector, endnotes and multi-page footnotes.',
     'acceptance': 'Native feature counts and Word-render page/geometry references recorded. Template feature presence and engine-produced fixtures alone are insufficient.'},
    {'id': 'G05', 'status': 'UNMEASURED', 'missions': ['02', '07', '13'],
     'need': 'Long-document performance and real editing baseline, OS clipboard and IME.',
     'acceptance': 'Freeze machine/font/Word/browser versions and numeric latency/memory budgets before optimization; record baseline on G01. Small-fixture input timings are not long-thesis performance.'},
]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def asset(rel):
    p = ROOT / rel
    return {'path': p.relative_to(ROOT).as_posix(), 'sha256': digest(p)}


def references(path):
    if path.suffix.lower() == '.pdf':
        with open_pdf(str(path)) as pdf:
            return {'kind': 'source-pdf', 'pages': [
                {'physicalPage': i + 1, 'widthPt': page.rect.width, 'heightPt': page.rect.height,
                 'textSha256': hashlib.sha256(page.get_text().encode()).hexdigest(),
                 'openingText': ' '.join(page.get_text().split())[:180],
                 'imageCount': len(page.get_images())} for i, page in enumerate(pdf)]}
    with zipfile.ZipFile(path) as archive:
        doc = ET.fromstring(archive.read('word/document.xml'))
        paragraphs = []
        for i, p in enumerate(doc.findall('.//w:p', W), 1):
            text = ''.join(t.text or '' for t in p.findall('.//w:t', W))
            paragraphs.append({'locator': f'word/document.xml#paragraph[{i}]',
                               'textSha256': hashlib.sha256(text.encode()).hexdigest(), 'characters': len(text)})
        sections = [{'locator': f'word/document.xml#sectPr[{i}]',
                     'xml': ET.tostring(section, encoding='unicode')} for i, section in enumerate(doc.findall('.//w:sectPr', W), 1)]
        return {'kind': 'source-docx-xml', 'paragraphs': paragraphs, 'sections': sections,
                'wordRenderedPageReferences': 'PENDING: XML ordinals are not physical page numbers'}


def freeze():
    if (OUT / 'corpus.json').exists():
        raise SystemExit('Refusing to replace a frozen corpus; create a reviewed version instead.')
    inventory = json.loads((OUT / 'source-inventory.json').read_text(encoding='utf-8'))['sources']
    cases, refs = [], {}
    for cid, name, language, degree, field, partition, role in SELECTION:
        matches = [row for row in inventory if Path(row['path']).name == name]
        if len(matches) != 1 or 'error' in matches[0]:
            raise SystemExit(f'Missing/ambiguous/unreadable source: {name}')
        row = matches[0]
        path = ROOT / row['path']
        provenance = path.parent / 'KAYNAK.md'
        cases.append({'id': cid, **asset(row['path']), 'language': language, 'degree': degree,
            'field': field, 'partition': partition, 'role': role,
            'fullRealThesisAccepted': False,
            'roleEvidence': 'Local source name/content and archived KAYNAK.md; no fresh online verification',
            'provenance': asset(provenance.relative_to(ROOT)) if provenance.exists() else None,
            'features': row['features'], 'counts': row['counts'],
            'physicalPages': row['renderedPageCount'], 'pdfDiagnostics': row.get('pdfDiagnostics', '')})
        refs[cid] = references(path)
    synthetic = []
    for cid, target, files, purpose in SYNTHETIC:
        synthetic.append({'id': cid, 'target': target, 'role': 'synthetic-engine-regression', 'purpose': purpose,
            'fixtures': [asset('orchestration/specs/' + name) for name in files],
            'checks': asset(f'orchestration/specs/{target}.checks.json'),
            'referenceRule': 'Compare real editor export against independent Word render; do not infer PASS from fixture presence.'})
    coverage = {
        '02': {'cases': ['SRC01', 'SRC04', 'SRC09', 'SYN04'], 'probe': 'Import/edit/save/reopen native structures; stable IDs and source formatting.', 'gaps': ['G01', 'G04']},
        '03': {'cases': ['SRC01', 'SRC03', 'SRC04', 'SRC05', 'SRC07', 'SRC08', 'SRC09', 'SRC11'], 'probe': 'Native DOCX text/structure counts and inherited/direct properties; report unsupported elements.', 'gaps': ['G01']},
        '04': {'cases': ['SRC02'], 'probe': 'All 43 source PDF pages: reading order, page text hashes, headings, tables and watermark handling.', 'gaps': ['G03']},
        '05': {'cases': ['SYN01', 'SYN02', 'SYN05', 'SRC09', 'SRC10'], 'probe': 'Exact line text and font identity; retain original J03/J04 failures.', 'gaps': ['G01']},
        '06': {'cases': ['SRC01', 'SRC04', 'SRC05', 'SYN04'], 'probe': 'Section XML settings, landscape, visible/hidden numbering and header/footer behavior.', 'gaps': []},
        '07': {'cases': ['SRC02', 'SYN03', 'SYN04'], 'probe': 'Cumulative page drift, keep/widow, note reserve, content insertion/deletion.', 'gaps': ['G01', 'G05']},
        '08': {'cases': ['SRC03', 'SRC04', 'SRC05'], 'probe': 'Fill long title/two advisors/jury variants and verify editable non-overlapping covers.', 'gaps': ['G04']},
        '09': {'cases': ['SRC07', 'SRC08', 'SRC09', 'SYN04'], 'probe': 'Merged cells, repeated headers, nested tables, split rows and landscape large table.', 'gaps': ['G04']},
        '10': {'cases': ['SRC09', 'SRC10'], 'probe': 'Native OMML structure/count plus image anchors/crops; no equation rasterization acceptance.', 'gaps': ['G04']},
        '11': {'cases': ['SRC11', 'SYN03'], 'probe': 'Notes, numbering and links after editing, multi-page note and endnote behavior.', 'gaps': ['G04']},
        '12': {'cases': ['SRC01', 'SRC04', 'SYN04'], 'probe': 'Real field refresh after section/table/appendix changes; preserve citation identities.', 'gaps': ['G04']},
        '13': {'cases': ['SRC07', 'SRC08'], 'probe': 'Reserved templates are supplemental controls; final acceptance requires new real held-out theses.', 'gaps': ['G01', 'G02', 'G05']},
    }
    legacy = [str(p.relative_to(ROOT).as_posix()) for p in sorted((ROOT / 'Butun-Sablonlar').rglob('*'))
              if p.suffix.lower() in {'.doc', '.rar', '.zip'}]
    contract = {'schemaVersion': 1, 'frozenOn': '2026-10-08', 'status': 'PARTIAL_SOURCE_GAPS',
        'scope': 'Mission 01 input/reference preparation only; no engine behavior changed or certified.',
        'sourceInventory': asset('orchestration/engine-work/mission01/source-inventory.json'),
        'rules': ['Hash changes fail verification; never silently rebaseline.',
                  'Development and reserved-template partitions fixed before implementation.',
                  'Reserved-template does not mean a held-out real thesis.',
                  'Official filled example is not proof of a complete deposited thesis.',
                  'DOCX XML locators use descendant paragraph ordinals, not XPath child indices or page numbers.',
                  'Native feature presence and source geometry do not prove successful import/export.',
                  'Retain existing tolerances and all FAIL/UNKNOWN; no current application result is a golden reference.'],
        'sources': cases, 'synthetic': synthetic, 'missionCoverage': coverage, 'gaps': GAPS,
        'notInspectedAsDOCX': legacy,
        'completionGate': 'All G01-G05 resolved with recorded reference evidence; actual long/held-out theses and numeric performance budgets frozen. Until then Mission 01 remains partial.'}
    (OUT / 'reference-index.json').write_text(json.dumps(refs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    contract['referenceIndex'] = asset('orchestration/engine-work/mission01/reference-index.json')
    (OUT / 'corpus.json').write_text(json.dumps(contract, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def verify():
    if (OUT / 'acceptance-v3.json').exists():
        from close_mission01 import verify as verify_completed_contract
        return verify_completed_contract()
    corpus = json.loads((OUT / 'corpus.json').read_text(encoding='utf-8'))
    assets = [corpus['sourceInventory'], corpus['referenceIndex']]
    ids = set()
    for row in corpus['sources']:
        ids.add(row['id'])
        assets.append(row)
        if row['provenance']:
            assets.append(row['provenance'])
    for row in corpus['synthetic']:
        ids.add(row['id'])
        assets.extend(row['fixtures'])
        assets.append(row['checks'])
    review_path = OUT / 'corpus-review-v2.json'
    review = json.loads(review_path.read_text(encoding='utf-8')) if review_path.exists() else None
    if review:
        assets.extend(review[key] for key in ['baseCorpus', 'contentReview', 'archiveReview'])
        for row in review['wordReferences']:
            assets.extend(row[key] for key in ['pdf', 'record', 'pageIndex'])
        archives = json.loads((ROOT / review['archiveReview']['path']).read_text(encoding='utf-8'))
        assets.extend(archives['archives'])
        content = json.loads((ROOT / review['contentReview']['path']).read_text(encoding='utf-8'))
        assets.extend(content['documents'])
    failures = []
    for item in assets:
        path = ROOT / item['path']
        if not path.is_file() or digest(path) != item['sha256']:
            failures.append(item['path'])
    for mission, row in corpus['missionCoverage'].items():
        if not set(row['cases']) <= ids:
            failures.append('invalid case IDs for mission ' + mission)
    print(json.dumps({'integrity': 'FAIL' if failures else 'PASS', 'assetsChecked': len(assets),
        'sourceCases': len(corpus['sources']), 'syntheticGroups': len(corpus['synthetic']),
        'mission01Status': review['status'] if review else corpus['status'],
        'gapReview': 'See corpus-review-v2.json; original gaps superseded' if review else len(corpus['gaps']),
        'failures': failures}, ensure_ascii=False))
    return 1 if failures else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--freeze', action='store_true')
    args = parser.parse_args()
    if args.freeze:
        freeze()
    raise SystemExit(verify())
