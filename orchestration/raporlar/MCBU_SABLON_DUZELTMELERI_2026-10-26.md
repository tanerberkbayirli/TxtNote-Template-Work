# CBÜ şablon düzeltmeleri ve çıktı doğrulaması

26 Ekim 2026

## Sonuç

CBÜ klasöründeki dört JSON tanımı incelendi ve güncellendi. Üç etkin şablonun yanı sıra seçim listesinden gizlenmiş eski yüksek lisans taslağı da kapsama alındı. Eski taslak seçim listesine geri eklenmedi; bu kimliği taşıyan kayıtlı belgeler için genel şablona düşmeyen uyumluluk çözümlemesi eklendi.

CBÜ ile ilişkili güncel test grubunda 141 test geçti. Gerçek editörün PDF ve Word düğmeleriyle dokuz senaryoda toplam 18 dosya üretildi. PDF çıktıları toplam 124 sayfa; 94 dizin hedefi doğrulandı. Dört şablonda eksik bilgilerle PDF, Word ve yazdırma girişimlerinin engellendiği tarayıcıda ayrıca test edildi. Üretim derlemesi başarılı.

Bu sonuç test edilen şablon davranışları ve senaryolar içindir; enstitünün kabul kararı anlamına gelmez. Kullanıcının sonradan yaptığı serbest biçim değişiklikleri ve kaynağı koruma modundaki içe aktarımlar için tüm olası yerleşimlerin uygunluğunu garanti etmez.

## Şablon bazında değişiklikler

### mcbu-lee-master-tr-v1

- Gövde içinde gereksiz boş paragraflar, metin/başlık/tablo/şekil bloklarının arasından çıktı modelinde kaldırılır. Özel kapak aralıkları, tablo hücresi paragrafları, nesneler, yer imleri, açık sayfa sonları ve yazmaya devam etmek için kullanılan uç paragraflar korunur. Kaydedilmiş içerik metni değiştirilmez.
- Paragraf aralığı collapse modeliyle 6 nk olarak kalır. Özet, teşekkür, simgeler gibi bölümlerin kendi özel aralıkları korunur.
- İçindekiler nokta liderli ve sağa hizalıdır. Gerçek Word TOC/PAGEREF alanları korunur. Kılavuz örneğindeki İÇİNDEKİLER girdisi korunur.
- Öğrenci/danışman/ikinci danışman adlarının son sözcüğü, gösterimde Türkçe büyük harfe çevrilir. Kaydedilen ad değeri değiştirilmez. Birleşik soyadların tamamının tek alanın son sözcüğünden çıkarılamayacağı dikkate alınmalıdır.
- Girintisiz anahtar kelime blokları, simgelerde 1,5 satır, şekil/tablo listelerinde tek satır korunur.
- Eksik İngilizce anabilim dalı, beşten az anahtar kelime, boş giriş/özet/kaynakça, eksikleri çıktıdan önce bildirilir. Kullanıcının danışman unvanı sözcük seçimi veya LEE ana bölüm/sonuç tercihi çıktı engeli değildir. Zorunlu metadata eksikleri de çıktı engelidir. Danışmanın gerçek unvanı uydurulmaz.

### mcbu-lee-phd-tr-v1

Yüksek lisansla ortak düzeltmeler uygulandı. Doktora derece satırları ve yalnız doktorada kullanılan özgeçmiş koşulu korundu. Uzun başlık, uzun anabilim dalı/programı ve ikinci danışman içeren ek senaryo başarıyla üretildi.

### mcbu-tip-uzmanlik-tr-v1

Gereksiz boş paragraf temizliği, adların gösterim biçimi ve zorunlu metadata eksiklerinde çıktı engeli uygulandı. Tıp kılavuzuna özgü Arial 12, sol hizalama, normal paragraf aralığı, 30 mm üst kenar, 5 harf karşılığı girinti, Romen bölüm başlıkları, kendi içindekiler düzeni ve bölüm ilk sayfasında sayfa numarası gizleme korundu. LEE'nin noktalı dizin/TNR/6 nk kuralları tıp şablonuna taşınmadı. Mevcut zorunlu bölüm sırası ve sayısal kaynak gösterimi kontrolleri korunarak çıktı engeline bağlandı.

### cbu-lee-master-tr-kilavuz

Eski genel taslak, güncel LEE yüksek lisans düzenine geçirildi. Kimlik ve sürüm ile kayıtlı belgelerin `cover`, `abstract`, `english-abstract`, `acknowledgements`, `main-content` ve diğer eski bölüm anahtarları korundu. Yanlış küçük Roma numaraları ve eski ön bölüm sırası düzeltildi. Kaynak, mevcut 2025 resmî kılavuzuna bağlandı. Eski belgelerde yeni gereken alanlar boşsa kullanıcıya gösterilir; mevcut metinler başka bölüme taşınmaz veya silinmez.

## Uygulama davranışı

Yeni kontroller CBÜ şablonlarında `exportValidation: strict` ile etkindir. PDF/Word düğmeleri ve yazdırma aynı kontrolü kullanır. Taslak düzenleme ve kaydetme devam eder; kontrol edilmemiş unvan veya eksik bölüm için otomatik metin üretilmez. Soyadı büyük harf gösterimi ve paragraf temizliği ortak editör/PDF/DOCX modelinde yapılır.

Kullanıcının açıklaması üzerine LEE için eklenen en az iki ana başlık ve sonuç başlığı zorlaması kaldırıldı. Dört şablondaki danışman unvanı regex kısıtlaması da kaldırıldı. “Akademisyen” ve kullanıcının seçtiği ana bölüm yapısı biçim hatası değildir. Tıp için önceden var olan kılavuz bölüm listesi bu düzeltmede değiştirilmedi.

Toplam sayfa sayısı zaten gerçek sayfalamadan türetiliyordu. Bu davranış yeniden yazılmadı; bütün LEE testlerinde eski saklı `999` değeri yerine gerçek PDF sayfa sayısının Özet/Abstract'a yazıldığı doğrulandı.

## Test matrisi ve ölçümler

- Yüksek lisans: boş ve dolu şekil/tablo dizinleri, her senaryo 14 PDF sayfası.
- Doktora: boş ve dolu dizinler, her senaryo 14 PDF sayfası.
- Tıp: şekil/tablo içermeyen ve içeren gövde, her senaryo 13 PDF sayfası. Kılavuzunda ayrı LEE dizin sayfaları bulunmadığından bu sayfalar eklenmedi.
- Eski yüksek lisans taslağı: boş ve dolu dizinler, her senaryo 14 PDF sayfası.
- Uzun doktora başlığı/anabilim dalı/programı/ikinci danışman: 14 PDF sayfası.
- Önceki olumsuz senaryo boş öğrenci adı yanında kullanıcının bilinçli içerik tercihlerini de engelliyordu; bu son iki engel kaldırıldı. Güncel regresyonlar boş zorunlu metadata engelini ve LEE için “Akademisyen” + tek ana bölüm ile başarılı dışa aktarımı doğruluyor.

XML kontrolleri: ZIP bütünlüğü, XML ayrıştırma, kenar boşlukları, gerçek TOC/PAGEREF alanları, noktalı sağ sekmeler, anahtar kelime girintileri, simge aralığı, fazla gövde paragraflarının kalkması, sonraki paragrafın satır ve aralık değerleri.

Gerçek PDF ölçümü: LEE örnek metin çiftlerinde baz çizgisi farkı 26,695 punto; beklenen 20,7 punto satır adımı + 6 nk paragraf aralığı. Tıp çiftlerinde 20,695 punto; beklenen normal 1,5 satır adımı. Ölçülen bütün gövde sayfalarının metinleri yatay kenar sınırları içinde kaldı. PDF sayfa sayıları editör sayfa sayılarıyla eşleşti. Sayfalama hatası, kayıp dizin hedefi ve tarayıcı çalışma zamanı hatası bulunmadı.

Bütün PDF sayfaları toplu önizlemelerle, kapak/uzun başlık/içindekiler/gövde örnekleri ayrıca normal ölçekte incelendi. DOCX'lerin Microsoft Word tarafından yeniden sayfalanmış görünümü doğrulanamadı; bu ortamda Word/LibreOffice dönüştürmesi kullanılamıyor. PDF görünümü ile DOCX XML ölçümlerinin uyumu test edildi; Word'deki yeniden alan güncellemesi için koşulsuz görsel garanti verilmez.

## Kanıtlar

Kanıt dizini: `.test-tmp/validation/mcbu-20261026/`

- `output-verification.json`: dokuz senaryonun XML/sayfa/dizin sonuçları ve çıktı SHA-256 değerleri.
- `pdf-measurements.json`: gerçek PDF paragraf adımları ve kenar ölçümleri.
- `negative-ui.json`: dört şablonda PDF/Word/yazdırma engelleme mesajları.
- `mcbu-final-tests.log`: 138 başarılı test.
- `mcbu-build-final.log`: başarılı üretim derlemesi.
- Senaryo alt dizinlerinde `export.docx`, `export.pdf`, `export.layout.json` ve `preview/`.

Kalıcı regresyon: `engine/src/templates/mcbuConformance.test.js`. Küçük test belge üreticisi: `engine/tools/mcbu-output-fixtures.mjs`. Gerçek çıktı yolu: `engine/tools/export.mjs`.

Genişletilmiş ortak test grubunda 59 testin 58'i geçti; kapsam dışındaki AFSÜ özel sayfa testinde `templateFontFamilies(afsuLeeMaster).includes("Symbol")` denetimi başarısız oldu. Bu CBÜ değişikliklerinin kullandığı bir şablon değildir; AFSÜ tanımı veya bu test değiştirilmedi. Kanıt `mcbu-shared-regression.log` dosyasındadır. Bu nedenle tüm depo testlerinin geçtiği iddia edilmez.

## Kaynak dayanağı

LEE: `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx`; resmî PDF karşılığında s.1 kapak, s.4-5 özet blokları, s.7 simgeler, s.8-9 dizinler, s.10 bölüm örneği, s.11 genel yazım kuralları.

Tıp: `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf`; s.2 §1.2-1.5 ve kapak açıklaması, s.3 §V-XIII bölüm düzeni.

## Kullanıcının özgün teziyle yeniden kontrol

Kullanıcının içerik tercihleri değiştirilmeden gerçek ThesisEditor arayüzü açıldı ve Word düğmesiyle çıktı indirildi. Kaynaktaki 12 yazılmış paragraf/başlık, çıktı XML metniyle karşılaştırıldı; hepsi eşleşti. Otomatik bölüm etiketi ve soyadının büyük harf gösterimi şablon biçimlendirmesidir.

XML: sol 2268 twip (40 mm), üst/sağ/alt 1417 twip (25 mm); gövde line=360, firstLine=709; iki anahtar kelime bloğunda firstLine=0; simgelerde line=360; içindekilerde right/dot/8220 tab, canlı TOC ve 9 PAGEREF; ön sayfalarda upperRoman ve GİRİŞ'te decimal start=1. PAGE altbilgi alanları korunuyor. Editörde 13 sayfa ve hazır sayfalama doğrulandı.

Bu özgün belgenin ek PDF denemesi tarayıcıda tamamlanmadı; sistem fontu erişim çağrısı olası bekleme noktasıdır, kesin nedeni doğrulanmadı. Word yeniden sayfalamasının görsel kontrolü bu ortamda yapılamadı. Bu nedenle koşulsuz enstitü kabulü veya tamamlanmış Word görsel kontrolü iddia edilmez.

Kanıt: `.test-tmp/validation/testtez-original-20261026/`; `testtez.docx`, `xml-format-verification.json`, `xml-content-verification.json`, `model-verification.json`, `editor-final.png`.
