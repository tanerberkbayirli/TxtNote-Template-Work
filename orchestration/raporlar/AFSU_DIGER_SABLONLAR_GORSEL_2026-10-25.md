# AFSÜ: Eczacılık dışındaki altı seçeneğin görsel kontrolü

25.10.2026. İncelenen seçenekler: LEE yüksek lisans, LEE doktora, yüksek lisans tez önerisi, doktora tez önerisi, Tıp uzmanlık ve Diş Hekimliği uzmanlık. Eczacılık düzeltmesi korunmuştur.

## Sonuç ve düzeltmeler

- **Yüksek lisans ve doktora:** dış/iç kapak ve kabul/onay tabloları kendi resmî Word örnekleriyle karşılaştırıldı. Kapakların PDF çiziminde mevcut Word taban çizgisi desteği etkinleştirildi. Etik sayfasındaki tarayıcı sekmesi kaynaklı madde girintisi, farklı satır kırılımı ve aşağıya doğru biriken yaklaşık 2 mm kayma giderildi. Sabit metinler korunarak madde ve paragraf çerçeveleri resmî başlangıç satırlarına bağlandı; paragraflar doğal biçimde iki yana yaslanıyor. İkinci maddede “kurallarına uygun” sözcükleri bölünmez boşlukla birlikte tutuluyor; görünür sözcükler değiştirilmedi. İkinci danışman dolu iki derece de ayrıca çıktı alarak doğrulandı.
- **Tıp ve Diş Hekimliği:** dış kapakların dikey yerleşimi her fakültenin kendi PDF örneğine göre düzeltildi. BAP desteği olduğunda kullanılan iç kapaklar ayrıca incelendi; destekli örneğin farklı üst başlık konumları için ayrı koşullu alanlar eklendi. Fakülte kimlikleri ve derece adları korundu; Diş yerleşimi Tıp koordinatlarına zorlanmadı. Desteksiz iç kapaklar, kabul/onay ve özet örnekleri de yan yana incelendi.
- **İki tez önerisi:** başlık iki satır olduğunda öğrenci/danışman/şehir alanlarını aşağı iten akış kaldırıldı. Kılavuz Şekil 1'in ölçülen konumları kullanıldı. Açıkça yazılan 12/14 punto kuralları korundu; küçültülmüş çizimdeki 11,73 punto glifler kopyalanmadı. Derece etiketinin başlangıcı iki başlık satırına yer bırakmak için 92,6 mm olarak ayrıldı; bu uyarlama kurumun açık koordinat kuralı diye gösterilmez.
- **Bütün AFSÜ kapakları:** kullanıcı anabilim dalı ekini adıyla birlikte girerse ikinci kez eklenmesi önlendi. Türkçe büyük İ ve “Ana Bilim Dalı” biçimi de test edildi.

Ortak motora üniversite adına göre koşul eklenmedi. Genel `sections[].overrides.justify` seçeneği, yalnız etik sayfasında tarayıcı sözcük sıkıştırmasını kapatmaya yarar; diğer bölümler mevcut ayarı devralır.

## Doğrulama

Son gerçek dosyalar, güncel kalıcı kontrol tanımlarıyla yeniden ölçüldü: **299 PASS, 0 FAIL, 6 INFO**. Dağılım LEE 112, iki tez önerisi 44, Tıp 77, Diş 66 PASS. Altı ana varyanta ek olarak iki ikinci danışmanlı ve iki BAP destekli varyant kullanıldı. INFO maddeleri kaynakta belirsiz veya çelişkili kalan hususlardır; hata sayılmaz ve koşulsuz kurumsal kabul anlamına gelmez.

- [LEE son kontrol](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/acceptance/afsu-lee/check-20261025-0303.json)
- [Tez önerileri son kontrol](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/acceptance/afsu-lee-proposal/check-20261025-0303.json)
- [Tıp son kontrol](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/acceptance/afsu-tip/check-20261025-0303.json)
- [Diş son kontrol](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/acceptance/afsu-dis-hekimligi/check-20261025-0303.json)

AFSÜ seçimi/kaynak/içerik ve motor yerleşim testleri: **31 PASS, 0 FAIL**. Son üretim derlemesi başarılı; ayrıntılı kayıtlar `.test-tmp/afsu-others-unit-final.log` ve `.test-tmp/afsu-others-build-final.log`.

PDF'ler gerçek ThesisEditor düğmeleriyle üretildi. Word dosyaları Microsoft Word ile PDF'e çevrildi. LEE kapaklarında yalnız tarayıcı çizimini etkileyen son taban çizgisi düzeltmesinden sonra PDF yeniden üretildi; bütün `word/` XML ve medya parçalarının önceki gerçek Word renderına ait DOCX ile birebir aynı olduğu hash ile doğrulandı: [Word önbelleği kanıtı](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/word-cache-verification.json). Son toplu ölçüm mevcut bu gerçek çıktıları kullanır; yeni bir Word renderı yapılmış gibi sunulmaz.

## Görsel kanıtlar

Görsellerde solda resmî kaynak, ortada editör PDF, sağda Word bulunur. Kaynaktaki örnek adlar, yönerge metinleri ve kısa başlıklar yerine kurgusal kullanıcı verisi kullanıldığı için içerik ve içerik uzunluğuna bağlı tablo yükseklikleri aynı olmak zorunda değildir. Kılavuzun EK başlıkları, açıklama çerçevesi ve kendi sayfa sayacı tez sayfasına basılmaz.

- [YL etik sayfası](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-3.png), [doktora etik sayfası](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-3.png)
- [YL dış kapak](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-1.png), [doktora dış kapak](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-1.png)
- [YL ikinci danışman](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-coadvisor.png), [doktora ikinci danışman](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-coadvisor.png)
- [YL kabul/onay](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-4.png), [doktora kabul/onay](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-4.png)
- [YL özet](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-abstract.png), [doktora özet](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-abstract.png)
- [YL gövde](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-master-main.png), [doktora gövde](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/lee-phd-main.png)
- [YL tez önerisi](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/proposal-default.png), [doktora tez önerisi](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/proposal-phd.png)
- [Tıp dış kapak](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/tip-outer.png), [Diş dış kapak](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/dhf-outer.png)
- [Tıp BAP destekli](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/tip-supported.png), [Diş BAP destekli](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-diger-gorsel-20261025/final/dhf-supported.png)

## Çıktılar

Ana PDF/DOCX/Word-PDF dosyaları `.test-tmp/afsu-others-visual-final/` altındadır:

- [Yüksek lisans PDF](../../.test-tmp/afsu-others-visual-final/afsu-lee/run/default.pdf)
- [Doktora PDF](../../.test-tmp/afsu-others-visual-final/afsu-lee/run/phd.pdf)
- [YL tez önerisi PDF](../../.test-tmp/afsu-others-visual-final/afsu-lee-proposal/run/default.pdf)
- [Doktora tez önerisi PDF](../../.test-tmp/afsu-others-visual-final/afsu-lee-proposal/run/phd.pdf)
- [Tıp PDF](../../.test-tmp/afsu-others-visual-final/afsu-tip/run/default.pdf)
- [Diş PDF](../../.test-tmp/afsu-others-visual-final/afsu-dis-hekimligi/run/default.pdf)

## Kaynak sınırları

Kaynakların güncelliği önceki canlı indirme/hash kontrolüyle aynı gün doğrulanmıştır: [canlı kaynak kayıtları](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-live-sources-20261025.json). Master karşılaştırma DOCX'inin arşivdeki güncel resmî dosyayla aynı SHA-256 değerinde olduğu ayrıca doğrulandı: `3a891f9fe8da0a9c4ad0d1f0b6b41c048d03e27d75dcfe1ba0b8c00e4c4520cd`. Doktora resmî DOCX'i ayrıca Word ile işlendi.

Bu kontrol, incelenen kaynak kuralları ve sayfa türleri içindir. Resmî örneği bulunmayan bütün serbest içerik sayfalarına piksel eşliği onayı verilmez. Tıp/Diş etik metni ve içindekiler sırası çelişkisi, kaynakta belirtilmeyen ayrıntılar ve farklı fakülte PDF'leri arasındaki farklar açık belirsizlik olarak korunmuştur. Tez önerisi kaynakçasının yeri kaynakta belirtilmediğinden metnin sonundaki tercih çıkarım olarak kalır.
