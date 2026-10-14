# TxtNote

Türkçe arayüzlü not uygulaması. Masaüstü kabuğu **Tauri 2**, arayüz **React 19 + Vite + Tailwind**.

Notlar masaüstünde SQLite dosyasında (`txtnote.sqlite`, uygulama veri klasörü), tarayıcıda IndexedDB’de tutulur. Uzak sunucu yok; `backend/` klasörü ilerideki HTTP sözleşmesi için boş bir yer tutucudur.

Tez şablonu motorunun kaynak kanıtı, gerçek PDF/DOCX dışa aktarma ve doğrulama akışı için [tez motoru belgelerine](../engine/README.md) bakın. Üniversite hedeflerinin güncel durumu ve sırası `../../README.md` ile `../../progress.json` içindedir; envanterde bir kaynak yolunun bulunması tek başına analiz veya PASS anlamına gelmez.

## Gereksinimler

- Node.js 20+
- Masaüstü geliştirme için [Rust](https://rustup.rs/) ve Windows’ta WebView2
- `npm run desktop:build` için ayrıca NSIS (Windows kurulum paketi)

## Kurulum

```bash
npm install
cd frontend && npm install
```

Kök dizindeki `npm install` Tauri CLI içindir. Arayüz bağımlılıkları `frontend/` altındadır.

## Komutlar

Kök dizinden:

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Yalnızca Vite (tarayıcı, `http://localhost:5173`) |
| `npm run desktop` | Tauri penceresi + Vite |
| `npm run desktop:build` | Üretim derlemesi ve Windows kurucusu |
| `npm test` | Birim testleri (`frontend/`) |

Yüklü `TxtNote.exe` bu kaynak ağacını kullanmaz. Arayüz veya kabuk değişikliğini görmek için `npm run desktop` çalıştırın.

## Dizinler

```
frontend/     React uygulaması
src-tauri/    Tauri kabuğu, yetkiler, Windows kurucusu
services/     Kalıcılık (SQLite / IndexedDB / mock / http stub)
types/        Paylaşılan veri şekilleri
backend/      İlerideki HTTP API notları (sunucu yok)
scripts/      Tauri npm sarmalayıcısı
```

Daha ayrıntılı harita: [ARCHITECTURE.md](./ARCHITECTURE.md).

## GitHub’a yüklerken

Şunlar **gerekmez** ve `../../../TxtNote/.gitignore` ile dışarıda bırakılır:

- `node_modules/`
- `frontend/dist/`
- `src-tauri/target/`, `src-tauri/gen/`
- `dist-installer/`
- `../../../TxtNote/.cargo/config.toml` (makineye özel Cargo hedefi)
- `.env` dosyaları

Gizli anahtar veya API anahtarı bu depoda yoktur.

## Lisans

Henüz bir lisans dosyası yok. Depoyu herkese açık yapmadan önce bir lisans seçin.

## Doğrulanan desktop release

`npm run desktop:build` imzalı release üretir. `npm run desktop:build:unsigned`
explicit unsigned moddur; bu modda `.sig` ve `latest.json` bulunması hata sayılır.
`output/task6-package.mjs` de aynı tam build akışına yönlenir.

Akış: frontend build → source fingerprint ve dist asset hash manifest'i → Tauri
release build/embedding → her dist asset'inin binary içindeki byte karşılığının
kontrolü (Tauri HTML nonce dönüşümü ve Brotli dahil) → NSIS bundle → updater
signature ve manifest doğrulaması → 7-Zip ile payload executable hash kontrolü →
gerçek packaged WebView2 smoke → `dist-installer` aktarımı ve kopya hash kontrolü.
Başarısız bir gate installer yayınlamaz. Eski bundle, signature ve manifest'ler
release başında temizlenir. Tekrar paketlemek için sadece `tauri bundle` kullanmayın.

Windows prerequisites: Edge/WebView2, `7z.exe` (`SEVEN_ZIP` ile yol seçilebilir),
Playwright (`PLAYWRIGHT_MODULE` ile yolu seçilebilir), Rust/MSVC ve mevcut updater
signing key. Smoke testi production CSP'yi kullanır, yalnızca kendi test WebView
profilini ve kendi başlattığı executable PID'sini yönetir. Cihaz cüzdanıyla oturum
varsa devam eder; kullanıcı belgelerini düzenlemek yerine yeni bir test tezi açar.
Varsayılan `current-release` kontrolü güncel resmî MCBÜ yüksek lisans şablonunu
paketlenmiş uygulamada oluşturur; altı ribbon sekmesini, kalıcı panel kısayollarını,
metin düzenleme/kalın/hizalama/zoom işlemlerini, A4 tuvalini, gerçek PDF/DOCX
export'unu, DOCX açılış alan ayarını ve kayıt/reload/tam uygulama restart'ını test
eder. Bu kontrol üniversite şablonu uygunluk raporu yerine geçmez. Eski demo
üniversitelere bağlı kapsam `TXTNOTE_SMOKE_SCOPE=legacy` ile korunmuştur;
demolar üretim listesinden kaldırıldığı için o kapsam güncel release kapısı değildir.
CSP olayları ve WebView Log security kayıtları hata sayılır; test için CSP gevşetilmez.

`npm run desktop:smoke -- <installer-payload/txtnote.exe>` aynı smoke'u bağımsız
çalıştırır. `npm run test:release` eski/değiştirilmiş updater artifact'larını
reddeden doğrulayıcı testleridir. Kanıtlar `output/desktop-parity/smoke.json` ve
`dist-installer/verification.json` içinde saklanır. Debug portu yalnızca testte
WebView2 environment argument'ıyla açılır; yayımlanan uygulamada açık kalmaz.
