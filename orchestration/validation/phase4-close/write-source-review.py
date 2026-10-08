import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
def read(path):
    return json.loads((root / path).read_text(encoding='utf-8-sig'))
def save(path, value):
    (root / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

guide = read('orchestration/validation/phase4-close/guide.extracted.json')
mapping = read('orchestration/specs/adu-sagbil.mapping.json')
conversion = read('orchestration/artifacts/adu-sagbil/source/guide.converted.docx.conversion.json')
selected = [170, 171, 180, 181, 182, 184, 186, 188, 195, 197, 198, 200, 206, 577, 579, 638, 641]
paragraphs = {p['index']: p for p in guide['paragraphs']}
facts = {f['key']: f for f in mapping['facts']}
review = {
    'schemaVersion': 1, 'target': 'adu-sagbil', 'reviewedAt': '2026-10-07',
    'scope': 'Only format prose relevant to mapped pilot roles/source conflicts; not a full guide or Tier 2 audit',
    'conversion': conversion,
    'sourceTemplateSha256': mapping['sourceSha256'],
    'guideEvidence': [{'index': i, 'locator': paragraphs[i]['locator'], 'text': paragraphs[i]['text']} for i in selected],
    'agreements': [
        {'guideParagraphs': [170, 180, 186, 188], 'templateFactKeys': ['typography.body.fontFamily', 'typography.body.fontSizePt', 'typography.body.lineHeight', 'typography.body.spaceAfterPt', 'typography.body.firstLineIndentMm'], 'ruling': 'Use measured official XML (TNR 12 pt, 1.5 lines, after 6 pt, first indent 10 mm, 30/20/25/25 mm margins).'},
        {'guideParagraphs': [195, 197, 198], 'ruling': 'Arabic main / lower Roman front matter, right footer, H1 14 pt and H2-H4 12 pt agree with reviewed source roles. Complex-script szCs is not Latin text size.'}
    ],
    'conflicts': [
        {'id': 'subheading-alignment', 'guideParagraphs': [188, 200], 'guide': 'Subheadings flush left', 'templateFacts': [facts['typography.headings.2.align'], facts['typography.headings.3.align']], 'ruling': 'Official 2026 template XML has w:jc=both; keep source justify. Short single-line headings still paint at the left.'},
        {'id': 'bibliography-line-spacing', 'guideParagraphs': [184, 638, 641], 'guide': 'General paragraph says single spacing; bibliography-specific paragraph says 1.5 with after 6 pt', 'templateFacts': [facts['bibliography.style.lineSpacing'], facts['bibliography.style.spaceAfterPt']], 'ruling': 'Official template XML and specific bibliography prose agree on 1.5/6 pt; do not apply the general single-spacing sentence.'},
        {'id': 'separate-inner-cover', 'guideParagraphs': [195], 'guide': 'Mentions unnumbered outer and inner covers', 'template': 'Reviewed 2026 example page 1 is cover; page 2 is approval. No distinct inner cover in this example.', 'ruling': 'Pilot follows official example section sequence. Do not invent an extra page; alternate cover variant remains UNKNOWN.'}
    ],
    'tier2Unknown': ['Long replacement title/jury text on individually positioned fixed-page words', 'PhD / English thesis / second-advisor / alternate inner-cover variants', 'Footnotes, multi-page tables and other content not exercised by this pilot', 'Theme fonts and conditional/unused styles: 109 source property groups retained in mapping inventory'],
    'engineGapPolicy': 'Unmapped groups retain their source XML locators; they are not silently treated as satisfied requirements. Pilot PASS is scoped to its explicit 298 Tier 1 assertions.'
}
save('orchestration/specs/adu-sagbil.source-review.json', review)
save('orchestration/specs/adu-sagbil.json', {
    'id': 'adu-sagbil', 'schemaVersion': 1, 'analyzedAt': '2026-10-07',
    'scope': 'Official 2026 master/TR example; Tier 1 source-derived pilot only',
    'sourceSha256': mapping['sourceSha256'],
    'sourceReviewPath': 'orchestration/specs/adu-sagbil.source-review.json',
    'extractionPath': 'orchestration/specs/adu-sagbil.extracted.json',
    'generationProfilePath': 'orchestration/specs/adu-sagbil.generation.json',
    'mappingPath': 'orchestration/specs/adu-sagbil.mapping.json',
    'measuredRules': mapping['facts'], 'unmappedPropertyGroups': len(mapping['engineGaps']),
    'tier2Unknown': review['tier2Unknown']
})
print('Source review: 17 selected guide paragraphs, 3 explicit rulings; canonical source spec saved')
