# Klasör düzenlemesi — 14.10.2026

Görev, plan, yapay zekâ yönergesi, teknik belge ve kaynak notları `orchestration/` altında toplandı. Üretim tez motoru `TxtNote/frontend/src/thesis/` konumundan kökteki `engine/src/` konumuna taşındı.

- Güncel görev: `orchestration/MISSION.md`; ortak yönergeler: `orchestration/AGENTS.md`; başlangıç: `orchestration/README.md`.
- Önceki `engine/` çalışma klasörü: `orchestration/engine-work/`. Deneyler, eski uygulama kopyaları, ölçüm araçları ve kanıtlar birlikte korundu.
- 139 Markdown belge taşındı. Motor belgeleri `docs/engine/`, uygulama belgeleri `docs/TxtNote/`, üniversite kaynak notları `docs/Butun-Sablonlar/` altında. Üçüncü taraf lisansları dağıtım dosyalarının yanında kaldı.
- Hata kayıtları `orchestration/bugs.md` ve `orchestration/bugs/`; eski motor planı `orchestration/plans/MOTOR.md`; MCBÜ kararları `orchestration/decisions/` altında.
- Importlar, Vite izin/alias ayarları, JS proje yolları, şema/katalog test yolları ve kabul araçları güncellendi. Motor kaynak testleri frontend test komutuna dahil edildi. Ortak `docx` sınıf kimliği uygulama runtime köprüsüyle korundu.
- Motor bağımlılıkları mevcut frontend kilidindeki sürümlerle ayrı kilitlendi. Ağ kurulumunun tamamlanmaması üzerine yereldeki aynı sürümler doğrulanarak kopyalandı; tekrar kullanılabilir çevrimdışı araç `tools/seed-engine-dependencies.cjs`.
- İlk taşıma eski deneydeki bağımlılık junction'ını izlediği için işlem durduruldu; taşınan bağımlılıklar uygulama dizinlerine geri kondu. Çakışan iki önbellek dosyası silinmeden `relocation-backups/` altında saklandı. Ardından bağlantıları izlemeyen dizin taşıması kullanıldı.
- Dizinleri kilitleyen, bu projeye ait olduğu doğrulanan eski Vite süreçleri kapatıldı. Yeni uygulama sunucusu `http://127.0.0.1:5200/` üzerinde başlatıldı.

## Doğrulama

- Frontend ve motor: **1034/1034 PASS**, 0 atlama — `layout-reorganization-unit-final.log`.
- Servisler: **27/27 PASS**, 0 atlama — `layout-reorganization-services.log`.
- Üretim derlemesi: **PASS** — `layout-reorganization-build-final.log`. Mevcut büyük paket/plugin süre uyarıları devam ediyor.
- Gerçek Chrome: **PASS**, HTTP 200, 4 editör sayfası, `/engine/` üzerinden 34 şablon, 0 pageerror — `layout-reorganization-browser.json`.
- Taşıma haritasındaki tüm hedefler mevcut; taşınan belgelerde kırık yerel bağlantı yok. Kaynak notlarındaki 25 eski dosya bağlantısı gerçek dosya konumlarına düzeltildi.
- Fixture üretim aracı yeni motor yoluyla ADÜ Sağlık Bilimleri belgesi üretti. `git diff --check` temiz.

İlk başarısız test/derleme kayıtları korundu. Taşıma sırasında yanlışlıkla yol kabul edilen nokta karakterleri geri yüklendi; son testlerin tamamı bu düzeltmelerden sonra geçti.

Özgün PDF/DOCX kaynakları ve geçmiş ölçüm JSON/log dosyaları korundu. Tarihsel ölçüm dosyalarındaki eski yollar için `../relocation-map.json` kullanılabilir. Kullanıcı değişiklikleri sıfırlanmadı; commit yapılmadı. Bu yapısal doğrulama SRC09/SRC10 ürün hatalarının veya genel Word kabulünün kapandığı anlamına gelmez.
