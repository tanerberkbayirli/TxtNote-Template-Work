# AFSÜ Eczacılık kapak düzeltmesi — 25.10.2026

Kullanıcının karşılaştırması editörden alınan PDF ile resmî kaynak arasındaydı. İlk kabul kontrolleri kapak örneklerinin koordinatlarını sınamadığından belirgin farklar varken geçmişti. Bu kapsamda önceki görsel uygunluk değerlendirmesi düzeltilmiştir.

## Kaynak ve tercih

[Resmî Araştırma Projesi Dersleri Yönergesi](https://eczacilik.afsu.edu.tr/wp-content/uploads/sites/19/2024/01/ARASTIRMA-PROJESI-DERSLERI-YONERGESI16.01.2024.pdf), fiziksel sayfa 8–9. Canlı kaynağın arşivle eşleşen SHA-256 değeri `ec76ed61e1bcd3528c4652d6158d81f8c9aad982ddc7426c86b221cb2fc621b4`.

Kaynak çelişkisi açıkça korunur: açıklama dış kapak/başlık için 14 punto isterken çizilmiş örnekler 12 punto kalındır. Kullanıcının resmî örnekle görsel eşleşme talebinde örneklerin 12 punto biçimi uygulandı. Bu tercih çelişkisiz kurumsal uygunluk olarak sunulamaz. İç örnekte beyaz bir şeklin altında kalan eski metin katmanı da bulunur; görünür son katmanın konumları esas alındı. Yönergenin EK başlığı ve kendi sayfa sayacı rapor kapağına eklenmedi.

## Düzeltme

Dış/iç kapakların metin alanları resmî örneğin ölçülen başlangıç satırlarına sabitlendi; tek satır aralığı ve 106,5 mm yatay merkez kullanıldı. Gövdenin 40/20/35/20 mm kenar boşlukları kapak yerleşiminin merkezini artık kaydırmıyor. İç kapaktaki şehir/yılın yaklaşık 32 mm erken gelmesi giderildi. Logolar kaynakta kullanılan boyut, konum ve saydamlık maskeleriyle alındı. İki satırlı uzun proje başlığı öğrenci ve danışman alanlarının yerini kaydırmıyor. Kullanıcı metni resimleştirilmedi; Word alanları düzenlenebilir metin olarak kalıyor.

## Doğrulama

- Gerçek editörden alınan 69 sayfalık PDF ve DOCX; DOCX gerçek Microsoft Word ile PDF'e çevrildi.
- `node engine/tools/check.mjs --target afsu-eczacilik-proje --word --out .test-tmp/afsu-eczacilik-final`: **44 PASS, 0 FAIL, 1 INFO**. INFO kaynakta belirsiz kalan kuralları bildirir.
- Yeni 16 kalıcı kontrol iki kapaktaki satır başlangıçları, yatay merkez, 12 punto ve kalınlığı hem PDF hem Word çıktısında resmî örneğe karşı sınar. Ölçülen en büyük başlangıç satırı farkı 0,043 mm; statik metin merkez farkı en çok 0,040 mm.
- AFSÜ seçim/kaynak/içerik ve tez önerisi birim testleri: **11 PASS, 0 FAIL**.
- Normal tarayıcıda gerçek ThesisEditor ayrıca açılıp kapak görünümü incelendi. Kaynak, editör PDF ve Word görüntüleri yan yana incelendi.

Son kontrol: `.test-tmp/afsu-eczacilik-final/check-20261025-0240.json`. Çıktılar: `.test-tmp/afsu-eczacilik-final/run/default.{pdf,docx,word.pdf}`.

[Dış kapak karşılaştırması](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-eczacilik-20261025/compare-1.png) · [İç kapak karşılaştırması](../../.test-tmp/validation/rehber-kanitlari-20261025/afsu-eczacilik-20261025/compare-2.png). Solda resmî örnek, ortada editör PDF, sağda Word. Örnek ve çıktı metadata değerleri farklıdır; uzun başlık kasıtlı taşma sınamasıdır.

Bu çalışma Eczacılık kapaklarındaki bildirilen görsel farkı giderir. Kaynakta belirsiz kalan imza dizgisi, sayfa sayacı ayrıntıları ve 14/12 punto çelişkisi için tüm belgeye koşulsuz uygunluk onayı verilmez.
