import sys
from pathlib import Path
import xml.etree.ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from pdfmeasure import docx_xml,W
run=Path('orchestration/validation/mcbu-final-20261015/mcbu-tip-uzmanlik/run')
for file in ['default.docx','default.roundtrip.docx']:
    rows=list(docx_xml(run/file).find(W+'body'))
    print(file)
    for i,p in enumerate(rows):
        text=''.join(t.text or '' for t in p.iter(W+'t'))
        if text in ['X. KAYNAKLAR26','I. GİRİŞ']:
            for q in rows[max(0,i-1):i+2]:
                print(ET.tostring(q,encoding='unicode')[:3300])
