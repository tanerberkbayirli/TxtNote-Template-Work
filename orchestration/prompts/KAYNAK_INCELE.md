# Prompt: bir üniversite hedefinin resmî kaynağını incele

Önce [../BASLA.md](../BASLA.md). Hedef: `<kimlik>` ([../manifest.json](../../engine/specs/manifest.json) kaydı). Yalnız bu hedefin kaynaklarını açın; üretim kodunu ve `Butun-Sablonlar/` dosyalarını değiştirmeyin.

**Çıktılar (yalnız bu yollar):** `engine/specs/<kimlik>.json` (şema örneği: [engine/specs/adu-sagbil.json](../../engine/specs/adu-sagbil.json)), `engine/docs/reports/<kimlik>.md`, `engine/references/<kimlik>/source/` (türetilmiş küçük dosyalar; ≤15 sayfa görseli, JSON dökümü tercih edilir), isteğe bağlı `engine/specs/<kimlik>.CONTEXT.md` (≤1 sayfa).

**Yöntem**
1. Kılavuzun **tüm** sayfalarını ve şablon/örnekleri okuyun; örnek sayfaları sayfa numarasıyla listeleyin.
2. Sayısal değerleri ekran görüntüsünden değil XML/PDF geometrisinden alın: `python engine/tools/docx2spec.py` ([DOCX_EXTRACTION.md](../../engine/tools/DOCX_EXTRACTION.md)); `.doc` için `legacy-doc2docx.ps1`.
3. Her kural: anahtar, değer, birim, güven (`EXPLICIT` açık yazı · `TEMPLATE` şablon XML · `MEASURED` ölçüm · `INFERRED` gerekçeli çıkarım · `UNKNOWN`), kaynak konumu ve alıntı. Word varsayılanı veya örnek metin tesadüfü ile gerçek gereksinimi ayırın.
4. Özel sayfalarda (kapak, onay, özet…) her satırı ölçün: metin, font, punto, kalın, baseline y (mm), x0/x1; `sourceGeometry` ve `sections[].layout` olarak yazın.
5. Derece (YL/Doktora/lisans) ve dil (TR/EN) farklarını kanıtla ayırın; manifest varyantını doğrulayın ya da çürütün. Varyant/değer uydurmayın.
6. Çelişkiler: iki tarafı da kaydedin; şablon XML'i kılavuz düzyazısından önce gelir, **iki değer de** raporda kalır; karar gerekiyorsa `needsConfirmation: true`.
7. Motor boşluklarını `engine/docs/CAPABILITIES.md` ile karşılaştırıp somut yazın (`engineGaps`).
8. Doğrulanacak ölçümleri `measurableChecks` olarak tanımlayın (beklenen, birim, tolerans ≤0,5 mm).

Bitince hedefin açık kalanlarını [../GOREVLER.md](../GOREVLER.md) C bölümüne işleyin. Son yanıt ≤15 satır.
