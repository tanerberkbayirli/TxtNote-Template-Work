# Özel içindekiler satırının dikey hizalaması

19 Ekim 2026: yaklaşık 0,30 mm dikey kaymaya neden olan hata düzeltildi ve görev ölçülen kapsamıyla kapatıldı. Asıl örnekte Word/PDF baseline farkı **0,296223 mm'den 0,027506 mm'ye** indi. Bu değer sıfır fark iddiası değildir; kalan küçük fark doğrulama kaydında korunmuştur.

## Neden ve çözüm

Üretilen içindekiler listesi, Word'ün yazı taban çizgisini taklit eden dikey düzeltmeyi liste kabında taşıyordu. Kullanıcı bir satırın puntosunu veya yazı tipini değiştirdiğinde satırın görünümü güncelleniyor, fakat yeni yazı biçimine ait baseline ölçümü ve ebeveyne göre düzeltmesi üretilmiyordu. PDF de ekrandaki bu kaymayı alıyordu.

`engine/src/engineCss.js` artık özel satırın etkin biçimini liste varsayılanı, satır düzeyi ve kayıtlı kullanıcı biçimini birleştirerek hesaplıyor. Bu biçim gerçek tarayıcı baseline ölçümlerine kaydediliyor. Satırın dikey düzeltmesi, liste kabının mevcut düzeltmesini hesaba katıyor; satır yüksekliği de ortak satır aralığı modelinden geliyor. Sabit milimetre kaydırması veya üniversiteye özel değer eklenmedi. Yalnız metin/rengi değişen satırların mevcut yerleşimi korunuyor. DOCX alanları ve Word yenileme yolu değiştirilmedi.

## Doğrulama

- Asıl 16 punto Times New Roman örneği: **0,027506 mm** dikey fark; Word alan güncellemesinden önce/sonra aynı.
- Ek dört gerçek Word kontrolü: Times New Roman 10 ve 20 punto, Arial 16 punto, Times New Roman 18 punto italik. Dikey farklar sırasıyla **0,001268 / 0,008378 / 0,009977 / 0,030703 mm**. Beş TOC örneğinde en büyük mutlak fark **0,031 mm altında**.
- Her TOC örneğinde komşu GİRİŞ/KAYNAKÇA satırlarının baseline farkları 0,05 mm altında; özel etiket ve kaynak başlık birer kez mevcut, renk korunuyor.
- Önceki konum/sayfa numarası örnekleri güncel kodla yeniden üretildi. Dört belgenin sayfa sayıları editör/PDF/Word/yenilenmiş Word'de **12/12/12/13**; dört ek TOC belgesinin her biri **12** sayfa. Seçili konum ve sayfa numarası farkları 0,05 mm altında.
- **1102 test PASS, 0 FAIL/SKIP; üretim derlemesi PASS.** İki yeni regresyon, farklı satır fontları için doğru baseline ölçümünün seçilmesini ve yalnız metin/renk değişikliklerinin eski yerleşimi korumasını sınar.
- Sekiz gerçek tarayıcı belgesinde hata yok. Gerçek Windows fontları test köprüsüyle kullanıldı. Word ve PDF hedef sayfaları render edilerek görsel olarak karşılaştırıldı; beş TOC örneğinin karşılaştırma görseli ayrıca incelendi.

Kanıtlar: [kapanış ölçümleri ve kaynak hash'leri](../validation/layout-output-20261018/toc-alignment/summary.json), [asıl örnekler](../validation/layout-output-20261018/toc-alignment/comparison.json), [ek yazı tipi örnekleri](../validation/layout-output-20261018/toc-baseline-matrix/comparison.json), [görsel karşılaştırma](../validation/layout-output-20261018/toc-alignment/visual-check.png), [test günlüğü](../validation/layout-output-20261018/toc-alignment/unit.log), [derleme](../validation/layout-output-20261018/toc-alignment/build.log).

Tekrar üretim: `layout-output-cases-20261018.mjs toc-alignment`, `toc-baseline-cases-20261019.mjs`, iki klasör için `export-consistency-browser-20261018.mjs` (`CONSISTENCY_FOLDER=layout-output-20261018`), gerçek Word için `word2pdf.ps1`, iki klasör için `compare-layout-output-20261018.py`, son olarak `verify-toc-baseline-20261019.py`. Önceki tarihsel ölçümler değiştirilmedi.

Bu kapanış özel üretilen içindekiler satırındaki belirtilen hataya aittir. Sayfalar arası/yoğun çerçeveler, kaynak DOCX koruma kipi ve genel/uzun belge kabulü kapsam dışındadır. SRC09/SRC10 işleri kapanmadı. Commit veya yayın yapılmadı.
