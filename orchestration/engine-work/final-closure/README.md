# Güncel durum — 12.10.2026

Kullanıcı kalan üç başlığı yeniden açtı; ardından limit nedeniyle güvenli mola istedi. Çalışma durduruldu. Güncel devam noktası: [mola kaydı](./resumed-20261012/PAUSE.md), plan: [../MISSION.md](../../MISSION.md). Kullanıcı yeniden devam demeden geliştirme veya test başlatma. Aşağıdaki kapanış tarihsel kayıttır. Son genel kabul henüz verilmedi.

# Motor geliştirme kapanışı — 11.10.2026

Kullanıcı son talimatında üç başlığın bırakılmasını ve diğer işlerin kapatılmasını istedi. Bu kayıt önceki otomatik devam, bütün işleri bitirme ve hiçbir görevi ertelememe talimatlarının yerine geçer. Yeni geliştirme veya geniş test döngüsü kendiliğinden başlatılmayacak.

## Kapatılan işler

- Özel sayfalarda ölçülen esnek akış, konumlu metin, hizalama, görünür taşma ve geri küçülme; imkânsız sabit DOCX çerçevesinin doğal akışa geçmesi. FBE hedefi 51 PASS, doktora PDF/Word 39/39. Yedi uzun başlıklı ailede sayfa eşliği, düzenlenebilir başlık ve harf kapsamı 7/7 PASS. 08-E kaynak ölçülerini koruyan şablon incelemesi tamamlandı. Kanıt: `special/REPORT.md`, `special/families/comparison.json`, `special/template-review.md`.
- Özel sayfa ölçümündeki ondalık CSS döngüsü kapandı: 20 ölçümde tek CSS ve hazır durum; `special/helper-cycle.json`. 232 matrisin geliştirme turu konsolda hatasız tamamlandı; eski dosya son dört uygulanmayan satırı yazmamıştı. Araç düzeltildi; yeni tam matris aşağıdaki son kabul başlığına ertelendi.
- Uzun/tek yüksek satırlı tabloların genel akışı, başlık/alt açıklama kuralları, iç içe tablolar ve kaynak liste satır yüksekliği düzeltmeleri korundu. Dikey hücre hizası aktarımı korundu. Uzun kaynakların tam Word sayfa eşliği ayrı ertelenen iştir.
- Yerel VML kimlikleri, referansları, şema ve yerel OMML koruması düzeltildi. SRC09 aktif DOCX VML denetiminde yinelenen/sahipsiz kimlik yok; SDK hataları sıfırlandı. SmartArt ve ChartEx çıkarılmış karma nesne kesitinde gerçek Word düzenle/kaydet/yeniden aç geçti. ChartEx içeren paketin kaydetme sorunu aşağıda açık bırakıldı.
- Dipnot/sonnot ve kalıcı dizin/referans işleri kapatıldı. Başlık içindeki yer imlerinin kaybı giderildi. SRC08/SRC10 sıralı gövde metni 671/671 ve 1675/1675 korundu; yeni kopuk alan hedefleri 0/0; SDK 0/0. Gerçek Word alan güncelleme, kaydetme ve yeniden açmada hata sonucu yok. Kanıt: `performance/heldout-*.json`.
- Başlık numaraları gerçek Word PDF'inde doğrulandı. Uzun SRC10 üzerinde yazma, seçim, gerçek pano, tarayıcı CDP IME composition/commit/cancel, undo/redo, kaydet/aç ve Enter imleci geçti; tarayıcı hatası yok. CDP IME, işletim sistemi IME sertifikası olarak sunulmuyor. Kanıt: `performance/headings-pdf.json`, `performance/interact-SRC10.json`.
- Yazma sırasında derlemeyi kısa duraklamaya alma, aynı DOM için satır ölçümü önbelleği ve font/stil/genişlik değişiminde önbellek iptali tamamlandı. Consolas/Courier New fontlarının dört gerçek yüzü PDF'e gömülebiliyor; kimlik, gömme izni, eş aralıklı metrik ve Türkçe metin 18/18 hedefli testten geçti. Rust masaüstü font testi 1/1 PASS. Kanıt: `font-regression3.log`, `desktop-font-regression.log`.

## Kullanıcının açıkça ertelediği üç başlık

1. **Uzun kaynaklarda tam Word sayfa/kırılım eşliği.** SRC09 kararlı liste düzeltmesi sonrası 187/180 idi. Deneysel tam satır yüksekliği düzeni 174/180 verdi; kabul edilmedi. Exact/minimum satır yüksekliği, birleşik hücreler ve ilk parça asgari yüksekliği teşhisleri `long/` altında korunur; deneysel üretim eklemeleri ayrı `long/parked/` kaydına alınır. SRC10 son eşlik ölçümü de bu başlıktadır.
2. **Kalan gerçek dışa aktarma sorunları.** SRC09 PDF düğmesi Consolas engelini aştı; Wingdings gerçek font/glyph desteği eksikliğiyle görünür hata verdi (`performance/export-probe-fonts/benchmark-SRC09.json`). ChartEx içeren kaynak kesiti ve yeniden dışa aktarılan kesit gerçek Word SaveAs sırasında aynı RPC hatasını verdi; dış çalışma kitabı bağlantısı/önbellek onarımı ertelendi. Bunlar başarılı kabul sayılmıyor.
3. **Son seri genel kabul.** Tüm kod sabitken yeni 25 hedef/gerçek Word, 5 normal + 5 CPU kısıtlı SBE, 232 matris, yeni DOCX şemaları, uzun kaynaklar ve 20 örnekli tam performans/PDF kabulü çalıştırılmadı. Hazır araçlar `accept.ps1`, `fingerprint.mjs`, `verify.mjs`; kullanıcı yeniden isterse çalıştırılır. Önceden sayısal performans sınırı kaydedilmemiştir; sonradan bir eşik uydurulmadı. SRC08/SRC10 geliştirmede incelendiği için artık kör ayrılmış veri olarak sunulmaz.

## Doğrulamanın sınırı ve çalışma ağacı

Bu oturumda ara tam birim turu 931 PASS olarak raporlandı; root'un saklı ara turu `development-unit.log` 930 PASS içerir. Daha sonraki ekler hedefli testlerle doğrulandı. Bunlar son kodun bütün kabulünden geçtiği iddiası değildir; üçüncü başlık kullanıcı tarafından ertelendi. Eski başarısız/yarıda kesilen kanıtlar saklandı; beklenti, tolerans ve sabit kaynaklar bu turda değiştirilmedi. Commit yapılmadı, kullanıcının mevcut çalışma ağacı korundu.

**Son durum: diğer geliştirme işleri kapalı; yalnız yukarıdaki üç başlık kullanıcı kararıyla ertelendi. Motor için tam genel kabul verilmedi.**
