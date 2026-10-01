"""Rebuilds the aku-sbe validation fixtures (deterministic). usage: python build_fixtures.py  (run from orchestration/artifacts/aku-sbe/export)"""
import json, re, subprocess, sys
MAKE = "../../../tools/make-fixture.mjs"
S = "Katılımcıların yöneticilerine duydukları güven düzeyi, çalışma yaşam kalitesi algıları ve işten ayrılma niyetleri ayrıntılı biçimde çözümlenmiştir."
LONG = "Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeylerinin ve ilişkili değişkenlerin ayrıntılı incelenmesi"
for id_ in ("aku-sbe-master-tr-v1", "aku-sbe-phd-tr-v1"):
    subprocess.run(["node", MAKE, id_, f"{id_}.fixture.json", "overrides.json"], check=True)
    d = json.load(open(f"{id_}.fixture.json", encoding="utf-8"))
    c = re.sub(r'<span class="math-formula[^>]*>.*?</span>', "", d["content"])  # no equation: katex dev-dep 504 noise, equations are UNKNOWN in the spec
    img = re.search(r"<img[^>]*>", c).group(0)
    fig = lambda cap, kind="": f'<figure class="academic-figure" data-kind="figure"{(" data-caption-kind=" + chr(34) + kind + chr(34)) if kind else ""} contenteditable="false">{img}<figcaption>{cap}</figcaption></figure>'
    tab = lambda cap, long=False: f'<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>{cap}</caption><thead><tr><th>Değişken</th><th>f</th><th>%</th></tr></thead><tbody><tr><td>Kadın</td><td>64</td><td>53,3</td></tr><tr><td>Erkek</td><td>56</td><td>46,7</td></tr>' + ('<tr><td>Katılımcıların ölçek maddelerine ilişkin uzun açıklama metni burada yer alır</td><td>10</td><td>5,0</td></tr>' if long else "") + '</tbody></table></div>'
    extra = ('<h2>Ek Alt Başlık</h2>' + f'<p>{S} {S} {S}</p>' + '<h3>Üçüncü Düzey Başlık</h3>' + f'<p>{S}</p>' + '<h4>Dördüncü Düzey Başlık</h4>' + f'<p>{S}</p>' + '<h5>Beşinci Düzey Başlık</h5>' + f'<p>{S} {S}</p>'
             + f'<h2>{LONG}</h2><p>{S}</p><h3>{LONG}</h3><p>{S}</p><h4>{LONG}</h4><p>{S}</p><h5>{LONG}</h5><p>{S}</p>'
             + f'<p data-thesis-style="blockQuote">"{S} {S} {S} {S}" (Pelit, 2016: 45).</p>'
             + tab("Katılımcıların Cinsiyete Göre Dağılımı", True) + '<p data-thesis-style="sourceLine"><strong>Kaynak:</strong> Pelit, 2016: 66</p>'
             + tab("Katılımcıların Eğitim Durumu") + tab("Katılımcıların Yaş Dağılımı")
             + fig("Konut Sektöründe Elektrik Tüketim Oranları") + '<p data-thesis-style="sourceLine"><strong>Kaynak:</strong> Pelit, 2016: 66</p>' + fig("Araştırma Modeli")
             + fig("Sosyal Bilimler Enstitüsü Binasının Dış Görünümü", "photo") + fig("Otel Girişi", "photo"))
    d["content"] = c.replace("<h1>Yöntem</h1>", extra + "<h1>Yöntem</h1>", 1)
    v = d["researchData"]["thesis"]["values"]
    if "phd" in id_:
        v.update({"JURY_3_TITLE_NAME": "Prof. Dr. Mustafa KÖSE", "JURY_4_TITLE_NAME": "Doç. Dr. Ayşe DEMİR", "JURY_5_TITLE_NAME": "Doç. Dr. Can YILMAZ", "CO_ADVISOR_TITLE": "Prof. Dr.", "CO_ADVISOR_NAME": "Koray KASAPOĞLU"})
    json.dump(d, open(f"{id_}.fixture.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if id_.startswith("aku-sbe-master"):  # the <3 case: no extra tables/figures/pictures -> no lists
        d2 = json.load(open(f"{id_}.fixture.json", encoding="utf-8")); d2["content"] = c
        json.dump(d2, open("aku-sbe-master-lt3.fixture.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("fixtures ok")
