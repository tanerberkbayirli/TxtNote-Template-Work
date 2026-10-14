"""Read archive members in memory; never extract arbitrary member paths."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'orchestration/tools'))
from pdfmeasure import pymupdf

seven = Path('C:/Program Files/7-Zip/7z.exe')
rows = []
for archive in sorted((ROOT / 'Butun-Sablonlar/Ege').rglob('*')):
    if archive.suffix.lower() not in {'.rar', '.zip'}:
        continue
    listing = subprocess.run([str(seven), 'l', '-slt', '-sccUTF-8', str(archive)],
        capture_output=True, encoding='utf-8', errors='replace', timeout=30, check=True).stdout
    members = [line[7:] for line in listing.splitlines() if line.startswith('Path = ')][1:]
    row = {'path': archive.relative_to(ROOT).as_posix(),
           'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'members': members, 'pdfExamples': []}
    for member in members:
        if not member.lower().endswith('.pdf'):
            continue
        data = subprocess.run([str(seven), 'e', '-so', str(archive), member],
            capture_output=True, timeout=30, check=True).stdout
        with pymupdf.open(stream=data, filetype='pdf') as pdf:
            texts = [page.get_text() for page in pdf]
            row['pdfExamples'].append({'member': member, 'sha256': hashlib.sha256(data).hexdigest(),
                'physicalPages': len(pdf), 'words': len(' '.join(texts).split()),
                'pageIndex': [{'physicalPage': i + 1, 'openingText': ' '.join(text.split())[:180],
                    'textSha256': hashlib.sha256(text.encode()).hexdigest()} for i, text in enumerate(texts)],
                'fullRealThesisVerified': False})
    rows.append(row)
out = ROOT / 'orchestration/engine-work/mission01/archive-review.json'
out.write_text(json.dumps({'reviewedOn': '2026-10-08', 'archives': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps([{'archive': row['path'], 'pdfExamples': [
    {'member': pdf['member'], 'pages': pdf['physicalPages'], 'words': pdf['words']} for pdf in row['pdfExamples']]} for row in rows], ensure_ascii=False))
