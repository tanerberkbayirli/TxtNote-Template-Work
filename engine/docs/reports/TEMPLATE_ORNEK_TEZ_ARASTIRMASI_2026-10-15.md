# Güncel örnek tez araştırması — devam tamamlandı

15.10.2026. Kullanıcının “devam et” talebiyle mola sona erdi. Dört örnek-tez kararı güncel üretim çıktılarında doğrulandı.

- **AKÜ FBE:** 71 PASS, 3 INFO; yüksek lisans, doktora ve üç üyeli yüksek lisans senaryosu. PDF ve Word'de Özet/Abstract yıl-sayfa → anahtar kelime sırası; üç üyeli senaryoda yalnız 1/2/3 numaralı jüri üyeleri basılıyor.
- **AKÜ SBE:** 176 PASS, 2 INFO; TR yüksek lisans/doktora, Sanatta Yeterlik, EN yüksek lisans/doktora. Roma/Arap sayfa numaralarının konumu ve fontu kaynak örneğine göre kontrol edildi.
- **AFSÜ Tıp:** 68 PASS, 2 INFO. İlk Word denemesi, kaynak PDF'te ölçülen 11,04 punto OOXML'in yarım punto birimlerine uymadığı için başarısız oldu. Nominal boyut **11 punto** olarak düzeltildi; kaynağın 11,04 ölçümü korundu. Yeni Word ve PDF numara konumu/fontu kontrolleri geçti. Diş Hekimliği bu örnek kararına dahil edilmedi.

Toplam **315 PASS, 0 FAIL/UNKNOWN/SKIPPED, 7 INFO**, üç hedef ailesi/dokuz örnek belge. İlgili **39 birim testi** ve üretim derlemesi PASS. Dört örnek Word sayfası görsel olarak incelendi; Tıp/SBE örneklerindeki bütün basılı numaralar ayrıca sayfa bazında ölçüldü. Üretim kodu aynı kaldı. Kontrol aracı yardımcı betikleri de hash'e kattığından iki tam kod parmak izi oluştu: arada yalnız yeni salt-okuma inceleme betiği eklendi. İki kimlik güncel dosyalardan bu bilinen eklemeler çıkarılarak birebir yeniden hesaplandı; özgün rapor hash'leri değiştirilmedi. Ayrıntı kabul özetinin codeIdentityAudit alanında.

Sonuç: [kabul özeti](../validation/template-thesis-research-20261015/acceptance-summary.json), [sayfa bazlı inceleme](../validation/template-thesis-research-20261015/output-inspection.json), [güncel karar kaydı](../validation/template-thesis-research-20261015/decisions-v2.json). Başarısız denemeler silinmedi. Spec JSON içindeki NOT_RERUN ifadeleri ilk kaynak-kararı checkpointinin tarihsel notudur; güncel çıktı durumu bu kabul özetindedir.

Uygun güncel örneği bulunamayan şablonlar kullanıcının talimatıyla pas geçildi. Bu şablonların veya çalışılan hedeflerdeki diğer kaynak belirsizliklerinin tamamlandığı söylenmiyor. Genel motor uzun belge kabulü ve Word'ün yeniden kaydettiği DOCX/SDK işi ayrıca açık. Commit yapılmadı.

Yerel geliştirme sunucusu kapatılırken loglarda mevcut `ResizeObserver loop completed with undelivered notifications` bildirimleri görüldü. Gerçek dışa aktarımlar ve yukarıdaki biçim kontrolleri geçti; bu koşu için “tarayıcı hatası sıfır” iddiası verilmedi. Yalnız bu çalışma için açılan Vite oturumu kapatıldı.

---

# Güncel örnek tez araştırması — mola kaydı

15.10.2026. Kullanıcı talebiyle uygun bir noktada durduruldu. Çalışma **MOLADA**; tüm biçim belirsizlikleri kapanmış değildir. Kullanıcı, güncel örnek bulunamayan şablonların pas geçilmesini istedi.

## Uygulanan dört karar

1. **AKÜ FBE yüksek lisans jüri satırları:** varsayılan üç üye. Bilgehan ve Çakal'ın Temmuz 2026 tarihli, üniversitenin açık arşivindeki tezlerinin fiziksel 3. sayfalarında bir başkan ve iki üye var. Danışman ayrıca üstte yazılsa da jüri içinde aynı kişidir; dördüncü üye sayılmadı. Doldurulan ek satırlar gösterilmeye devam eder; doktora varsayılanı korunur.
2. **AKÜ FBE Özet/Abstract sonu:** yıl/sayfa satırı → anahtar kelimeler. İki 2026 tezin fiziksel 6/8. sayfaları, resmî DOCX ve kılavuz örnekleriyle aynı sırada. Kullanıcının örnek tezleri esas alma talimatıyla önceki düzyazı öncelikli karar değiştirildi; çelişen kılavuz cümlesi spec içinde korundu.
3. **AKÜ SBE sayfa numarası:** Kocatürk'ün Temmuz 2026 tezi örnek alındı; Times New Roman 12 punto, alt orta, üst kenardan taban çizgisi 283,549 mm. Roma ve Arap numaralı fiziksel 3/10/20/30/50. sayfalarda ölçüldü. Bu ölçü Word altbilgi uzaklığı değildir; altbilgi XML uzaklığı belirsizliği açık kalır.
4. **AFSÜ Tıp sayfa numarası:** Mutlu Mevlüt Yılmaz'ın 2025 uzmanlık tezi örnek alındı; Calibri 11,04 punto, taban çizgisi 278,757 mm, yatay merkez yaklaşık 115 mm. Fiziksel 3/10/20/30/50. sayfalarda aynı. Önceki 105 mm sayfa merkezi kaynak çıkarımı değiştirildi. Yalnız Tıp uygulanır; Diş Hekimliği için aynı düzeyde örnek bulunmadı. Gövde Times New Roman olarak kalır.

Kaynak kararları kullanıcı izniyle alınan uygulama tercihleridir; üniversitenin yeni genel kuralı veya bağımsız biçim onayı olarak sunulmaz.

## Güncellik ve kaynaklar

- [Bilgehan, 2026, AKÜ resmî arşiv kaydı](https://acikerisim.aku.edu.tr/items/152a6bee-ce3a-48b9-b1d5-900009a0ba89).
- [Çakal, 2026, AKÜ resmî arşiv kaydı](https://acikerisim.aku.edu.tr/items/8eb072b9-5a4c-4a3b-967b-22fad85c985e).
- [Kocatürk, 2026, AKÜ resmî arşiv kaydı](https://acikerisim.aku.edu.tr/items/dd8f4a9e-fa8f-4007-8b31-b3f3ed1ba910).
- [Yılmaz, 2025, AFSÜ resmî arşiv kaydı](https://acikerisim.afsu.edu.tr/items/4710c2d1-2b2f-4a70-b677-c3246a0866da/full).
- [AFSÜ Şubat 2026 güncel şablon duyurusu](https://legens.afsu.edu.tr/2026/02/17/guncel-tez-yazim-sablonu-hakkinda/): canlı sayfadaki doktora/yüksek lisans DOCX dosyalarının SHA-256 değerleri mevcut yerel 2026 kaynaklarıyla aynı. Özgül'ün 2025 LEE tezi yeni şablondan eski olduğu ve numara konumu farklı olduğu için yeni yerleşim kaynağı yapılmadı.

Ham indirmeler, adresler ve SHA-256: `orchestration/validation/template-thesis-research-20261015/downloads-v2.json`. İlk indirme hataları `downloads.json` içinde korunur. PDF metinleri, sayfa görüntüleri ve ortak `pdfmeasure.py` ile yapılan ölçümler aynı klasörde. İncelenen görüntüler: AFSÜ Tıp içindekiler, AKÜ FBE onay sayfası, AKÜ SBE gövde/dipnot sayfası.

## Pas geçilenler ve açık kalanlar

- AKÜ Felsefe lisans/seminer, Sosyoloji, Coğrafya, Kimya, Matematik, MBG lisans ve AFSÜ Eczacılık projesi: uygun, erişilebilir 2024–2026 öğrenci tam metni bulunamadı. Bazılarında güncel resmî kılavuz/şablon bağlantısı bulundu; bunlar yeni kabul edilmiş öğrenci tezi sayılmadı. Kullanıcıda da örnek yok; talimatıyla pas geçildi.
- ADÜ Ziraat: yayına dayalı etik beyan alternatifini gösteren güncel lisans örneği bulunamadı.
- MCBÜ Tıp: 2025 Altunbaş/Kumrular adayları bulundu, fakat Raw Data Library PDF erişimi zaman aşımı/cache miss ve tarayıcıda ERR_BLOCKED_BY_CLIENT ile sonuçlandı. 2026 Scribd adayı ölçülebilir, kaynağı doğrulanmış PDF sağlamadı. Önceki MCBÜ kararları korunur; yeni alt başlık/dipnot/tablo ayrıntıları kapatılmadı.
- AKÜ Sağlık Bilimleri: Avşar'ın 2025 uzun başlıklı doktora tezi indirildi. Tek başarılı örnek, keyfî uzunluktaki başlıkların sığacağını kanıtlamaz; taşma stres senaryosu açık kalır.
- Çalışılan şablonlarda diğer dipnot, tablo, başlık, kapak ve varyant belirsizlikleri sırf bir tez bulundu diye kapatılmadı. AFSÜ Tıp içindekiler hedefi çözümleme notu teknik kontrol açığıdır; örnek tezle kendiliğinden çözülmez.

## Devam noktası

Kod değişiklikleri `engine/src/templates/aku-fbe.js`, `aku-sbe.js`, `afsu-tip.js` içinde. İlgili spec, checks, context ve mevcut birim testi beklentileri güncellendi. Yeni test eklenmedi. **Bu mola öncesi birim testleri, derleme veya yeni Word/PDF üretim kabulü çalıştırılmadı.** Kaynak ölçümleri çıktı kabulü yerine geçmez. Eski PASS raporları kendi kod sürümlerine aittir.

Devam edildiğinde ilk iş, bu dört kararın güncel üretim çıktılarında doğrulanmasıdır; özellikle Tıp numara fontunun yüklenmesi, DOCX kutu/numara konumu, FBE üç üyeli onay sayfası ve Özet/Abstract sırası. Mola boyunca araştırma veya arka plan işi sürmez. Genel motorun uzun belge ve SDK açık işleri bu çalışmayla kapanmadı. Commit yapılmadı.
