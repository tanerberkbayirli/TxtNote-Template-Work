import json,re
d=json.load(open("aku-sbe-master-tr-v1.fixture.json",encoding="utf8"))
c=d["content"]
src='<p data-thesis-style="sourceLine"><strong>Kaynak:</strong> Pelit, 2016: 66</p>'
def rm_table(c,cap):
    m=re.search(r'<div class="academic-table-wrap".{0,160}?<caption>'+re.escape(cap)+r'</caption>.*?</div>',c,flags=re.S)
    return c[:m.start()]+c[m.end():]
def rm_fig(c,cap):
    m=re.search(r'<figure[^>]*>(?:(?!</figure>).)*?<figcaption>'+re.escape(cap)+r'</figcaption></figure>',c,flags=re.S)
    return c[:m.start()]+c[m.end():]
c=rm_table(c,"İkinci Kısa Tablo Örneği"); c=rm_fig(c,"Üçüncü Şekil Örneği"); c=rm_fig(c,"Salon Görünümü")
d["content"]=c
t="Yöneticiye Duyulan Güven İle Çalışma Yaşam Kalitesinin İşten Ayrılma Niyetine Etkisi: Afyonkarahisar’daki Beş Yıldızlı Otel İşletmelerinde Bir Araştırma"
d["researchData"]["thesis"]["values"]["THESIS_TITLE"]=t; d["title"]=t
json.dump(d,open("aku-sbe-master-lt3.fixture.json","w",encoding="utf8"),ensure_ascii=False)
print(c.count("<caption>"),c.count("<figcaption>"))
