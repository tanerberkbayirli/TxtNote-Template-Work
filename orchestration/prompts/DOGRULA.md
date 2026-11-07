# Çıktıyı doğrulama

Önce [BASLA.md](../BASLA.md) ve [AGENTS-RAPOR.md](../AGENTS-RAPOR.md). Amaç kaynakla gerçek çıktı arasındaki farkı ölçmektir. Kendi uygulama kontrolünüzü bağımsız inceleme diye sunmayın; bu yöntem başka ajan başlatma talimatı değildir.

- Salt doğrulamada üretim kodunu, şablonu veya beklenen değerleri değiştirmeyin. Düzeltme de yetkiliyse değişiklik sonrası kontrolü ayrıca kaydedin.
- Gerçek arayüzden PDF/DOCX alın; kaynak hash'i ve araç sürümü eşleşmeyen önbelleği güncel kanıt saymayın. Araç: [CHECKER.md](../motor/CHECKER.md).
- Beklenen/gözlenen değer, kaynak sayfası veya XML konumu, fark ve kanıt yolunu yazın. Spec yanlışsa çıktı hatası yerine spec bulgusu kaydedin.
- Sayfa sayısı, açılışlar, dizin hedefleri, font ve kapsam ayrı denetlenir. XML veya aynı sayfa sayısı tek başına Word görsel uygunluğu değildir. Sorunlu sayfaları gerçekten açın.
- Sonuç `PASS`, `FAIL`, `BLOCKED` veya `UNKNOWN` olabilir. Çalıştırılmayan kontrol geçmez; gerçek engel ve sınır açıklanır. Etiketler kurum kabulü değildir.
- Ham kanıt `.test-tmp/validation/<iş>-<tarih>/`, kısa rapor `raporlar/`, açık iş [GOREVLER.md](../GOREVLER.md) içindedir. Panel değişiyorsa ilgili [uygulama belgesini](../uygulama/README.md) okuyun.
