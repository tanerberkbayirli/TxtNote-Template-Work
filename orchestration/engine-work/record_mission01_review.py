"""Record a versioned correction without overwriting the original frozen corpus."""
import json
from pathlib import Path
from prepare_mission01 import ROOT, OUT, asset, references

review = OUT / 'corpus-review-v2.json'
if review.exists():
    raise SystemExit('Review already recorded; preserve it and create a new revision.')
word = []
for cid in ['SRC09', 'SRC10']:
    directory = ROOT / 'orchestration/validation/mission01/source-references' / cid
    record = json.loads((directory / 'record.json').read_text(encoding='utf-8'))
    if record['status'] != 'RENDERED':
        raise SystemExit('Source Word rendering not available: ' + cid)
    pdf = directory / 'word.pdf'
    index = references(pdf)
    index_path = OUT / f'{cid.lower()}-word-page-index.json'
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    word.append({'sourceId': cid, 'sourceSha256': record['sourceSha256'],
        'role': 'long-template-with-filled-research-content',
        'physicalPages': len(index['pages']), 'pdf': asset(pdf.relative_to(ROOT)),
        'record': asset((directory / 'record.json').relative_to(ROOT)),
        'pageIndex': asset(index_path.relative_to(ROOT)),
        'wordVersion': record['renderInfo']['version'], 'wordBuild': record['renderInfo']['build'],
        'fullDepositedThesisVerified': False})
data = {'schemaVersion': 2, 'reviewedOn': '2026-10-08', 'status': 'PARTIAL_REFERENCE_PREPARATION',
    'baseCorpus': asset('orchestration/engine-work/mission01/corpus.json'),
    'reason': 'User identified thesis examples in Ege. Filename-based initial role classification understated filled content and archive examples.',
    'contentReview': asset('orchestration/engine-work/mission01/content-review.json'),
    'archiveReview': asset('orchestration/engine-work/mission01/archive-review.json'),
    'wordReferences': word,
    'corrections': [
        'Long filled research examples exist locally. SRC09 is 180 physical Word pages; do not report local long-document material as missing.',
        'SRC03 contains filled health research passages; Uşak contains filled engineering example passages.',
        'Seven archives were inspected; five source PDFs inside four archives were indexed. They were omitted from the initial 198 loose-file count.',
        'A 100-page minimum, two complete deposited theses, and numeric performance measurements were additional proposed criteria, not explicit Mission 01 requirements.',
        'Mission 01 prepares examples and references. OCR implementation and full orchestration/engine-work/IME/performance acceptance belong to later missions; do not make their implementation a Mission 01 blocker.',
        'Keep the distinction between a filled official template/example and a verified deposited full thesis. The latter remains unverified, not proven absent.'],
    'gapReassessment': {
        'G01': {'status': 'LOCAL_LONG_EXAMPLES_CONFIRMED', 'remaining': 'Map language/degree/field and source features; establish reference adequacy. Deposited full-thesis provenance remains unverified.'},
        'G02': {'status': 'PARTITION_REVIEW_PENDING', 'remaining': 'Reserve suitable existing filled examples before engine implementation. Original two-deposited-thesis criterion is a proposal, not mandatory Mission 01 wording.'},
        'G03': {'status': 'BOUNDARY_REFERENCE_PENDING', 'remaining': 'Choose or prepare scan boundary inputs and reviewed ground truth. OCR implementation belongs to Mission 04.'},
        'G04': {'status': 'REFERENCE_WORK_PENDING', 'remaining': 'Use local native equation/table/note examples first; add synthetic boundary inputs only where genuinely absent.'},
        'G05': {'status': 'LATER_ACCEPTANCE_WORK', 'remaining': 'Record a future performance/editing validation protocol now; long-document optimization and real IME acceptance belong to Missions 07/13.'}},
    'nextAction': 'Continue source/reference preparation from existing Ege materials; no request for additional user files is currently justified.',
    'acceptance': 'Source rendering and hash recording only; Mission 01 is not yet complete, and no engine import/export acceptance is claimed.'}
review.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'revision': 2, 'wordSources': [{'id': row['sourceId'], 'pages': row['physicalPages']} for row in word],
                  'mission01Status': data['status']}, ensure_ascii=False))
