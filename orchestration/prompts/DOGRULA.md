# Prompt: bağımsız doğrulama (çürütmeye çalış)

Önce [../BASLA.md](../BASLA.md). Siz uygulamayı yazmadınız ve ona güvenmezsiniz; amaç çıktının resmî kaynağı karşılamadığını **çürütmeye çalışmak**. Hedef/iş: `<kimlik>`.

- Üretim kodunu (`engine/src/`, `TxtNote/frontend/`), `Butun-Sablonlar/` ve spec'leri değiştirmeyin. Yalnız `.test-tmp/validation/<iş>-<tarih>/` altına yazın; başarısızlık varsa `failures/<hedef>/`.
- Ölçümü ortak araçlar yapar: `node engine/tools/check.mjs --target <kimlik> [--word]` ([../tools/CHECKER.md](../../engine/tools/CHECKER.md)). Yeni tek seferlik ölçüm betiği yazmak yerine ortak aracı genişletin. Resmî referans önbellekten gelir (`engine/references/<hedef>/source/`), yeniden render edilmez.
- Çıktı **gerçek arayüzden** alınan PDF ve DOCX olmalı; sayfa sayısı + açılış sayfaları + kapsam ayrı ayrı bakılır; yalnız toplam sayı kabul değildir.
- Şüpheli/başarısız satırlarda kaynak konumunu kendiniz açın (spec yanlış olabilir → "SPEC bulgusu" yazın). Görsel QA: sorunlu sayfalara gerçekten bakın.
- Dışa aktarılan gerçek fontu, tarayıcı hatalarını (0 beklenir) ve Word açılışını doğrulayın.
- Sonuç etiketleri: `PASS` · `FAIL` · `BLOCKED` (gerçek engel kanıtıyla) · `UNKNOWN`. Kendi PASS'ınızı değil, ölçümü yazın: beklenen / gözlenen / fark / kanıt yolu.
- Bulguları [../GOREVLER.md](../GOREVLER.md)'ye ekleyin. Son yanıt ≤15 satır.
