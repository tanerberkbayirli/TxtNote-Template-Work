# Görev 03 — Word'ü yapısıyla içe aktar

Durum: TAMAMLANDI · 09.10.2026

Tez düzenleyicisinde **Dosya → Word içe aktar** girişi eklendi. DOCX, iptal edilebilir
Web Worker içinde okunuyor. Önizleme, kaynak/şablon biçimi seçimini ve aktarım
bildirimlerini gösteriyor; uygulama kararı verilene kadar mevcut belge korunuyor.
İçerik ve belge modeli çalışma alanı ve tuval düzenleyicilerinde tek güncellemeyle
değişiyor. Eski `.doc` için Word/LibreOffice'te `.docx` olarak kaydetme yolu gösteriliyor.

Yerel Word bölüm sınırları, sayfa ayarları, paragraf/run stilleri, kalıtım, doğrudan
biçim, tema fontları, liste tanımları ve başlangıç istisnaları modele aktarılıyor.
Tablo/görsel/not/denklem nesneleri, alan önbellekleri ve referans kimlikleri korunuyor.
Kaynak bölümler kaynak biçiminde ayrı açılıyor; şablona uyarlamada içerik kaybolmuyor.
Kaynak biçiminde kayıtlı stiller CSS ile gösteriliyor. Özgün sıkıştırılmış paket,
SHA256 ve parça bilgileri bir kez saklanıyor; gereksiz üst XML tekrarları kaldırıldı.

Desteklenmeyen özellikler parça/XML konumuyla raporlanıyor; kaynak verileri
korunuyor. Ayrıntılı tablo/görsel/denklem/not çizimi ve alan yenilemesi sonraki ilgili
görevlerde doğrulanacak. Bu kapanış, Word/PDF sayfa veya piksel eşdeğerliği değildir.
Mammoth kullanan eski akademik editör yolu bağımsız kalıyor.

Doğrulama:

- 769 test geçti; atlanan test yok. Üretim derlemesi Web Worker dahil başarılı.
- Sabit kümedeki dokuz DOCX, üretim adaptörüyle okundu. Bağımsız Python/lxml/ZIP
  referansıyla sıralı metin, paragraf/run/tablo/hücre/not/referans sayıları, bölüm
  ölçüleri, açık stil eşlemeleri, stil kalıtım bağlantıları ve doğrudan biçim karşılaştırıldı.
  Tüm özgün paket parçalarının SHA256'ları ve JSON kaydet/aç modeli korundu.
- Dokuz DOCX'in tüm kaynak bölümlerinde Chrome HTML ayrıştırması nesne kimliklerini
  ve sırasını korudu. Alternatif gösterimlerin gizli dalı ve metin kutuları da dahil.
- Gerçek dosya seçimi, işçi, önizleme iptali, `.doc` dönüşüm talimatı, atomik uygulama,
  kaynak font/hizalama, düzenleme ve yeniden açma geçti. Bağımsız EDGE_STRUCTURE ve
  EDGE_NOTES Word belgeleri editöre aktarılıp tekrar açıldı; etkin nesne kimliği kaybı yok.
- Kayıtlı 23 hedefin genel regresyonu Görev 02 kapanışındaki sonuçlarla karşılaştırıldı.
  Önceden var olan altı ölçüm hatası korundu; yeni başarısız ölçüm yok. Word gerektiren
  kontroller bu turda çalıştırılmadı ve başarı sayılmadı.
  AKÜ SBE'nin eşzamanlı dışa aktarmadaki sayfalama-hazır hataları özgün ve tekrar
  manifestlerinde korundu. `CHECK_EXPORT_JOBS=1` ile tarayıcılar sırayla çalıştırıldı;
  sayfalama kapısı ve ölçüm toleransları değiştirilmeden bu hedefin ölçümleri tamamlandı.

SRC08/SRC10 ayrılmış son kabul belgeleri geliştirmede kullanılmadı.
Kapanış, özetler ve dosya SHA256'ları: [completion.json](./completion.json).
Yeniden doğrulama: `python orchestration/engine-work/close_mission03.py`.

Başlıca kod: `src/thesis/importDocx.js`, `src/thesis/docx/importPackage.js`,
`properties.js`, `projection.js`, `import.worker.js`, `WordImportReview.jsx`,
düzenleyici/ribbon/çalışma alanı bağlantıları ve modelin yerel öğe türü koruması.
API ve sınırlar `orchestration/docs/engine/README.md` içinde.

Kabulü yeniden çalıştırma sırası: `python orchestration/engine-work/mission03_sources.py`,
`node orchestration/engine-work/verify_mission03_sources.mjs`, `node orchestration/engine-work/verify_mission03_dom.mjs`,
`node orchestration/engine-work/verify_mission03_browser.mjs`; tarayıcı akışı için Vite sunucusunu
`THESIS_BASE_URL` ile seçin. Birim testleri ve derleme frontend paketindeki standart
komutlarla, genel kontroller `orchestration/tools/check.mjs --all` ile çalışır.
