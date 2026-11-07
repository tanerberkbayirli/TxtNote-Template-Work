# AFSÜ güncel kaynak ve şablon doğrulaması — 25.10.2026

**Eczacılık için düzeltme:** Aşağıdaki ilk kabul çalışması kapakların resmî örnekle aynı yerleşimde olduğunu kanıtlamıyordu. Kullanıcı bildirimi üzerine dış/iç kapakta belirgin farklar doğrulandı ve düzeltildi. Önceki Eczacılık onayı görsel eşleşme onayı olarak kullanılamaz. Son durum ve yeni 44 çıktı kontrolü: [Eczacılık görsel doğrulaması](AFSU_ECZACILIK_GORSEL_2026-10-25.md).

**Diğer altı seçenek için son görsel kontrol:** LEE etik sayfasının aşağıda kalan yaklaşık 2,2 mm kayması artık giderilmiştir; Tıp/Diş dış ve BAP destekli kapakları ile iki tez önerisi kapağı da düzeltildi. Altı ana ve dört koşullu varyantın son ölçümü **299 PASS, 0 FAIL, 6 INFO**. Önceki yerleşim bulgularının yerini [son görsel doğrulama raporu](AFSU_DIGER_SABLONLAR_GORSEL_2026-10-25.md) alır.

Mevcut yedi AFSÜ seçeneği, güncel resmî sayfalardaki dosyalar indirilerek yeniden incelendi. Kaynakların güncelliği dosya adına veya eski onay etiketlerine dayanılarak kabul edilmedi. On resmî sayfadan yirmi dosya alındı; arşivdeki on altı farklı ilgili belgenin SHA-256 değerleri canlı dosyalarla eşleşti. Aynı tez kılavuzunun Şubat ve Haziran bağlantıları aynı içeriği sunuyor. Enstitünün güncel Word şablonları Eylül 2026 bağlantılarından doğrulandı.

Kaynak kanıtı: `orchestration/raporlar/afsu-live-sources-20261025.json`. Her şablonun `source.currentSourceVerification` kaydı kendi dosyalarını, resmî URL'lerini ve hash değerlerini taşır. İki güncel tez önerisi başvuru/savunma formu kaynak arşivine ve bölgesel kaynak envanterine eklendi. İdari formlar ayrı bir tez yazım şablonu olarak sunulmadı.

## Şablon kararları

- **LEE yüksek lisans — düzeltildi; ölçülen kurallar açısından onaylandı.** Sayfa, font, başlık, kapak ve numaralandırma kuralları mevcut güncel kaynaklarla uyumlu. Eksik olan anahtar kelime üst sınırı ve alfabetik sıra, en az 250 kelimelik Türkçe/İngilizce özet, özet ve teşekkür için bir sayfa sınırı ve zorunlu ana bölüm sırası denetimleri eklendi.
- **LEE doktora — düzeltildi; ölçülen kurallar açısından onaylandı.** Aynı denetimler eklendi; doktora kapak ve jüri farklılıkları korundu. İki derecenin gerçek çıktıları ayrı ölçüldü.
- **LEE yüksek lisans tez önerisi — düzeltildi; ölçülen kurallar açısından onaylandı.** Kılavuz §1.1'in istediği kaynakça mevcut şablonda yoktu; APA kaynakça bölümü eklendi. Kapak, kaynakta atıf yapılan ortak yazım kuralları ve Word/PDF uyumu için kalıcı çıktı kontrolleri eklendi.
- **LEE doktora tez önerisi — düzeltildi; ölçülen kurallar açısından onaylandı.** Kaynakça eksikliği giderildi; doktora ibaresiyle ayrı gerçek çıktı ölçüldü.
- **Tıp uzmanlık — düzeltildi; ölçülen kurallar açısından onaylandı.** Kaynakta belirtilen temel sayfa ve yazı kuralları uygundu. Anahtar kelime üst sınırı/sırası, özet ve teşekkür sayfa sınırları ve ana bölüm sırası denetimleri tamamlandı. Kaynak havuzuna bağlı atıfların ilk kullanım sırasıyla numaralandığı ayrıca sınandı.
- **Diş Hekimliği uzmanlık — düzeltildi; ölçülen kurallar açısından onaylandı.** Aynı içerik denetimleri tamamlandı. Bu fakülte için kalıcı çıktı kontrolleri eklendi; kendi resmî PDF kopyası ve fakülte metinleri korundu. Tıp kopyasının farklı kapak/onay koordinatları Diş kontrolüne taşınmadı.
- **Eczacılık lisans araştırma projesi — düzeltildi; ölçülen kurallar açısından onaylandı.** Anahtar sözcük üst sınırı/sırası ve özet sayfa sınırları tamamlandı. Kapaklarda anabilim dalı adı zaten ek içeriyorsa ikinci kez “ANABİLİM DALI” yazılması engellendi; yalın ad ve iki farklı ekli giriş biçimi sınandı. Düzeltmeden sonra gerçek PDF/Word çıktısı tekrar üretildi.

## Karşılaştırılan kurallar

Kenar boşlukları, A4 boyutu, gövde/başlık yazı tipi ve büyüklüğü, satır aralığı ve paragraf girintisi, başlık sırası/numarası, kapak ve özel sayfa düzeni, Roma/Arap sayfa geçişleri, tablo/şekil açıklamaları, kaynakça, özet ve anahtar kelime hükümleri incelendi. Ortak motor koduna üniversite adına göre koşul eklenmedi. Asgari kelime denetimi genel ve isteğe bağlı bir kural olarak eklendi; diğer şablonlarda etkinleştirilmedi.

LEE kontrolündeki iki eski SymbolMT hatası kılavuza aykırı yazı kullanımından kaynaklanmıyordu: resmî 2026 DOCX'in `numbering.xml` dosyası etik sayfasındaki madde imleri için Symbol kullanıyor. Kontrol tanımı resmî kaynağın bu istisnasıyla uyumlu hale getirildi. Bu işlem gövde fontunu değiştirmez.

## Kaynak ve ölçüm sınırları

- Bu onaylar belirtilen kaynak kuralları ve ölçülen örnekler içindir; üniversitenin kurumsal kabulü veya tüm olası kullanıcı belgelerinin kusursuz dışa aktarımı anlamına gelmez.
- Tıp/Diş ortak kılavuzunun içindekiler/etik sayfası sırası ile ayrıntılı açıklaması birbiriyle çelişiyor; etik sayfasının sabit metni verilmemiş. Mevcut açıklama ve örnek temelli sıra korundu. Kaynakta olmayan bir etik beyanı yazılmadı.
- İki uzmanlık PDF'inin örnek sayfa geometrileri farklıdır. Kaynakların kendi farklılıkları tek bir fakültenin koordinatlarına zorlanmadı. Dış kapak şeması mutlak dikey koordinatlar tanımlamaz.
- Tez önerisi kılavuzu kaynakçayı ister; yerini belirtmez. Kaynakça öneri metninin sonuna konuldu; bu yerleşim açık bir kurum hükmü olarak gösterilmez.
- LEE etik sayfasının Word çıktısında sabit madde metinleri sonunda yaklaşık 2,2 mm birikimli yerleşim farkı ve bir satır kırılımı farkı sürüyor. Kontrollü kopyada yalnız Word uyumluluk modunu 15'ten 14'e indirmek farkı gidermedi. Önceki raporun bu modu kesin kök neden sayan açıklaması doğrulanmadı; ortak dışa aktarım motoru bu varsayımla değiştirilmedi. Karşılaştırma `.test-tmp/afsu-20261025/ethics-comparison.{png,json}`.
- Güncel ayrı bir tezsiz dönem projesi yazım şablonu doğrulanamadı. Güncel sitedeki LEE.FR.33 bir yeterlik/teslim formudur. Eski 2020/2022 kılavuzları güncel yüksek lisans/doktora kılavuzunun yerine geçirilmedi. Ayrı tam İngilizce tez şablonu için de güncel resmî kaynak doğrulanmadı.

## Doğrulama ve kanıtlar

AFSÜ odaklı içerik, seçim, kaynak hash'i, kaydetme/yeniden açma, sayfa sınırı, kelime sınırı, kaynakça ve kapak testleri: **29 PASS, 0 FAIL**. Kaynak arşivi envanter kontrolü ayrıca geçti. Son üretim derlemesi başarılıdır.

Gerçek editör çıktıları `engine/tools/check.mjs --all --targets afsu-lee,afsu-tip,afsu-dis-hekimligi,afsu-eczacilik-proje,afsu-lee-proposal --word` ile son dosyalar üzerinde ölçüldü: **287 PASS, 0 FAIL, 7 INFO; 5 hedefte 7 derece/fakülte varyantı; 0 çıktı hatası**. Hedef sonuçları LEE 94, Tıp 68, Diş 57, Eczacılık 28, tez önerileri 40 PASS. INFO maddeleri kaynak/ölçüm sınırlarıdır, tam uygunluk onayı değildir. Son kabul dizini `.test-tmp/afsu-20261025/accepted/`; toplu kanıt `.test-tmp/afsu-20261025/acceptance-manifest.json`. Kapak, özet ve son sayfaların görselleri ayrıca incelendi; görsel inceleme tüm sayfaların eksiksiz incelemesi olarak sunulmaz. LEE'nin iki son Word çıktısında ve resmî kaynakta Symbol kullanımının yalnız altı madde iminden oluştuğu ayrıca doğrulandı (`symbol-glyph-audit.json`).

Genel test çalışması: **1221 test; 1209 PASS, 12 FAIL**. Kalan hatalar AFSÜ dışındaki üretilmiş Ege kayıtları/kaynak beklentileri, ADÜ Ziraat kapak beklentileri, metin süsleme ve genel İngilizce başlık davranışındadır. Bunlar AFSÜ kabulüne dahil edilmedi. Tam çıktı `.test-tmp/afsu-20261025/unit-tests-final.log`; üretim derlemesi `.test-tmp/afsu-20261025/build-final.log`.

## Resmî başlangıç sayfaları

- https://legens.afsu.edu.tr/tez-yazim-sablonu/
- https://legens.afsu.edu.tr/tez-yazim-klavuzu/
- https://legens.afsu.edu.tr/tez-onerisi-hazirlama-kilavuzu/
- https://legens.afsu.edu.tr/yuksek-lisans-formlari/
- https://legens.afsu.edu.tr/doktora-formlari/
- https://tip.afsu.edu.tr/yonergeler-2/
- https://dhf.afsu.edu.tr/
- https://eczacilik.afsu.edu.tr/
