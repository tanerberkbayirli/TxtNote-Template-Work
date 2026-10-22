# MCBÜ düzeltmeleri ve son doğrulama — 15 Ekim 2026

**Sonuç:** İncelemede bulunan üç görünür Word çıktı hatası düzeltildi. Üç MCBÜ varyantının tanımlı biçim/çıktı kontrollerinde **194 PASS, 0 FAIL** var. Kaynak çelişkileri ve Tıp kılavuzunun güncelliği için iki UNKNOWN grubu açık tutuldu. Üniversiteye ait tam uygunluk/onay iddiası verilmedi.

## Tamamlanan işler

1. **İçindekiler satırlarının korunması:** Şekiller Dizini, Tablolar Dizini ve İçindekiler başlıkları gerçek Word TC kaynakları olarak yazılıyor. Alan güncellemesi üç satırı artık silmiyor.
2. **Bölüm satır sonlarının korunması:** Ayrı satırda yazılan bölüm adı ve başlığı için Word TOC alanında satır sonlarını koruyan seçenek kullanılıyor. Güncelleme sonrası iki satırlı düzen korunuyor.
3. **Tıp'ta boş sayfanın önlenmesi:** Word'ün TOC yenilemesinde oluşturduğu alan sonu paragrafının son satırın boşluğunu ve Normal satır yüksekliğini devralması engellendi. Alanın sonu, görünür boş satır oluşturmayan açık bir twip yüksekliğindeki paragrafta tutuluyor. Önce 30→31 olan sayfa sayısı artık 30→30.
4. **Tıp içerik kontrolleri:** Gereken altı ana bölümün sırası ve eksikliği, İngilizce tez başlığı, yazar-yıl atıf örüntüsü, ilk sayısal atıfların sırası, kaynakça girdilerinin numaralandırılması ve ölçülmüş önsöz/Türkçe özet sayfa sınırı için bildirimler eklendi. İngilizce başlık yazarın doldurduğu bir alan olarak İngilizce özette basılıyor.
5. **Doğrulama güvenilirliği:** Paylaşılan altbilgi PAGE alanının COM bağlamındaki geçici değerleri yerine iki gerçek Word PDF'inin basılı numaraları karşılaştırılıyor. Kaybolan alanlar, gövdedeki PAGE değişiklikleri, gerçek basılı numara farkları ve render kanıtının yokluğu hâlâ başarısız sayılıyor. Kod parmak izi kökteki `engine/src/` dosyalarını da kapsıyor.

Tıp'ın eski stres verisindeki uygunsuz bölüm adları, yazar-yıl atfı, numarasız APA kaynakları ve uydurma DOI kaldırıldı. Sayısal kaynakça denemesinde kılavuzdaki kitap/bölüm örnekleri kullanıldı. Bunlar yine **sentetik test belgeleridir**; bilimsel olarak teslim edilecek veya onaylanmış tezler değildir.

## Son sürümdeki sonuçlar

- LEE yüksek lisans ve doktora birlikte: **100 PASS, 0 FAIL, 1 UNKNOWN**. Son rapor: [LEE kontrolü](../validation/mcbu-final2-20261015/mcbu-lee/check-20261015-0019.json).
- Tıpta uzmanlık: **94 PASS, 0 FAIL, 1 INFO, 1 UNKNOWN**. Son rapor: [Tıp kontrolü](../validation/mcbu-final2-20261015/mcbu-tip-uzmanlik/check-20261015-0014.json).
- Ortak Word motoru regresyonu: AKÜ Matematik **60 PASS**, AKÜ Sosyal Bilimler beş varyantta **136 PASS**; 0 FAIL. Sonuçlar: [regresyon kaydı](../validation/mcbu-final2-20261015/regression-manifest.json).
- Son dört hedefin `codeFingerprint` değerleri aynı: MCBÜ ve regresyon ölçümleri aynı üretim koduna ait.
- Frontend/motor: **1.053/1.053 test**, 0 atlama; [test kaydı](../validation/mcbu-final2-20261015/unit.log). Üretim derlemesi PASS; [derleme kaydı](../validation/mcbu-final2-20261015/build.log).
- Paylaşılan ölçüm aracı: **43 test PASS**, bağımsız sayfa sınırı/başlık sırası ve gerçek numara değişikliklerini yakalayan negatif kontroller dahil.
- Gerçek tarayıcıda beş olumsuz durumun bildirimi görüldü: eksik İngilizce başlık, eksik Genel Bilgiler, yazar-yıl atfı, numarasız kaynakça ve beş sayfalık önsöz. 0 tarayıcı hatası. [Tarayıcı kanıtı](../validation/mcbu-fix-20261014/browser-validation.json).

## Word'de düzenle, kaydet, yeniden aç

Her varyantta gövdeye kontrollü bir işaret eklendi, eklendiği doğrulandı, kaldırıldı ve yazar metninin birebir geri döndüğü kontrol edildi. Belge yeni DOCX olarak kaydedilip tekrar açıldı; bütün alanlar iki kez güncellendi, kaydedildi, tekrar açıldı ve PDF alındı.

Üç varyantta da bu işlemler geçti. Önceki alanı güncellenmiş Word PDF'i ile son kaydet–aç PDF'inin tüm sayfalardaki basılı metni eşleşti. Ortak ölçüm aracıyla kelime koordinatları ve satır taban çizgileri 0,25 mm toleransla karşılaştırıldı. Sayfa sayıları yüksek lisans **34**, doktora **35**, Tıp **30** olarak korundu. [Ayrıntılı Word turu ve ölçümleri](../validation/mcbu-final2-20261015/word-roundtrip-results.json).

Kapak/özet, bölüm açılışı, içindekiler, tablo devamı, İngilizce başlık, kaynakça ve doktora son sayfalarının seçilmiş görüntüleri de incelendi. [LEE güncelleme sonrası](../validation/mcbu-final2-20261015/visual/lee-after-refresh.png), [Tıp sayfaları](../validation/mcbu-final2-20261015/visual/tip-pages.png).

## Ayrı açık konu: Word'ün yeniden kaydettiği DOCX ve SDK şeması

Uygulamanın doğrudan ürettiği **üç DOCX**, kurulu Open XML SDK 2.9.1 / Office2016 kontrolünde **PASS, 0 hata** verdi.

Word tarafından yeniden kaydedilen üç kopya aynı araçta **13'er hata** veriyor. Bunlar iki tablodaki `tblLook` özellikleri ve `useWord2013TrackBottomHyphenation` uyumluluk değeridir. Kontrol için, 14 Ekim'de resmî siteden indirilen ve depoyla SHA-256 düzeyinde aynı olan MCBÜ Word kılavuzu da aynı araçla sınandı: bir tablo için **aynı altı özellik ve aynı uyumluluk değeri, toplam 7 hata** verdi. [Resmî kılavuzun şema sonucu](../validation/mcbu-final2-20261015/official-guide.schema.json).

Bu bulgu, hataların yalnız bizim dışa aktarıcımıza özgü olmadığını gösterir; yeniden kaydedilmiş dosyaların şema sonuçları **PASS'e çevrilmedi veya gizlenmedi**. Word turundaki basılı içerik/geometri kontrolleri ayrı olarak geçti. Kurulu doğrulayıcı/profil ile Word'ün yazdığı bu özellikler arasındaki uyum ayrıca ele alınmalıdır; “Word'de kaydedildikten sonra her DOCX şema testinden hatasız geçer” iddiası verilmedi.

## Üniversiteyle tamamlanacak işler

Kılavuzdaki özet aralığı, kapak boşlukları, bölüm açılışı hizası, özette sayfa sayısının anlamı ve İngilizce derece/enstitü adlandırması için yazılı cevap veya kabul edilmiş örnek gerekli. Tıp'ın eski kılavuzu yeniden indirilemedi; son web erişimi 403 verdi. Güncel sürüm/adres ve çelişen Tıp kuralları kurumdan teyit edilmeli.

[Görüşme soruları ve cevap kayıt formu](MCBU_GORUSME_SORULARI_2026-10-15.md) hazır. Bu sorular gönderilmedi; kurum adına veya kullanıcı adına dışarıya mesaj atılmadı. Yanıtlar alındığında kaynak kararları ve kontroller bu yanıtlara göre güncellenip son örnek çıktı kurumun biçim kontrolüne sunulmalı.

**Kapsam sınırı:** İçerik kontrolleri yapısaldır. Kaynakların gerçekliğini, bütün kaynakça alanlarının bibliyografik doğruluğunu, her bağlamdaki sayının bir atıf olup olmadığını veya bilimsel metnin niteliğini sertifikalandırmaz. Uyarılar taslak kaydetme/dışa aktarmayı engellemez; bildirilen eksikleri gidermeden belge uygun kabul edilmemelidir. Kılavuzda belirtilmeyen ayrıntılar ve genel motorun önceki uzun belge sorunları bu çalışmayla kapatılmadı. Tezsiz yüksek lisans dönem projesi kapsam dışıdır.

## Son örnek çıktılar

- Yüksek lisans: [PDF](../validation/mcbu-final2-20261015/mcbu-lee/run/master.pdf), [DOCX](../validation/mcbu-final2-20261015/mcbu-lee/run/master.docx).
- Doktora: [PDF](../validation/mcbu-final2-20261015/mcbu-lee/run/phd.pdf), [DOCX](../validation/mcbu-final2-20261015/mcbu-lee/run/phd.docx).
- Tıp: [PDF](../validation/mcbu-final2-20261015/mcbu-tip-uzmanlik/run/default.pdf), [DOCX](../validation/mcbu-final2-20261015/mcbu-tip-uzmanlik/run/default.docx).

Son kaynak kodu ve kontroller dondurulduktan sonra bu çıktı serisi alındı. Önceki başarısız denemeler kendi klasörlerinde korunuyor. Üniversite belirsizlikleri nedeniyle kontrol komutlarının çıkış kodu 1 olabilir; son seride bu, kaydedilmiş UNKNOWN kapısını ifade eder, görünür bir FAIL değildir. Commit veya yayın yapılmadı.
