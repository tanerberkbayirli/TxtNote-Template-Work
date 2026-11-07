# Orchestration sadeleştirmesi

26 Ekim 2026. Kapsam yalnız proje talimatları ve belgeleridir; uygulama kodu veya şablon çıktısı bu çalışmada değiştirilmedi. Resmî internet kaynakları yeniden taranmadı.

## Yapılanlar

- Giriş ve kurallar `BASLA.md`, açık işler `GOREVLER.md`, değerlendirme dersleri `AGENTS-RAPOR.md`, dosya yerleşimi `KATI_KURALLAR.md` içinde ayrıldı. `KANIT.md` kaldırıldı; harita ve komutları `motor/README.md` içinde birleştirildi.
- 22 hedef bağlamı `hedefler/specs/` yerine doğrudan `hedefler/` altına taşındı. Geçmiş kayıtlar güncel talimat veya PASS sayılmayacak biçimde işaretlendi. CBÜ LEE bağlamı son doğrulanmış kaynak kararlarıyla yenilendi.
- Ayrı başlık/metadata notları `uygulama/TEZ_BILGILERI.md` içinde, atıf/kaynakça kararları uygulama mimarisinde birleştirildi. Araştırma senaryoları `prompts/ARASTIRMA.md` altına taşındı; mevcut düzeltme yetkisine rağmen tekrar onay isteme çelişkisi kaldırıldı.
- 34 ham TXT dökümü aktif talimat ağacından kaldırıldı. Yerini daha yeni raporların aldığı eski AFSÜ tekrar raporu kaldırıldı. Rapor dizini hangi kaydın hangi kapsamı kapattığını gösteriyor.
- 725 satırlık eski hata envanteri kısa kimlik/kapanış kaydına indirildi. 51 tarihsel hata kimliğinin tamamı ve sonradan bildirilen kapanışlar korundu; hepsi güncel açık hata diye sunulmadı.
- AFSÜ etik/kapak sorunları ve editör keşif hataları için eski açık durumlar düzeltildi. CBÜ bilinçli içerik tercihleri ve kılavuzla uyumlu başlık düzeni açık hata listesinden ayrıldı.
- Altyapı belgesindeki eski sabit sayılar, geri alınmış planlar ve “elle inceleme gerekmez” iddiası çıkarıldı. Teknik anahtar kataloğu korundu; eski “Word line breaker uygulanmadı” kaydı sonraki uygulamayla uzlaştırıldı; strict politika ve yeni anahtarlar belgelendi.

## Son yapı ve korunanlar

Başlangıç `../BASLA.md` dosyasıdır. `motor/`, `uygulama/`, `prompts/`, `hedefler/`, `raporlar/`, `sablon-kaynaklari/` görevleri ayrıdır. Toplam dosya sayısı 382'den 348'e, boyut yaklaşık 2,77 MB'den 1,37 MB'ye indi. 38 eski/ham dosya kaldırıldı, 23 dosya taşındı; birleşen bilgilerin güncel karşılıkları korundu.

Üniversite kaynak bankasındaki 294 dosya bayt düzeyinde değişmedi. Özgün belgeler, çalışan JSON şablonları, motor ve uygulama kodu bu temizliğin kapsamına alınmadı. `AGENTS-RAPOR.md` korundu ve başlangıç okuma sırasına bağlandı.

## Kontrol ve geri alma

- Göreli Markdown bağlantıları normalize edilmiş tam yollarla denetlendi; eksik hedef bırakılmadı.
- Teknik belge anahtar kapsamını sınayan `thesisCapabilities.test.js` geçti. Uygulama değişmediği için tam test/derleme çalıştırılmadı.
- 51 eski hata kimliği, kaynak bankası hash'leri, dosya envanteri ve yedek ZIP bütünlüğü kontrol edildi.
- Tam temizlik öncesi yedek: `.test-tmp/validation/orchestration-sadelestirme-20261026/orchestration-before.zip`. Kaldırılan içerik ZIP içinde özgün `orchestration/...` yolu ile bulunur. Geçici klasör temizlenirse bu geri alma kopyası da kaybolur.
- Makinece okunabilir kanıt: aynı dizindeki `inventory-before.json`, `operations.json`, `verification.json` ve `capabilities-test.log`.

Belge tutarlılığı denetimi, tarihsel uygulama bulgularının yeniden çalıştırılması veya kurum kabulü anlamına gelmez.
