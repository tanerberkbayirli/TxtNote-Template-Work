# Konum, sayfa numarası ve içindekiler — 19 Ekim 2026

**Sonraki doğrulama:** Bu raporda ayrı açık bırakılan 0,2962 mm içindekiler kayması aynı gün düzeltildi. Asıl fark 0,0275 mm'ye indi; beş TOC kontrolünde en büyük fark 0,031 mm altında. [Yeni kapanış ve kanıtlar](ICINDEKILER_DIKEY_HIZALAMA_2026-10-19.md). Aşağıdaki ölçümler ilk kapanışın tarihsel kaydıdır.

Kullanıcının seçip kapatmamı istediği işlerden üç ortak aktarım görevi, aşağıdaki sınanmış kapsamlarıyla tamamlandı. Çalışma 18 Ekim'de başladı, son Word kontrolleri 19 Ekim'de kapandı. Üretim değişiklikleri üniversiteye özgü biçim değerlerini değiştirmiyor; önceden bulunan çalışma ağacı değişiklikleri korundu.

## Kapanan görev 1: aynı sayfada taşınan sabit metnin Word konumu

Editör sabit başlık/paragrafların serbest x/y/genişlik bilgisini kullanırken Word yazıcısı yalnız yazı biçimini alıyordu. Kontrollü taşınmış başlıkta başlangıçta Word yaklaşık 5 mm solda ve 39,9 mm yukarıdaydı.

DOCX aktarımı artık dışa aktarım anındaki görünür belge geometrisini ölçüyor. Kaydedilmiş serbest konum, sayfaya bağlı gerçek Word paragraf çerçevesine yazılıyor. Metin düzenlenebilir kalıyor; paragrafın yer imleri ve dizin kaynak alanları korunuyor. Eski akıştaki saklı boşluk bir gerçek boşluk paragrafıyla taşınıyor; metin resme dönüştürülmüyor ve iki kere yazılmıyor.

Son gerçek Word/PDF farkı x yönünde **0,0076 mm**, baseline yönünde **0,0185 mm altında**. Word alan güncellemesinden sonra aynı konum kaldı. Başlık ve normal sabit paragraf yolları birim testinde ayrı kontrol edildi. Bu kapanış aynı fiziksel sayfadaki tek paragraf/başlık konumuna aittir; sayfalar arası sürükleme ve yoğun çok satırlı çerçevelerin genel kabulü değildir.

## Kapanan görev 2: sayfa bazında numara konumu ve biçimi

Seçilen sayfada numara ekranda 35 mm'den başlıyor, 16 punto ve kırmızı görünüyordu. Eski Word çıktısı varsayılan ortadaki 12 punto siyah numarayı kullanıyordu: x farkı yaklaşık 68,31 mm, baseline farkı 11,09 mm idi.

Ölçülen numara kutusu Word'e sayfaya bağlı düzenlenebilir bir kutuda aktarılıyor. Sayı gerçek `PAGE` alanı; sabit yazı değil. Koşullu alanlar aynı üst/altbilgiyi paylaşan sayfalar arasında ayrım yapıyor: yalnız hedef etikette özel konum görünür, o sayfada varsayılan numara bastırılır. Diğer sayfalarda varsayılan numara korunur.

Tek sayfalı ve aynı grupta iki sayfalı gerçek arayüz örnekleri sınandı. Özel numarada Word/PDF x farkı **0,0188 mm**, baseline farkı **0,0049 mm altında**; renk ve nominal 16 punto korundu. İkinci sayfa 12 punto ve varsayılan konumunda kaldı; x/baseline farkları **0,045 mm altında**. Hiçbir sayfada çift numara yok. Word alan güncellemesinden sonra da aynı sonuç alındı. Silme, daha zengin üst/altbilgi nesneleri ve kaynak-koruma kipinin tamamı bu kabulün kapsamında değildir.

## Kapanan görev 3: özel içindekiler satırını Word yenilemesinde koruma

Başlangıç DOCX'inde elle değiştirilmiş satır metni ve biçimi görünüyordu; Word alanları güncellediğinde özel metin kaybolup asıl başlık geri geliyordu. Neden, yalnız önbellekteki satırın değiştirilmesi; Word'ün yeniden üretimde okuduğu kaynakta özel etiket ve ayrı görünüm bulunmamasıydı.

Özel satır metni için canlı `TC` kaynağı, farklı kayıtlı görünümler için ayrı `TOC` çıktı stilleri üretiliyor. İlgili asıl başlık dizine ikinci kez girmiyor; belgedeki başlık metni ve düzeyi değişmiyor. Normal satırların biçimleri özel satırla ezilmiyor. Dizin kilitlenmedi, sayfa alanları düz metne dönüştürülmedi.

Gerçek Word tam alan güncellemesinden sonra özel etiket tek satır olarak, aynı 16 punto ve renk ile korundu. Güncelleme öncesi ve sonrası Word satırının konumu/biçimi birebir aynı; asıl kaynak başlık belgede bir kez mevcut. Yazıcının dokuz TOC çıktı seviyesi normal ve özel görünüm profilleri arasında paylaşılıyor. Kapasite aşılırsa başka bir stilin üzerine yazmak yerine açık hata veriliyor.

Bu görev **Word yenilemesinde özel etiket/biçimin korunması** kapsamında kapandı. İncelenen bu satırda PDF ile Word arasında yaklaşık **0,2962 mm baseline farkı** hem güncellemeden önce hem sonra var. Bu ayrı dikey hizalama işi açık kaydedildi; genel içindekiler görsel eşliği ilan edilmedi.

## Kanıt ve kontroller

MCBÜ LEE ve AKÜ SBE şablonlarıyla dört gerçek arayüz belgesi üretildi. Son belgeler editör/PDF/Word'de sırasıyla **12, 12, 12 ve 13 sayfa**; Word alan güncellemesi sonrasında da aynı. Bu 49 sayfalık toplam kontrol, her sayfadaki bütün nesnelerin görsel kabulü değildir. Sayısal konum ölçümleri seçilen metne ve numaralara aittir. İlgili Word/PDF sayfa görüntüleri ayrıca incelendi.

- **1100 test PASS, 0 FAIL/SKIP.** Beş yeni regresyon; metin çerçevesi ve yer imleri, normal sabit paragraf, özel TC/TOC stili ve kaynak başlığın korunması, kapasite sınırı, koşullu sayfa alanları. [Test günlüğü](../validation/layout-output-20261018/unit.log).
- **Üretim derlemesi PASS.** Mevcut büyük paket/Node modülü dışlama uyarıları sürüyor. [Derleme](../validation/layout-output-20261018/build.log).
- **Dört tarayıcı belgesinde pageerror yok.** Gerçek kurulu Windows fontları test köprüsüyle sağlandı; üretim font denetimi değiştirilmedi. [Tarayıcı sonucu](../validation/layout-output-20261018/verified/browser.json).
- **Word kontrolü:** her çıktı ayrı, sahipliği doğrulanmış görünmez Word oturumunda PDF'e çevrildi; alanlar iki kez güncellenerek ikinci PDF alındı. Kullanıcıya ait Word süreçleri kapatılmadı.
- **Kapanış kapıları ve kaynak kodu hash'leri:** [summary.json](../validation/layout-output-20261018/summary.json). Bu kaydı üreten araç, gerekli karşılaştırmalar/test/derleme geçmeden görevleri kapatmaz.
- **Ayrıntılı ölçümler:** [başlangıç](../validation/layout-output-20261018/before/comparison.json), [son sürüm](../validation/layout-output-20261018/verified/comparison.json). Ara `after` ölçümleri tarihçe olarak korundu.

Tekrar üretim araçları: `layout-output-cases-20261018.mjs`, `export-consistency-browser-20261018.mjs` (`CONSISTENCY_FOLDER=layout-output-20261018`), `compare-layout-output-20261018.py`, `word2pdf.ps1`, `close-layout-output-20261019.mjs`. Karşılaştırma sunucusu izleyici/HMR kapalı olarak çalıştırıldı ve iş sonunda kapatıldı.

## Açık kalan kapsam

İçindekilerdeki yaklaşık 0,2962 mm dikey fark; sayfalar arası taşınan ve yoğun çok satırlı nesneler; içe aktarılan kaynak DOCX'in koruma kipi; daha zengin üst/altbilgi öğeleri; tablo/şekil/dipnot ağırlıklı belgeler ve normal akademik editörün aynı güncel kabulü açık. SRC09/SRC10 uzun belge işleri bu turda yeniden ölçülmedi veya kapatılmadı. Genel motor/ürün kabulü açık. Commit veya yayın yapılmadı.
