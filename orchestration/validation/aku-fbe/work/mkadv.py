import json,subprocess,sys,re
root='/home/user/TxtNote-Template-Work/orchestration'
def build(rid,out,degree):
    tmp=f'{out}.base.json'
    subprocess.run(['node',f'{root}/tools/make-fixture.mjs',rid,tmp],check=True,cwd='/home/user/TxtNote-Template-Work')
    f=json.load(open(tmp)); t=f['researchData']['thesis']; v=t['values']
    base=json.load(open(f'{root}/artifacts/aku-fbe/export/{rid}.fixture.json'))
    # long title 3-4 lines
    f['title']=("Anadolu Ege Bölgesi Kırsal Kesiminde Yetiştirilen Yerel Arpa ve Buğday Çeşitlerinin Ağır Metal Stresi Altında Kök ve Gövde Dokularında Oluşan Oksidatif Hasarın, Antioksidan Enzim Aktivitelerinin ve Fizyolojik Tolerans Mekanizmalarının Karşılaştırmalı Olarak İncelenmesi Üzerine Deneysel Bir Araştırma")
    v['THESIS_TITLE_EN']="A COMPARATIVE EXPERIMENTAL INVESTIGATION OF OXIDATIVE DAMAGE, ANTIOXIDANT ENZYME ACTIVITIES AND PHYSIOLOGICAL TOLERANCE MECHANISMS IN ROOT AND SHOOT TISSUES OF LOCAL BARLEY AND WHEAT CULTIVARS GROWN IN RURAL AEGEAN ANATOLIA UNDER HEAVY METAL STRESS"
    v['DEPARTMENT_NAME']="Tarımsal Biyoteknoloji ve Bitki Fizyolojisi"
    v['DEPARTMENT_NAME_EN']="Agricultural Biotechnology and Plant Physiology"
    v['STUDENT_NAME']="Muhammed Abdurrahman Şükrüoğlu ÇAĞLAYANGİL"
    v['ADVISOR_NAME']="Mehmet Ali ÖZKAYNAK-YILDIRIM"
    v['ADVISOR_TITLE']="Prof. Dr."
    v.pop('PROJECT_NUMBER',None); v.pop('PROJECT_FUNDER',None)
    if degree=='master':
        for k in ('CO_ADVISOR_NAME','CO_ADVISOR_TITLE','CO_ADVISOR_TITLE_EN'): v.pop(k,None)
        for i in (6,7):
            v.pop(f'JURY_{i}_TITLE_NAME',None); v.pop(f'JURY_{i}_AFFILIATION',None)
    else:
        v['CO_ADVISOR_NAME']="Gökhan IŞIK ŞİMŞEK"
        for i in range(1,8):
            v[f'JURY_{i}_AFFILIATION']=f"Afyon Kocatepe Üniversitesi, Fen-Edebiyat Fakültesi, Biyoloji Bölümü {i}"
    sn=lambda s:s
    P=lambda x:f'<p>{x}</p>'
    fn=lambda i,x:f'<sup class="academic-footnote" contenteditable="false" data-fn-id="{i}" data-fn-text="{x}">1</sup>'
    S="Ağır metal stresi altında bitkilerin kök ve gövde dokularında biriken krom miktarı, hücre içi reaktif oksijen türlerinin oluşumu ve antioksidan savunma sistemlerinin aktivitesi ile doğrudan ilişkilendirilmiştir; ancak literatürde bu ilişkinin çeşitlere göre değiştiğini gösteren çelişkili bulgular da yer almaktadır (Karasar, 2020)."
    img=re.search(r'<img[^>]*src="[^"]+"[^>]*>',base['content']).group(0)
    def fig(cap,kind=''):
        k=f' data-caption-kind="{kind}"' if kind else ''
        return f'<figure class="academic-figure" data-kind="figure"{k} contenteditable="false">{img}<figcaption>{cap}</figcaption></figure>'
    def table(cap,rows,cols=5):
        head=''.join(f'<th>Sütun {c+1}</th>' for c in range(cols))
        body=''.join('<tr>'+''.join(f'<td>{r}.{c}</td>' for c in range(cols))+'</tr>' for r in range(rows))
        return f'<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>{cap}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'
    def eq(l,num=True): return f'<span class="math-formula math-formula--block" data-display="block" data-latex="{l}" data-eq-numbered="{"true" if num else "false"}">({l})</span>'
    LONGCAP="Çok uzun bir açıklama metni: farklı Cr(VI) konsantrasyonlarına maruz bırakılan arpa ve buğday çeşitlerinin gövde ve kök dokularında krom birikimi, antioksidan enzim aktiviteleri ve lipid peroksidasyonu düzeylerinin sekiz haftalık deneme süresince haftalık olarak ölçülen ortalama değerleri ve standart sapmaları (Dursun 1997)."
    parts=[]
    for c,title in enumerate(["Giriş Bölümü","Literatür ve Kuramsal Temeller","Materyal ve Metot","Bulgular","Tartışma ve Sonuç"]):
        n=c+1
        if c==0: continue
        parts.append(f'<h1>{title}</h1>'); parts.append(P(S+S)+P(S+fn(f'a{n}','Birinci dipnot: '+S)+' '+S+fn(f'b{n}','İkinci dipnot: uzun bir açıklama daha '+S)))
        parts.append(f'<h2>Alt Bölüm Başlığı Çok Uzun Olduğunda İkinci Satıra Taşan İkinci Derece Başlık Örneği {n}.1</h2>'+P(S+S+S))
        parts.append(f'<h3>Üçüncü Derece Başlık {n}</h3>'+P(S)+f'<h4>Dördüncü Derece Başlık {n}</h4>'+P(S))
        if c==1: parts.append(P(S)+eq('F = a \\cdot b')+P('Burada F alan, a uzun kenar, b kısa kenardır.')+eq('E = mc^2',True)+P(S)+fig(LONGCAP)+P(S)+fig('Kısa şekil açıklaması'))
        if c==2: parts.append(P(S)+table(LONGCAP,70)+P(S)+P(S+S+S))
        if c==3: parts.append(P(S)+fig(LONGCAP,'photo')+P(S)+table('Kısa tablo',5)+'<p data-thesis-style="tableNote">Not: a-g; Bir kritere ait kolondaki farklı harfler, istatistiksel olarak önemli farklılıkları göstermektedir (P&lt;0.05). Bu not birden çok satıra yayılacak kadar uzundur ve on punto olmalıdır.</p>'+f'<h2>Tablo Sonrası Başlık {n}.2</h2>'+P(S+S))
        parts.append(P(S+S+S+S))
    t['sectionContent']['introduction']=P(S+S)+P(S+fn('gi','Giriş dipnotu: '+S))+f'<h2>Çalışmanın Amacı</h2>'+P(S)
    f['content']=''.join(parts)
    json.dump(f,open(out,'w'),ensure_ascii=False,indent=1)
build('aku-fbe-master-tr-v1','adv-master.json','master')
build('aku-fbe-phd-tr-v1','adv-phd.json','phd')
