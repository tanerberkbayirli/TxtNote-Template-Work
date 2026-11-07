# AKÜ kaynak ve editör doğrulaması — 24.10.2026

Kullanıcı talimatıyla yalnız Afyon Kocatepe Üniversitesi tamamlandı. AFSÜ ve Aydın Adnan Menderes Üniversitesi için çalışma başlatılmadı. Kadro: ana ajan, GPT-6.1-Sol bağımsız denetçi, iki GPT-6-Luna uygulama/kaynak ajanı.

Mevcut 17 editör kaydı, 11 kaynak ailesi üzerinden incelendi. Kaynakla uyumlu şablon geometrileri korundu. İki kanıtlı ortak motor hatası giderildi: İSG içindekiler satırında asılı girintinin ayrı numara/başlık kutularına iki kez uygulanması ve baş harflerin kırpılması; Sağlık Bilimleri numarasız/sayılmayan sayfalarına Word PAGEREF alanlarının fiziksel sayfa numarası eklemesi. Sağlık düzeltmesi Word içindekiler alanı yenilendikten sonra da doğrulandı. Gizli fakat sayılan etiketler korundu.

Eksik FBE 2023 resmî Word belgesi, önceden canlı resmî kaynaktan alınmış ve tarihsel SHA-256 ile birebir eşleşen yerel kopyadan onarıldı. Farklı hash taşıyan 2025 belgesi onun yerine geçirilmedi. Coğrafya spec'inde eski karar notu güncel kaynak önceliğiyle uyumlu hale getirildi; geometri değişmedi. Kullanıcının önceden mevcut çalışma ağacı değişiklikleri korunmuştur.

Sonuç: kaynak temelli 11 hedefte 730 PASS, 0 FAIL, 26 INFO. INFO maddeleri kaynak belirsizlikleri ve denenmeyen kapsamdır; tam veya sınırsız uygunluk iddiası değildir. Dokuz hatasız hedefin ilk gerçek dışa aktarım kabulü korundu; değişiklikten etkilenen İSG ve Sağlık yeniden gerçek PDF/DOCX/Word çıktılarıyla sınandı. İSG son görseli ve tarayıcı regresyonu ayrıca bağımsız incelendi; kaynak Word ile başlık başlangıcı farkı yaklaşık 0,026 mm, numara–başlık boşluğu 1,06 mm / kaynak 1,058 mm.

Kanıt: `.test-tmp/validation/orchestration-aku-20261024-live/manifest.json`; `.test-tmp/validation/orchestration-aku-20261024-fixed/independent-acceptance-summary.json`; son İSG `orchestration-aku-20261024-final/aku-isg-tezsiz-proje/check-20261024-2057.json`; Sağlık `orchestration-aku-20261024-fixed/aku-sagbil/check-20261024-2047.json`. Bu yollar `.test-tmp/validation/` altındadır. Canlı kaynak hash kontrolleri `orchestration-aku-20261024-live/source-verification.json` içindedir.

Son AKÜ birim testleri: 88/88 PASS (`node --test` ile `TxtNote/frontend/src/lib/thesisAku*.test.js`). Kalıcı tarayıcı regresyonu: `TxtNote/frontend/tests/aku-isg-toc-hanging-clip.e2e.mjs` PASS. Genel test çalıştırması 1190/1193 geçti; üç başarısızlık bu turda değiştirilmeyen metin süsleme davranışı ve CAPABILITIES anahtar kapsamına aittir. Bunlar AKÜ kabulüne dahil edilmedi; GOREVLER.md'ye kaydedildi.
Son üretim derlemesi: npm run build --prefix TxtNote/frontend — PASS (8,29 sn). Bu tur için açılan 5176 geliştirme sunucusu kapatıldı.
