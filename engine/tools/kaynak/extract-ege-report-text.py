import csv, json, re
from pathlib import Path
import pdfplumber
from docx import Document
ROOT=Path(__file__).resolve().parents[2]
manifest=ROOT/'output/ege-thesis-report-files/download-manifest.csv'
out=ROOT/'output/ege-thesis-report-files/extracted-text.jsonl'
def clean(s):
    return re.sub(r'\s+',' ',s or '').strip()
with manifest.open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
with out.open('w',encoding='utf-8') as dst:
    for i,row in enumerate(rows,1):
        path=Path(row.get('analysis_local_path') or '')
        entry={k:row.get(k,'') for k in ('university','province','classification','file_type','link_text','document_url','analysis_download_status')}
        entry['number']=i
        entry['local_path']=str(path) if path.is_file() else ''
        entry['title_from_document']=''
        entry['page_count']=None
        entry['text']=''
        entry['headings']=[]
        if path.is_file():
            try:
                if path.suffix.lower()=='.pdf':
                    pages=[]
                    with pdfplumber.open(path) as pdf:
                        entry['page_count']=len(pdf.pages)
                        for p in pdf.pages:
                            pages.append(p.extract_text() or '')
                    full='\n'.join(pages)
                    entry['text']=full
                elif path.suffix.lower()=='.docx':
                    doc=Document(path)
                    parts=[]
                    for para in doc.paragraphs:
                        t=para.text.strip()
                        if t: parts.append(t)
                    for ti,table in enumerate(doc.tables,1):
                        parts.append(f'[TABLO {ti}]')
                        for tr in table.rows:
                            parts.append(' | '.join(c.text.replace('\n',' / ').strip() for c in tr.cells))
                    for section in doc.sections:
                        for p in section.header.paragraphs+section.footer.paragraphs:
                            if p.text.strip(): parts.append(p.text.strip())
                    entry['text']='\n'.join(parts)
                elif path.suffix.lower()=='.doc':
                    entry['text']='[İçerik eski .doc biçiminde; otomatik çıkarım yapılamadı.]'
                else:
                    entry['text']='[Desteklenmeyen dosya biçimi.]'
                lines=[clean(x) for x in entry['text'].splitlines() if clean(x)]
                entry['title_from_document']=next((x for x in lines[:35] if len(x)>7 and len(x)<180), '')
                entry['headings']=[x[:240] for x in lines if (len(x)<140 and (re.match(r'^(?:[0-9IVX]+[.)]?\s+|[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{6,}$)',x) or any(k in x.casefold() for k in ['içindekiler','kaynakça','ekler','tez yazım','yazım kuralları','biçimsel'])) )][:80]
            except Exception as e:
                entry['extract_error']=str(e)[:240]
        entry['text']=entry['text'][:120000]
        dst.write(json.dumps(entry,ensure_ascii=False)+'\n')
        print(f"{i:02d} {row.get('university')} | {row.get('classification')} | {row.get('link_text')} | {entry['page_count']}p | {len(entry['text'])} chars",flush=True)
print(out)
