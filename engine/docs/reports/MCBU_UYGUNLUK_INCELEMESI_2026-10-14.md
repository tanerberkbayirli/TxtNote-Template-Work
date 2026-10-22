# MCBÜ tez şablonları ve çıktıları — 14 Ekim 2026

**Karar: Mevcut sürüm için tam uygunluk onayı verilmemeli.** Lisansüstü kılavuzun güncelliği canlı resmî kaynaktan doğrulandı ve temel biçim kontrolleri geçti. Ancak yüksek lisans ve doktora Word çıktılarının içindekiler alanı güncellendiğinde resmî örneğin gerektirdiği satırlar kayboluyor ve bölüm satırlarının düzeni değişiyor. Kılavuz içindeki çelişkiler için de enstitü teyidi gerekiyor.

Bu inceleme yüksek lisans, doktora ve tıpta uzmanlık olmak üzere mevcut üç MCBÜ şablonunu kapsar. Resmî sitede ayrıca yayımlanan **tezsiz yüksek lisans dönem projesi** kılavuzu bu üç şablonun kapsamında değildir. Kurumun bütün programlarına uygunluk iddiası bu incelemeden çıkarılamaz.

## Güncel resmî kaynak

[LEE ana sayfası](https://lee.mcbu.edu.tr/) 14 Ekim 2026 tarihinde yeniden okundu. Öğrenci menüsündeki tez kılavuzu bağlantıları aşağıdaki dosyalara yöneliyor:

- [Resmî Word kılavuzu](https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx): yeniden indirildi; 77.831 bayt; SHA-256 `e607f8f7405ae10eee4880e7d52f660517fb595625f065088ec5f437f08238c7`. Depodaki kaynakla bayt düzeyinde aynı. HTTP Last-Modified: 22.10.2025.
- [Resmî PDF kılavuzu](https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-GTSM221020251445.pdf): yeniden indirildi, 12 sayfa; SHA-256 `cb7a4a6d433d360e0087f24d27ab8c40aece4c2e8be0819ab63cf19e91a6055f`. Önceki kaynak notunda kayıtlı değerle aynı. Kapak, taahhütname, özet, içindekiler ve kural sayfaları görsel olarak incelendi.

Tıp için depodaki altı sayfalık kılavuzun kuralları yeniden okundu. [Kayıtlı resmî PDF adresi](https://tip.mcbu.edu.tr/db_images/file/asistantezyazimkilavuzu-43TR.pdf) bu incelemede zaman aşımı/bağlantı kesilmesi nedeniyle indirilemedi. Dolayısıyla bu eski belgenin bugün geçerli olduğu **yeniden doğrulanamadı**. PDF metaverisi 2014 tarihlidir; metin eski üniversite adını kullanır.

Canlı kaynak kayıtları: [live-sources.json](../validation/mcbu-review-20261014/live-sources.json). Yeniden indirilen LEE PDF'sinin SHA-256 değeri yukarıda ayrıca kayıtlıdır.

## Gerçek çıktı kontrollerinin sonucu

Kontroller uygulamanın gerçek tez editöründeki PDF ve Word indirme düğmelerini kullandı. DOCX belgeleri Microsoft Word 16.0, build 16.0.20430, tr-TR ortamında açılıp PDF'e çevrildi. LEE belgeleri ayrıca bütün alanlar güncellenerek ikinci kez Word PDF'ine çevrildi. PDF üretiminde kullanılan fontlar ve ortam bilgileri kaydedildi.

- **LEE yüksek lisans + doktora:** 96 PASS, 4 FAIL, 1 UNKNOWN. Dört FAIL, iki varyanttaki alan yenileme sorununun iki farklı kontrolle saptanmasıdır; dört bağımsız hata anlamına gelmez. UNKNOWN, birden fazla kaynak çelişkisini birlikte izler.
- **Tıp:** mevcut kontrol kümesinde 50 PASS, 1 INFO; 0 FAIL. Bu küme aşağıdaki içerik ve kaynak güncelliği açıklarını kapsamaz; tam uygunluk onayı değildir.
- Yüksek lisans: uygulama PDF'i ve ilk Word PDF'i **34/34 sayfa**. Doktora: **35/35 sayfa**. Tıp: **30/30 sayfa**. Sayfa sayısının eşit olması tüm yerleşimin eşit olduğunu kanıtlamaz.

LEE için daha önce eksik olan kaynak konumlu kontrol tanımları ve iki stres belgesi eklendi. Önceki verilerde yanlış doldurulmuş tez başlığı, üniversite/enstitü ve şehir alanları düzeltildi. Test içeriği başlık düzeyleri 1–4, Türkçe karakterler, uzun anahtar kelimeler, dipnotlar, şekiller, çok sayfalı tablo, kaynakça, ekler ve doktora özgeçmişini içerir. Bu belgeler sentetik test verisidir; bilimsel içerikleri görüşmede örnek tez olarak sunulmamalıdır.

**Geçen LEE kontrolleri:** A4; sol 40 mm ve diğer kenarlar 25 mm; DOCX üst/altbilgi mesafesi 12,5 mm; çizilen kapsamda gömülü gerçek Times New Roman; gövdede 12 punto ve 1,5 satır aralığı; DOCX'te 1,25 cm girinti ve 6 punto paragraf aralığının varlığı; iç kapakta numara olmaması; özetin I ve girişin 1 ile başlaması; alt ortadaki sayfa numaraları; 10 punto dipnot; satıra sığmayan anahtar kelimelerden sonra boşluk; ana bölüm başlığının koyuluğu; ilk açılışta içindekiler sayfa eşlemesi; doktora özgeçmiş başlığının 14 punto, koyu ve ortalı olması; paket ilişkileri ve düzen raporu kontrolleri.

Buradaki bazı XML kontrolleri ilgili değerin **varlığını**, bazı PDF kontrolleri baskın ölçüyü veya sınırlı bir metin kapsamını sınar. Bu sonuçlar bütün paragrafların ve bütün gelecek kullanıcı belgelerinin tek tek uygun olduğu anlamına gelmez. Kaynak ve çıktıların seçilmiş sayfaları görsel olarak da karşılaştırıldı; her sayfanın her nesnesi için ayrı görsel kabul verilmedi.

## Kesin bulgular

### F1 — Yüksek öncelik: Word güncellemesi içindekiler satırlarını siliyor

**Gereklilik:** LEE Word kılavuzu `word/document.xml` G[294]–G[296] ve resmî PDF s.10; Şekiller Dizini, Tablolar Dizini ve İçindekiler kendi sayfa numaralarıyla içindekilerde yer alır. G[n], belge gövdesinin sıfır tabanlı çocuk sırasıdır; tablolar da sayılır.

**Gerçek çıktı:** Yüksek lisans ve doktora DOCX'leri ilk açıldığında fiziksel s.9'da bu üç satır vardır. Word'de tüm alanlar güncellenince üçü de kaybolur. Toplam sayfa sayısı değişmez; bu yüzden yalnız sayfa sayısına bakan bir kontrol sorunu kaçırır. Güncellenmiş DOCX'ten yeniden PDF almak da bu değişmiş içindekileri üretir.

**Olası bileşen:** `engine/src/docx/body.js` içindeki generatedIndex dalı, bölüm başlığını üretip diğer özel sayfalardaki TC alanı yoluna ulaşmadan döner; `engine/src/export.js` ve `engine/src/docx/fields.js` canlı TOC alanının kaynaklarını yönetir. Üretilen dizin başlıklarının Word alan güncellemesinde de indeks kaynağı olarak kalması gerekir. Bu incelemede üretim kodu değiştirilmedi.

**Tekrar:** MCBÜ yüksek lisans/doktora belgesini Word'e aktar; içindekilerdeki üç satırı gör; bütün alanları güncelle; aynı sayfayı yeniden kontrol et. Otomatik koşuda bütün alanlar iki kez güncellendi ve Word yeniden sayfalandırıldı.

### F2 — Orta öncelik: Word güncellemesi bölüm satırlarının iki satırlı düzenini bozuyor

**Gereklilik:** Resmî LEE PDF s.10 ve Word G[299]–G[300], G[311]–G[312]; bölüm adı ile bölüm başlığı ayrı satırlarda gösterilir. Mevcut şablon bu örnek düzenini benimsemiştir.

**Gerçek çıktı:** İlk Word/PDF çıktısında `BİRİNCİ BÖLÜM` ve `KURAMSAL ÇERÇEVE` ayrı satırlardadır. Word alan yenilemesinden sonra aynı satıra birleşirler. Diğer bölüm başlıklarında da aynı davranış görülür. Fiziksel s.9–10 dağılımı değişir; belge yine 34/35 sayfada kalır.

**Olası bileşen:** Word'ün canlı TOC üretimi ile önceden yazılmış satır sonlarının temsil biçimi. Bu, üniversiteden karar bekleyen bir kaynak çelişkisi değil; seçilmiş mevcut düzenin Word'de korunamamasıdır.

### F3 — Yüksek öncelikli kapsam açığı: Tıp kontrolünden geçen belge içerikçe uygun olmayabiliyor

Tıp kılavuzu s.3, VI–VIII ve Ek-2 bölüm sırasını; s.4 XV ve kaynak örnekleri ise geçiş sırasına göre sayısal atıf/kaynakçayı tanımlar. Mevcut test PDF'inde giriş yerine `I. KURAMSAL ÇERÇEVE` ile başlanıyor; kaynakçada yazar-yıl biçiminde numarasız kayıtlar ve metinde `(Karasar, 2020, s. 45)` bulunuyor. Buna rağmen mevcut 50 biçim kontrolü geçiyor.

Şablonda `citationStyle: numeric` ve `numbered: true` var. Motor yapılandırılmış kaynakça girdilerini numaralayabiliyor; fakat kullanıcı kaynakça bölümüne serbest HTML/metin yazdığında bu içerik korunuyor. Burada yanlış atıf düzeni otomatik dönüştürülmüyor ve uygunluk kontrolü tarafından yakalanmıyor. Bu nedenle “sayısal kaynakça tanımlı” ifadesi, “kullanıcının çıktısı sayısal kaynakça kurallarına uygun” sonucunu sağlamaz.

İngilizce özette İngilizce tez başlığı, önsöz/özetin sayfa sınırı ve gereken ana bölümlerin varlığı da Tıp kabul kapsamına eklenmelidir. Bunlar bilimsel içerik üretme işi değil; yazarın dolduracağı yapı ve denetim gereksinimleridir. Görüşmede Tıp şablonu için tam uygunluk iddiası kullanılmamalı.

## Üniversiteden teyit gerektirenler

1. **Özet/Abstract satır aralığı:** resmî PDF s.4 aynı sayfada tek satır tarifini ve 1,5 satır notunu içeriyor; Word G[96], G[104], G[130]. Mevcut çıktı 1,5 satır kullanıyor. Enstitü hangisini istiyor?
2. **Kapaktaki boşluklar:** resmî PDF s.1'deki 9/1 satır tarifleriyle DOCX'in gerçek boş paragraf dizisi uyumlu değil; G[10], G[32]. Mevcut şablon örnek/XML yapısını izliyor. Görsel örnek mi, açıklama satır sayıları mı esas alınmalı?
3. **Bölüm açılışının hizası:** kural metni G[332] ve PDF s.11 iki yana yaslı başlık diyor; içindekiler örneği ortalı iki satır veriyor. Ana metinde bölüm açılışı için enstitüce kabul edilmiş bir örnek istenmeli. Mevcut şablon ana metinde kural metnini, içindekilerde örneği izliyor.
4. **Özetteki sayfa sayısı:** `xxx sayfa`, fiziksel toplam mı, ana metnin numaralı sayfa sayısı mı? Mevcut sistem fiziksel toplamı kullanıyor. G[102], G[128].
5. **Tıp:** 2014 metaverili ayrı kılavuz hâlâ geçerli mi; sayfa numarası alt orta mı üst sağ mı; kapakta eski üniversite adı güncellenmeli mi? Kılavuzun §1.4 sayfa numarası tarifleri çelişiyor.

Enstitü örneğinde yazan `Graduate School of Education` ve `M.Sc. Thesis` aynen taşınıyor. Özellikle sosyal bilimlerde yüksek lisans derecesinin İngilizce adı için birim/program düzeyinde teyit alınması yararlı olur; örneğin varlığı bütün programlarda aynı İngilizce derece adının doğru olduğunu kanıtlamaz.

Önceki projede örnek/XML önceliğiyle alınmış uygulama kararları üniversitenin onayı olarak değerlendirilmedi. Kaynakta belirtilmeyen kaynakça asılı girintisi, bazı başlık/nesne boşlukları ve tablo ayrıntıları için de evrensel uygunluk iddiası verilmedi.

## 15 Ekim görüşmesi için kullanılabilecek ifade

“Şablonları yayımladığınız güncel kılavuzun aynı dosyasına dayandırdık. Temel sayfa ve yazı ölçülerini gerçek PDF ve Word çıktılarında kontrol ettik. Word içindekiler güncellemesinde düzeltilecek bir sorun tespit ettik. Kılavuzdaki özet aralığı, kapak boşlukları ve bölüm açılışı gibi çelişkileri sizinle kesinleştirip son örnek çıktıya göre kabul almak istiyoruz.”

**Bu aşamada kullanılmaması gereken iddia:** MCBÜ'nün bütün tezleri için yüzde yüz uygunluk, kurum onayı veya her Word/PDF çıktısına uygunluk garantisi.

## Kanıt ve yeniden çalıştırma

- [LEE son kontrol JSON'u](../validation/mcbu-review-20261014/lee-final/check-20261014-1917.json)
- [Tıp kontrol JSON'u](../validation/mcbu-review-20261014/tip/check-20261014-1909.json)
- [Word güncellemesi sonrası görsel kanıt](../validation/mcbu-review-20261014/visual/toc-after-refresh.png)
- [Kaynak PDF görsel inceleme](../validation/mcbu-review-20261014/visual/official-guide.png)
- [Üretim motoru ve kaynak dosya hash'leri](../validation/mcbu-review-20261014/engine-and-sources.sha256.json)

Son LEE çıktıları `validation/mcbu-review-20261014/lee-final/run/` içindedir: `master` ve `phd` için uygulama PDF'i, DOCX, ilk Word PDF'i, alan güncellemesi sonrası Word PDF'i, alan dökümü ve ortam kaydı bulunur. İlk koşu `lee/` altında korunmuştur; kapaktaki numarasız sayfanın kontrol API'sinde boş dizeyle temsil edilmesini düzelttikten sonra iki varyanttan da yeniden çıktı alındı. İlk koşudaki dört kapak FAIL'i ürün hatası değildi; son sonuçta yoktur.

```powershell
$env:THESIS_BASE_URL='http://127.0.0.1:5175'
node orchestration/tools/check.mjs --target mcbu-lee --word --out orchestration/validation/mcbu-review-RECHECK/lee
node orchestration/tools/check.mjs --target mcbu-tip-uzmanlik --word --out orchestration/validation/mcbu-review-RECHECK/tip
```

Üretim şablonları ve motor değiştirilmedi. Kaynaklı kontrol tanımları, LEE test verileri ve inceleme kanıtları eklendi; commit yapılmadı. Genel motor kabulünün önceki açık uzun belge sorunları bu çalışmanın kapsamında kapatılmadı.
