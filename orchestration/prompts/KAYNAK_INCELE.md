# Prompt: bir üniversite hedefinin resmî kaynağını incele

Önce [../BASLA.md](../BASLA.md). Hedef: `<kimlik>` ([manifest.json](../../engine/specs/manifest.json) kaydı). Yalnız bu hedefin kaynaklarını açın; üretim kodunu ve `Butun-Sablonlar/` dosyalarını değiştirmeyin.

Şablon kaynak çalışmasında [İçindekiler paneli rehberini](../uygulama/ICINDEKILER_PANELI.md) de okuyun. Ortak kullanıcı deneyimini yeniden tasarlamayın; hedef üniversitenin içindekiler bölümünün gerekip gerekmediğini ve çıktı biçimini resmî kaynaktan belirleyin. Bu okuma, kaynak inceleme görevinin üretim kodunu değiştirmeme sınırını kaldırmaz.

**Çıktılar (yalnız bu yollar):** `engine/specs/<kimlik>.json` (şema örneği: [adu-sagbil.json](../../engine/specs/adu-sagbil.json)), `orchestration/raporlar/<kimlik>.md`, `engine/references/<kimlik>/source/` (türetilmiş küçük dosyalar; ≤15 sayfa görseli, JSON dökümü tercih edilir), isteğe bağlı `orchestration/hedefler/<kimlik>.CONTEXT.md` (≤1 sayfa).

**Yöntem**
1. Önce kaynağın güncelliğini canlı resmî sayfadan doğrulayın; doğrulanamazsa bunu UNKNOWN olarak kaydedin. Kılavuzun **tüm** sayfalarını ve şablon/örnekleri okuyun; örnek sayfaları sayfa numarasıyla listeleyin.
2. Sayısal değerleri ekran görüntüsünden değil XML/PDF geometrisinden alın: `python engine/tools/docx2spec.py` ([DOCX_EXTRACTION.md](../motor/DOCX_EXTRACTION.md)); `.doc` için `legacy-doc2docx.ps1`.
3. Her kural: anahtar, değer, birim, güven (`EXPLICIT` açık yazı · `TEMPLATE` şablon XML · `MEASURED` ölçüm · `INFERRED` gerekçeli çıkarım · `UNKNOWN`), kaynak konumu ve alıntı. Word varsayılanı veya örnek metin tesadüfü ile gerçek gereksinimi ayırın.
4. Özel sayfalarda (kapak, onay, özet…) her satırı ölçün: metin, font, punto, kalın, baseline y (mm), x0/x1; `sourceGeometry` ve `sections[].layout` olarak yazın.
5. Derece (YL/Doktora/lisans) ve dil (TR/EN) farklarını kanıtla ayırın; manifest varyantını doğrulayın ya da çürütün. Varyant/değer uydurmayın.
6. Çelişkiler: iki tarafı da kaydedin; öncelik [BASLA.md](../BASLA.md) kaynak kuralına göredir; iki değer ve gerekçe raporda kalır. `needsConfirmation` yalnız mevcut kaynak ve kullanıcı talimatıyla çözülemeyen, işi gerçekten durduran karar için kullanılır; her çelişki yeni onay gerektirmez.
7. Motor boşluklarını `orchestration/motor/CAPABILITIES.md` ile karşılaştırıp somut yazın (`engineGaps`).
8. Doğrulanacak ölçümleri `measurableChecks` olarak tanımlayın (beklenen, birim, tolerans ≤0,5 mm).

Bitince hedefin açık kalanlarını [../GOREVLER.md](../GOREVLER.md) ilgili bölümüne işleyin. Son yanıt ≤15 satır.
