import json
from pathlib import Path
root = Path('orchestration/validation/aku-felsefe-independent-2')
text = ('Felsefe araştırmalarında kavramların tarihsel bağlamı ve kaynakların eleştirel değerlendirilmesi bu paragrafta açıklanır. ' * 4).strip()
quote = ('Bir düşüncenin anlamı, onu ortaya çıkaran tartışma ortamı ve önceki metinlerle kurduğu ilişki birlikte incelendiğinde belirginleşir. ' * 8).strip()

def thesis_body():
    out=[]
    for i in range(2):
        out += [f'<h1>{i+1}. Bölüm: Kavramsal İnceleme {i+1}</h1>', '<h2>Temel Tartışma</h2>', '<p>'+text+' (Turhan, 2003: 40-51)</p>']
        if i==0: out.append('<p data-thesis-style="blockQuote">'+quote+'</p>')
        for j in range(18):
            cites = ' (Arslan, 2018: 12) (Özkan, 2020: 21-39)' if i==0 and j==0 else ''
            out.append('<p>'+text+f' Bölüm {i+1}, paragraf {j+1}.'+cites+'</p>')
    return ''.join(out)

def seminar_body():
    out=['<h1>GELİŞME</h1>', '<p>'+text+' (Turhan, 2003: 40-51) (Arslan, 2018: 12) (Özkan, 2020: 21-39)</p>', '<p data-thesis-style="blockQuote">'+quote+'</p>']
    out.extend('<p>'+text+f' Gelişme paragrafı {j+1}.</p>' for j in range(105))
    return ''.join(out)
refs = '<p>Arslan, M. (2018). <i>Felsefeye giriş</i>. Bilge Yayınları.</p><p>Özkan, A. (2020). Antik düşüncede doğa kavramı. <i>Felsefe Araştırmaları, 12</i>(2), 21–39.</p><p>Turhan, M. (2003). <i>Felsefe tarihi</i>. Ufuk Yayınları.</p>'
for name, body in [('thesis',thesis_body()),('seminar',seminar_body())]:
    p=root/f'{name}.json'; d=json.loads(p.read_text(encoding='utf-8'))
    d['title']='Felsefe Kaynak ve Biçim Denetimi'; d['content']=body
    sec=d['researchData']['thesis']['sectionContent']
    sec['introduction']='<p>Giriş: Bu metin, felsefi sorunu ve incelemenin sınırlarını tanıtır. (Arslan, 2018: 12)</p>'
    sec['conclusion']='<p>Sonuç: Tartışma, başlangıçta belirtilen soruya dayalı bir değerlendirmeyle tamamlanır.</p>'
    sec['bibliography']=refs
    if name=='thesis':
        sec['preface']='<p>Bu önsöz, numaralandırmanın başladığı kaynakça kuralını sınar.</p>'
        d['researchData']['thesis']['enabledSections']=['symbols','toc']
    else:
        sec.pop('preface',None)
        d['researchData']['thesis']['enabledSections']=['toc']
    p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
