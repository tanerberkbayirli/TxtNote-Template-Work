# Proje çalışma merkezi

Görevler, planlar, yapay zekâ çalışma yönergeleri, teknik belgeler, kaynak notları ve doğrulama kayıtları bu klasörde tutulur. Güncel görevlerin başlangıç noktası [MISSION.md](MISSION.md); geçmiş kayıtlar yeni bir kabul sonucu sayılmaz.

- [MISSION.md](MISSION.md): güncel görevler ve son durum.
- [AGENTS.md](AGENTS.md): yapay zekâlar için ortak başlangıç ve çalışma yönergeleri.
- [plans/MOTOR.md](plans/MOTOR.md): önceki motor geliştirme planı ve çalışma kuralları.
- `*BRIEF*.md`, `WORKFLOW_LOCAL.md`: mevcut çalışan/inceleme yönergeleri.
- `decisions/`: karar bekleyen konular.
- `docs/engine/`: motorun teknik belgeleri ve yetenek kataloğu.
- `docs/TxtNote/`: uygulama mimarisi, kurulum ve entegrasyon belgeleri.
- `docs/Butun-Sablonlar/`: resmî üniversite kaynaklarının açıklama ve köken notları. Özgün PDF/DOCX dosyaları kökteki `Butun-Sablonlar/` altında kalır.
- `engine-work/`: eski `engine/` klasöründeki görevler, deneyler, ölçüm araçları ve kanıtlar. Buradaki deney kopyaları üretim motoru değildir.
- `bugs.md`, `bugs/`: hata kayıtları ve kanıtları.
- [relocation-map.json](relocation-map.json): 13 Ekim 2026 klasör taşıma haritası.

Üretim motoru proje kökündeki `engine/src/` altındadır. Uygulama arayüzü `TxtNote/frontend/` altında kalır; motorun arayüzle paylaştığı yardımcılar hâlâ bu uygulama klasöründen alınır.

Kurulum ve doğrulama, proje kökünden:

```powershell
npm ci --prefix engine
npm ci --prefix TxtNote/frontend
npm test --prefix TxtNote/frontend
npm run build --prefix TxtNote/frontend
```

Mevcut frontend bağımlılıkları kuruluysa, ağ bağlantısı gerektirmeyen kurulum alternatifi `node orchestration/tools/seed-engine-dependencies.cjs` komutudur. Araç yalnızca motor kilit dosyasındaki aynı sürümleri kopyalar.

Tarayıcı testleri motoru `/engine/` üzerinden yükler; Node testleri gerçek `engine/src/` dosyalarını kullanır. Klasör taşıması, bekleyen ürün hatalarının kapandığı veya tam Word kabulünün geçtiği anlamına gelmez. Önceki ölçüm sonuçları kendi kaynak sürümlerine aittir.

## Tez şablonları: kaynaklar ve doğrulama

Bu klasör, TxtNote / TxtEngine tez şablonlarının resmi üniversite belgelerine uygunluğunu incelemek ve doğrulamak için kullanılan teknik altyapıyı içerir.

## Klasör yapısı

- `specs/`: Resmi kaynaklardan çıkarılan biçim kuralları, kaynak konumları, kontrol tanımları ve deterministik test belgeleri.
- `tools/`: Gerçek editör üzerinden PDF/DOCX üretimi ve ölçüme dayalı uygunluk kontrolü yapan araçlar.
- `reports/`: Kaynak incelemeleri, teknik kararlar ve doğrulama raporları.
- `artifacts/`: Resmi kaynaklardan elde edilen referans ölçümleri ve inceleme kayıtları. Referans önbelleğinin bazı dosyaları yalnızca yerelde bulunabilir.
- `validation/`: Kaydedilmiş doğrulama sonuçları ve tekrar kullanılabilir test yardımcıları. Üretilen PDF/DOCX belgeleri ve geçici inceleme dosyaları Git dışında tutulur.
- `manifest.json`: Üniversite kaynaklarının, hedef şablonların ve desteklenen varyantların envanteri.
- `progress.json`: Hedeflerin geliştirme ve doğrulama durumu.

## Doğrulama yaklaşımı

Resmi kaynak → kaynak temelli kurallar → şablon → gerçek PDF/DOCX export → ölçüm ve karşılaştırma → regresyon kontrolü.

Kurallar açıkça belirtilmiş (`EXPLICIT`), doğrudan ölçülmüş (`MEASURED`), gerekçeli çıkarım (`INFERRED`) veya kanıtı eksik (`UNKNOWN`) olarak kaydedilir. Belirsizlikler ve kaynak çelişkileri raporlarda korunur.

Bir şablonun kodunun yazılmış olması uygunluk onayı anlamına gelmez. `PASS` yalnızca ilgili kaynak temelli kontroller başarılı olduğunda kullanılır; `FAIL` desteklenen bir gereksinime aykırılığı, `BLOCKED` ise tamamlanmayı engelleyen kaynak veya teknik sorunu gösterir. Eski raporlar ait oldukları denemenin sonucudur; güncel durumu anlamak için ilgili hedefin son kontrol raporu ve ilerleme kaydı birlikte incelenmelidir.

## Kontrol araçları

Frontend geliştirme sunucusu çalışırken, proje kökünde:

```sh
node orchestration/tools/check.mjs --target <hedef-kimliği>
node orchestration/tools/check.mjs --target <hedef-kimliği> --word
node orchestration/tools/check.mjs --all --word
```

Word kontrolleri Microsoft Word ve uygun yerel ortam gerektirir. Araçların bağımlılıkları, ortam değişkenleri ve ayrıntılı kullanım bilgisi için [kontrol aracı belgesine](./tools/CHECKER.md) bakılabilir. Eksik referans önbelleği veya bağımlılıklar hazırlanmalıdır; bu depo tüm hedeflerin tamamlandığı iddiasını taşımaz.

## Depoda tutulan dosyalar

Kaynak kuralları, kontrol araçları, test tanımları ve teknik sonuç raporları sürümlenir. İç çalışma talimatları, devam notları, bağımlılık klasörleri ve yeniden üretilebilir geçici çıktılar GitHub sunumuna dahil edilmez.

İç içe doğrulama klasörlerindeki `run/` dizinleri ve ham `*.layout.json` çıktıları da geçicidir. Bunlar kontrol aracıyla yeniden üretilir; kaynak `specs/` girdileri, resmî referanslar ve sonuç raporları depoda korunur. Örneğin bir hedefin güncel çıktıları `node orchestration/tools/check.mjs --target <hedef-kimliği>` komutuyla oluşturulur. Yerel tarayıcı test profilleri ve önbellekleri `.test-tmp/` altında tutulur ve sürümlenmez.

## Active policy 2026-10-03

Doğrulama politikası: resmi kaynaklara dayanmak, eksik kanıtı `UNKNOWN` olarak kaydetmek, gerçek export üzerinden ölçmek, açık ölçüler için en fazla 0,5 mm (güvenilir ölçümlerde tercihen 0,25 mm) tolerans uygulamak ve kullanılan fontu doğrulamak. Kaynak çatışmaları belgelenir; font ikamesi tam uygunluk sayılmaz. Paylaşılan motor değişikliklerinde regresyon kontrolü yapılır. Üretilen belgeler geçici çıktı, kaynak temelli kurallar ve sonuç kayıtları ise teknik kanıt olarak ele alınır.

## Resmî DOCX kaynak çıkarımı (Faz 4)

`docx2spec.py`, resmî DOCX XML özelliklerini kaynak konumları ve SHA256 ile çıkarır. Kullanım: [DOCX çıkarım belgesi](./tools/DOCX_EXTRACTION.md). Faz 4, ADÜ Sağlık Bilimleri master/TR pilotunda kaynak Word geometrisi, şablon üretimi ve 303/303 gerçek PDF/DOCX/Word kontrolüyle kapandı; üniversitenin diğer varyantları ayrı kuyruğa dahildir. [Kapanış raporu](./reports/MOTOR_PHASE4_CLOSE_2026-10-07.md).

## Word uyumu — başlanmış fazlar

[Çalışma planı](./reports/WORD_UYUM_5_FAZ_PLANI_2026-10-07.md) ve [başlangıç denetimi](./specs/word-compatibility-plan.audit.json) mevcut bulguları içerir. 5.1 kapandı; 5.2 kısmi araştırma durumunda ve kabulü açık. Başlanmamış görevler 2026-10-08 tarihinde kullanıcı isteğiyle kaldırıldı. Kaynak envanteri ve doğrulama bulguları korunur.
