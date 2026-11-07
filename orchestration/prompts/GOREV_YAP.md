# Uygulama ve düzeltme

Önce [BASLA.md](../BASLA.md) ve ilgili [bilinen hata kaydı](../AGENTS-RAPOR.md). Kullanıcının verdiği işi yapın; başka işleri kendiliğinden başlatmayın.

1. İlgili görev, teknik belge ve gerekiyorsa `hedefler/<kimlik>.CONTEXT.md` kaydını okuyun. Tarihsel notu güncel test sonucu saymayın.
2. Sorunu mevcut kod/dosyada yeniden üretin. Kök nedeni ölçün; eski rapordaki sayıyı bugünün bulgusu olarak kullanmayın.
3. Kullanıcının içerik tercihlerini koruyarak gerekli değişikliği yapın. Şablon değeri kendi resmî kaynağından gelir; motor davranışı mümkün olduğunca ortaktır.
4. Uygun kontrolü çalıştırın: yerleşim işinde gerçek çıktı/görsel kontrol; yalnız belge işinde bağlantı, dosya yolu ve içerik tutarlılığı kontrolü. Komutlar [motor/README.md](../motor/README.md).
5. Ham kanıtı `.test-tmp/validation/<iş>-<tarih>/` altına yazın. Gerekliyse kısa tarihli rapor oluşturun; [GOREVLER.md](../GOREVLER.md) içindeki kapanan işi kanıtla kaldırın veya kalan kapsamı güncelleyin.
6. Değişiklik, kontrol sonucu ve sınırları belirtin. Yetkili iş için yeniden izin istemeyin; kullanıcı istemedikçe commit/push/paketleme yapmayın.
