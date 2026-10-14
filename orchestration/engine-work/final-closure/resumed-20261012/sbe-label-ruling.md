# SBE Türkçe fixture — etiket beklentisi düzeltmesi

12.10.2026. Üç Türkçe varyantın `none x2` beklentisi, 11 Ekim'de başlığın beş satır olduğu ve dış kapağın tek sayfaya sığdığı varsayımıyla değiştirilmişti. Güncel gerçek ölçüm bu varsayımı doğrulamıyor.

`cover-probe.json`: kaynak başlık metni, 80 mm genişlik, Times New Roman 12 pt kalın/büyük harf ve 13,8 pt satır adımı korunuyor. Başlık dokuz satır yüksekliğinde; ardından beş metin bloğu ve 6 pt paragraf aralığı geliyor. Toplam 14 × 13,8 + 6 = 199,2 pt (70,27 mm), kaynak üst konumu ile 10 mm alt kenar payı arasında kalan yaklaşık 62,6 mm'ye sığmaz. Tarih ve şehir ikinci sayfaya geçer; içerik gizlenmez, font/kaynak ölçüsü küçültülmez.

`final-2026-10-12b/all-word/aku-sbe` gerçek PDF/Word karşılaştırmasında her üç Türkçe varyantın dış kapağı iki sayfadır; numarasız iç kapakla birlikte üç numarasız fiziksel sayfa oluşur. Kılavuzun tek sayfalık EK-1 örneği, daha uzun bu fixture başlığının beş satır olduğunu kanıtlamaz; 80 mm çerçeve de şablonun mevcut belgelenmiş çıkarımıdır.

Bu nedenle yalnız `page-labels-unnumbered`, `-sanatta-yeterlik-tr`, `-phd-tr` için eski `none x3` beklentisi geri yüklenir. İngilizce kısa başlık beklentileri ve diğer kontroller değişmez. Bu, tolerans gevşetme veya başarılı çıktı üretmek için içerik azaltma değildir; yanlış beş satır varsayımının ölçümle düzeltilmesidir.
