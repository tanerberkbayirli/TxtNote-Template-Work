import pymupdf as f
from pathlib import Path
folder=Path('orchestration/validation/aku-felsefe-independent-2/official-guides')
files=[('AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx.pdf','thesis-cover-p7.png'),('AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx.pdf','seminar-cover-p7.png')]
for src,out in files:
 d=f.open(folder/src); d[6].get_pixmap(matrix=f.Matrix(1.1,1.1),alpha=False).save(folder/out)
