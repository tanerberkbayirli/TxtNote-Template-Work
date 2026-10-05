# Tez şablonları: kaynaklar ve doğrulama

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

Word kontrolleri Microsoft Word ve uygun yerel ortam gerektirir. Araçların bağımlılıkları, ortam değişkenleri ve ayrıntılı kullanım bilgisi için [kontrol aracı belgesine](tools/CHECKER.md) bakılabilir. Eksik referans önbelleği veya bağımlılıklar hazırlanmalıdır; bu depo tüm hedeflerin tamamlandığı iddiasını taşımaz.

## Depoda tutulan dosyalar

Kaynak kuralları, kontrol araçları, test tanımları ve teknik sonuç raporları sürümlenir. İç çalışma talimatları, devam notları, bağımlılık klasörleri ve yeniden üretilebilir geçici çıktılar GitHub sunumuna dahil edilmez.

## Active policy 2026-10-03

Doğrulama politikası: resmi kaynaklara dayanmak, eksik kanıtı `UNKNOWN` olarak kaydetmek, gerçek export üzerinden ölçmek, açık ölçüler için en fazla 0,5 mm (güvenilir ölçümlerde tercihen 0,25 mm) tolerans uygulamak ve kullanılan fontu doğrulamak. Kaynak çatışmaları belgelenir; font ikamesi tam uygunluk sayılmaz. Paylaşılan motor değişikliklerinde regresyon kontrolü yapılır. Üretilen belgeler geçici çıktı, kaynak temelli kurallar ve sonuç kayıtları ise teknik kanıt olarak ele alınır.
