# Açık işler

Düzenleme: 26 Ekim 2026. Yalnız kalan kapsam tutulur; bu dosya yeni iş başlatma talimatı değildir. Bir madde somut sorun, kanıt ve kapanış ölçütüyle güncellenir. Tarihli sayılar güncel test sonucu değildir. Değerlendirme dersleri [AGENTS-RAPOR.md](AGENTS-RAPOR.md), geçmiş sonuçlar [rapor dizinindedir](raporlar/README.md).

## Yeniden doğrulanacaklar

- **Genel test sağlığı ve kayıt defteri:** 25 Ekim kaydındaki 15 lib testi başarısızlığı ve beş sürüm uyuşmazlığı bugünkü sayı olarak kullanılmaz. 26 Ekim CBÜ grubunda 141 test geçti; ortak AFSÜ özel sayfa testinde Symbol beklentisi başarısızlığı ayrıca kaydedildi. Kalanları güncel kodla yeniden üretip kapsamı belirleyin. [CBÜ raporu](raporlar/MCBU_SABLON_DUZELTMELERI_2026-10-26.md), [AKÜ raporu](raporlar/AKU_DOGRULAMA_2026-10-24.md).
- **Eski hata envanteri:** veri bütünlüğü, performans, masaüstü ve araç sorunlarının tarihli kimlikleri [22 Ekim özetinde](raporlar/HATA_ENVANTERI_2026-10-22.md). Sonradan kapatılanlar dahil hepsini açık varsaymayın. Güncel inceleme yapılmadan toplu düzeltme başlatmayın.
- **Editör uçtan uca kontrolü:** içindekilerden gövde başlığı ekleme/taşıma ve olmayan sayfaya yer açmanın gerçek Word/PDF çıktısı; çift taraflı baskı numarası; okuma konumu kök nedeni; eski `general-editor-workflow` ve `thesis-ribbon-panels` testlerinin sağ sütuna uyarlanması. 25 Ekim [panel kaydı](uygulama/ICINDEKILER_PANELI.md) kapsamından ayrılmalıdır.
- **Metin kutusunda kısmi biçim:** kalın/italik/altı çizili editörde denendi; renk/vurgu/boyut ve gerçek Word/PDF kısmi biçim çıktısı aynı kapsamda doğrulanmadı. [Mimari](uygulama/ARCHITECTURE.md).
- **Rehber kapsamı:** `templateRuleOverlays.js` kaynak taraması AKÜ/AFSÜ/MCBÜ ile sınırlı; diğer Ege kuralları, AFSÜ öneri ve AKÜ İSG/Matematik kalanları yeniden belirlenmeli. Tauri'de kaynak bağlantılarının açılışı denenmedi. [Rehber raporu](raporlar/REHBER_PANELI_2026-10-25.md).
- **Kaynak çelişkileri:** İKÇÜ FBE başlık fontu, MSKÜ FBE paragraf aralığı ve kayıtsız DEÜ FBE artığının son kaynak/registry durumunu doğrulayın; eski dosya sayısını veya eski öncelik kararını esas almayın.

## Motor ve çıktı

- Şema tekrarları, boşluk politikaları ve özel sayfa davranışlarının ortak modele taşınmasında kalan kapsam: [ALTYAPI.md](motor/ALTYAPI.md). Kaynak izi, anlamlı alanlar, ikili görseller ve registry üretiminin eksikleri kodla belirlenmeli.
- Editör ↔ Word/PDF: uzun tablo/denklem/resim, dipnota ayrılan alan ve otomatik dizin kırılımları farklı içerik uzunluklarında ölçülmeli; tek örnek genel kabul değildir.
- Gerçek Tauri'den MCBÜ PDF/Word çıktısı ve 80–120 sayfalık tezde yazma gecikmesi ölçülmedi. Performans bütçesi önceden belirlenmeli; en az 20 örnekle medyan/p95 kaydedilmeli.
- Özgün `testtez.docx` editörden alındı ve XML/metin denetimleri geçti; aynı belgenin ek PDF denemesi tamamlanmadı, Word yeniden sayfalama görsel kontrolü yapılmadı. Neden varsayılmamalı. [CBÜ raporu](raporlar/MCBU_SABLON_DUZELTMELERI_2026-10-26.md).
- `spec2template.mjs` bağlam dosyasını spec çıktı dizinine üretebiliyor. Bilgilendirme çıktısı `orchestration/hedefler/` altına yönlendirilmeli; ham araç verisiyle karıştırılmamalı.

## Açık sanılmaması gereken kapanışlar

- AFSÜ etik sayfası kayması ve ilgili kapak bulguları, 25 Ekim [son görsel raporunda](raporlar/AFSU_DIGER_SABLONLAR_GORSEL_2026-10-25.md) giderilmiş olarak kayıtlıdır; önceki rapora dayanarak yeniden açık yazılmaz. Symbol ile ilgili genel test beklentisi ayrı konudur.
- 24 Ekim editör keşfindeki dört doğrulanmış hata düzeltildi; yalnız iki doğrulanmamış gözlem için sonuç yoktur. [Keşif ve düzeltme kaydı](raporlar/editor-test-notlari-2026-10-24.md).
- CBÜ'de “Akademisyen”, kullanıcının kısa bölüm yapısı, içindekilerde ortalı/numarasız ana bölüm ve simgelerde 1,5 satır hata değildir. Bunlar açık iş listesine geri eklenmez.

## Askıdaki kapsam

- [Araştırma senaryoları](prompts/ARASTIRMA.md) ancak kullanıcı ilgili işi verdiğinde yürütülür; tamamlanmış bulgu değildir.
- İçe aktarma kabulü/SRC09/SRC10 işleri askıdadır; düğmeler görünür kalır. Eski içe aktarma raporu yeniden başlatma yetkisi değildir.
- Uzak arka uç ve cihazlar arası senkronizasyon tamamlanmış sayılmaz. Haricî hesap hizmeti, TypeScript geçişi ve kaldırılmış kabuk görevleri kendiliğinden başlatılmaz.
