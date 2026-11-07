# Editör keşif testi — 24 Ekim 2026

Kapsam: Kullanıcı isteğiyle yalnızca kullanım testi; uygulama kodunda düzeltme yapılmadı. Ayrı tarayıcı test belgesi: http://localhost:5173/tests/thesis.html (DEMO şablon). Gerçek kullanıcı belgesi değiştirilmedi.

## Doğrulanan bulgular

### 1. Kalın uygulamak yazının boyutunu da küçültüyor
- Özet alanına normal klavye girdisiyle iki paragraf yazıldı.
- İkinci paragrafın ilk sözcüğü Home → Ctrl+Shift+Sağ ile seçildi.
- Şeritte Kalın düğmesine basıldı.
- Önce araç çubuğu 12 pt gösteriyordu; işlemden sonra 11.25 pt gösterdi.
- DOM ölçümü: paragraf 16 px, kalınlaştırılan sözcük 15 px. Üretilen span: `fmt-size-body fmt-color-black fmt-bold`.
- Kalın tekrar kapatılınca da punto 11.25 olarak kaldı.
- Beklenen: Kalın açma/kapatma mevcut 12 pt boyutunu korumalı.

### 2. Çok satırlı düz metinde Başlık 1 ilk satırı dönüştürmüyor
- Ana metne çok satırlı düz metin girildi (contenteditable fill; satırlar DOM'da metin + br).
- Ctrl+Home ile başa gidilip stil galerisinden Başlık 1 seçildi.
- Metnin önüne boş bir h1 eklendi; ilk satır normal metin olarak kaldı. Sayfada yalnızca “1” görüldü, içindekilere de metinsiz “1” girdi.
- Beklenen: İmlecin bulunduğu ilk satır başlığa dönüşmeli.
- Not: Bu bulgu düz metin/br yapısında doğrulandı; gerçek pano yapıştırması ayrıca denenmeli.

## Henüz doğrulanmamış gözlemler
- Ana metin boşaltılıp hemen seri yazılınca iki karakterden sonra otomasyon hedefin değiştiğini/odağın kaybolduğunu bildirdi; eski metin yeniden göründü. Hızlı ardışık giriş ve yeniden çizim yarışı olabilir. Normal Özet yazımında tekrarlanmadı; kesin hata olarak sayılmadı.
- Boş başlangıç belgesinde 5 görünür sayfa varken durum çubuğu önce 4 sayfa dedi; yazınca 5'e düzeldi. İlk derleme sırasında geçici olabilir.

## Çalışan denemeler
- Özet alanında Türkçe karakterlerle normal yazma ve Enter ile yeni paragraf oluşturma.
- Sözcük seçip kalın açma/kapatma (boyut yan etkisi yukarıda).

## Ek doğrulanan bulgular

### 3. Metin kutuları sözcük sayısına katılmıyor
- Durum çubuğu 39 sözcük gösterirken Özet sayfasında boş yere çift tıklanarak kutu açıldı.
- “Deneme kutusu” yazıldı, Başlık 1 yapıldı ve yazım planına eklendi.
- Ardından kutuya “burada beş yeni sözcük ekliyorum” eklendi; düzenlemeden Escape ile çıkıldı.
- Sayaç 39 olarak kaldı. Yeniden yükledikten sonra kutu metni korunmasına rağmen sayaç yine 39.
- Beklenen: Belgedeki kullanıcı metin kutularının sözcükleri belge sayacına katılmalı.

### 4. Başlıktan gelen kalın biçim düğmeyle kapatılamıyor
- Normal klavyeyle oluşturulmuş Özet paragrafında Ctrl+Home → Başlık 2 uygulandı. Bu paragraf dönüşümü doğru çalıştı.
- Şerit 12 pt ve Kalın açık gösteriyordu. Kalın düğmesine basıldı ve “Normal ” yazıldı.
- Yeni metin hâlâ 700 font ağırlığında (kalın); düğme de açık kaldı. Yeni span ayrıca 15 px oldu (başlık 16 px).
- Beklenen: Kalın düğmesi açıkken basmak yazılacak metni normal ağırlığa geçirmeli; punto değişmemeli.
- Birinci bulguyla ilişkili, ancak başlıktan miras alınan kalın biçimin kapatılamaması ayrı bir davranış.

## Diğer çalışan akışlar
- Boş yere tek çift tıklamada metin kutusu açıldı ve içine yazılabildi.
- Kutuya galeriden Başlık 1 uygulanabildi.
- Sağ tık → Yazım planına ekle çalıştı. Özet altında, İçindekiler üstünde bağımsız satır oluştu; bu denemedeki konumla uyumluydu.
- Plandaki kutu adına basınca panel kapandı ve doğru kutuya kaydırılıp seçildi.
- Yeniden yüklemede Özet metni, kutu metni ve biçimleri korundu. Plan üyeliğinin yeniden açılışta sürmesi ayrıca kontrol edilmedi.
- Normal p yapısındaki paragrafın Başlık 2'ye dönüşümü çalıştı; ikinci bulgu metin/br yapısına özgü görünüyor.

## Kapanış
Bu keşif turu tamamlandı. Dört bulgu ve iki doğrulanmamış gözlem kaydedildi. Uygulama koduna müdahale edilmedi; yalnızca test belgesinde işlemler yapıldı. PDF/DOCX çıktısı, görseller, tablolar, çok uzun belgeler ve MCBÜ şablonunda aynı bulguların tekrarı bu turda denenmedi. Sonraki çalışma için düzeltmeler bekliyor.

## Düzeltme turu — kullanıcı “şimdi düzelt” isteği sonrası
- Dört doğrulanan bulgu düzeltildi. Biçimlendirme yalnızca değiştirilen özelliği yazar; varsayılan boyut/rengi metne eklemez. Miras alınan kalın/italik için açık kapatma değeri saklanır ve Word çıktısına aktarılır.
- Düz metin/br satırları başlık dönüşümünden önce paragraf olarak ayrılır; ilk satır boş başlık eklemek yerine dönüştürülür.
- Kullanıcının eklediği metin kutuları sözcük sayımına katılır; iç içe kaynaklar birden fazla sayılmaz ve sıfır genişlikli imleç karakteri sayılmaz.
- Yeni `editor-exploration-fixes.e2e.mjs` testi geçti: punto koruma, kalın/italik kapatma, diğer semantik işaretleri koruma, boş başlık hatası, kutu sözcükleri ve yeniden açılış.
- Mevcut `ribbon-rendered-metrics.e2e.mjs`, `dblclick-text-frame.e2e.mjs`, `writing-plan-boxes.e2e.mjs` testleri geçti; sonuncusu gerçek MCBÜ Özet grubunu da deniyor.
- Biçimlendirme, akademik çıktı ve kaynak Word çıktısı birim testleri geçti; açık normal ağırlığın Word'de korunması için ek test de geçti.
- Arayüzde Kaynakça alanına yeni metin yazılıp bir sözcük kalınlaştırıldı; şerit 12 pt göstermeye devam etti.
- Önceki iki doğrulanmamış gözlem için düzeltme iddiası yok. Eski kayıtlara önceden yanlış yazılmış boyutlar otomatik değiştirilmez; yeni biçimlendirme işlemlerinde boyut korunur.
