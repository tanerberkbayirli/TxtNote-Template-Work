import json
import re
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools'))
from pdfmeasure import open_pdf
import pymupdf

out=Path(__file__).resolve().parent
doc=open_pdf(out/'ux-export.pdf')
text=' '.join(re.sub(r'\s+',' ',page.get_text()) for page in doc)
checks={
    'heading':'UX Başlık Denemesi' in text,
    'reference':'Yeni kaynak & deneme' in text,
    'citation':'Gilster, 1997, s. 25' in text,
    'workspaceExcluded':all(value not in text for value in ['Adım adım yazın','Kaynaklarınız bir arada','İçindekiler kendiliğinden güncellenir']),
    'A4':all(abs(page.rect.width-595.276)<1 and abs(page.rect.height-841.89)<1 for page in doc),
}
for label,needle in [('heading','UX Başlık Denemesi'),('reference','Yeni kaynak & deneme')]:
    matching=[index for index,page in enumerate(doc) if needle in re.sub(r'\s+',' ',page.get_text())]
    if matching:
        page=doc[matching[-1]]
        page.get_pixmap(matrix=pymupdf.Matrix(1.2,1.2),alpha=False).save(out/f'pdf-{label}.png')
result={'checks':checks,'pages':len(doc),'pass':all(checks.values())}
(out/'pdf-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))
if not result['pass']:sys.exit(1)
