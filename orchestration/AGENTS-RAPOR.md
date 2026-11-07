# Bilinen hatalar ve tekrarını önleme kaydı

Oluşturulma: 26 Ekim 2026

Çalışma kuralları [BASLA.md](BASLA.md), açık işler [GOREVLER.md](GOREVLER.md) içindedir. Bu kayıt hata değerlendirme derslerini tutar; ikinci görev listesi değildir.

Bu dosya, inceleme sırasında yapılan yanlış değerlendirmeleri ve bunların tekrarını önleyecek çalışma kurallarını toplar. Şablon veya çıktı denetimine başlamadan önce ilgili kayıtlar okunmalıdır. Yeni bir hata öğrenildiğinde mevcut kayıtlar silinmeden buraya eklenmelidir. Bu dosya bir kabul garantisi veya bütün üniversitelere uygulanacak ortak tez kılavuzu değildir.

## 1. Kullanıcının içerik tercihlerini editör hatası saymak

**Yapılan hata:** Kullanıcının bilinçli yazdığı “Akademisyen” danışman unvanı ile seçtiği kısa bölüm yapısı, editörün biçim uyumsuzluğu olarak değerlendirildi. Bunları engelleyen kontroller eklendi.

**Doğru yaklaşım:** Bu görevde değerlendirilen şey editörün biçimlendirme ve dışa aktarma becerisidir. Unvan sözcüğü, bilimsel içerik, yazım tercihleri ve kullanıcının seçtiği bölüm sayısı bu kapsamda otomatik hata değildir. “Akademisyen” aynen korunur; kullanıcı istemedikçe sonuç bölümü veya yeni metin eklenmez.

**Uygulanan düzeltme:** Dört CBÜ şablonundaki danışman unvanı regex engeli kaldırıldı. LEE şablonlarına eklenen en az iki ana başlık ve sonuç başlığı zorlaması kaldırıldı. Tıp şablonunun önceden var olan kendi kaynak kuralları bu işlemde değiştirilmedi.

**Tekrarını önleme:** Bir çıktı engeli eklemeden önce bunun açık bir kaynak kuralı mı, kullanıcı tercihi mi, yoksa inceleyenin varsayımı mı olduğunu belirle. Varsayımı zorunluluk olarak kodlama. İçerik tercihi ile biçim hatasını ayrı değerlendir.

## 2. Önceki hata listesini doğrulanmış gerçek kabul etmek

**Yapılan hata:** İlk iddialardaki beklenen değerlerin hepsi doğruymuş gibi hareket etme riski oluştu. MCBÜ kılavuzu ve dosyanın gerçek XML değerleri bazı iddiaları doğrulamadı.

**Doğru yaklaşım:** Önce gerçek dosyayı ve ilgili kılavuz bölümünü incele. Önceki rapor veya kullanıcı tarafından aktarılan hata listesi bir inceleme girdisidir; tek başına düzeltme kanıtı değildir.

**Doğrulanmış CBÜ LEE 2025 bulguları:**

- Kılavuzun içindekiler örneği kendisini “İÇİNDEKİLER VII” olarak listeler. Bu girdiyi kendini listeliyor diye kaldırma.
- Simgeler ve kısaltmalar için kılavuz örneğinde 1,5 satır aralığı vardır. `w:line="360"` bu nedenle otomatik hata değildir; şekil/tablo dizinlerinin tek satır olması bütün dizinlere aynı aralığı uygulamayı gerektirmez.
- İncelenen kaynak dosyada “Keywords:” satırının ilk satır girintisi zaten `0` idi. `709` olduğu iddiası doğrulanmadı. Yapılmamış bir düzeltmeyi yapılmış gibi raporlama.
- Şekil/tablo bulunmadığında ilgili boş dizin sayfalarının mutlaka kaldırılacağını söyleyen açık bir kural doğrulanmadı. Böyle bir zorunluluk uydurma; bu çalışmada sayfalar korundu.

**Tekrarını önleme:** Her madde için gözlenen önceki değer, kaynak dayanağı, yapılan gerçek değişiklik ve son ölçüm ayrı kaydedilir. Değişiklik gerekmiyorsa açıkça “mevcut değer doğru; korundu” denir.

## 3. İçindekilerdeki ana bölüm düzenini bozuk sanmak

**Karışıklık:** İçindekilerde “BİRİNCİ BÖLÜM” ve altında “NEDEN TXTNOTE” satırlarının ortalı, sayfa numarasız görünmesi hata gibi algılandı.

**Doğrulanmış kural:** MCBÜ LEE 2025 kılavuzunun PDF 10. sayfasındaki içindekiler örneği ana bölüm numara/ad bloğunu iki satır, ortalı ve sayfa numarasız gösterir. “BİRİNCİ BÖLÜM” metni örneğin açık bir parçasıdır. Diğer içindekiler girdileriyle aynı görünmek zorunda değildir. Alt başlık bulunmaması bu bloğu kendiliğinden hatalı yapmaz.

**Tekrarını önleme:** İçindekilerde ana bölüm, alt başlık ve numarasız ön bölüm girdilerini kendi kaynak örnekleriyle karşılaştır. Ana bölüme genel sağ sekme/sayfa numarası kuralını körlemesine uygulama. Bu projede diğer girdilere eklenen nokta lideri ile kılavuzun numarasız ana bölüm bloğunu birbirine karıştırma.

## 4. Gövde başlığı ile içindekiler başlığının hizasını aynı sanmak

**Doğrulanmış kural:** MCBÜ LEE 2025 kılavuzunun PDF 11. sayfası bölüm başlıklarını 12 punto, koyu, büyük harf ve iki yana yaslı ister. Kısa başlıkta iki yana yaslama solda görünür. İçindekilerdeki karşılığı ise 10. sayfa örneğinde ortalıdır.

**Kontrol edilen çıktı:** Gövdedeki bölüm başlığı `w:jc="both"`, içindekilerdeki ana bölüm bloğu `w:jc="center"` idi. Bu iki görünümün farklı olması bu örnekte aktarım hatası değildir. Gövdedeki 1,25 cm ilk satır girintisi ve 1,5 satır aralığı da hata değildir.

**Tekrarını önleme:** Aynı metnin farklı belge rollerinde farklı stilleri olabileceğini dikkate al. Ekran görüntüsünü açıklarken hangi rolün hangi kurala uyduğunu belirt; yalnızca “doğru” demekle yetinme.

## 5. Bir enstitünün kurallarını bütün CBÜ şablonlarına taşımak

**Risk:** LEE ve Tıp uzmanlık tezleri aynı üniversiteye ait olsa da aynı biçim kurallarını kullanmaz.

**Doğru yaklaşım:** LEE için Times New Roman, 40/25/25/25 mm kenarlar ve ilgili dizin kuralları; Tıp için kendi kılavuzundaki Arial, 30 mm üst kenar ve diğer özel kurallar esas alınır. Ortak motor düzeltmesi ile şablona özgü kural ayrılır.

**Tekrarını önleme:** Her şablon kendi kaynağıyla test edilir. Aynı klasörde bulunmak, bütün görsel ayarları ortaklaştırmak için gerekçe değildir.

## 6. XML doğrulamasını tamamlanmış Word görsel kontrolü saymak

**Yapılan hata:** XML ve otomatik test bulguları anlatılırken Word'deki gerçek görünümün doğrulanma sınırı yeterince erken ve açık belirtilmedi.

**Doğru yaklaşım:** XML kontrolü, editör görünümü, PDF görünümü ve Microsoft Word'ün yeniden sayfaladığı görünüm farklı kanıtlardır. Birinin başarılı olması diğerlerinin tamamlandığı anlamına gelmez. “Enstitüden kesin geçer” denmez; yalnızca gerçekten kontrol edilen özellikler raporlanır.

**Bu çalışmanın sınırı:** Özgün tez gerçek editörün Word düğmesiyle üretildi. Kaynaktaki 12 metin/başlık öğesi çıktı XML'iyle eşleşti; kenarlar, gövde aralığı/girintisi, anahtar kelime girintileri, TOC/PAGEREF ve Roma/Arabik geçişi doğrulandı. İlgili test grubunda 141 test geçti. Bu özgün belge için ek PDF denemesi tamamlanmadı; Word'ün yeniden sayfaladığı görünüm de doğrulanamadı. PDF beklemesinin nedeni kesinleştirilmedi; nedeni kanıtsız biçimde font izni olarak ilan edilmemelidir.

**Tekrarını önleme:** Görsel kontrol yapılmadıysa yapılmış gibi bildirme. Test edilmiş senaryolardan “her olası çıktı hatasızdır” sonucu çıkarma. Biçim uygunluğu ile kurumun nihai kabul kararını ayır.

## Kaynak ve kanıtlar

- [MCBÜ LEE 2025 kaynak DOCX](../Butun-Sablonlar/Ege/Manisa%20Celal%20Bayar%20Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx)
- [Ayrıntılı şablon düzeltme raporu](raporlar/MCBU_SABLON_DUZELTMELERI_2026-10-26.md)
- Kılavuz görsel kanıtı: `.test-tmp/tez-format/guide-page-10.png`, `guide-page-11.png`.
- Özgün tez çıktı kanıtları: `.test-tmp/validation/testtez-original-20261026/`.
- Kalıcı regresyon testleri: `engine/src/templates/mcbuConformance.test.js`.

## Yeni kayıt ekleme biçimi

Her yeni kayıtta tarih, yanlış değerlendirme veya davranış, doğrulanmış doğru bilgi, kaynak/kanıt, yapılan düzeltme ve tekrarını önleyecek kontrol bulunmalıdır. Kullanıcının bilinçli içerik tercihleri “bilinen hata” listesine eklenmemelidir.
