# MCBÜ Lisansüstü DOCX biçim ve yapı incelemesi

Tarih: 26 Ekim 2026

İncelenen dosya: C:\Users\CASPER\Desktop\TxtNote-editörü-ile-tez-yazmak-artık-çok-kolay.docx

Sonuç: Temel sayfa ve yazı biçimi büyük ölçüde uyumlu. Mevcut hali için koşulsuz biçim uygunluğu onayı verilemez; paragraf boşlukları ve ana bölüm yapısı nedeniyle düzeltme istenmesi beklenebilir. Bu, enstitü kararı değil, belge ve kılavuz karşılaştırmasına dayalı değerlendirmedir. Geçme yüzdesi hesaplamaya elverişli kabul/ret verisi bulunmamaktadır.

İçeriğin bilimsel yeterliliği, anlatım dili, benzerlik oranı ve öğrencilik/mezuniyet koşulları değerlendirme dışında tutulmuştur. Word dosyası ve şablon JSON dosyaları değiştirilmemiştir.

## Kaynaklar

1. Yerel 2025 kılavuzu: Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx.
2. Enstitünün 26 Ekim 2026 tarihinde erişilen resmî ana sayfasındaki güncel Word ve PDF kılavuz bağlantıları:
   - https://lee.mcbu.edu.tr/
   - https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx
   - https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-GTSM221020251445.pdf
3. Aynı sitedeki Yüksek Lisans Tez Savunma ve Mezuniyet akışı:
   - https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-YGRB010620261134.pdf

Sayfa numaraları resmî PDF dosyasının 1'den başlayan fiziksel sayfalarıdır. XML paragraf numaraları word/document.xml içindeki doğrudan w:body/w:p elemanlarında 1'den başlar.

## Doğrulanan uygun özellikler

- 18 bölüm tanımında A4: 11906 × 16838 twip; sol kenar 2268 twip (yaklaşık 4 cm), üst/alt/sağ 1417 twip (yaklaşık 2,5 cm). Kılavuz PDF s.11.
- İncelenen görünen metinlerde Times New Roman; gövdede sz=24 (12 punto), kapak kurum ve tez başlığında sz=28 (14 punto). 1 punto gibi küçük run değerleri boşluk üretmek için kullanılan boş paragraflarda; bunları görünür yazı puntosu hatası saymadım.
- Gövde metin paragraflarında line=360, lineRule=auto, firstLine=709, jc=both: 1,5 satır, 1,25 cm ilk satır, iki yana yaslama. Kılavuz PDF s.11.
- GİRİŞ, NEDEN TXTNOTE ve KAYNAKÇA başlıkları 12 punto, kalın, büyük harf ve iki yana yaslı. Bölüm başlangıçları nextPage bölüm düzeniyle kurulmuş.
- Kapakta 9 satır için exact line=2484, 5 satır 14 punto için 1610, 5 satır 12 punto için 1380 twip boşluk tanımları var. Kılavuz PDF s.1'deki 9/5/5 satır tariflerinin teknik karşılıkları mevcut; nihai konumlar görsel kontrol gerektiriyor.
- Kapak/sırt/taahhütname footer parçaları boş; özet için upperRoman/start=1 ve gövdede decimal/start=1 tanımları mevcut. Sayfa alanları footer XML'lerinde var. Gerçek sayfa taşmaları ve sayfa sayısı render olmadan doğrulanamaz.
- Ön bölüm sırası: Özet, Abstract, Önsöz ve Teşekkür, Simgeler ve Kısaltmalar, Şekiller, Tablolar, İçindekiler. Resmî içindekiler örneğiyle uyumlu (PDF s.10).
- İçindekilerde 10 satır; her birinde gerçek w:tab ve right/dot/8221 twip sekme tanımı var. İÇİNDEKİLER VII girdisi kılavuz örneğinde de bulunduğundan hata değil.
- Simgeler girdisi line=360; kılavuz s.7 bunu 1,5 satır olarak istiyor. Şekil/tablo dizini için s.8-9 tek satır tarifi var. Dizin türlerinin aralıklarının farklı olması tek başına kusur değil.
- Özet ve Abstract metinleri line=240; anahtar kelime satırları firstLine=0 ve her dilde beş virgülle ayrılmış terim içeriyor. Kılavuz s.4-5.
- Önsöz metni line=240 ve firstLine=709: ilgili özel örnekle uyumlu (s.6). Genel kuralların 1,5 satır ifadesiyle özel örneğin tek satır ifadesi arasındaki farklılık, özel örnek esas alınarak değerlendirildi.

## Düzeltme veya teyit gerektiren bulgular

### 1. GİRİŞ paragrafları arasında fazladan boş paragraflar — doğrudan biçim sorunu

Kural: PDF s.11, paragraflar arasındaki boşluk 6 nk olmalıdır.

Ölçüm: 102. ve 104. XML paragrafları boş; her ikisi de line=360 ve before=120 taşıyor. Sonraki dolu paragraflarda da before=120 var. Böylece standart 6 nk aralığa ek olarak boş bir metin satırı yerleştiriliyor. Bunlar bölüm sonu veya yer imi taşıyan paragraflar değil.

Öneri: Yalnız bu gereksiz gövde boş paragraflarını kaldırıp paragraf aralığını tek bir tutarlı 6 nk tanımıyla kurmak. Bölüm sonu ve özel kapak boşluklarına dokunmamak.

### 2. Ana bölüm ve sonuç yapısı — yüksek öncelikli yapı riski

Mevcut gövde başlıkları GİRİŞ → NEDEN TXTNOTE → KAYNAKÇA. Ayrı sonuç/sonuç ve öneriler başlığı veya numaralı bölüm/alt başlık düzeni yok.

Dayanak: PDF s.10, BİRİNCİ BÖLÜM ve alt başlık hiyerarşisini gösteriyor; s.11 çalışmanın alanına göre bölüm yapısını ve sonuç bölümünü ele alıyor. Kılavuz bütün alanlar için aynı başlık listesini zorunlu tutmadığından bunu her durumda kesin ret nedeni olarak sınıflandırmak doğru olmaz.

Öneri: Gerçek tez hazırlanırken danışmanın alan için benimsediği bölüm yapısı belirlenmeli; gerekli ana bölüm, alt bölüm ve sonuç başlıkları oluşturulmalı, içindekiler buna göre güncellenmeli. Bu bir metin değerlendirmesi değil, mevcut başlık iskeletinin teslim riski değerlendirmesidir.

### 3. Ad/soyad ve danışman unvanı sunumu — örneğe göre tutarlılık riski

Kapak ve özetlerde Taner Berk Bayırlı yazıyor; kılavuz örnekleri Ad SOYAD / Name and LASTNAME kullanıyor. Danışman satırında Akademisyen Osman Can Çetlenbik yazıyor; iç kapak örneğinde Doç. Dr. Ad SOYAD biçiminde akademik unvan gösteriliyor (PDF s.1,4,5).

Öneri: Soyadın büyük harf sunumunu örneğe uydurmak; danışmanın gerçek akademik unvanı ve kurumda kayıtlı anabilim dalı/program adını doğrulamak. Kimsenin unvanı tahmin edilmemeli. Bunlar kenar boşluğundan bağımsız kapak bilgi bloğu kontrolleridir.

### 4. İçindekiler ve sayfa sayısı sabit metin — güncelleme riski

İçindekilerde gerçek Word TOC alanı yok. Dizin sayfaları ve gövde sayfaları elle yazılmış değerler; özetlerdeki 13 sayfa / 13 pages de sabit metin.

Bu kılavuzda otomatik TOC zorunluluğu bulunmadığından mevcut yöntem doğrudan ihlal değil. Ancak paragraf aralığı veya bölüm yapısı değişince sayfa numaraları yeniden kontrol edilmezse uyumsuzluk oluşabilir. Word/PDF çıktısı üzerinde bütün numaralar tek tek eşleştirilmeli.

### 5. Boş şekil ve tablo dizinleri — açık hüküm yok

Belgede numaralı şekil/tablo başlığı yok; bulunan görsel kapak logosu, tablo ise tez sırtı düzeni. Bunlar araştırma şekil/tablo girdisi olarak değerlendirilmedi.

Kılavuz, içerik yokken bu dizinlerin zorunlu olarak tutulmasını veya çıkarılmasını belirtmiyor. Bu nedenle boş dizinleri kesin hata veya zorunlu sayfa diye sunmuyorum. Son teslimde enstitü uygulamasıyla teyit edilmeli.

### 6. Klasörde iki farklı yüksek lisans şablonu — uygulama tarafında tutarlılık riski

cbu-lee-master-tr-kilavuz.json içindeki kaynak notları, resmî kapak düzeninin bulunmadığı ve bölüm sırasının genel kabullerden üretildiği yönünde eski varsayımlar içeriyor. mcbu-lee-master-tr-v1.json ise mevcut resmî 2025 Word bağlantısını ve doğru ön bölüm sırasını içeriyor.

Bu, mevcut Word dosyasının otomatik olarak eski şablondan üretildiği anlamına gelmez; hangi şablonun editörde seçildiği bu incelemede izlenmedi. Ancak ürün düzeyinde CBÜ uyumluluğu iddiası için iki tanımın hangisinin etkin olduğunun kontrol edilmesi gerekir. JSON içindeki PASS değeri enstitünün belgeye verdiği uygunluk onayı değildir.

## Teslim sürecine ilişkin doğrulama

Resmî yüksek lisans savunma/mezuniyet akışının s.2'si, gönderilen tezin kılavuza uygunluğunun enstitü tarafından kontrol edildiğini belirtiyor. Dolayısıyla doğru kenar boşlukları tek başına kabul güvencesi değil.

Aynı akışın s.3'ü elektronik tezde ıslak imzalı sayfaların yer almamasını, s.4'ü ise ciltli tezde taahhütnamenin imzalı olmasını belirtiyor. Bu nedenle DOCX'te imza görseli veya jüri onay sayfası yok diye genel bir zorunluluk varsayımıyla hata yazılmadı. Dış teslim formları bu Word dosyasının kapsamından ayrıdır.

## Kontrol sınırı ve karar

Resmî PDF kılavuzunun kapak, Özet ve Abstract sayfaları görsel olarak incelendi. Ancak tez DOCX'i için LibreOffice yok ve Word COM bağlantısı kullanılamıyor; gerçek tez sayfaları render edilemedi. Kapakta taşma, boş sayfa, son sayfa sayısı, sayfa numaralarının görünür konumu ve içindekiler eşleşmeleri bu nedenle kesinleşmedi.

Biçim açısından değerlendirme: temel şablon başarılı; teslim öncesi düzeltme ve çıktı denetimi gerekiyor. Bilimsel içerik tamamlanmış varsayılsa bile mevcut dosyaya doğrudan “enstitüden geçer” onayı vermek için yeterli kanıt yok.
