# Editör → PDF / DOCX kayma teşhisi — 16 Ekim 2026

Kullanıcı önce araştırma ve tartışma, daha sonra uygulama istedi. Bu çalışma teşhistir; `engine/src` ve `TxtNote/frontend/src` değiştirilmedi. İnceleme betikleri ve yeni çıktılar `orchestration/engine-work/export-diagnosis-20261016/` altında tutuldu. Eski kabul kanıtları değiştirilmedi.

## Sonuç

Tek bir genel sayfa yüksekliği hatası yok. Üç ayrı çıktı yolunda farklı kayıplar var:

1. **İçe aktarılan tez → DOCX:** editörde kullanılan düğüm bazlı kaynak biçimi DOCX yazıcısına tam taşınmıyor. Kaynak paragraf/run/tablo bilgileri sade HTML bloklarına dönüşürken bağlantı kopuyor; yazıcı bölümün genel kurallarını uyguluyor. Word, bu değiştirilmiş belgeyi yeniden yerleştiriyor.
2. **Tez editörü → PDF:** sıradan eşleşen metnin konum aktarımı ölçülen örneklerde doğru; fakat SVG, CSS şekil arka planı, dikey yazı ve bazı kırpma davranışları PDF çizicisine aktarılmıyor. Sayfa sayısı aynı kalırken grafik/ok/metin görünümü değişebiliyor.
3. **Normal akademik editör → PDF:** canlı makale DOM'u gönderilse de PDF yolu bunu ölçmüyor; HTML'den yeni kutular üretip sabit tipografiyle yeniden sayfalıyor. Kullanıcının özel punto değeri kayboluyor.

Üstbilgi logosu ve bölüm sınırını aşan Word alanları ayrıca doğrulanmış ortak veri aktarım eksikleri. Sadece font kurmak, kenar boşluğu değiştirmek veya alan güncellemesini kapatmak bu hataları gidermez.

## Yeni ölçüm ve kapsam

- Girdi: mevcut `SRC09_FINAL_595fec37` fixture; kaynak DOCX SHA-256 `a96608c4acfed017e94af51630662fadf5f77f604b3c045f7dc2b21f0aa4262b`. Kayıtlı fixture yeni bir Chrome oturumunda yüklendi; bu turda özgün DOCX yeniden içe aktarılmadı.
- Yalıtılmış Vite sunucusu 5242, HMR ve dosya izleyicisi kapalı; Chrome'da yerel font izni açık. Gerçek Dosya → PDF / Word düğmeleri kullanıldı.
- **Editör: 180 sayfa. Yeni PDF: 180 sayfa. Yeni DOCX: Word'de 206 sayfa.**
- Yeni DOCX Word'de açıkça `Fields.Update()` çağrılmadan önce **206**, çağrıdan sonra **206** sayfa. Aynı kontrol eski sabit kabul DOCX'inde de 206→206 verdi. Açılışta Word'ün kendi alan davranışları ayrıca devre dışı bırakılmadı; ölçüm yalnız açık güncelleme çağrısını ayırır.
- Kaynak kod dosyalarının tarayıcı koşusu öncesi ve sonrası SHA-256 envanterleri aynı. Tarayıcı `pageerror` 0.
- PDF için 1, 17, 66, 71, 72, 73, 83, 84, 85, 86, 91, 97, 102, 115, 153. sayfalar ölçüldü. Her sayfada kırpılmış olmayan, en az dört karakterli, sayfada tek geçen ve PDF'de aynı kelime olarak bulunan metin işlemleri eşleştirildi: sayfa başına 7–120 eşleşme. X ve baseline farklarının sayfa başına medyanları **0,0001 mm'nin altında**. Bu, yalnız eşleşen metnin başlangıç konumu kontrolüdür; kaybolan içerik, harflerin tüm şekillendirmesi, kelime sonu genişliği, döndürme veya tam görsel eşlik kanıtı değildir.
- Küçük normal akademik PDF kontrolünde ekrandaki **32 px = 24 pt** metin, dosyada **12 pt**. Standart paragraf da 12 pt; kullanıcı punto farkı kayboldu.

Kanıt: [tarayıcı sonucu](../engine-work/export-diagnosis-20261016/browser-result.json), [güncel karşılaştırma](../engine-work/export-diagnosis-20261016/current-comparison.json), [yeni DOCX Word ölçümü](../engine-work/export-diagnosis-20261016/current-word/word-result.json), [akademik punto örneği](../engine-work/export-diagnosis-20261016/academic-font-probe.json).

## 1. DOCX kaynak biçimi kaybı — doğrulandı

Akış:

`document.sections[].nodes[].properties.resolvedSource` → editör için düğüm bazlı CSS → `section.html` → `asBlocks` / `parseAcademicHtml` → `docxChildren` → genel bölüm stilleri → yeni DOCX.

Editörün `docx/projection.js` katmanı `data-txt-node-id` ile kaynak paragraf/run biçimlerini uygular. Buna karşılık `engine/src/docx/xml.js:49–85` HTML'i akademik bloklara çevirir; bloklar kaynak düğüm kimliği ve tam resolvedSource biçimini DOCX paragrafına bağlamaz. `engine/src/docx/body.js:149–160` sıradan paragrafı bölüm gövde/named stilinden kurar. `engine/src/docx/tables.js:72–92` hücre içi paragrafları da genel gövde/cellStyle ile yazar. Yerel çizim XML'inin saklanması, çevresindeki paragrafın aynı kalması anlamına gelmez.

Somut örnek, ilk kapak satırı `docx-15`, “YAŞAR ÜNİVERSİTESİ”:

- Kaynak/model: `align=center`, önce 18 pt, sonra 12 pt, `keepWithNext=true`, `keepLines=true`; kaynak run'larından gelen görünür yazı 13 pt.
- Güncel gerçek editör DOM'u: font 17,3333 px = 13 pt, ortalı, line-height 29,8975 px. İlk sayfa başında önceki boşluk için mevcut kaynak sayfa-başı kuralı uygulanıyor.
- Güncel DOCX XML'i: `w:jc=both`, `w:sz=24` = 12 pt, önce/sonra 120 twip = 6/6 pt, `keepNext=0`, kaynak Kapak stiline bağlı değil.
- Word'de ilk “YAŞAR” kelimesinin x konumu kaynak PDF'de yaklaşık 251,21 pt, eski çıktı Word PDF'de 113,42 pt. Görsel ayrışma **kapakta başlıyor**; s.17 ilk fark değildir.

Bunlar Word'ün aynı biçimi farklı yorumlaması değil; uygulamanın farklı biçim yazmasıdır. Büyük belgedeki +26 sayfa, paragraf/run, hücre/tablo, bölüm ve belge ayarlarının toplam etkisidir. Her nedenin toplam sayfaya ayrı katkısı ablation ile ölçülmedi; “tek başına şu ayar +26 yapıyor” sonucu verilmez.

Kaynak/çıktı paragraf XML ve model örnekleri: [model incelemesi](../engine-work/export-diagnosis-20261016/model-probe.json), [paket incelemesi](../engine-work/export-diagnosis-20261016/inspection.json). Kaynak 6343, çıktı 5415 `w:p` içeriyor; bu sayımlar metin kutuları ve boş paragrafları da kapsar, fark doğrudan kayıp metin sayısı değildir.

## 2. Bölümler arası Word alanları yanlış kapsamda doğrulanıyor — doğrulandı

Özgün belgede üç TOC alanı var: içindekiler, şekil listesi, tablo listesi. Her dış alan iki kaynak bölümüne yayılıyor: 9→10, 11→12, 13→14.

`asBlocks(section)` her bölümü tek başına `foldFieldMarkup` içine gönderiyor. `engine/src/docx/fields.js:127–145` her çağrıda yeni bir alan yığını başlatıyor ve çağrı sonunda boş olmasını bekliyor. Başlangıç bir bölümde, bitiş sonraki bölümde olduğu için her iki bölüm de `field-unbalanced` alıyor. Bu durumda **o bölümdeki tüm fldChar/instrText işaretleri** kaldırılıp önbellek metni bırakılıyor; içteki dengeli PAGEREF alanları da etkileniyor.

Yeni gerçek DOCX'te **0 TOC instruction** var. Eski ve yeni çıktı aynı davranışı gösteriyor. Kaynak `w:fldChar` 651, eski çıktı 348; eski çıktıda 98 PAGEREF de yok. Bunlar canlı alan kaybıdır; “TOC yeniden üretiliyor” diye açıklamak doğru değildir. İçe aktarılan liste bölümleri `generatedIndex` değildir; başka oluşturulmuş şablon içindekileri için bulunan üretim dalı bunu telafi etmiyor.

Bu hata sayfa numaralarının güncelliğini bozabilir. DOCX'in zaten alan güncellemesinden önce 206 sayfa olması, toplam yerleşim bozulmasını yalnız bu hataya bağlamayı engeller.

Kanıt: `model-probe.json → fieldDiagnostics` ve `current-comparison.json → docx.tocInstructions`.

## 3. Tez PDF çizicisi ekrandaki tüm katmanları aktarmıyor — doğrulandı

### SVG ve şekil arka planları

`engine/src/layoutPdf.js:341–353` SVG gördüğünde genel olarak çizmeden geri döner. Yalnız KaTeX kökü ve ChartEx/Pareto için özel yollar var. Güncel sütun/pasta/dağılım grafiklerinin ve şekil oklarının SVG önizlemeleri genel bir PDF çizim yoluna bağlı değil.

`engine/src/docx/shapes.js:170` bazı şekilleri CSS data-URI `background` ile gösterir. PDF toplayıcısı border, IMG ve metni işler; bu CSS arka plan görüntüsünü aktaran bir dal yok.

- s.83: editördeki sütun grafiği yeni PDF'de tamamen yok; grafik için ayrılan boşluk ve altyazı duruyor.
- s.97: editördeki akış şemasının okları/bağlantıları, elips ve elmas geometrisi PDF'de eksik; bazı yuvarlatılmış kutular düz dörtgen oluyor.

Karşılaştırma görselleri: [editör s.83](../engine-work/export-diagnosis-20261016/current-editor-p83.png), [PDF s.83](../engine-work/export-diagnosis-20261016/current-pdf-p83.png), [editör s.97](../engine-work/export-diagnosis-20261016/current-editor-p97.png), [PDF s.97](../engine-work/export-diagnosis-20261016/current-pdf-p97.png).

### Dikey metin ve kırpma

PDF yazıcısı DOM Range'in eksene paralel kutusunu ölçüp `layoutPdf.js:535` ile yatay `pdf.text(...)` yazar. Metin işleminde writing-mode/dönüş matrisi korunmuyor. s.97'de editörde dikey görünen Alternatif 1–3 metni PDF'de yatay ve parçalanmış çıkıyor.

Kırpma için `layoutPdf.js:375–376` yalnız en yakın `txt-table-cell-content` veya `p` öğesine bakıyor. Kaynak şekil çerçevesindeki `overflow:clip` / içerik kutusu sınırı bütün atalar üzerinden toplanmıyor. s.97'de editörde görünmeyen “Alternatifler / Kısıtlar” devamı PDF'de kutunun dışına çiziliyor.

PDF'in sayfaları yeniden kırmadığı ve sıradan eşleşen metin konumlarının korunduğu ölçüldü. Bu yoldaki doğrulanmış sorunlar içerik katmanları, yön ve kırpmadır; “PDF'te her paragraf genel olarak kayıyor” sonucu çıkmaz.

## 4. Üstbilgi logosu aktarılmıyor — doğrulandı

Kaynak `word/header1.xml` içindeki çizim, ilişki `image1.jpeg` ve içe aktarılan `headerFooterReferences.header.first.nodes` içinde mevcut. Veri ilk okumada kaybolmuyor.

`engine/src/docx/chromeImport.js:44–65` üst/altbilgide drawing/pict/table/object için desteklenmeyen düzen bildirimi üretip metin projeksiyonuna bu nesneyi katmıyor. `projectSourceChrome` gösterim kurallarını `displayText/displayParagraphs` üzerinden kuruyor. `engine/src/docx/sections.js:41–49` DOCX üstbilgisini de bunların yalnız metin/alan içeriklerinden yeniden yazıyor; saklanmış native header düğümlerini kullanmıyor.

Sonuç: logo editörde yok; editör üzerinden çizilen PDF'de yok; yeni DOCX'in bütün üstbilgilerinde toplam çizim sayısı **0**. Kaynak paket içinde bir resmin bulunması, görünür üstbilgide kullanıldığı anlamına gelmez. Bu bilinen desteklenmeyen yolun çıktıya etkisidir.

## 5. Normal akademik PDF özel tipografiyi kaybediyor — küçük örnekle doğrulandı

`AcademicEditor.jsx:257–270` canlı `article` öğesini export verisine ekliyor. `buildAcademicPdf` (`academicPdf.js:162–179`) bu DOM'u ölçmek yerine HTML'i parse edip `boxesFromBlocks` ve `paginateBoxes` çalıştırıyor.

`academicPdfLayout.js:78–116` run bilgilerini düzleştirirken punto/aile verisini taşımıyor. `:265–277` paragraf boyutunu `PDF_TYPE.body=12` ile sabitliyor. Ayrıca `academicPdf.js:223` justify hizasını left'e çeviriyor. Böylece ekranda ve PDF'de ayrı satır ölçümü/yerleşimi kullanılıyor.

Yalıtılmış örnek: `<span data-fmt-pt="24">CUSTOM LARGE PARAGRAPH</span>`. Uygulamanın gerçek A4/custom format CSS'iyle görünür boyut 32 px = 24 pt; gerçek `buildAcademicPdf` çıktısında CUSTOM/LARGE sözcükleri PDF karakter ölçümüne göre **12 pt**. `article` parametresi verilmesine rağmen sonuç aynı.

Kanıt: [ekran](../engine-work/export-diagnosis-20261016/academic-font-editor.png), [PDF görüntüsü](../engine-work/export-diagnosis-20261016/academic-font-pdf.png), `current-comparison.json → academicFontProbe`. Normal akademik DOCX'in canlı DOM snapshot yolu ayrı; bu küçük örnek onun Word yerleşim kabulü değildir.

## Tartışılacak düzeltme sırası

1. DOCX yazıcısında kaynak düğüm kimliği, çözülmüş paragraf/run/tablo biçimi ve desteklenen belge ayarlarını uçtan uca korumak. Şablon uyarlama modu ile kaynak koruma modunun niyetini ayrı tutmak.
2. Word alan yığınını bütün belge/bölümler boyunca korumak; geçerli çok bölümlü alanları önbellek metnine düşürmemek.
3. Üstbilgi/altbilgi için metin dışında desteklenen nesneleri ortak gösterim/dışa aktarım yoluna bağlamak.
4. Tez PDF çizicisine SVG/şekil arka planı, yazı yönü ve ata kırpma kurallarını taşıyan açık bir çizim sözleşmesi eklemek; sessiz öğe kaybını yakalamak.
5. Normal akademik PDF'in sabit tipografiyle yeniden kurma yolunu, gerçek editör biçimini kullanan ortak yerleşimle uzlaştırmak.
6. Yeni çıktıları gerçek Word ve PDF üzerinden içerik, alanlar, konum ve görsellerle karşılaştırmak. Yalnız sayfa sayısı veya nesne sayısının eşitliği yeterli değildir.

Bu teşhis, motoru tamamen yeniden yazmak veya Word'ü zorunlu tek render motoru yapmak gerektiğini kanıtlamıyor. Mevcut mimaride somut, tekrarlanabilir veri ve çizim kayıpları var. Önce bunları giderme yaklaşımı tartışılmalı; uygulama bu çalışmada yapılmadı.

## Sınırlar ve çalışma kaydı

- SRC09'un tamamının görsel eşliği, bütün üniversite şablonları, işletim sistemleri ve Office sürümleri doğrulanmadı. SRC10 bu çalışmada yeniden koşulmadı.
- 0,98068 kapsam oranı önceki kaynak/Word karşılaştırıcısının sıralı eşleşme ölçümüdür; burada yeni bir metin silinmesi oranı gibi kullanılmadı.
- Yeni DOCX'in +26 sayfasının hatalar arasındaki sayısal dağılımı ölçülmedi. Kaynak biçim kaybı ve 206 sayfa tekrar üretildi; ayrı nedenlerin katkısı için kontrollü varyantlar gerekir.
- İlk tarayıcı girişimi sandbox ağ engeli, sonraki girişim sandbox içi sunucuya erişim sorunu verdi. İlk başarılı sayfa yüklemesinde dışa aktarma sekmesi açılmadığı için düğme bulunamadı. Bunlar kabul sayılmadı; son koşu Dosya sekmesi üzerinden gerçek indirmelerle tamamlandı.
- Word incelemesi görünmez/salt okunur yapıldı; yalnız başlatılan Word örnekleri kapatıldı. Kullanıcı Word süreçleri kapatılmadı. Bu çalışma için açılan 5242 sunucusu iş sonunda durdurulur.
- Uygulama kodunda düzeltme veya commit yapılmadı. Bu bir test/build kapanışı değildir; yeniden üretim ve neden analizi raporudur.
