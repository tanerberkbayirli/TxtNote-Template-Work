# Tez bilgileri paneli — 2026-10-10

Kullanıcı kuralı: Bir bilgi seçili şablonun belgesinde kullanılmıyorsa panelde
istenmez. Bu kural kayıtlı tüm şablonlara uygulanır.

`metadataPanel.js`, açık belge bölümlerinin gerçek metin yer tutucularını ve
metadata bloklarını okur. Yalnızca şablon tanımında bulunması bir alanı göstermek
için yeterli değildir. Ortak alan listesi etiket/tür için varsayılan sağlar;
belgede olmayan öğrenci numarası, şehir, yıl, ikinci danışman vb. eklemez.

- Kapalı isteğe bağlı bölümlere özel alanlar gösterilmez; bölüm açılınca açılır.
- Koşullu ikinci danışman gibi kullanıcı doldurunca belgeye giren alanlar erişilebilir kalır.
- Aynı verinin eski/yeni anahtarları tek alan olarak gösterilir.
- Üniversite/enstitü/derece ve hesaplanan değerler kullanıcıdan tekrar istenmez.
- İngilizce belgelerde tek “Tez başlığı” alanı korunur; gerekli Türkçe ÖZET başlığı ayrıdır.
- Boş bilgi grupları, boş belge ayarları ve olmayan isteğe bağlı bölüm grubu gizlenir.
- Kaynakça bölümü olmayan iki AFSÜ tez önerisinde kaynakça girişi gösterilmez.
- Gösterilmeyen alanların kayıtlı değerleri silinmez. Şablon/bölüm geri açılınca geri gelir.
- Belgeye basılmayan metadata için panelde doldurma uyarısı gösterilmez; kaynak
  kullanım notları ve derleyicinin kaynak kuralları değiştirilmez.

Doğrulama:

- 800 test geçti; üretim derlemesi başarılı.
- 34 kayıtlı şablon gerçek tarayıcıda açıldı. Alan listesi, isteğe bağlı bölümleri
  açma, boş gruplar, başlık kaydı, yeniden açma ve sayfa hataları kontrol edildi.
- Son kaynakça düzeltmesinden sonra etkilenen iki tez önerisi tekrar kontrol edildi.
- İYTE lisans ve yüksek lisans panel görüntüleri görsel olarak incelendi.
- Kayıtlar: `orchestration/validation/metadata-panel/report.json`,
  `proposals/report.json`, `source-audit.json` ve
  `orchestration/validation/iyte/metadata-panel-tests.log`, `metadata-panel-build.log`.

Önceki tamamlanma kayıtları önceki sürümlerin tarihsel doğrulaması olarak korunur.
