# TxtNote uygulaması

Uygulama kodu `TxtNote/`, ortak belge motoru `engine/` altındadır. [Mimari](ARCHITECTURE.md), [motor belgeleri](../motor/README.md), [komutlar](../motor/README.md#komutlar).

**Zorunlu okuma (şablon, içindekiler, rehber işleri):** [İçindekiler paneli](ICINDEKILER_PANELI.md) ve [Rehber paneli](REHBER_PANELI.md). Burada karara bağlanmış davranışlar kullanıcıya yeniden sorulmaz.

## Çalıştırma

Komutlar proje kökünden: `npm run dev --prefix TxtNote` arayüz, `npm run desktop --prefix TxtNote` geliştirme masaüstü uygulaması; yüklü TxtNote.exe kaynak ağacındaki değişiklikleri kullanmaz. `npm run build --prefix TxtNote` derleme, `npm test --prefix TxtNote` uygulama ve bağlı motor testleri. Bağımlılık gereksinimleri package.json/lock dosyalarına göredir.

## Masaüstü paketleme

`npm run desktop:build --prefix TxtNote` sürüm akışıdır (Rust/MSVC, WebView2, NSIS gerekir; imzalı akış mevcut updater anahtarını kullanır, `desktop:build:unsigned` imzasızdır). Çıktı `TxtNote/dist-installer/` altındadır. Ayrıntı için `TxtNote/scripts/release.mjs` esas alınır. **Kurucu yalnız kullanıcı isterse üretilir;** her kod değişikliğinden sonra otomatik paketleme yapılmaz.

## Ürün kararları

- [İçindekiler paneli](ICINDEKILER_PANELI.md): manuel/otomatik dizin, sıralama ve gövde bağı.
- [Tez bilgileri](TEZ_BILGILERI.md): görünür alanlar ve Türkçe/İngilizce başlık.
- [Rehber paneli](REHBER_PANELI.md): sağ sütun ve kaynak kurallarının sunumu.
- [Mimari](ARCHITECTURE.md): veri sınırları, kısmi biçim ve atıf/kaynakça.
