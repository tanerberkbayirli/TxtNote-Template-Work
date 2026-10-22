# PDF ve DOCX çıktı düzeltmeleri — 16 Ekim 2026

Kullanıcının uygulama yetkisiyle, [teşhis raporundaki](EXPORT_KAYMA_TESHISI_2026-10-16.md) dışa aktarım kusurları için üretim kodu değiştirildi. Önceden bulunan çalışma ağacı değişiklikleri korundu; commit yapılmadı.

## Uygulanan değişiklikler

- Kaynak DOCX kipinde yeni `engine/src/docx/sourceExport.js`, güncel model düğümlerini kaynak OOXML paragraf, metin, tablo ve bölüm özellikleriyle yazar. Eski kaynak dosyayı aynen geri vermek değildir: metin değiştirme, ekleme/silme, yeni biçim, resim, denklem, liste, bağlantı ve dipnot regresyonları vardır. Düzenlenebilir yerel çizimler mevcut normalleştirme yolundan geçirilir. Kaynak paketi olmayan şablon belgeleri mevcut yazıcıyı kullanır.
- Bölüm sınırını aşan geçerli alan akışları korunur; üç TOC alanının önbellek metnine düşmesi giderilir. Üstbilgi resimleri kaynak modelden editör sayfalarına ve PDF'e taşınır; DOCX kaynak üstbilgisini korur.
- `engine/src/layoutPdf.js`, SVG ve SVG arka plan grafiklerini ayrı resim katmanları olarak aktarır; yuvarlak kenarlıkları, üst öğe kırpmasını ve döndürülmüş metin koordinatlarını işler. Sayfanın gövde metni seçilebilir kalır. Grafiklerin kendi SVG içi metni raster katmanda olabilir.
- Normal akademik PDF, canlı editörün dondurulmuş DOM ölçümlerini kullanır. Özel puntoyu sabit 12 puntoya indiren yol kaldırıldı. Dışa aktarma anında ölçülen sayfa sayısı kullanılır.

## Son sürüm kanıtları

Kanıt klasörü: [export-fix-20261016/final](../engine-work/export-fix-20261016/final/). Eski teşhis ve ilk düzeltme çıktıları ayrı tutuldu.

- Gerçek tarayıcıdaki Dosya → PDF / Word düğmeleriyle kayıtlı `SRC09_FINAL_595fec37` örneği dışa aktarıldı. Editör 180, PDF 180 sayfa; `pageerror` yok. Çalıştırma öncesi/sonrası üretim kaynak hash'leri aynı: [browser-result.json](../engine-work/export-fix-20261016/final/browser-result.json).
- Son DOCX gerçek Word'de 180 sayfa; 320 alan açıkça güncellendikten sonra yine 180 sayfa. Önceki kusurlu çıktı aynı örnekte 206 sayfaydı. [Word sonucu](../engine-work/export-fix-20261016/final/word/word-result.json).
- DOCX'te üç TOC ve bir üstbilgi çizimi mevcut. 15 seçilmiş sayfada eşleşen sıradan metinlerin medyan konum farkı 0,0001 mm altında: [current-comparison.json](../engine-work/export-fix-20261016/final/current-comparison.json). Bu örnekleme bütün metin ve grafiklerin eşliğini kanıtlamaz.
- PDF s.97 görsel kontrolünde oklar, elips/baklava ve dikey Alternatif etiketleri görünür: [sayfa görüntüsü](../engine-work/export-fix-20261016/final/current-pdf-p97.png). Kaynak şeklin diğer ayrıntıları için genel kabul verilmedi.
- Normal akademik PDF'te özel metin 24 pt, standart metin 12 pt olarak ölçüldü. Çok sayfalı kontrol: editör/PDF 9/9 sayfa, 80/80 işaret mevcut, son işaret 9. sayfada: [academic-pages-result.json](../engine-work/export-fix-20261016/final/academic-pages-result.json).
- Tam test: 1078 test, 1077 PASS, 1 FAIL, 0 atlanan. Tek hata önceden bulunan AFSÜ LEE etik maddesi aralığı (`spaceAfterPt`, 0/6); kaynak kararı dışında değiştirilmedi. [Test kaydı](../engine-work/export-fix-20261016/unit-final.log).
- Üretim derlemesi PASS; mevcut büyük paket uyarısı sürüyor. [Derleme kaydı](../engine-work/export-fix-20261016/build-final.log).

## Açık sınırlar

Bu çalışma genel ürün kabulü değildir. SRC09 kapsam 0,98068 ve kaynak/editör okuma sırası, SRC10 s.57 kırılımı ve s.75 font seçimi, diğer şekil sayfalarının tüm ayrıntıları, Open XML SDK/Word yeniden kayıt farkı ve nihai seri kabul açık kalır. Dönüş testi dik açılı etiketleri kapsar; keyfî açılar ve bütün zengin üstbilgi/ankraj türleri sertifikalanmadı. Son uzun belge kontrolü kayıtlı modelden alınmıştır; yeni bir özgün kaynak içe aktarımı veya yeni 20/20 etkileşim kabulü değildir.
