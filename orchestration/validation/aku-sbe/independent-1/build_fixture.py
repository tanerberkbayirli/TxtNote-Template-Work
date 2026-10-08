# Independent-1 fixture builder (own content). Shape follows orchestration/tools/export.mjs header.
import json, re
SRC="../../../artifacts/aku-sbe/export/aku-sbe-master-tr-v1.fixture.json"  # only for JSON shape + one PNG data URI
shape=json.load(open(SRC,encoding="utf8"))
img=re.search(r"<img[^>]*>", shape["content"]).group(0)
vals=shape["researchData"]["thesis"]["values"]
S1="Toplumsal değişim süreçlerinin yerel yönetimler üzerindeki etkisi, kurumsal kapasite ve katılım mekanizmaları bakımından ayrıntılı biçimde çözümlenmiştir."
S2="Bu bağlamda alanyazında öne çıkan yaklaşımlar karşılaştırılmış, elde edilen bulgular kuramsal çerçeveyle ilişkilendirilerek yorumlanmıştır."
S3="Araştırmanın örneklemi, amaçlı örnekleme yöntemiyle belirlenmiş ve veriler yarı yapılandırılmış görüşmelerle toplanmıştır."
def para(n,i=0): return "<p>"+" ".join([S1,S2,S3][(i+k)%3] for k in range(n))+"</p>"
fnc=[0]
def fn(t=""):
    fnc[0]+=1; k=fnc[0]
    return f'<sup class="academic-footnote" contenteditable="false" data-fn-id="f{k}" data-fn-text="Açıklama dipnotu {k}: {S2}">{k}</sup>'
def fig(cap,kind=""):
    return f'<figure class="academic-figure" data-kind="figure"{(" data-caption-kind=%s%s%s"%(chr(34),kind,chr(34))) if kind else ""} contenteditable="false">{img}<figcaption>{cap}</figcaption></figure>'
src='<p data-thesis-style="sourceLine"><strong>Kaynak:</strong> Pelit, 2016: 66</p>'
def table(cap,rows):
    body="".join(f"<tr><td>Değişken {i+1}</td><td>{40+i}</td><td>{(40+i)/3:.1f}</td></tr>".replace(".",",") if True else "" for i in range(rows))
    return f'<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>{cap}</caption><thead><tr><th>Değişken</th><th>f</th><th>%</th></tr></thead><tbody>{body}</tbody></table></div>'
eq='<p><span class="math-formula math-formula--block" data-display="block" data-latex="E = mc^2" data-eq-numbered="true">(E = mc^2)</span></p>'
big="<p>"+" ".join([S1,S2,S3]*14)+"</p>"   # multi-page paragraph (~1000+ words)
chapters=["Kavramsal ve Kuramsal Çerçeve","Araştırmanın Yöntemi ve Deseni","Araştırmanın Bulguları","Bulguların Yorumlanması"]
parts=[]
for c,t in enumerate(chapters):
    parts.append(f"<h1>{t}</h1>")
    parts.append(para(3,c)+para(2)[:-4]+fn()+"</p>")
    parts.append("<h2>Birinci Ana Başlık Örneği</h2>"+para(4,c)+big if c==0 else "<h2>Birinci Ana Başlık Örneği</h2>"+para(4,c))
    parts.append("<h3>İkinci Düzey Alt Başlık</h3>"+para(3,1)[:-4]+fn()+"</p>")
    parts.append("<h4>Üçüncü Düzey Alt Başlık</h4>"+para(2,2))
    parts.append("<h5>Dördüncü Düzey Alt Başlık</h5>"+para(2,0))
    parts.append("<h2>Bir Satıra Sığmayacak Kadar Uzun Bir İkinci Ana Başlık Örneği Çok Uzun Bir Başlık Metni</h2>"+para(3,2))
    parts.append("<h3>Bir Satıra Sığmayacak Kadar Uzun Bir Üçüncü Düzey Başlık Örneği İçin Metin</h3>"+para(2,1))
    if c==0:
        parts.append(table("Katılımcıların Sürekli Dağılımı Uzun Tablo",48)+src+para(2))
        parts.append(f"<p>Denklem örneği aşağıdadır.</p>{eq}"+para(2))
    if c==1:
        parts.append(table("Katılımcıların Kısa Dağılımı",4)+src+table("İkinci Kısa Tablo Örneği",5)+src)
        parts.append(fig("Konut Sektöründe Elektrik Tüketim Oranları")+src+fig("Araştırma Modeli Şeması")+src+fig("Üçüncü Şekil Örneği")+src)
        parts.append(para(2)+f'<p data-thesis-style="blockQuote">"{S1} {S2} {S1} {S2}" (Pelit, 2016: 45).</p>')
    if c==2:
        parts.append(fig("Sosyal Bilimler Enstitüsü Binasının Dış Görünümü","photo")+src+fig("Otel Girişi","photo")+src+fig("Salon Görünümü","photo")+src)
        parts.append(para(6))
    parts.append("<h2>Son Alt Başlık</h2>"+para(5,c))
content="".join(parts)
vals.update({"THESIS_TITLE":"Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Dijital Okuryazarlık Düzeylerinin ve Kamusal Hizmet Algılarının Bölgesel Kalkınma Süreçleriyle İlişkisinin İncelenmesi: Afyonkarahisar Örneği",
 "STUDENT_NAME":"Ayşe ÖZTÜRK","DEPARTMENT_NAME":"Kamu Yönetimi","ADVISOR_NAME":"Mehmet YILDIZ"})
sc=shape["researchData"]["thesis"]["sectionContent"]
sc["introduction"]=para(4)+para(3,1); sc["conclusion"]=para(4)+"<h2>Öneriler</h2>"+para(3)
sc["bibliography"]="".join(f"<p>{a}, A. ({1990+i}). <i>Örnek kaynak başlığı numara {i} ve uzun ikinci satıra taşacak biçimde yazılmış ek açıklama metni</i>. Ankara: Yayınevi.</p>" for i,a in enumerate(["Çelik","Demir","Eren","Güneş","Işık","Kaya","Öz","Şahin","Uçar","Yılmaz","Zorlu","Aksoy"]))
sc["appendices"]="<p><b>EK 1.</b> Anket Formu</p>"+para(2)+"<p><b>EK 2.</b> Görüşme Formu</p>"+para(2)+"<p><b>EK 3.</b> Etik Kurul İzni</p>"+para(1)
sc["appendix-index"]="<p>Ek 1: Anket Formu</p><p>Ek 2: Görüşme Formu</p><p>Ek 3: Etik Kurul İzni</p>"
for k in ("abstract","preface"): sc[k]=para(3)
for k in ("abstract-en",): sc[k]="<p>"+("The effect of social change on local governments was examined in detail. "*8)+"</p>"
for variant in ("master","phd"):
    d=json.loads(json.dumps(shape))
    rid=f"aku-sbe-{variant}-tr-v1"
    t=d["researchData"]["thesis"]
    t["templateId"]=rid; t["selection"]["degreeType"]=variant
    d["content"]=content; d["title"]=vals["THESIS_TITLE"]
    if variant=="phd": t["values"].update({"JURY_3_TITLE_NAME":"Prof. Dr. Mustafa KÖSE","CO_ADVISOR_TITLE":"Prof. Dr.","CO_ADVISOR_NAME":"Koray KASAPOĞLU"})
    json.dump(d,open(f"{rid}.fixture.json","w",encoding="utf8"),ensure_ascii=False)
print("ok", len(content))
