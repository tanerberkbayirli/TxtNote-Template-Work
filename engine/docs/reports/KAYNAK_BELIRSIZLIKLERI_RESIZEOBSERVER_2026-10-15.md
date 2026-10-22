# Kalan kaynak belirsizlikleri ve ResizeObserver — 15.10.2026

## Yapılan düzeltme

`ThesisSectionPages.jsx`, ResizeObserver bildiriminde `flushSync` ile sayfa sayısını güncelliyordu. Bu güncelleme dıştaki sayfa yığınının geometrisini aynı gözlem turunda değiştiriyordu. Aynı yükle/yakınlaştır/yaz senaryosunda AFSÜ Tıp 1, AKÜ SBE 3 adet `ResizeObserver loop completed with undelivered notifications` bildirimi üretti; AKÜ FBE üretmedi. Kayıt `before-instrumented.json` içindedir. `pageerror` bu tarayıcı bildirimini yakalamadığından ayrıca gerçek `window.error` dinlendi.

Gözlemci artık en son kesirli, ölçeklenmemiş yüksekliği saklıyor; React güncellemesini `requestAnimationFrame` içinde yapıyor. İlk ölçüm korunuyor, biriken bildirimler birleştiriliyor ve bileşen kapanırken bekleyen kare iptal ediliyor. Sürekli yüzey yedeği de aynı zamanlamayı kullanıyor. Hata mesajına filtre veya `preventDefault` eklenmedi.

## Güncel kontroller

- Son kodda, gözlemciyi sarmalamadan dört gerçek şablon: AFSÜ Tıp **34**, AKÜ FBE **38**, AKÜ SBE **38**, AFSÜ LEE **37** sayfa; her birinde **0 window.error / 0 pageerror**, sayfalama hazır, fiziksel yaprak sayısı ile toplam eşit ve yazılan metin kaydedilmiş. İlk üç şablonun toplamları önceki karşılaştırmayla aynı. Kanıt: `after-native-final.json`; üretim dosyasının SHA-256 değeri her kayıtta bulunur.
- Mevcut sayfalama regresyonunun kopyası son sürümde geçti: ekle/sil, %50–150 yakınlaştırma, başlıklar ve listeler, 400 satırlı tablo, 9000 kelimelik paragraf, büyük resim/seçim, bölüm sırası, Roma/Arap numaraları, not değiştir/kaydet/yeniden aç ve kenar boşluğundan imleç yerleştirme. **0 konsol / pageerror / window.error**. Kanıt: `pagination-final/result.json`.
- Üretim derlemesi **PASS**: `build-final.log`. Var olan Node modüllerinin tarayıcı için dışlanması ve büyük paket uyarıları devam ediyor.

Bu kapsam sürekli yüzey yedeği için ayrı bir tarayıcı kabulü veya yeni Word/PDF tam seri kabulü değildir. Genel uzun belge ve SDK işleri kapanmadı.

## Kaynaklarda kapanan üç madde

AFSÜ LEE’nin [resmî 2026 duyurusundaki](https://legens.afsu.edu.tr/2026/02/17/guncel-tez-yazim-sablonu-hakkinda/) yüksek lisans ve doktora DOCX dosyaları aynı gün önceki araştırmada indirilip yerel kaynaklarla SHA-256 üzerinden eşleştirilmişti. Bu çalışmada aynı dosyaların XML’i yeniden okundu; yeni indirme yapılmış gibi kaydedilmedi.

1. **Altbilgi punto ve mesafesi:** nominal 11 punto (`AltBilgiChar`, `w:sz=22`); ortak gövde altbilgisi 709 twips. Doktora Roma altbilgisinin farklı ankrajı korunur.
2. **İçindekiler 1–3 düzeyleri:** 0/220/440 twips girinti (0/11/22 punto), 8210 twips sağa hizalı noktalı sekme. Üçüncü düzeyin sekmesi stil içinde değil, örnek paragrafın doğrudan özelliklerindedir. “11 punto/düzey” notu, yazı boyutu değil **girinti artışı** olarak netleştirildi; örnek giriş yazısı 12 punto. Dördüncü düzey bu örneklerle kesinleşmez.
3. **Jüri satır yükseklikleri:** başlık 1127, üye satırları 939 twips **asgari** yükseklik; sabit yükseklik değiller. Yüksek lisans 3, doktora 5 üye. Uzun metin satırı büyütebilir.

Bu değerler üretimde zaten uygulanıyordu; eski belirsizlik kaydı düzeltildi. Yeni bir üniversite ölçüsü tahmin edilmedi. Etik listede kaynak Symbol işaretinin bilinmesine rağmen yedek font kullanılması ayrıca **bilinen uygulama farkı** olarak kaydedildi.

Kaynak XML, dosya hash değerleri ve tez sayfaları: `source-audit.json`. Kararlar ve sınıflandırma: `source-disposition.json`. AFSÜ LEE spec, checks ve context güncellendi; AFSÜ Tıp notunda PDF’in 11,04 punto ölçüsünün nominal Word 11 punto olduğu netleştirildi.

## Açık kalanların durumu

24 adet `UNKNOWN` kanıt etiketli kontrol satırının tamamı `note` türünde; bunlar kendi başına başarısız çıktı kontrolü değildir. Gruplar ayrı ele alındı:

- **AFSÜ LEE:** tam İngilizce tez varyantı, gözlenen örneğin ötesinde özet yerleşimi, bütün tablolara uygulanacak hücre hizası, dipnot aralığı/ayırıcı/numaralandırma, sayısal alıntı sınırı kaynakta kesinleşmiyor. Dördüncü içindekiler düzeyi ve keyfî uzun tablo devamı ölçülen kapsam dışında. Symbol font farkı teknik sınırlama.
- **AFSÜ Tıp:** bazı başlıksız sayfaların içindekiler eşlemesi kontrol aracının kapsam sınırı. Ham Word üstbilgi/altbilgi mesafesi, dipnot, tablo ayrıntıları, etik sayfası ve dış kapak konumları için kaynak boşlukları sürüyor. Diş hekimliği varyantı için uygun güncel örnek bulunmadı.
- **AKÜ Coğrafya / Sağlık:** uzun kapak başlığı kapasitesi ve yatay şekil sayfası, kaynak belirsizliğine ek olarak ayrı yerleşim/özellik kapsamı gerektiriyor; “kaynak bulundu” diye kapatılmadı.
- **AKÜ FBE:** 2026 Bilgehan ve Çakal tezleri yeniden tarandı. Özgeçmiş fiziksel s.76/104’te; ikisinde de ekler bölümü yok. Bu nedenle özgeçmiş–ekler sırası çözülemedi. İkinci danışmanlı doktora ve uzun kapak için önceki çelişkiler de açık.
- **AKÜ SBE:** basılı numara taban çizgisi önceden çözüldü; kaynak Word üstbilgi/altbilgi mesafesi ayrı bilinmeyen olarak korunuyor.
- **AKÜ Felsefe lisans/seminer, Sosyoloji, Kimya, Matematik, MBG; AFSÜ Eczacılık; ADÜ Ziraat; MCBÜ Tıp’ın kalan ayrıntıları:** uygun düzeyde güncel kaynak/örnek bulunmayan maddeler kullanıcının **“bulamazsan pas geç”** kararıyla açık ve pas geçilmiş durumda. Başka düzey veya üniversitenin biçimi aktarılmadı.

Eski ölçüm/hash dosyaları korunmuştur. Bu çalışma tüm şablonlar veya tüm uygulama için yeni genel kabul vermez.

Kanıt klasörü: `orchestration/validation/resizeobserver-source-review-20261015/`.
