import pymupdf as f
from pathlib import Path
p=Path('orchestration/validation/aku-felsefe-independent-2/official-guides/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx.pdf')
d=f.open(p); d[7].get_pixmap(matrix=f.Matrix(1.1,1.1),alpha=False).save(p.parent/'thesis-p8.png')
