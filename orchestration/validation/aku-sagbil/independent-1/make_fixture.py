# Independent fixture generator (shape borrowed from export.mjs header + existing fixture; content is original).
import json, re, random, sys
src = json.load(open('orchestration/artifacts/aku-sagbil/export/aku-sagbil-master-tr-v1.fixture.json', encoding='utf8'))
m = re.search(r'src="(data:image/png;base64,[^"]+)"', src['content']); IMG = m.group(1)
random.seed(7)
S = ["Hastaların klinik bulguları, laboratuvar değerleri ve demografik özellikleri ayrıntılı biçimde kaydedilmiştir.",
     "Elde edilen veriler, ilgili literatürde bildirilen sonuçlarla karşılaştırıldığında benzer eğilimler gözlenmiştir.",
     "Örneklem büyüklüğü, güç analizi ile belirlenmiş ve etik kurul onayı alınmıştır (Karasar, 2020).",
     "Gruplar arası farklar tek yönlü varyans analizi ile değerlendirilmiş, anlamlılık düzeyi 0,05 olarak alınmıştır.",
     "Bu bulgular, erken tanının önemini vurgulamakta ve ileri çalışmalar için bir temel oluşturmaktadır (Özdemir ve Işık, 2024).",
     "Ölçüm araçlarının güvenirliği Cronbach alfa katsayısı ile sınanmış ve kabul edilebilir düzeyde bulunmuştur."]
def para(n=6):
    return "<p>" + " ".join(random.choice(S) for _ in range(n)) + "</p>"
fn_id = [0]
def fnpara(text):
    fn_id[0] += 1
    k = fn_id[0]
    return ("<p>" + " ".join(random.choice(S) for _ in range(3)) +
        f'<sup class="academic-footnote" contenteditable="false" data-fn-id="f{k}" data-fn-text="Dipnot {k}: {text}">{k}</sup> ' +
        " ".join(random.choice(S) for _ in range(3)) + "</p>")
def fig(cap, kind=None):
    kk = f' data-caption-kind="{kind}"' if kind else ''
    return f'<figure class="academic-figure" data-kind="figure"{kk} contenteditable="false"><img width="420" height="210" src="{IMG}" alt=""><figcaption>{cap}</figcaption></figure>'
def table(cap, rows, note=None):
    t = f'<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>{cap}</caption><thead><tr><th>Sıra</th><th>Değişken</th><th>Ortalama</th><th>SS</th><th>p</th></tr></thead><tbody>'
    for i in range(rows):
        t += f'<tr><td>{i+1}</td><td>Parametre {i+1}</td><td>{10+i*0.37:.2f}</td><td>{1+i*0.05:.2f}</td><td>0,{(i*7)%90+10:02d}</td></tr>'
    t += '</tbody></table></div>'
    if note: t += f'<p data-thesis-style="tableNote">{note}</p>'
    return t
eq = '<span class="math-formula math-formula--block" data-display="block" data-latex="E = mc^2" data-eq-numbered="true">(E = mc^2)</span>'
c = ""
c += "<h1>MATERYAL ve METOT</h1>" + para(9) + fnpara("Çalışma tek merkezlidir.") + para(8)
c += "<h2>Çalışma Grubu ve Örneklem</h2>" + para(8) + fnpara("Dışlama ölçütleri ayrıca listelenmiştir.")
c += "<h3>Katılımcı Seçimi ve Dışlama Ölçütleri</h3>" + para(7) + "<h4>Kan Örneklerinin Alınması</h4>" + para(5)
c += "<h2>Laboratuvar Yöntemleri ve Analizler</h2>" + para(10) + eq + para(4) + fig("Araştırma akış şeması ve örneklerin işlenmesi", None)
c += "<h3>İstatistiksel Çözümleme</h3>" + para(9)
c += "<h1>BULGULAR</h1>" + para(6)
c += "<h2>Betimleyici Bulgular</h2>" + table("Katılımcıların demografik ve klinik özellikleri", 46, "*Kısaltma açıklamaları: SS: Standart sapma; p: anlamlılık düzeyi.") + para(8)
c += fnpara("Tablo çok sayfalıdır.") + fig("Parametrelerin gruplara göre dağılımı") + para(7)
c += "<h2>Karşılaştırmalı Bulgular</h2>" + para(9) + fig("Deney düzeneğinin görüntüsü", "photo") + "<h3>Alt Grup Analizleri</h3>" + para(9) + "<h4>Yaş Gruplarına Göre</h4>" + para(6)
c += "<h2>İkinci Bulgu Grubu</h2>" + table("Gruplara göre ölçüm sonuçları", 8) + para(5)
c += "<h1>TARTIŞMA</h1>" + para(10) + "<h2>Bulguların Literatürle Karşılaştırılması</h2>" + para(10) + "<h3>Sınırlılıklar</h3>" + para(6)
c += "<h1>SONUÇ ve ÖNERİLER</h1>" + para(6) + "<h2>Öneriler</h2><ul><li>Daha geniş örneklemli çalışmalar yapılmalıdır</li><li>Çok merkezli izlem önerilir</li></ul>" + para(4)
v = dict(src['researchData']['thesis']['values'])
v.update(THESIS_TITLE="Tekrarlayan Gebelik Kayıplarında Faktör V Leiden ve Protrombin G20210A Gen Polimorfizmlerinin Maternal Yaş, Vücut Kitle İndeksi ve Klinik Seyir ile İlişkisinin Çok Değişkenli Analizlerle İncelenmesi",
  THESIS_TITLE_EN="Investigation of the Relationship of Factor V Leiden and Prothrombin G20210A Gene Polymorphisms with Maternal Age, Body Mass Index and Clinical Course in Recurrent Pregnancy Losses by Multivariate Analyses",
  STUDENT_NAME="Ayşe Gül ÇİÇEK", DEPARTMENT_NAME="Tıbbi Genetik", JURY_CHAIR="Prof. Dr. Ahmet YILMAZ, Afyon Kocatepe Üniversitesi", JURY_MEMBER_1="Prof. Dr. Fatma DEMİR, Ankara Üniversitesi", JURY_MEMBER_2="Doç. Dr. Mehmet KAYA, Ege Üniversitesi", JURY_MEMBER_3="Dr. Öğr. Üyesi Elif ŞAHİN, AKÜ", JURY_MEMBER_4="Dr. Öğr. Üyesi Can ÖZTÜRK, AKÜ", JURY_MEMBER_5="", JURY_MEMBER_6="")
ab = lambda n: "".join(para(7) for _ in range(n))
sc = {
 'abstract': ab(2), 'abstract-en': "<p>" + " ".join(["The gene polymorphisms were examined in detail with respect to clinical findings and laboratory values in the study group."]*8) + "</p>",
 'preface': "<p>Bu çalışmanın hazırlanmasında katkı sağlayan herkese teşekkür ederim. Destek veren kuruluşlara şükranlarımı sunarım.</p>",
 'symbols': "<p><b>%:</b> Yüzde</p><p><b>ANOVA:</b> Analysis of Variance</p><p><b>FVL:</b> Faktör V Leiden</p><p><b>SS:</b> Standart sapma</p>",
 'introduction': para(8) + "<h2>Konunun Önemi</h2>" + para(8) + "<h3>Tarihçe</h3>" + para(6) + "<h4>Erken Dönem</h4>" + para(4) + "<h2>Amaç</h2>" + para(6),
 'bibliography': "".join(f"<p>Yazar{chr(65+i)}, {chr(65+i)}., Başka, B. (20{10+i}). Örnek makale başlığı numara {i+1}. <i>J Ethnopharmacol</i>, {i+1}(2): {10+i}-{20+i}.</p>" for i in range(22)),
 'appendices': "<h2>Hayvan Deneyleri Yerel Etik Kurul Kararı</h2>" + para(4) + "<h2>Anket Formu</h2>" + para(4) + "<h2>Veri Toplama Formu</h2>" + para(2),
 'cv': "<p>Adı Soyadı\t\t\t: Ayşe Gül ÇİÇEK</p><p>Doğum Yeri ve Tarihi\t\t: Afyonkarahisar, 01.01.1995</p><p>Yabancı Dili\t\t\t: İngilizce</p>",
}
for variant in ('master','phd'):
    d = {'title': v['THESIS_TITLE'], 'content': c, 'researchData': {'thesis': {
        'templateId': f'aku-sagbil-{variant}-tr-v1', 'templateVersion': '1.0.0',
        'selection': {'universityId':'aku','instituteId':'sagbil','degreeType':variant,'language':'tr'},
        'values': v, 'sectionContent': sc, 'enabledSections': ['symbols','appendices']}}}
    json.dump(d, open(f'orchestration/validation/aku-sagbil/independent-1/aku-sagbil-{variant}-tr-v1.fixture.json','w',encoding='utf8'), ensure_ascii=False)
