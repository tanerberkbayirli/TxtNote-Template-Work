# Rehber paneli — uygulama raporu (25.10.2026)

## Yapılan
Rehber sağ sütuna, Tez bilgileri'nin altına taşındı; iki seçenek: Uygulama rehberi (ortak modal) ve Bu şablonun yazım kuralları (panel içi, 11 bölüm, kaynak bağlantılı). Eski drawer girişi aynı bileşene yönlendirildi; eski `thesisGuide` paneli ThesisNavigation'dan kaldırıldı. Ayrıntı: [uygulama/REHBER_PANELI.md](../uygulama/REHBER_PANELI.md).

## Kontroller (geçti)
- `templateRulesGuide.test.js`: 8/8 (124 şablonun hepsi 11 bölümlü, kimlik doğru; aynı üniversitede iki enstitü farklı; fallback/taslak “kontrol edilmiş” gösterilmez; overlay kaynağa bağlı; ortak rehberde üniversite adı yok).
- Tanılama testleri (manualToc, manualTocStress, presentationLayout, layoutOutput): 60/60. `vite build`: başarılı.
- Tarayıcı (MCBÜ, AKÜ FBE/SBE, MCBÜ doktora, AFSÜ doktora): sıra doğru, panel sayfayı örtmüyor (viewport sağı < rail solu), şablon değişince içerik değişiyor, modal merkezde/blur 6px, ×, Escape, Tab sarma ve odak dönüşü çalışıyor, belge HTML uzunluğu/sayfa sayısı modal öncesi ve sonrası aynı.
- Kanıt: `.test-tmp/validation/rehber-2026-10-25/` (MCBÜ kılavuz metin dökümü).

## Kaynak kapsama envanteri (özet)
| Durum | Şablon sayısı |
|---|---|
| Resmî + bölgesel denetimli kayıt (“kontrol edilmiş kayıt”) | 34 |
| Resmî Word şablonundan üretilmiş taslak | 43 |
| Kılavuzdan çıkarılmış taslak | 42 |
| Elle/genel (doğrulanmadı) | 5 |
Doğrudan okunup rehbere bağlanan kurallar: AKÜ FBE (yüksek lisans/doktora) anahtar kelime 4–6, kılavuz Ocak 2020 s.18, PDF SHA-256 yerel kopyayla eşleşti; MCBÜ (yüksek lisans/doktora) kılavuzu 22.10.2025: yalnız anahtar kelime sayısı var, kelime/sayfa sınırı yok. Canlı sayfa kontrolü 25.10.2026: AKÜ FBE ve MCBÜ LEE bağlantıları hâlâ yayında.

## Doğrulanamayan / açık
- Kalan şablonların kılavuz-düzeyi kural taraması (özet kelime sınırları vb.) yapılmadı; bu alanlar panelde “Şablon kaydında yok” görünür. “Bütün bilgiler var” iddiası yoktur.
- Kaynak bağlantıları düz `<a target=_blank>`; Tauri'de dış tarayıcıda açılışı doğrulanmadı.
- Registry'de 5 kayıt (ör. `adu-fbe-master-en-kaynak`) `templateVersion` uyuşmazlığıyla yüklenemiyor, editör genel taslağa düşüyor (rehber bunu “Henüz doğrulanmadı” gösterir). Ayrı hata.
- `TxtNote/frontend` lib testlerinde 15 başarısız (academicLayout, aduZiraatCover, AfsuTip, AkuFbe/Sbe, BatchB, Mcbu, McbuTip, SpecialPages, Title); rehber dosyalarını içermiyor, motor/şablon dosyası değiştirilmedi; bu turda kök nedeni incelenmedi.
- Eski e2e dosyalarındaki “Rehber” sekmesi beklentisi kaldırıldı; e2e'ler bu turda çalıştırılmadı.

## Ek tur — AKÜ, AFSÜ, MCBÜ kılavuz taraması (25.10.2026)
Kapsam kullanıcı kararıyla yalnız bu üç üniversiteyle sınırlandı; diğer Ege üniversiteleri taranmadı. Yerel özgün kılavuzlar (SHA-256 kayıtla eşleşen) metne çevrilip özet/anahtar kelime/sayfa-kelime sınırları okundu; 22 şablon için `templateRuleOverlays.js` kuralı eklendi (metin dökümleri: `.test-tmp/validation/rehber-2026-10-25/txt/`).
- AKÜ FBE, MBG, Coğrafya, Kimya: anahtar kelime 4–6. SBE: özet ≤1 sayfa, anahtar kelime ≤5; yabancı dilli SBE: genişletilmiş Türkçe özet ≥2000 kelime. Sağlık Bilimleri: özet ≤2 sayfa, 3–6 anahtar kelime. Sosyoloji: ≥60 sayfa/≥40 kaynak. Felsefe seminer: ≥10 sayfa.
- AFSÜ LEE: özet/abstract ≥250 kelime, ≤1 sayfa, 3–5 anahtar kelime. Tıp/Diş: özet ve abstract ≤1 sayfa, 3–5 anahtar kelime (Türkçe). Eczacılık proje: rapor ≥20 sayfa, özet ≤1 sayfa, ≤5 anahtar kelime.
- MCBÜ LEE: kelime/sayfa sınırı yok. MCBÜ Tıp: özet ≤1 sayfa.
Sınırlar: Sayfa konumları PDF fiziksel sayfa numarasıdır (kılavuzun basılı numarası değil); DOCX kılavuzlarda bölüm adı verildi. AFSÜ Tez Önerisi, AKÜ lisans Matematik/Sosyoloji/Felsefe tez ve AKÜ İSG proje kılavuzlarında özet kuralı aranmadı veya bulunmadı; bu satırlar "kayıtta yok" kalır. Taranan kılavuzların canlı sayfa yeniden doğrulaması yalnız AKÜ FBE ve MCBÜ LEE için yapıldı; diğerlerinde yerel kopya + kayıtlı hash esas alındı.

## MCBÜ inceleme bulguları (25.10.2026, kullanıcı listesi)
- **Özet/Abstract satır aralığı — uygulandı:** şablon JSON'unda (yüksek lisans + doktora) abstract ve abstract-en 1,5 → tek satır, paragraf arası 20,7 → 13,8 nk. Kılavuzda iki çelişen açık ifade var (özet metni “tek satır aralıklı”, sayfa altı not ve örnek XML 1,5); kullanıcı kararıyla tek satır seçildi, karşı taraf şablon `source.notes`'unda kayıtlı. Editörde ölçüldü: özet 18,4 px, giriş 27,6 px.
- **Onay sayfası — uygulanmadı:** kılavuzun sayfa listesinde jüri/onay sayfası yok; “danışman onayı” ifadesi yalnız çift taraflı baskıyla ilgili. Kılavuzda olmayan sayfa eklenmez.
- **Kaynakça / “0–20” / yayınevi yok:** kullanıcının girdiği örnek kaynağın eksik alanları; şablon hatası değil. Kılavuz tek atıf yöntemi (APA-6/7, Chicago…) istiyor, “birebir APA değil” iddiası bu turda ölçülmedi.
- **p12 sağ kenar sarkması 0,11 cm:** ilgili PDF/ölçüm elimde yok, yeniden üretilmedi; açık.
- **Taahhütname çelişkisi:** “yapay zeka ve program kullanmadığımı” cümlesi ve “(Kullanılan herhangi bir program varsa belirtilmelidir.)” satırı kılavuzun kendi metnidir; çelişki kullanıcının girdiği “Kullanılan program” değerinden doğuyor. Metin değiştirilmedi.
- Tests: thesisMcbu/Fix1/Tip 38/40 geçti; 2 başarısızlık (thesisMcbu.test.js:61, thesisMcbuTip.test.js:66) bu değişiklikten önce de vardı.

## Numarasız boş (parity) sayfa — 25.10.2026
Tek/çift sayfa başlangıcı veya çift taraflı numara hizası için eklenen boş sayfa (`numberThesisPages` → `blankBefore`) artık kendi sıra numarasını basar (`labels`/`countedLabels`; üst/alt bilgi yine yok). Sonraki sayfalar sırayla devam eder. Değişen testler: thesisPagination (2), thesisSectionGeometry (2), thesisMcbuFix2 (özet tek satır kararı). Kullanıcının belgesindeki şablon bilinmediği için sayfa yeniden üretilemedi; yalnız bu parity mekanizması kapsandı. Word dışa aktarımında Word'ün kendi eklediği boş sayfa numara basmayabilir.
