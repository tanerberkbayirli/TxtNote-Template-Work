# Görev 02 — Kayıpsız belge modeli

Durum: TAMAMLANDI · 09.10.2026

Tez içeriği artık sürümlü, kalıcı bir belge modelinde tutuluyor. Bölümler,
paragraf ve metin parçaları, stiller ve kalıtım, listeler, iç içe/birleşik tablolar,
görseller, denklem kaynakları, not gövdeleri ve referans kimlikleri ayrı veriler.
Yerel Word özellikleri ve ilişkili kaynak parçaları JSON verisi olarak korunuyor.
Mevcut HTML alanları düzenleyicinin uyumluluk görünümü olarak çalışmaya devam ediyor.

İçerik düzenleme ve senkronizasyon kaydet/aç yolları modeli güncelliyor. Kararlı
kimlikler yerel özellikleri düzenleme ve bölümler arası taşıma boyunca bağlı tutuyor;
kopyalanmış nesneler yeni kimlik alıyor. Silme geri alınırken yerel özellikler
geri geliyor. Modelin kimlik damgaları imleci ve geri alma geçmişini sıfırlamıyor.
Ana gövde, adı başka olsa da ek bölüm alanlarıyla karışmıyor.

**Tez bilgileri → Belge biçimi** alanında “Üniversite şablonuna uyarla” veya
“Kaynak biçimini koru” seçiliyor; tercih kayıtla birlikte saklanıyor. Kaynak modu
adaptörün kaydettiği bölüm kurallarını kullanıyor. Şablon değiştirmek kaynak stil
verilerini silmiyor. Stil çözümleme varsayılanları, kalıtımı ve doğrudan değişiklikleri
ayırıyor; döngü veya desteklenmeyen model sürümü hata olarak bildiriliyor.

Sayfa boşlukları, satır/tablo parçalama damgaları, devam satırları ve denklem araç
çubuğu/KaTeX görünümü kalıcı içeriğe alınmıyor. Denklem görünümü saklanan LaTeX'ten
yeniden üretiliyor; yeniden açmada paragraf dışına taşan kopya oluşmuyor.

Doğrulama:

- 759 test geçti; atlanan test yok. Üretim derlemesi başarılı.
- Görev 01'in altı geliştirme DOCX'iyle model kabulü → düzenleme → iki JSON
  kaydet/aç döngüsü geçti. 74.581 yerel öğe ve 174 kaynak paket parçası korundu.
- Gerçek tarayıcıda yazma, geri al/yenile, kimlik/yerel özellik koruma, biçim tercihi,
  şablon değiştirme, not değiştirme ve yeniden açma geçti; sayfa hatası yok.
- Mevcut örneklerdeki 247 bölümün modelden üretilen HTML görünümü DOM olarak eşdeğer.
- Kayıtlı 23 hedefte genel regresyon çalıştırıldı. Altı başarısız ölçüm değişiklik
  öncesi HEAD sürümünde de aynı: ADÜ Ziraat kapak konumu, AKÜ Sağlık ölçümü ve
  AKÜ SBE'nin dört İngilizce ön sayfa numarası kontrolü. AFSÜ Eczacılık uzun gövde
  karşılaştırması da HEAD ile aynı. Eşikler ve beklenen sonuçlar değiştirilmedi.
  Word çalıştırılmadığı için Word gerektiren kontroller atlandı; bunlar başarı sayılmadı.
  İlk turda raporu oluşmayan üç hedef ayrı tekrar manifestiyle tamamlandı;
  ilk tur hataları özgün manifestte korundu.

Bu görev üretim DOCX içe aktarıcısının doğruluğunu onaylamaz. Kaynak DOCX kabul
hazırlayıcısı yalnızca modelin yerel veriyi kayıpsız saklamasını sınayan test aracıdır;
mevcut Mammoth yolu değiştirilmedi. Word bölüm/stil verilerini uygulamanın içe aktarma
akışına bağlamak Görev 03'tür. Yerel Word nesnelerinin çizimi ve dışa aktarım
uygunluğu sonraki görevlerde doğrulanacak. SRC08/SRC10 ayrılmış kabul belgeleri kullanılmadı.

Kod: `engine/src/contentModel.js`, `contentMarkup.js`, `sourceHtml.js`,
`schema.d.ts`; düzenleyici, uygulama kayıt ve senkronizasyon bağlantıları.
API ve uyumluluk açıklaması: `orchestration/docs/engine/README.md`.

Sabit kapanış ve dosya SHA256'ları: [completion.json](./completion.json).
Yeniden doğrulama: `python orchestration/engine-work/close_mission02.py`.
Kabul araçları: `orchestration/engine-work/verify_mission02_sources.mjs`,
`orchestration/engine-work/verify_mission02_browser.mjs`, `orchestration/engine-work/verify_mission02_projection.mjs`.
Kaynak girdilerini yeniden hazırlama: `python orchestration/engine-work/mission02_source_inputs.py`.
Tarayıcı kabulü, çalışan Vite sunucusunu `THESIS_BASE_URL` ile seçer.
