# Editör, PDF ve DOCX tutarlılığı — 18 Ekim 2026

19 Ekim devam notu: Aşağıdaki sonraki işlerden aynı sayfada sabit metin konumu, sayfa bazında numara konumu/biçimi ve özel içindekiler satırının Word yenilemesinde korunması [sonraki raporda](KONUM_SAYFA_DIZIN_2026-10-19.md) sınanan kapsamlarıyla kapandı. Bu 18 Ekim belgesinin ölçümleri kendi sürümüne aittir; yeni kapsam ve açık sınırlar için 19 Ekim raporunu okuyun.

İlk güncel karşılaştırmada iki ortak DOCX kusuru bulundu ve düzeltildi: kaydedilmiş sabit başlık biçimleri Word'e taşınmıyordu; boş yazım alanının kapladığı satır ve bazı başlık–gövde boşlukları atlanıyordu. Üç kontrollü belgede düzeltmeler gerçek editör, gerçek PDF ve Microsoft Word çıktısıyla doğrulandı. Bu çalışma bütün uygulamaya tek bir uyum yüzdesi veya genel kabul vermiyor.

## Ölçüm kapsamı

MCBÜ LEE, AFSÜ LEE ve AKÜ SBE yüksek lisans şablonlarında aynı küçük senaryo kullanıldı. Ortak motorun ürettiği sabit bir ön sayfa başlığı 20 punto, sağa hizalı ve `#9b1c1c` renkli olarak kaydedildi. Ana metinde Türkçe karakterler ve bir başlık var. Belgeler sırasıyla 12, 15 ve 12 sayfa. Düşük içerik yoğunluğu özellikle boş yazım alanının sonraki imza bloğuna etkisini görünür kılıyor.

PDF ve DOCX gerçek arayüz düğmelerinden indirildi. Word her dosyayı kendisine ait, görünmez bir COM oturumunda açtı; PDF ölçümü alan güncellemesinden önce ve sonra tekrarlandı. Özgün üniversite kaynakları açılıp değiştirilmedi; kullanıcıya ait Word süreçleri kapatılmadı. Başsız tarayıcı testi gerçek Windows font dosyalarını test köprüsüyle okuyor; üretimin font denetimleri değişmedi.

Son kanıt [verified/comparison.json](../validation/export-consistency-20261018/verified/comparison.json), kısa sonuç ve kaynak kodu SHA-256 değerleri [summary.json](../validation/export-consistency-20261018/summary.json) içindedir. `before`, `after` ve `final` ara ölçümler olarak korundu; üretimin son sürümü için `verified` esas alınır.

## 1. Sabit başlık biçimi kaybı — düzeltildi

Önce editör ve PDF'deki 20 punto, sağa hizalı renkli başlık DOCX'te 12 punto, ortalı ve varsayılan renkliydi. Başlangıç Word/PDF yatay farkı üç örnekte 39,829–42,324 mm; baseline farkı yaklaşık 2,67 mm idi. Sayfa sayıları o sırada da eşitti. Dolayısıyla eşit sayfa toplamı, belge görünümünün doğru olduğunu kanıtlamıyordu.

Neden: editör başlığı `presentationElements` ve kaydedilmiş nesne kimliği üzerinden CSS ile biçimlendiriyor. Akademik HTML ayrıştırıcısı `data-layout-id` bilgisini bloklara taşımadığı için DOCX yazıcısı bu tercihi bulamıyor, şablonun varsayılan başlık biçimini yazıyordu.

`academicDocument.js` artık başlık ve paragraf kimliğini hem tarayıcı hem Node ayrıştırma yolunda koruyor. `docx/body.js` bunu aynı bölümün `presentationElements` verisiyle eşleyip kaydedilmiş biçimi kullanıyor. Otomatik içindekiler başlığı ve satırlarının ilk DOCX görünümündeki biçim/metin tercihleri de bu yola bağlandı; canlı TOC/PAGEREF alanları korunuyor. Üniversite varsayılanları değiştirilmedi.

Sonuç: üç başlığın DOCX XML'inde 20 punto, sağ hizalama ve doğru renk var. Word'ün oluşturduğu PDF'de başlangıç x farkı 0,0136–0,0164 mm, baseline farkı 0,0052 mm altında. Sağ uç farkı 0,0754 mm altında. PDF karakter kutularında Word yaklaşık 20,04 pt, uygulama PDF'i yaklaşık 20 pt raporluyor; bu küçük ölçüm farkı sıfır diye sunulmadı. İncelenen sayfa görüntülerinde önceki küçülme ve ortalama yok.

## 2. Boş yazım alanı ve sonraki imza — düzeltildi

Ekrandaki boş düzenleme alanı imleç/yer tutucu için bir gövde satırı kaplıyor; yer tutucu metni PDF'e yazılmasa da satır yüksekliği sonraki imzayı aşağı itiyor. DOCX, başlığı yazıp boş alanı atlıyordu. Toplamalı paragraf boşluğu kullanan örnekte başlık–gövde toplamı da kayboluyordu.

Başlık biçimi düzeltildikten sonra bu bağımsız fark MCBÜ imzasında 4,8745 mm, SBE imzasında 6,9937 mm olarak kaldı. Gerçek DOM ölçümü boş alanın bir satır yüksekliğini doğruladı: [DOM kaydı](../validation/export-consistency-20261018/after/empty-body-dom.json).

DOCX yazıcısı artık başlıklı, boş, düzenlenebilir ve ek sabit içerik içermeyen bu bölümlerde bir boş gövde satırını koruyor. Toplamalı modelde başlık sonrası boşluk ile gövde öncesi boşluk birlikte taşınıyor. Yer tutucu metni dosyaya eklenmiyor; bu dar koşul kaynak DOCX koruma yoluna uygulanmıyor.

Son Word/PDF imza baseline farkı MCBÜ'de 0,0062 mm, SBE'de 0,0087 mm. AFSÜ örneğinin seçilen sayfasında karşılaştırılabilir imza olmadığı için ona imza kabulü verilmedi. Son MCBÜ ve SBE sayfa görüntüleri de görsel olarak karşılaştırıldı.

## Genel ölçümün anlamı

Üç örnekte editör/PDF/Word sayfa toplamları 12/12/12, 15/15/15 ve 12/12/12; Word alan güncellemesinden sonra da değişmedi. Bu toplam 39 sayfa için sayfa sayısı kontrolüdür, 39 sayfadaki her nesnenin tam görsel kabulü değildir. Ayrıntılı konum ölçümü üç değiştirilmiş başlığa ve iki imza satırına aittir.

Ham metin çıkarım sırası benzerliği MCBÜ'de 1, AFSÜ'de yaklaşık 0,99168, SBE'de 0,99733. Fark incelemesinde içindekiler nokta liderleri ve Symbol karakterlerinin farklı Unicode karşılıkları görüldü. Bu oranlar içerik kaybı yüzdesi olarak yorumlanmadı. PDF metin çıkarımının sırası veya sembol eşlemesi tek başına görünür kaybı kanıtlamaz.

## Kontroller ve kalan işler

- **1095 test PASS, 0 FAIL/SKIP.** Yedi yeni regresyon; üç gerçek şablonda başlık biçimi, üretilmiş dizin alanları, blok kimlikleri, boş satır ve toplamlı boşluk. [Son test günlüğü](../validation/export-consistency-20261018/unit-verified.log).
- **Üretim derlemesi PASS.** Önceden bulunan büyük paket ve Node modülü dışlama uyarıları sürüyor. [Son derleme](../validation/export-consistency-20261018/build-verified.log).
- **Üç gerçek tarayıcı örneğinde pageerror yok.** [Tarayıcı sonucu](../validation/export-consistency-20261018/verified/browser.json).
- **Gerçek Word ve alan güncellemesi:** her örneğin `verified/*-word-info.json`, `*-word.pdf` ve `*-word-refreshed.pdf` dosyalarında kayıtlı.

Kalan kabul kapsamı: serbest taşınmış/sığdırılmış nesnelerin Word konumları, özel sayfa numarası yerleşimleri, düzenlenmiş otomatik dizin satırlarının Word'de tam yeniden üretimden sonraki görünümü, tablo/şekil/dipnot ağırlıklı belgeler ve normal akademik editör için aynı güncel karşılaştırma. Dizinlerin canlı alan olması, manuel satır görünümünün tam Word güncellemesinden sonra korunacağını tek başına kanıtlamaz; bu çalışma o kabulü vermiyor.

SRC09 kapsam/şekil-grafik ayrıntıları ve SRC10 s.57/s.75 önceki açık uzun belge işleridir; bu turda yeniden ölçülmedi veya kapatılmadı. Sonraki ölçüm sırası önce ortak nesne geometrisi ve dolu tablo/şekil örnekleri, ardından normal akademik editör ve uzun kaynak belgeleridir. Her yeni fark küçük örnekte tekrar üretilip ortak motor katmanında düzeltilmeli; gerçek Word/PDF kontrolü ve mevcut regresyonlar ardından tekrar çalıştırılmalı.

Tekrar üretim araçları `orchestration/tools/export-consistency-*-20261018.mjs`, `compare-export-consistency-20261018.py` ve `word2pdf.ps1` içindedir. Son kayıt aracı karşılaştırma, test ve derleme kapılarını doğrulamadan ilerleme kaydı yazmaz. Commit veya yayın yapılmadı.
