// Task 10B: representative MCBÜ thesis (Turkish text, every front page, H1–H4, figures,
// tables, footnotes, references, appendices). Shared by the e2e test and the browser fixture.
export const MCBU_STORAGE_KEY = "txtnote-thesis-regression";

const P = (text) => `<p>${text}</p>`;
const fn = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}">1</sup>`;
const figure = (image, caption) => `<figure class="academic-figure" data-kind="figure" contenteditable="false"><img width="420" height="210" src="${image}" alt=""><figcaption>${caption}</figcaption></figure>`;
const table = (caption, rows) => `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>${caption}</caption><thead><tr><th>Değişken</th><th>Grup</th><th>f</th><th>%</th></tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const L = "Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeyleri; öz yeterlik, erişim olanakları ve ölçme araçlarının güvenirliği açısından ayrıntılı biçimde incelenmiştir.";
const long = (n, tag) => Array.from({ length: n }, (_, i) => P(`${tag} ${i + 1}. ${L} ${L} Işık, ığdır, şişe, ÇĞİÖŞÜ çğıöşü karakterleri doğru görünmelidir.`)).join("");

export function mcbuThesis(image, { degree = "master" } = {}) {
  const templateId = `mcbu-lee-${degree}-tr-v1`;
  const main = [
    "<h1>Kuramsal Çerçeve</h1>",
    long(3, "Kuram"),
    P(`Dijital okuryazarlık kavramı farklı biçimlerde tanımlanmaktadır${fn("k1", "Gilster (1997) kavramı ilk kez sistematik biçimde kullanmıştır; ayrıntı için Kaynakça'ya bakınız.")}. Bu çalışmada bütüncül bir tanım benimsenmiştir.`),
    "<h2>Dijital Okuryazarlığın Boyutları</h2>",
    long(2, "Boyut"),
    "<h3>Bilgi Okuryazarlığı</h3>",
    long(1, "Bilgi"),
    "<h4>Çevrimiçi Kaynak Değerlendirme</h4>",
    P("Kaynak güvenilirliği ölçütleri ölçek maddeleriyle ilişkilendirilmiştir."),
    figure(image, "Dijital okuryazarlık boyutları"),
    P("Şeklin ardından açıklama paragrafı yer alır ve metin iki yana yaslı olarak devam eder."),
    table("Katılımcıların demografik özellikleri", [["Cinsiyet", "Kadın", "64", "53,3"], ["", "Erkek", "56", "46,7"], ["Sınıf", "3. sınıf", "70", "58,3"], ["", "4. sınıf", "50", "41,7"]]),
    "<h2>İlgili Araştırmalar</h2>",
    long(4, "Araştırma"),
    "<h1>Yöntem</h1>",
    P(`Araştırmada ilişkisel tarama modeli kullanılmıştır${fn("y1", "Karasar, N. (2020). Bilimsel araştırma yöntemi. Nobel Yayıncılık.")}.`),
    "<h2>Çalışma Grubu</h2>",
    long(2, "Grup"),
    figure(image, "Araştırma sürecinin aşamaları: veri toplama, çözümleme, raporlama ve bulguların uzman görüşleriyle karşılaştırılarak doğrulanması adımlarını gösteren ayrıntılı akış şeması"),
    "<h2>Veri Toplama Araçları</h2>",
    long(2, "Araç"),
    table("Ölçeğin alt boyutlarına ilişkin güvenirlik katsayıları ve madde sayıları ile açıklanan varyans oranlarının karşılaştırmalı gösterimi", [["Bilgi", "—", "12", "0,87"], ["İletişim", "—", "9", "0,81"]]),
    "<h1>Bulgular ve Tartışma</h1>",
    long(8, "Bulgu"),
    P(`Bulgular alanyazınla tutarlıdır${fn("b1", "Benzer sonuçlar farklı örneklemlerde de rapor edilmiştir.")}.`),
    "<h1>Sonuç ve Öneriler</h1>",
    long(2, "Sonuç"),
  ].join("");
  return {
    title: "Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Dijital Okuryazarlık Düzeylerinin İncelenmesi",
    content: main,
    researchData: {
      thesis: {
        templateId, templateVersion: "1.0.0",
        selection: { universityId: "mcbu", instituteId: "lee", degreeType: degree, language: "tr" },
        values: {
          YEAR: "2026", STUDENT_NAME: "Çağrı Şükrü ÖZDOĞAN", DEPARTMENT_NAME: "Eğitim Bilimleri", DEPARTMENT_NAME_EN: "Educational Sciences",
          PROGRAM_NAME: "Eğitim Programları ve Öğretim", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "İlknur ÇİÇEK",
          CO_ADVISOR_TITLE: "Dr. Öğr. Üyesi", CO_ADVISOR_NAME: "Gökhan IŞIK", PAGE_COUNT: "48",
          KEYWORDS: "dijital okuryazarlık, çevrimiçi öğrenme, öğretmen adayı, öz yeterlik, uzaktan eğitim",
          KEYWORDS_EN: "digital literacy, online learning, pre-service teacher, self-efficacy, distance education",
        },
        sectionContent: {
          abstract: P("Bu araştırmanın amacı, çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeylerini incelemektir.") + P("Araştırma ilişkisel tarama modelinde yürütülmüş; bulgular, düzeylerin cinsiyet ve sınıf düzeyine göre farklılaştığını göstermiştir."),
          "abstract-en": P("The aim of this study is to examine the digital literacy levels of pre-service teachers in online learning environments.") + P("The study used a correlational survey model; findings show that levels differ by gender and grade."),
          preface: P("Bu çalışma, öğretmen adaylarının dijital okuryazarlık düzeylerini ve çevrimiçi öğrenme deneyimlerini konu almaktadır.") + P("Tez sürecinde desteğini esirgemeyen danışmanım Doç. Dr. İlknur ÇİÇEK'e teşekkür ederim. Bu tez, Manisa Celal Bayar Üniversitesi Bilimsel Araştırma Projeleri Koordinasyon Birimi tarafından 2025-001 numaralı proje ile desteklenmiştir."),
          symbols: P("<b>BAP</b> Bilimsel Araştırma Projeleri") + P("<b>ÖSYM</b> Ölçme, Seçme ve Yerleştirme Merkezi") + P("<b>f</b> Frekans"),
          introduction: long(3, "Giriş") + P(`Araştırmanın önemi ve sınırlılıkları bu bölümde açıklanmıştır${fn("g1", "Sınırlılıklar Yöntem bölümünde ayrıca tartışılmıştır.")}.`),
          bibliography: P("Gilster, P. (1997). <i>Digital literacy</i>. Wiley.") + P("Karasar, N. (2020). <i>Bilimsel araştırma yöntemi</i> (35. baskı). Nobel Yayıncılık.") + P("Özdemir, Ş. ve Işık, Ç. (2024). Öğretmen adaylarının dijital okuryazarlığı. <i>Eğitim ve Bilim, 49</i>(1), 1–20."),
          appendices: P("EK 1. Dijital Okuryazarlık Ölçeği") + P("Ölçek maddeleri araştırmacının izniyle kullanılmıştır."),
          cv: P("Çağrı Şükrü ÖZDOĞAN, lisans eğitimini Manisa Celal Bayar Üniversitesi Eğitim Fakültesinde tamamlamıştır. Eğitim teknolojileri alanında çalışmaktadır."),
        },
        enabledSections: ["appendices", "cv"],
      },
    },
  };
}
