# Araştırma planı

Belge düzeni: 26.10.2026. Bu belge bir **plandır, bulgu raporu değildir**; hiçbir madde çalıştırılıp doğrulanmış sayılmaz. Senaryolar yalnız kullanıcı ilgili kodu seçtiğinde (`P4'ü yap`, `W2'yi yap`, `S'yi başlat`) başlatılır; komut gelmeden kod değiştirilmez. Açık işlerin dizini [GOREVLER.md](../GOREVLER.md).

**Hedef:** Kullanıcı bir MCBÜ yüksek lisans tezi (`mcbu-lee-master-tr-v1`) yazacak. Konu önemsizdir, metin yer tutucudur; sınanan şey kullanıcının yapmak istediği işi yapıp yapamadığıdır. Önerilen sıra: W → P → S → D.

## Yöntem

- Yerel geliştirme sunucusunda (Vite) gerçek `ThesisEditor`, MCBÜ yüksek lisans şablonu; gerçek hesap, ödeme veya kullanıcı verisi yok. Kullanıcı verisiyle çalışma veya dışa paylaşma gereği doğarsa mevcut yetki ve görev kapsamı kontrol edilir; gereksiz izin adımı eklenmez.
- Her test: adım → beklenen → gözlenen → kanıt (ekran görüntüsü, konsol/ağ çıktısı veya kod satırı).
- Etiketler: `OK` · `SÜRTÜNME` · `HATA` · `ENGEL` · `ÖLÇÜLEMEDİ`. Kullanıcı etkisi sırası: veri kaybı > iş yapılamıyor > yanlış çıktı > kafa karışıklığı > görünüş.
- Salt araştırma görevi üretim kodunu değiştirme yetkisi vermez. Kullanıcı düzeltmeyi de istemişse mevcut yetkiyle devam edilir; yeniden onay istenmez.

## Bölüm I — Tez yazım alanı (P1–P18)

Bakılacak kod: `ThesisEditor.jsx`, `ThesisSectionPages.jsx`, `RichTextBody.jsx`, `useLayoutInteraction.js`, `engine/src/pageLayout.js`, `generatedIndex.js`, `footnotes.js`, `specialPages.js`.

- **P1 Sayfa yüzeyi ve sayfalama:** boyut/kenar boşluğu uyumu, sayfa oluşma/silinme, yeni bölüm sayfası, yakınlaştırma, sayfa sonu, başlık-sonraki satır birlikteliği.
- **P2 Bölüm türleri:** sabit, yazılabilir ve otomatik bölümlerin davranışı; isteğe bağlı bölümleri açma/kapama.
- **P3 Metin girişi:** Türkçe karakterler, Enter/Tab/Backspace, seçim, kopyala/yapıştır, geri al/yinele, kısayollar, sağ tık menüsü.
- **P4 Başlıklar ve numaralama.** **P5 Paragraf biçimi, liste, girinti, hizalama.** **P6 Tablolar.** **P7 Şekiller ve görseller.** **P8 Denklemler.** **P9 Dipnot ve sonnot.** **P10 Atıf ve kaynakça.** **P11 Bağlantı, çizgi, metin çerçevesi, yerleşim araçları.** **P12 Üstbilgi, altbilgi, sayfa numarası.**
- **P13 Tez bilgileri ve özel sayfalar. P14 Otomatik sayfalar** (içindekiler, şekil/tablo dizinleri, güncelleme, boş durum).
- **P15 Kayıt, yeniden açma, sekmeler. P16 Dışa aktarma/içe aktarma. P17 Performans ve dayanıklılık. P18 Uç durumlar ve hata davranışı.**

## Bölüm II — Şerit ve sağ sütun (W1–W10)

- **W1 Şerit çerçevesi ve gezinme. W2 Giriş. W3 Dosya. W4 Ekle. W5 Düzen. W6 Başvurular. W7 Görünüm** sekmeleri.
- **W8 Sağ sütun panelleri** (İçindekiler, Tez bilgileri, Sayfa ayarı, Kaynaklar, Yazım planı, Rehber, Öğe ayrıntıları): tek panel açık kalma, kaydırma, odak, kapatma, paneller arası durum kaybı, şablona özel Rehber doğruluğu.
- **W9 Durum çubuğu. W10 Genel kullanılabilirlik ve erişilebilirlik.**

## Bölüm III — MCBÜ yüksek lisans simülasyonu (S0–S16)

Her adım için: yapabiliyor muyum (`E/KISMEN/H`), tıklama sayısı, kafa karışıklığı (0–2), veri kaybı riski. Başarı ölçütü: kullanıcı kılavuz okumadan bir MCBÜ tez dosyasını (PDF/Word) üretebiliyor.

S0 şablon seçimi ve yeni tez · S1 tez bilgileri · S2 kapak ve taahhütname · S3 özet/abstract (anahtar kelime ≥5) · S4 önsöz, simgeler · S5 giriş · S6 bölümler ve alt başlıklar · S7 tablolar · S8 şekiller · S9 denklem (şablonda yok; ne oluyor) · S10 dipnotlar · S11 atıf ve kaynakça · S12 ekler ve özgeçmiş · S13 otomatik sayfalar · S14 sayfa numaraları ve genel görünüm · S15 kontrol ve dışa aktarma (ekran ↔ PDF/Word karşılaştırması) · S16 kapat/yeniden aç.

Çıktı: adım adım tablo, en büyük 10 engel/sürtünme (kullanıcı etkisi ve öneri), kılavuzsuz tamamlanabilirlik sonucu.

## Bölüm IV — Diğer başlıklar (D1–D8)

- **D1 Rehber doğruluğu:** `templateRulesGuide.js` ve `templateRuleOverlays.js` çıktısının şablon ve kaynak notlarıyla karşılaştırması; `INFERRED/UNKNOWN` kuralların kesin gibi sunulup sunulmadığı.
- **D2 Sayfalama ve Word/PDF uyumu (motor):** [GOREVLER.md](../GOREVLER.md)'deki açık işler, mevcut ölçüm araçlarıyla güncel durum.
- **D3 Kayıt, eşitleme, veri güvenliği:** `useNoteSync`, `localBackup`, `services/crypto`, `services/local`, `db.rs`, `secure_store.rs`.
- **D4 Hesap, Premium, cüzdan, güncelleyici:** yalnız yerel/test ortamı; oturum kilidi; güncelleyici doğrulaması.
- **D5 Diğer not türleri ve kabuk:** standart not, To-Do, Günlük, zihin haritası, akademik yazı, klasör, flashcard, canvas; kenar çubuğu, sekmeler, çöp kutusu, arama, ayarlar, tema.
- **D6 Masaüstü (Tauri):** izin kapsamları, sistem yazı tipleri, dışa aktarma yolları, `desktop:smoke`.
- **D7 Depo hijyeni ve test sağlığı:** izlenmeyen fixture'lar, `TxtNote/` içindeki günlük/çıktı klasörleri, deney dosyaları; tam test ve derleme.
- **D8 Sağ sütun yeniden düzeni doğrulaması:** eski e2e testlerinin (`general-editor-workflow`, `thesis-ribbon-panels`) yeni yapıda durumu; W1/W8 ile birleşir.
