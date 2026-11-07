# Rehber paneli — güncel davranış ve bakım

Belge düzeni: 26.10.2026. Sağ sütun sırası: İçindekiler → Tez bilgileri (kapalı “Sayfa ayarı”) → Kaynaklar → Yazım planı → Rehber. Seçili öğenin “Öğe ayrıntıları” aynı sütunda açılır. Eski “Paneller” düğmesi/yan çekmece kullanılmaz; şerit kısayolları mevcut sağ sütunu açar. Kaynaklar paneli `ThesisSources` bileşenini kullanır (`sourcesOpen`).

## İki seçenek
- **Uygulama rehberi:** ortak, sabit içerik ([appGuideContent.js](../../TxtNote/frontend/src/lib/appGuideContent.js), `APP_GUIDE_VERSION`). [AppGuideModal.jsx](../../TxtNote/frontend/src/features/editor/AppGuideModal.jsx): ortalanmış modal, arka plan blur, sağ üstte ×, Escape, Tab sınırı, açan düğmeye odak dönüşü. Belge durumuna dokunmaz. İçeriğe yalnız kodda doğrulanmış özellik yazılır; yeni özellik eklenince metni güncelleyin.
- **Bu şablonun yazım kuralları:** panel içinde ([ThesisGuidePanel.jsx](../../TxtNote/frontend/src/features/editor/ThesisGuidePanel.jsx)). Veri [templateRulesGuide.js](../../TxtNote/frontend/src/lib/templateRulesGuide.js) ile seçili şablon kaydından okunur (11 bölüm). Kayıtta olmayan değer “Şablon kaydında yok — … henüz işlenmedi” görünür; motor varsayılanı resmî kural gibi sunulmaz. Resmî kılavuzdan doğrudan okunmuş kurallar [templateRuleOverlays.js](../../TxtNote/frontend/src/lib/templateRuleOverlays.js) içinde şablon kimliği + kaynak belge SHA-256 öneki + konum + tarihle tutulur; şablon kaydı o belgeyi içermiyorsa gösterilmez (testle denetlenir).

## Yeni şablonda
Ek kod gerekmez; kural kaydı şablondan gelir. Kılavuzdaki kelime/sayfa sınırı veya anahtar kelime aralığı gibi kayıtta eksik kuralı eklemek için kılavuzu okuyup overlay'e konumuyla ekleyin. Hiçbir şablon “tam rehber” diye sunulmaz (durum etiketi: kontrol edilmiş kayıt / taslak / doğrulanmadı).

## Doğrulama
`node --test TxtNote/frontend/src/lib/templateRulesGuide.test.js`; arayüz: `tests/mcbu-contents-review.html?template=<id>`.

## Sağ sütun davranışı (25.10.2026)
- Aynı anda tek panel açık kalır (`closeRail` ThesisEditor.jsx); açık panel diğer düğmeleri gizler, kapatmak için × kullanılır.
- Okuma konumu belge kimliği (`documentId`) başına hatırlanır; girdi (tekerlek/tuş/işaretçi) olmadan en üste atlama geri alınır, pencere öne gelince de konum korunur.
